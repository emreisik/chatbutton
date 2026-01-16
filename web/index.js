import { join, dirname } from "path";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import express from "express";
import serveStatic from "serve-static";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || "8080", 10);
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Parse JSON body
app.use(express.json());

/**
 * In-memory storage for WhatsApp settings
 * In production, this would be stored in a database or Shopify metafields
 */
let whatsappSettings = {
  phoneNumber: process.env.WHATSAPP_PHONE || "",
  defaultMessage: process.env.WHATSAPP_MESSAGE || "Hi! I need help with...",
  position: process.env.WHATSAPP_POSITION || "bottom-right",
  enabled: true,
};

/**
 * API Endpoint: Get WhatsApp settings
 * Returns the current WhatsApp button settings
 */
app.get("/api/settings", async (req, res) => {
  try {
    console.log("📖 Fetching settings:", whatsappSettings);
    res.json(whatsappSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * API Endpoint: Save WhatsApp settings
 * Saves the WhatsApp button configuration
 */
app.post("/api/settings", async (req, res) => {
  try {
    const { phoneNumber, defaultMessage, position, enabled } = req.body;
    
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim() === "") {
      return res.status(400).json({ 
        error: "Phone number is required" 
      });
    }
    
    // Update settings in memory
    whatsappSettings = {
      phoneNumber: phoneNumber.trim(),
      defaultMessage: defaultMessage || "Hi! I need help with...",
      position: position || "bottom-right",
      enabled: enabled !== undefined ? enabled : true,
    };
    
    console.log("✅ Settings saved successfully:", whatsappSettings);
    
    res.json({ 
      success: true,
      settings: whatsappSettings 
    });
  } catch (error) {
    console.error("❌ Error saving settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
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
