# 🔐 OAuth Environment Variables Setup

## Required Environment Variables for Railway:

```env
SHOPIFY_API_KEY=d8437b8ce81f6502e6eb89d102ebbf7d
SHOPIFY_API_SECRET=your_api_secret_here
HOST=chatbutton-production.up.railway.app
PORT=8080
NODE_ENV=production
```

## Where to Get API Secret:

1. Go to: https://partners.shopify.com
2. Apps → chat-button (your app)
3. App setup tab
4. Find "API secret key"
5. Copy it!

## Add to Railway:

Railway Dashboard → chatbutton → Variables → Add:
- SHOPIFY_API_KEY = d8437b8ce81f6502e6eb89d102ebbf7d
- SHOPIFY_API_SECRET = (your secret from Partners)
- HOST = chatbutton-production.up.railway.app
