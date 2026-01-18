# 🔐 Environment Variables Setup for Railway

## ✅ Required Environment Variables:

```env
SHOPIFY_API_KEY=d8437b8ce81f6502e6eb89d102ebbf7d
SHOPIFY_API_SECRET=your_api_secret_here
HOST=chatbutton-production.up.railway.app
PORT=8080
NODE_ENV=production
DATABASE_URL=your_neon_postgres_url
LEONARDO_API_KEY=your_leonardo_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 📋 Variable Details:

### 1. **Shopify OAuth**
- `SHOPIFY_API_KEY`: Get from [Shopify Partners](https://partners.shopify.com) → Apps → Your App → App setup
- `SHOPIFY_API_SECRET`: Same location as API key
- `HOST`: Your Railway app URL (e.g., `chatbutton-production.up.railway.app`)

### 2. **Database (Neon PostgreSQL)**
- `DATABASE_URL`: Get from [Neon Console](https://console.neon.tech/) → Your Project → Connection String
- Format: `postgresql://user:password@host/database?sslmode=require`

### 3. **Leonardo AI (Image Generation)**
- `LEONARDO_API_KEY`: Get from [Leonardo.ai](https://app.leonardo.ai/) → Settings → API Access
- **Cost**: ~$0.018/image (9 credits per image with PhotoReal + Alchemy)
- **See**: `LEONARDO_SETUP.md` for full details

### 4. **Cloudinary (Image Hosting - Optional)**
- `CLOUDINARY_CLOUD_NAME`: Get from [Cloudinary Dashboard](https://cloudinary.com/console)
- `CLOUDINARY_API_KEY`: Same location
- `CLOUDINARY_API_SECRET`: Same location
- **Note**: Only needed if you want to host generated images before uploading to Shopify

---

## ❌ **REMOVED (No Longer Needed):**

These API keys are NO LONGER required and should be removed from Railway:
- ~~`OPENAI_API_KEY`~~ (DALL-E 3 removed)
- ~~`GEMINI_API_KEY`~~ (Gemini removed)

**We now use ONLY Leonardo AI for image generation!**

---

## 🚀 Add to Railway:

1. Go to Railway Dashboard
2. Select your project → `chatbutton`
3. Go to **Variables** tab
4. Click **+ New Variable** for each variable
5. **Deploy** after adding all variables

---

## ✅ Verify Setup:

After deployment, check Railway logs:

```bash
🎨 AI Image Service initialized
🎨 Leonardo AI: ✅ Configured
🎨 Available Leonardo Models: 8 models
```

If you see `❌ Not configured`, the API key is missing!
