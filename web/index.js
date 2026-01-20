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
  generateWithLeonardo,
  generateWithCanvasInpainting,
  LEONARDO_MODELS, 
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

// In-memory job storage for async Leonardo AI generation
const generationJobs = new Map();

// Middleware
app.use(cookieParser());
// Increase body size limit for Virtual Try-On image uploads (Base64 encoded images can be large)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

console.log("🚀 Starting Product List App with OAuth...");

// Setup OAuth routes
setupAuthRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    oauth: 'enabled',
    virtualTryOn: 'enabled'
  });
});

/**
 * Simple rate limiter for Virtual Try-On (in-memory)
 */
const virtualTryOnRequests = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const key = `vto_${ip}`;
  const requests = virtualTryOnRequests.get(key) || [];
  
  // Remove old requests (older than 1 hour)
  const recentRequests = requests.filter(time => now - time < 60 * 60 * 1000);
  
  if (recentRequests.length >= 5) {
    return { allowed: false, remaining: 0 };
  }
  
  recentRequests.push(now);
  virtualTryOnRequests.set(key, recentRequests);
  
  return { allowed: true, remaining: 5 - recentRequests.length };
}

/**
 * PUBLIC API: Virtual Try-On (using existing generateWithLeonardo)
 * Simple implementation using existing infrastructure
 */
app.post('/api/public/virtual-try-on', async (req, res) => {
  try {
    // Rate limiting
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Çok fazla istek. Lütfen 1 saat sonra tekrar deneyin."
      });
    }

    const { customerImage, productImageUrl, productName } = req.body;

    // Basic validation
    if (!customerImage || !productImageUrl) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Fotoğraf ve ürün resmi gerekli"
      });
    }

    console.log(`👤 Virtual Try-On: ${productName || 'Unknown'} (IP: ${ip})`);

    // VIRTUAL TRY-ON MODE: Replace model, keep clothing identical
    console.log('👗 Virtual Try-On Mode: ULTRA LOW strength for maximum preservation');
    
    // Upload customer image to Cloudinary for reference
    let customerImageUrl = null;
    if (customerImage) {
      try {
        console.log('📤 Uploading customer image to Cloudinary...');
        customerImageUrl = await uploadBase64ToCloudinary(customerImage, 'virtual-tryon-customer');
        console.log('✅ Customer image uploaded:', customerImageUrl);
      } catch (uploadError) {
        console.error('⚠️ Customer image upload failed:', uploadError.message);
      }
    }
    
    const result = await generateWithLeonardo(
      productImageUrl,
      productName || "Virtual Try-On",
      null,
      {
        leonardoModel: "nano-banana-pro",
        strength: 0.08, // ULTRA LOW: Maximum clothing preservation (was 0.15)
        guidanceScale: 15, // HIGH: Strong prompt adherence
        inferenceSteps: 75, // HIGH: More careful processing
        customPrompt: `CRITICAL: ONLY change the model's face. The clothing MUST remain 100% identical: exact same fabric texture, exact same colors, exact same patterns, exact same style, exact same fit, exact same pose, exact same lighting, exact same shadows, exact same background. Everything except the face must stay perfectly unchanged. Hyperrealistic face replacement only. Professional fashion photography.${customerImageUrl ? ` Use face reference from: ${customerImageUrl}` : ''}`,
        customNegativePrompt: "different clothing, changed outfit, new garments, modified fabric, altered colors, different patterns, clothing variations, style changes, different accessories, pose changes, lighting changes, background changes, composition changes, outfit modifications, garment alterations, texture changes, fabric modifications, color shifts, pattern variations, altered garments, modified clothes, wardrobe changes, fashion changes, outfit variations",
        customerImageUrl: customerImageUrl,
      }
    );

    res.json({
      success: true,
      generatedImageUrl: result.imageUrl,
      message: "✨ İşte sen bu ürünü giyerken!",
      remaining: rateLimit.remaining
    });

  } catch (error) {
    console.error("❌ Virtual Try-On Error:", error.message);
    res.status(500).json({
      error: error.message,
      message: "AI ile görsel oluşturulamadı. Lütfen tekrar deneyin."
    });
  }
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
 * API Endpoint: Get Available Leonardo AI Models
 */
