import { join, dirname } from "path";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import express from "express";
import serveStatic from "serve-static";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || "8080", 10);
const app = express();

// Shopify configuration
const SHOPIFY_STORE = process.env.SHOPIFY_STORE || "web-health-developer.myshopify.com";
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || "";
const SHOPIFY_API_VERSION = "2024-01";

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Parse JSON body
app.use(express.json());

/**
 * Mock product data for demo
 * In production, this would fetch from Shopify Admin API
 */
const mockProducts = [
  {
    id: "1",
    title: "Premium T-Shirt",
    price: "29.99",
    inventory: 15,
    status: "active",
    image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-1_large.png",
  },
  {
    id: "2",
    title: "Classic Hoodie",
    price: "49.99",
    inventory: 8,
    status: "active",
    image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-2_large.png",
  },
  {
    id: "3",
    title: "Cotton Socks",
    price: "12.99",
    inventory: 0,
    status: "active",
    image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-3_large.png",
  },
  {
    id: "4",
    title: "Denim Jeans",
    price: "79.99",
    inventory: 23,
    status: "active",
    image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-4_large.png",
  },
  {
    id: "5",
    title: "Leather Jacket",
    price: "199.99",
    inventory: 5,
    status: "draft",
    image: "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-product-5_large.png",
  },
];

/**
 * Fetch products from Shopify Admin API
 */
async function fetchShopifyProducts() {
  // Check if we have Shopify credentials
  if (!SHOPIFY_ACCESS_TOKEN || SHOPIFY_ACCESS_TOKEN === "") {
    console.log("⚠️  No Shopify access token - using mock data");
    return mockProducts;
  }

  try {
    const url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=50`;
    
    console.log(`📡 Fetching from Shopify API: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Shopify products to our format
    const products = data.products.map(product => ({
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
    console.log("⚠️  Falling back to mock data");
    return mockProducts;
  }
}

/**
 * API Endpoint: Get Shopify Products
 * Returns list of products from the store
 */
app.get("/api/products", async (req, res) => {
  try {
    console.log("📦 Fetching products...");
    
    // Try to fetch real products, fall back to mock if needed
    const products = await fetchShopifyProducts();
    
    console.log(`✅ Returned ${products.length} products`);
    
    res.json({
      products: products,
      total: products.length,
      source: SHOPIFY_ACCESS_TOKEN ? "shopify" : "mock",
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
    const product = mockProducts.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    console.log(`✅ Product found: ${product.title}`);
    res.json(product);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
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
          <title>WhatsApp Chat Button</title>
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
            h1 { color: #25D366; }
            p { color: #666; }
            .status { 
              display: inline-block;
              padding: 8px 16px;
              background: #25D366;
              color: white;
              border-radius: 4px;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚂 WhatsApp Chat Button</h1>
            <p>Railway deployment successful!</p>
            <div class="status">✓ Server Running</div>
            <p style="margin-top: 2rem; font-size: 0.9em;">
              API: <a href="/api/settings">/api/settings</a><br>
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});
