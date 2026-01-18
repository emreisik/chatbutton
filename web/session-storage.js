/**
 * File-Based Session Storage
 * Persists sessions across Railway restarts (unlike in-memory storage)
 */

import { Session } from "@shopify/shopify-api";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage directory for session files
const STORAGE_DIR = process.env.SESSION_STORAGE_DIR || join(__dirname, ".sessions");

// Create directory if it doesn't exist
if (!existsSync(STORAGE_DIR)) {
  mkdirSync(STORAGE_DIR, { recursive: true });
  console.log(`📁 Created session storage directory: ${STORAGE_DIR}`);
}

function getFilePath(sessionId) {
  // Sanitize session ID for safe filename
  const safeId = sessionId.replace(/[^a-zA-Z0-9-_]/g, "_");
  return join(STORAGE_DIR, `${safeId}.json`);
}

export const sessionStorage = {
  storeSession: async (session) => {
    try {
      const filePath = getFilePath(session.id);
      
      // Convert session to plain object for JSON storage
      const sessionData = {
        id: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        accessToken: session.accessToken,
        expires: session.expires,
      };

      writeFileSync(filePath, JSON.stringify(sessionData, null, 2), "utf-8");
      console.log(`✅ Session saved to file: ${session.shop}`);
      return true;
    } catch (error) {
      console.error("❌ Error saving session to file:", error);
      return false;
    }
  },

  loadSession: async (id) => {
    try {
      const filePath = getFilePath(id);
      
      if (!existsSync(filePath)) {
        return undefined;
      }

      const sessionData = JSON.parse(readFileSync(filePath, "utf-8"));
      
      // Recreate Session object
      const session = new Session(sessionData);
      
      console.log(`✅ Session loaded from file: ${session.shop}`);
      return session;
    } catch (error) {
      console.error("❌ Error loading session from file:", error);
      return undefined;
    }
  },

  deleteSession: async (id) => {
    try {
      const filePath = getFilePath(id);
      
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        console.log(`🗑️  Session deleted: ${id}`);
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error deleting session:", error);
      return false;
    }
  },

  deleteSessions: async (ids) => {
    for (const id of ids) {
      await sessionStorage.deleteSession(id);
    }
    return true;
  },

  findSessionsByShop: async (shop) => {
    try {
      const files = readdirSync(STORAGE_DIR);
      const sessions = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = join(STORAGE_DIR, file);
          const sessionData = JSON.parse(readFileSync(filePath, "utf-8"));
          
          if (sessionData.shop === shop) {
            sessions.push(new Session(sessionData));
          }
        }
      }

      return sessions;
    } catch (error) {
      console.error("❌ Error finding sessions by shop:", error);
      return [];
    }
  },
};

console.log(`💾 File-based session storage initialized: ${STORAGE_DIR}`);