app.get("/api/ai/leonardo-models", (req, res) => {
  const models = Object.entries(LEONARDO_MODELS).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    baseCredits: value.baseCredits,
    features: value.features,
    recommended: value.recommended || false,
  }));
  
  res.json({ models });
});

/**
 * API Endpoint: Upload Image to Shopify Product (Manual)
 */
app.post("/api/products/upload-image", async (req, res) => {
  try {
    const session = await getSessionFromRequest(req, res);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { productId, imageUrl, altText } = req.body;

    if (!productId || !imageUrl) {
      return res.status(400).json({ error: "productId and imageUrl are required" });
    }

    const client = new shopify.clients.Rest({
      session,
      apiVersion: shopify.config.apiVersion,
    });

    console.log(`📤 Uploading image to product ${productId}`);
    console.log(`🖼️ Image URL: ${imageUrl}`);

    const shopifyImage = await uploadImageToShopify(
      client,
      productId,
      imageUrl,
      altText || "AI Generated Product Image"
    );

    console.log(`✅ Image uploaded successfully: ${shopifyImage.id}`);

    res.json({
      success: true,
      shopifyImageId: shopifyImage.id,
      message: "Image uploaded to Shopify successfully",
    });

  } catch (error) {
    console.error("❌ Image upload error:", error);
    res.status(500).json({
      error: "Failed to upload image to Shopify",
      details: error.message,
    });
  }
});

/**
 * API Endpoint: Generate AI Product Image
 */
app.post("/api/products/generate-image", async (req, res) => {
  try {
    const { 
      productId, 
      productName, 
      currentImageUrl, 
      uploadToShopify, 
      leonardoModel,
      customPrompt, // User's custom prompt
      customNegativePrompt, // User's custom negative prompt
      imageId, // For unique job ID per image
      generationMethod, // "img2img" or "canvas-inpainting"
      includeHair, // For canvas inpainting - change hair too?
    } = req.body;

    if (!productId || !productName) {
      return res.status(400).json({ 
        error: "Product ID and name are required" 
      });
    }

    // Get session
    const session = await getSessionFromRequest(req);
    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Leonardo AI - img2img required
    if (!currentImageUrl) {
      return res.status(400).json({
        error: "Leonardo AI requires an existing product image",
        details: "Please select a product with existing images"
      });
    }

    // Generate unique job ID
    const jobId = `${productId}-${imageId || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎨 [${jobId}] Starting async generation for: ${productName}`);

    // Store job info
    generationJobs.set(jobId, {
      status: "processing",
      productId,
      productName,
      currentImageUrl,
      startedAt: Date.now(),
    });

    // Return immediately with job ID
    res.json({
      success: true,
      status: "processing",
      jobId,
      message: "Generation started, poll for status",
    });

    // Process generation in background (don't await)
    (async () => {
      try {
        const method = generationMethod || "img2img";
        console.log(`🎨 [${jobId}] Generating with Leonardo AI (${method})...`);
        console.log(`📝 [${jobId}] Custom Prompt: ${customPrompt ? 'YES' : 'NO (using default)'}`);
        
        let result;
        
        if (method === "canvas-inpainting") {
          // Canvas Inpainting - 100% garment preservation with face mask
          console.log(`🎭 [${jobId}] Using Canvas Inpainting (face mask)...`);
          result = await generateWithCanvasInpainting(
            currentImageUrl,
            {
              leonardoModel: leonardoModel || "nano-banana-pro",
              customPrompt: customPrompt,
              customNegativePrompt: customNegativePrompt,
              includeHair: includeHair || false,
              initStrength: 0.15, // Low = high preservation
              guidanceScale: 7.0,
            }
          );
        } else {
          // Standard img2img - faster but less precise preservation
          console.log(`📸 [${jobId}] Using img2img (standard)...`);
          result = await generateWithLeonardo(
            currentImageUrl,
            productName,
            null, // No GPT-4 Vision analysis - Leonardo handles it
            {
              // Use default dimensions from ai-image-service.js (848x1264 - Leonardo tested size)
              // Use default init_strength from ai-image-service.js (0.15 - face-only changes)
              leonardoModel: leonardoModel || "nano-banana-pro",
              customPrompt: customPrompt, // User's custom prompt
              customNegativePrompt: customNegativePrompt, // User's custom negative prompt
            }
          );
        }

        console.log(`✅ [${jobId}] Generation complete!`);
        console.log(`💰 [${jobId}] Credits: ${result.creditsUsed}`);

        // Upload to Shopify if requested
        let shopifyImageId = null;
        if (uploadToShopify) {
          try {
            const client = new shopify.clients.Rest({
              session,
              apiVersion: shopify.config.apiVersion,
            });

            const shopifyImage = await uploadImageToShopify(
              client,
              productId,
              result.imageUrl,
              productName
            );

            shopifyImageId = shopifyImage.id;
            console.log(`✅ [${jobId}] Uploaded to Shopify: ${shopifyImageId}`);
          } catch (shopifyError) {
            console.error(`⚠️ [${jobId}] Shopify upload failed:`, shopifyError.message);
          }
        }

        // Update job status
        generationJobs.set(jobId, {
          status: "complete",
          productId,
          productName,
          imageUrl: result.imageUrl,
          creditsUsed: result.creditsUsed,
          modelName: result.modelName,
          shopifyImageId,
          completedAt: Date.now(),
        });

      } catch (error) {
        console.error(`❌ [${jobId}] Generation failed:`, error.message);
        console.error(`❌ [${jobId}] Error details:`, error.response?.data || error);
        
        generationJobs.set(jobId, {
          status: "failed",
          productId,
          productName,
          error: error.message,
          errorDetails: error.response?.data || error.toString(),
          stack: error.stack,
          failedAt: Date.now(),
        });
      }
    })();

  } catch (error) {
    console.error("❌ Error starting generation:", error);
    
    res.status(500).json({ 
      error: "Failed to start generation", 
      details: error.message,
    });
  }
});

