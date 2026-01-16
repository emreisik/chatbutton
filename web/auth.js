import { Shopify } from "@shopify/shopify-api";

// In-memory session storage (for development)
// In production, use Redis or database
const sessions = new Map();

export function storeSession(sessionId, session) {
  sessions.set(sessionId, session);
  return true;
}

export function loadSession(sessionId) {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId) {
  return sessions.delete(sessionId);
}

// Helper to get session from request
export function getSessionFromRequest(req) {
  const sessionId = req.cookies?.shopify_session;
  if (!sessionId) return null;
  return loadSession(sessionId);
}
