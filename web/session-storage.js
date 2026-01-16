/**
 * In-Memory Session Storage
 * For production, use Redis, PostgreSQL, or MongoDB
 */

const sessions = new Map();

export const sessionStorage = {
  storeSession: async (session) => {
    sessions.set(session.id, session);
    return true;
  },

  loadSession: async (id) => {
    return sessions.get(id) || undefined;
  },

  deleteSession: async (id) => {
    return sessions.delete(id);
  },

  deleteSessions: async (ids) => {
    ids.forEach((id) => sessions.delete(id));
    return true;
  },

  findSessionsByShop: async (shop) => {
    const result = [];
    for (const [, session] of sessions) {
      if (session.shop === shop) {
        result.push(session);
      }
    }
    return result;
  },
};

console.log("💾 Session storage initialized (in-memory)");
