import { shopify } from "./shopify-config.js";
import { sessionStorage } from "./session-storage.js";

/**
 * OAuth Routes for Shopify App
 */

export function setupAuthRoutes(app) {
  /**
   * OAuth Begin - Redirects to Shopify OAuth
   */
  app.get("/api/auth", async (req, res) => {
    try {
      const { shop } = req.query;

      if (!shop) {
        return res.status(400).send("Missing shop parameter");
      }

      console.log(`🔐 Starting OAuth for shop: ${shop}`);

      // Begin OAuth
      await shopify.auth.begin({
        shop: shopify.utils.sanitizeShop(shop, true),
        callbackPath: "/api/auth/callback",
        isOnline: false, // Offline token for background access
        rawRequest: req,
        rawResponse: res,
      });
    } catch (error) {
      console.error("❌ OAuth begin error:", error);
      res.status(500).send(error.message);
    }
  });

  /**
   * OAuth Callback - Handles OAuth response from Shopify
   */
  app.get("/api/auth/callback", async (req, res) => {
    try {
      console.log("📥 OAuth callback received");

      const callback = await shopify.auth.callback({
        rawRequest: req,
        rawResponse: res,
      });

      const { session } = callback;

      // Store session
      await sessionStorage.storeSession(session);

      console.log(`✅ OAuth completed for shop: ${session.shop}`);
      console.log(`🔑 Access token obtained`);

      // Store session ID in cookie
      res.cookie("shopify_session", session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      });

      // Redirect to app
      const host = req.query.host;
      const redirectUrl = `/?shop=${session.shop}&host=${host}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("❌ OAuth callback error:", error);
      res.status(500).send(error.message);
    }
  });

  /**
   * Verify Request - GDPR webhook verification
   */
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const sessionId = req.cookies?.shopify_session;
      
      if (!sessionId) {
        return res.status(401).json({ error: "No session" });
      }

      const session = await sessionStorage.loadSession(sessionId);
      
      if (!session) {
        return res.status(401).json({ error: "Session not found" });
      }

      res.json({ 
        authenticated: true,
        shop: session.shop 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  console.log("🔐 OAuth routes configured");
}
