import { join, dirname } from "path";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import express from "express";
import serveStatic from "serve-static";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { shopify } from "./shopify-config.js";
import { sessionStorage } from "./session-storage.js";
import { setupAuthRoutes } from "./auth-routes.js";

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || "8080", 10);
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

console.log("🚀 Starting Product List App with OAuth...");

// Setup OAuth routes
setupAuthRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    oauth: 'enabled' 
  });
});

/**
 * Get session from App Bridge token OR cookie
 */
async function getSessionFromRequest(req) {
  // First try to get session from App Bridge token (for embedded app)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      
      // Decode and validate the session token
      const payload = await shopify.session.decodeSessionToken(token);
      const shop = payload.dest.replace("https://", "");
      
      // Get offline session ID for the shop
      const sessionId = shopify.session.getOfflineId(shop);
      
      const session = await sessionStorage.loadSession(sessionId);
      if (session) {
        console.log(`✅ Session found via App Bridge token for: ${session.shop}`);
        return session;
      } else {
        console.log(`⚠️  No stored session found for shop: ${shop}`);
      }
    } catch (error) {
      console.log("⚠️  App Bridge token validation failed:", error.message);
    }
  }

  // Fallback to cookie-based session (for non-embedded access)
  const sessionId = req.cookies?.shopify_session;
  if (sessionId) {
    const session = await sessionStorage.loadSession(sessionId);
    if (session) {
      console.log(`✅ Session found via cookie for: ${session.shop}`);
      return session;
    }
  }

  console.log("❌ No valid session found");
  return null;
}

/**
 * Fetch products from Shopify using session token
 */
async function fetchShopifyProducts(session) {
  if (!session || !session.accessToken) {
    console.log("⚠️  No session - cannot fetch products");
    return [];
  }

  try {
    const client = new shopify.clients.Rest({
      session,
      apiVersion: shopify.config.apiVersion,
    });

    console.log(`📡 Fetching products for shop: ${session.shop}`);

    const response = await client.get({
      path: "products",
      query: { limit: 50 },
    });

    const products = response.body.products.map(product => ({
      id: product.id.toString(),
      title: product.title,
      price: product.variants?.[0]?.price || "0.00",
      inventory: product.variants?.[0]?.inventory_quantity || 0,
      status: product.status,
      image: product.images?.[0]?.src || product.image?.src || null,
    }));

    console.log(`✅ Fetched ${products.length} products from Shopify`);
    return products;

  } catch (error) {
    console.error("❌ Error fetching from Shopify API:", error.message);
    return [];
  }
}

/**
 * API Endpoint: Get Shopify Products
 * Returns list of products from the store using OAuth session
 */
app.get("/api/products", async (req, res) => {
  try {
    console.log("📦 Fetching products...");

    // Get session from cookie
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ 
        error: "Not authenticated",
        requiresAuth: true 
      });
    }

    // Fetch products using session
    const products = await fetchShopifyProducts(session);

    res.json({
      products: products,
      total: products.length,
      source: "shopify-oauth",
      shop: session.shop,
    });
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * API Endpoint: Get Single Product
 */
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const session = await getSessionFromRequest(req);

    if (!session) {
      return res.status(401).json({ 
        error: "Not authenticated" 
      });
    }

    const client = new shopify.clients.Rest({
      session,
      apiVersion: shopify.config.apiVersion,
    });

    const response = await client.get({
      path: `products/${id}`,
    });

    const product = response.body.product;
    
    res.json({
      id: product.id.toString(),
      title: product.title,
      price: product.variants?.[0]?.price || "0.00",
      inventory: product.variants?.[0]?.inventory_quantity || 0,
      status: product.status,
      image: product.images?.[0]?.src || null,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(404).json({ error: "Product not found" });
  }
});

// Serve static frontend files if they exist
const STATIC_PATH = join(__dirname, "frontend", "dist");
console.log(`🔍 Looking for frontend at: ${STATIC_PATH}`);
console.log(`📂 Frontend exists: ${existsSync(STATIC_PATH)}`);

if (existsSync(STATIC_PATH)) {
  console.log(`✅ Serving static files from: ${STATIC_PATH}`);
  app.use(serveStatic(STATIC_PATH, { index: false }));

  // Serve the React app for all other routes
  app.use("/*", async (_req, res, _next) => {
    const indexPath = join(STATIC_PATH, "index.html");
    if (existsSync(indexPath)) {
      return res
        .status(200)
        .set("Content-Type", "text/html")
        .send(readFileSync(indexPath));
    }
    res.status(404).send("Frontend not built yet");
  });
} else {
  // Fallback if frontend not built
  app.get("/*", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Product List App</title>
          <style>
            body { 
              font-family: system-ui; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #008060; }
            p { color: #666; }
            .status { 
              display: inline-block;
              padding: 8px 16px;
              background: #008060;
              color: white;
              border-radius: 4px;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📦 Product List App</h1>
            <p>OAuth-enabled Shopify App</p>
            <div class="status">✓ Server Running with OAuth</div>
            <p style="margin-top: 2rem; font-size: 0.9em;">
              API: <a href="/api/auth">Authenticate</a><br>
              Health: <a href="/health">/health</a>
            </p>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔐 OAuth enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Host: ${shopify.config.hostScheme}://${shopify.config.hostName}`);
});
