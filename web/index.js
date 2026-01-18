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
import { 
  generateProductImage, 
  PROMPT_TEMPLATES, 
  uploadImageToShopify,
  uploadBase64ToCloudinary,
} from "./ai-image-service.js";

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
 * Fetch ALL products from Shopify using GraphQL (supports pagination)
 */
async function fetchShopifyProducts(session) {
  if (!session || !session.accessToken) {
    console.log("⚠️  No session - cannot fetch products");
    return [];
  }

  try {
    const client = new shopify.clients.Graphql({
      session,
    });

    console.log(`📡 Fetching ALL products for shop: ${session.shop} via GraphQL`);

    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;

    // Pagination loop - fetch all products
    while (hasNextPage) {
      const query = `
        query getProducts($cursor: String) {
          products(first: 250, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                title
                status
                vendor
                featuredImage {
                  url
                }
                variants(first: 1) {
                  edges {
                    node {
                      price
                      inventoryQuantity
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await client.query({
        data: {
          query,
          variables: cursor ? { cursor } : {},
        },
      });

      const productsData = response.body.data.products;
      
      const products = productsData.edges.map(edge => {
        const product = edge.node;
        const variant = product.variants.edges[0]?.node;
        
        return {
          id: product.id.split('/').pop(),
          title: product.title,
          price: variant?.price || "0.00",
          inventory: variant?.inventoryQuantity || 0,
          status: product.status.toLowerCase(),
          image: product.featuredImage?.url || null,
          vendor: product.vendor || "Belirsiz",
        };
      });

      allProducts = allProducts.concat(products);

      // Check if there are more pages
      if (productsData.pageInfo.hasNextPage) {
        cursor = productsData.pageInfo.endCursor;
        console.log(`📄 Fetching next page... (${allProducts.length} products so far)`);
      } else {
        hasNextPage = false;
      }

      // Safety limit to prevent infinite loops
      if (allProducts.length > 10000) {
        console.log("⚠️  Safety limit reached: 10,000 products");
        break;
      }
    }

    console.log(`✅ Fetched ${allProducts.length} products from Shopify via GraphQL`);
    return allProducts;

  } catch (error) {
    console.error("❌ Error fetching from Shopify GraphQL API:", error.message);
    
    // Fallback to simple REST API (without pagination)
    try {
      console.log("📡 Falling back to REST API (250 products limit)...");
      const client = new shopify.clients.Rest({
        session,
        apiVersion: shopify.config.apiVersion,
      });

      const response = await client.get({
        path: "products",
        query: { limit: 250 },
      });

      const products = response.body.products.map(product => ({
        id: product.id.toString(),
        title: product.title,
        price: product.variants?.[0]?.price || "0.00",
        inventory: product.variants?.[0]?.inventory_quantity || 0,
        status: product.status,
        image: product.images?.[0]?.src || product.image?.src || null,
        vendor: product.vendor || "Belirsiz",
      }));

      console.log(`✅ Fetched ${products.length} products from Shopify REST API (fallback)`);
      return products;
      
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError.message);
      return [];
    }
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
 * API Endpoint: Get Available AI Prompt Templates
 */
app.get("/api/ai/templates", (req, res) => {
  const templates = Object.entries(PROMPT_TEMPLATES).map(([key, value]) => ({
    id: key,
    name: value.name,
  }));
  
  res.json({ templates });
});

/**
 * API Endpoint: Generate AI Product Image
 */
app.post("/api/products/generate-image", async (req, res) => {
  try {
    const { productId, productName, currentImageUrl, templateKey, uploadToShopify, modelType, quality, size } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ 
        error: "Product ID and name are required" 
      });
    }

    console.log(`🎨 Generating AI image for product: ${productName}`);
    console.log(`📸 Existing image: ${currentImageUrl ? 'YES - will analyze' : 'NO - text-only prompt'}`);

    // Get session
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Generate image with selected AI model
    const result = await generateProductImage(
      productName, 
      templateKey || "ecommerce_white",
      modelType || "openai",
      {
        currentImageUrl: currentImageUrl, // Pass existing image for analysis
        quality: quality || "standard",
        size: size || "1024x1024",
      }
    );

    // If image was generated (base64 data exists)
    if (result.imageData) {
      console.log(`📤 Image generated! Size: ${result.imageData.length} bytes`);

      // Upload to Cloudinary (if configured)
      const uploadResult = await uploadBase64ToCloudinary(result.imageData, `product-${productId}`);

      if (uploadResult.success && uploadToShopify) {
        // Upload to Shopify
        try {
          const client = new shopify.clients.Rest({
            session,
            apiVersion: shopify.config.apiVersion,
          });

          const shopifyImage = await uploadImageToShopify(
            client,
            productId,
            uploadResult.url,
            productName
          );

          console.log(`✅ Image uploaded to Shopify product ${productId}`);

          return res.json({
            success: true,
            productId,
            productName,
            imageGenerated: true,
            imageUrl: uploadResult.url,
            shopifyImageId: shopifyImage.id,
            ...result,
          });

        } catch (shopifyError) {
          console.error("❌ Error uploading to Shopify:", shopifyError);
          return res.json({
            success: true,
            productId,
            productName,
            imageGenerated: true,
            imageUrl: uploadResult.url,
            shopifyUploadFailed: true,
            shopifyError: shopifyError.message,
            ...result,
          });
        }
      }

      // Return image URL
      return res.json({
        success: true,
        productId,
        productName,
        imageGenerated: true,
        imageUrl: uploadResult.success ? uploadResult.url : null,
        cloudinaryConfigured: uploadResult.success,
        ...result,
      });
    }

    // No image generated - return enhanced prompt
    res.json({
      success: true,
      productId,
      productName,
      imageGenerated: false,
      ...result,
      note: "Use this enhanced prompt with DALL-E 3, Midjourney, or Stable Diffusion.",
    });

  } catch (error) {
    console.error("❌ Error generating AI image:", error);
    res.status(500).json({ error: "Failed to generate AI image", details: error.message });
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
