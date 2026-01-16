import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";
import { sessionStorage } from "./session-storage.js";
import dotenv from "dotenv";

dotenv.config();

// Shopify API configuration with OAuth
export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "d8437b8ce81f6502e6eb89d102ebbf7d",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  scopes: ["read_products", "write_online_store_pages"],
  hostName: process.env.HOST?.replace(/https?:\/\//, "") || "localhost:8080",
  hostScheme: process.env.NODE_ENV === "production" ? "https" : "http",
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  isCustomStoreApp: false,
  sessionStorage: sessionStorage,
});

console.log("🔧 Shopify API initialized");
console.log(`📍 Host: ${shopify.config.hostScheme}://${shopify.config.hostName}`);
console.log(`🔑 API Key: ${shopify.config.apiKey}`);
