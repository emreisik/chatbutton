# 🤳 Virtual Try-On Feature - Quick Start

## ✅ What's Been Added

Your Shopify app now has a **Virtual Try-On** feature that allows customers to upload their photos and see how products look on them using AI!

---

## 📁 New Files Created

1. **`web/virtual-tryon-service.js`** - AI generation service
2. **`web/rate-limiter.js`** - Security & rate limiting middleware
3. **`web/public/virtual-tryon-widget.html`** - Frontend widget for Shopify theme
4. **`VIRTUAL_TRYON_SETUP.md`** - Complete setup guide (READ THIS!)
5. **`VIRTUAL_TRYON_README.md`** - This file

---

## 🚀 Deploy NOW (3 Steps)

### Step 1: Commit & Push

```bash
cd /Users/emre/Desktop/YAZILIM/chatbutton

git add .
git commit -m "Add Virtual Try-On feature for customer storefront"
git push origin main
```

Railway will auto-deploy in ~2-3 minutes.

---

### Step 2: Configure Shopify App Proxy

After deployment completes:

1. Go to: https://partners.shopify.com/
2. Your App → **Extensions** → **Online Store** → **App Proxy**
3. Configure:

```
Subpath:        ai-tryon
Subpath prefix: apps
Proxy URL:      https://chatbutton-production.up.railway.app/apps/ai-tryon
```

4. **Save**

---

### Step 3: Test It

Visit:

```
https://chatbutton-production.up.railway.app/api/public/virtual-try-on
```

If you see {"error":"Missing customer image"} → **IT'S WORKING!** ✅

---

## 🎨 Add Widget to Shopify Theme

### Quick Integration

1. **Shopify Admin** → **Online Store** → **Themes** → **Edit Code**

2. **Snippets** → **Add a new snippet** → Name: `virtual-tryon-widget`

3. Copy contents from:
   ```
   web/public/virtual-tryon-widget.html
   ```

4. Open: `sections/product-template.liquid`

5. Add after "Add to Cart" button:
   ```liquid
   {% render 'virtual-tryon-widget' %}
   ```

6. **Save** → **Preview**

---

## 📊 Key Features

- ✅ **Rate Limited**: 5 requests/hour per IP (prevents abuse)
- ✅ **Secure**: Image validation, no storage
- ✅ **High Quality**: Leonardo AI PhotoReal v2
- ✅ **Privacy**: Customer photos NOT stored
- ✅ **Cost Control**: ~$0.02-0.05 per generation

---

## 💰 Cost Estimate

- **Per Generation**: $0.02-0.05 (Leonardo AI)
- **Per Customer**: Max $0.25/hour (5 requests limit)
- **1000 customers/day**: ~$20-50/day

**Start with beta testing** to control costs!

---

## 📖 Full Documentation

For complete setup, configuration, and troubleshooting:

👉 **Read:** `VIRTUAL_TRYON_SETUP.md`

---

## 🧪 Test Flow

1. Go to product page on your store
2. Click "🤳 Üzerimde Dene (AI)"
3. Upload customer photo
4. Wait ~30-60 seconds
5. See AI-generated result!

---

## ⚠️ Important Notes

### Before Going Live

- [ ] Test with 10-20 customers first
- [ ] Monitor Leonardo AI credits
- [ ] Add privacy notice to widget
- [ ] Set up cost monitoring

### Security

- Rate limiting: 5 requests/hour/IP ✅
- Image validation: Max 10MB ✅
- No storage: Photos not saved ✅

### Privacy

Add this to your widget:

```html
<p style="font-size: 12px; color: #999;">
  🔒 Fotoğrafınız sadece AI için kullanılır, saklanmaz.
</p>
```

---

## 🐛 Troubleshooting

### "Too many requests"
- Customer exceeded 5/hour limit
- Wait 1 hour or increase limit

### "App Proxy not working"
- Check Step 2 configuration
- Verify Proxy URL is correct

### "Generation failed"
- Check Leonardo AI credits
- Check Railway logs: `railway logs`

---

## 📞 Need Help?

1. **Full Guide**: Read `VIRTUAL_TRYON_SETUP.md`
2. **Railway Logs**: `railway logs`
3. **Leonardo Status**: https://status.leonardo.ai/

---

## ✅ Quick Checklist

- [ ] Code deployed to Railway
- [ ] App Proxy configured (Step 2)
- [ ] Widget added to theme (Step 3)
- [ ] Tested with real photo
- [ ] Privacy notice added
- [ ] Monitoring enabled

---

## 🎉 Ready to Launch?

Follow the 3 steps above, then test it!

**Questions?** Check `VIRTUAL_TRYON_SETUP.md` for detailed docs.

**Good luck!** 🚀