/**
 * API Endpoint: Get Generation Status (Polling)
 */
app.get("/api/generation-status/:jobId", (req, res) => {
  const { jobId } = req.params;
  
  const job = generationJobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({
      error: "Job not found",
      jobId,
    });
  }

  // Clean up completed/failed jobs after 5 minutes
  const age = Date.now() - (job.completedAt || job.failedAt || job.startedAt || 0);
  if ((job.status === "complete" || job.status === "failed") && age > 5 * 60 * 1000) {
    generationJobs.delete(jobId);
  }

  res.json(job);
});

/**
 * API Endpoint: Get Single Product with ALL Images
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

    // Use GraphQL to get product with all images
    const client = new shopify.clients.Graphql({ session });
    
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          description
          status
          vendor
          featuredImage {
            id
            url
            altText
          }
          images(first: 50) {
            edges {
              node {
                id
                url
                altText
              }
            }
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
    `;

    const response = await client.query({
      data: {
        query,
        variables: { id: `gid://shopify/Product/${id}` },
      },
    });

    const product = response.body.data.product;
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variant = product.variants.edges[0]?.node;
    const images = product.images.edges.map(edge => ({
      id: edge.node.id.split('/').pop(),
      url: edge.node.url,
      altText: edge.node.altText,
    }));

    res.json({
      id: product.id.split('/').pop(),
      title: product.title,
      description: product.description,
      price: variant?.price || "0.00",
      inventory: variant?.inventoryQuantity || 0,
      status: product.status.toLowerCase(),
      vendor: product.vendor,
      featuredImage: product.featuredImage ? {
        id: product.featuredImage.id.split('/').pop(),
        url: product.featuredImage.url,
        altText: product.featuredImage.altText,
      } : null,
      images: images, // All product images
      totalImages: images.length,
    });
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(404).json({ error: "Product not found", details: error.message });
  }
});

/**
 * ========================================
 * VIRTUAL TRY-ON ENDPOINTS (Must be BEFORE static middleware!)
 * ========================================
 */

/**
 * App Proxy: Virtual Try-On (using existing generateWithLeonardo)
 * Widget calls this endpoint via Shopify App Proxy
 */
