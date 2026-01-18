/**
 * PostgreSQL Session Storage (Neon)
 * Persists sessions across Railway restarts in cloud database
 */

import { Session } from "@shopify/shopify-api";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

// Create sessions table if it doesn't exist
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shopify_sessions (
        id VARCHAR(255) PRIMARY KEY,
        shop VARCHAR(255) NOT NULL,
        state VARCHAR(255),
        is_online BOOLEAN DEFAULT false,
        scope TEXT,
        access_token TEXT,
        expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create index for faster shop lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_shop ON shopify_sessions(shop);
    `);
    
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}

// Initialize database on startup
await initDatabase();

export const sessionStorage = {
  storeSession: async (session) => {
    try {
      const query = `
        INSERT INTO shopify_sessions (id, shop, state, is_online, scope, access_token, expires, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
          shop = EXCLUDED.shop,
          state = EXCLUDED.state,
          is_online = EXCLUDED.is_online,
          scope = EXCLUDED.scope,
          access_token = EXCLUDED.access_token,
          expires = EXCLUDED.expires,
          updated_at = NOW()
      `;
      
      const values = [
        session.id,
        session.shop,
        session.state || null,
        session.isOnline || false,
        session.scope || null,
        session.accessToken || null,
        session.expires ? new Date(session.expires) : null,
      ];

      await pool.query(query, values);
      console.log(`✅ Session saved to database: ${session.shop}`);
      return true;
    } catch (error) {
      console.error("❌ Error saving session to database:", error);
      return false;
    }
  },

  loadSession: async (id) => {
    try {
      const result = await pool.query(
        "SELECT * FROM shopify_sessions WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return undefined;
      }

      const row = result.rows[0];
      
      // Recreate Session object
      const session = new Session({
        id: row.id,
        shop: row.shop,
        state: row.state,
        isOnline: row.is_online,
        scope: row.scope,
        accessToken: row.access_token,
        expires: row.expires ? new Date(row.expires).getTime() : undefined,
      });

      console.log(`✅ Session loaded from database: ${session.shop}`);
      return session;
    } catch (error) {
      console.error("❌ Error loading session from database:", error);
      return undefined;
    }
  },

  deleteSession: async (id) => {
    try {
      await pool.query("DELETE FROM shopify_sessions WHERE id = $1", [id]);
      console.log(`🗑️  Session deleted: ${id}`);
      return true;
    } catch (error) {
      console.error("❌ Error deleting session:", error);
      return false;
    }
  },

  deleteSessions: async (ids) => {
    try {
      await pool.query(
        "DELETE FROM shopify_sessions WHERE id = ANY($1)",
        [ids]
      );
      console.log(`🗑️  ${ids.length} sessions deleted`);
      return true;
    } catch (error) {
      console.error("❌ Error deleting sessions:", error);
      return false;
    }
  },

  findSessionsByShop: async (shop) => {
    try {
      const result = await pool.query(
        "SELECT * FROM shopify_sessions WHERE shop = $1",
        [shop]
      );

      const sessions = result.rows.map((row) => {
        return new Session({
          id: row.id,
          shop: row.shop,
          state: row.state,
          isOnline: row.is_online,
          scope: row.scope,
          accessToken: row.access_token,
          expires: row.expires ? new Date(row.expires).getTime() : undefined,
        });
      });

      return sessions;
    } catch (error) {
      console.error("❌ Error finding sessions by shop:", error);
      return [];
    }
  },
};

console.log("💾 PostgreSQL session storage initialized (Neon)");

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log(`✅ Database connected successfully at ${res.rows[0].now}`);
  }
});
