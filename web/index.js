import { join } from "path";
import { readFileSync, existsSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

const PORT = parseInt(process.env.PORT || "8080", 10);
const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Parse JSON body
app.use(express.json());

/**
 * API Endpoint: Get WhatsApp settings
 * For Railway: Returns dummy data (customize later with actual Shopify integration)
 */
app.get("/api/settings", async (req, res) => {
  try {
    // TODO: Add Shopify API integration when ready
    res.json({
      phoneNumber: process.env.WHATSAPP_PHONE || "",
      defaultMessage: process.env.WHATSAPP_MESSAGE || "Hi! I need help with...",
      position: process.env.WHATSAPP_POSITION || "bottom-right",
      enabled: true,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * API Endpoint: Save WhatsApp settings
 */
app.post("/api/settings", async (req, res) => {
  try {
    const { phoneNumber, defaultMessage, position, enabled } = req.body;
    
    console.log("Settings saved:", { phoneNumber, defaultMessage, position, enabled });
    
    // TODO: Add Shopify API integration when ready
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// Serve static frontend files if they exist
const STATIC_PATH = join(process.cwd(), "web/frontend/dist");
if (existsSync(STATIC_PATH)) {
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