app.post('/apps/ai-tryon/virtual-try-on', async (req, res) => {
  console.log('🎯 POST /apps/ai-tryon/virtual-try-on HIT!');
  console.log('📦 Content-Type:', req.headers['content-type']);
  console.log('📦 Body keys:', Object.keys(req.body || {}));
  
  try {
    // Rate limiting
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        message: "Çok fazla istek. Lütfen 1 saat sonra tekrar deneyin."
      });
    }

    const { customerImage, productImageUrl, productName } = req.body;

    if (!customerImage || !productImageUrl) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Fotoğraf ve ürün resmi gerekli"
      });
    }

    console.log(`👤 Virtual Try-On (App Proxy): ${productName || 'Unknown'} (IP: ${ip})`);

    // VIRTUAL TRY-ON MODE: Replace model, keep clothing identical
    console.log('👗 Virtual Try-On Mode: Replace model while preserving exact outfit');
    
    // Upload customer image to Cloudinary for reference
    let customerImageUrl = null;
    if (customerImage) {
      try {
        console.log('📤 Uploading customer image to Cloudinary...');
        customerImageUrl = await uploadBase64ToCloudinary(customerImage, 'virtual-tryon-customer');
        console.log('✅ Customer image uploaded:', customerImageUrl);
      } catch (uploadError) {
        console.error('⚠️ Customer image upload failed:', uploadError.message);
      }
    }
    
    const result = await generateWithLeonardo(
      productImageUrl,
      productName || "Virtual Try-On",
      null,
      {
        leonardoModel: "nano-banana-pro",
        strength: 0.08, // ULTRA LOW: Maximum clothing preservation (was 0.15)
        guidanceScale: 15, // HIGH: Strong prompt adherence
        inferenceSteps: 75, // HIGH: More careful processing
        customPrompt: `CRITICAL: ONLY change the model's face. The clothing MUST remain 100% identical: exact same fabric texture, exact same colors, exact same patterns, exact same style, exact same fit, exact same pose, exact same lighting, exact same shadows, exact same background. Everything except the face must stay perfectly unchanged. Hyperrealistic face replacement only. Professional fashion photography.${customerImageUrl ? ` Use face reference from: ${customerImageUrl}` : ''}`,
        customNegativePrompt: "different clothing, changed outfit, new garments, modified fabric, altered colors, different patterns, clothing variations, style changes, different accessories, pose changes, lighting changes, background changes, composition changes, outfit modifications, garment alterations, texture changes, fabric modifications, color shifts, pattern variations, altered garments, modified clothes, wardrobe changes, fashion changes, outfit variations",
        customerImageUrl: customerImageUrl,
      }
    );

    res.json({
      success: true,
      generatedImageUrl: result.imageUrl,
      message: "✨ İşte sen bu ürünü giyerken!",
      remaining: rateLimit.remaining
    });

  } catch (error) {
    console.error("❌ Virtual Try-On Error (App Proxy):", error.message);
    // Return 200 OK even on errors (Shopify App Proxy converts 5xx to HTML)
    res.status(200).json({
      success: false,
      error: error.message,
      message: "AI ile görsel oluşturulamadı. Lütfen tekrar deneyin."
    });
  }
});

/**
 * App Proxy Route Handler (GET only - for testing)
 * Shopify App Proxy forwards requests from /apps/ai-tryon/* to this handler
 * This enables virtual try-on widget to work on storefront
 */
app.get('/apps/ai-tryon', (req, res) => {
  console.log('🏠 GET /apps/ai-tryon HIT (root path)');
  
  // Shopify App Proxy sends these parameters
  const { shop, logged_in_customer_id, timestamp, signature, path_prefix, ...rest } = req.query;
  
  console.log(`📱 App Proxy request from shop: ${shop}`);
  console.log(`🔐 Logged in customer: ${logged_in_customer_id || 'guest'}`);
  
  // Serve widget HTML for root path
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Virtual Try-On</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          text-align: center;
          padding: 40px;
          color: #333;
        }
        h1 { color: #667eea; }
        .status { background: #e8f5e9; padding: 16px; border-radius: 8px; display: inline-block; margin: 20px; }
      </style>
    </head>
    <body>
      <h1>✨ AI Virtual Try-On</h1>
      <div class="status">
        ✓ Service is active and ready!<br>
        <small>Shop: ${shop || 'unknown'}</small>
      </div>
      <p>This endpoint is active. Integrate the widget into your product pages.</p>
      <p><a href="/apps/ai-tryon/docs">View Documentation</a></p>
    </body>
    </html>
  `);
});

// Serve widget documentation
app.get('/apps/ai-tryon/docs', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'virtual-tryon-widget.html'));
});

/**
 * ========================================
 * STATIC FILES & FRONTEND (Must be LAST!)
 * ========================================
 */

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
  console.log(`👤 Virtual Try-On: ✅ ENABLED (using existing Leonardo AI)`);
  console.log(`📱 App Proxy: /apps/ai-tryon`);
});
