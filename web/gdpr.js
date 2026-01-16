/**
 * GDPR Webhook Handlers
 * Required for Shopify App Store compliance
 */

export default {
  /**
   * Customers can request their data from a store owner. When this happens,
   * Shopify invokes this webhook.
   */
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      console.log("CUSTOMERS_DATA_REQUEST", shop, payload);
      // Implement your data request logic here
      // This app doesn't store customer data, so no action needed
    },
  },

  /**
   * Store owners can request that data is deleted on behalf of a customer.
   */
  CUSTOMERS_REDACT: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      console.log("CUSTOMERS_REDACT", shop, payload);
      // Implement your customer data deletion logic here
      // This app doesn't store customer data, so no action needed
    },
  },

  /**
   * 48 hours after a store owner uninstalls your app, Shopify invokes this webhook.
   */
  SHOP_REDACT: {
    deliveryMethod: "http",
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      console.log("SHOP_REDACT", shop, payload);
      // Implement your shop data deletion logic here
      // Clean up any stored data for this shop
    },
  },
};
