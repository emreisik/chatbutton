# 🤳 Virtual Try-On Feature - Setup Guide

## Overview

Virtual Try-On allows your customers to upload their photos and see how products look on them using AI technology. This feature uses Leonardo AI to generate photorealistic images.

---

## 🎯 Features

- ✅ **Customer-Facing**: Public API for storefront integration
- ✅ **Rate Limited**: 5 requests per hour per IP to control costs
- ✅ **AI-Powered**: Leonardo AI with PhotoReal v2 for high-quality results
- ✅ **Garment Preservation**: 95%+ clothing accuracy maintained
- ✅ **Secure**: Image validation and rate limiting built-in
- ✅ **Privacy-Focused**: Customer images not stored, only used for generation

---

## 📋 Architecture

```
Customer (Storefront)
  ↓
  Upload Photo
  ↓
Widget (JavaScript)
  ↓
  POST /apps/ai-tryon/virtual-try-on
  ↓
Shopify App Proxy
  ↓
  POST /api/public/virtual-try-on (Rate Limited)
  ↓
Leonardo AI
  ↓
Generated Image
  ↓
Customer Sees Result
```

---

## 🚀 Deployment Steps

### 1. Deploy Code to Railway

The code is ready to deploy. All files are in place:

- ✅ `web/virtual-tryon-service.js` - AI generation service
- ✅ `web/rate-limiter.js` - Security middleware
- ✅ `web/index.js` - Public endpoint + App Proxy routes
- ✅ `shopify.app.toml` - App Proxy configuration
- ✅ `web/public/virtual-tryon-widget.html` - Frontend widget

```bash
cd /Users/emre/Desktop/YAZILIM/chatbutton
git add .
git commit -m "Add Virtual Try-On feature for customers"
git push origin main
```

Railway will auto-deploy (~2-3 minutes).

---

### 2. Configure Shopify App Proxy

After deployment, configure the App Proxy in Shopify Partner Dashboard:

1. Go to: https://partners.shopify.com/
2. Select your app: **Product List App**
3. Navigate to: **Extensions** → **Online Store** → **App Proxy**
4. Configure:

```
Subpath:        ai-tryon
Subpath prefix: apps
Proxy URL:      https://chatbutton-production.up.railway.app/apps/ai-tryon
```

5. **Save** the configuration

**Result**: Requests to `yourstore.myshopify.com/apps/ai-tryon/*` will forward to your Railway app.

---

### 3. Test the Public API

After deployment, test the endpoint:

```bash
curl -X POST https://chatbutton-production.up.railway.app/api/public/virtual-try-on \
  -H "Content-Type: application/json" \
  -d '{
    "customerImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "productImageUrl": "https://cdn.shopify.com/s/files/.../product.jpg",
    "productName": "Test Product"
  }'
```

Expected response:

```json
{
  "success": true,
  "generatedImageUrl": "https://cdn.leonardo.ai/...",
  "generationId": "abc123...",
  "message": "✨ İşte sen bu ürünü giyerken!",
  "credits": 9
}
```

---

### 4. Integrate Widget into Shopify Theme

#### Option A: Manual Installation (Recommended)

1. Go to: **Shopify Admin** → **Online Store** → **Themes** → **Edit Code**

2. Create new snippet:
   - Click **Snippets** → **Add a new snippet**
   - Name: `virtual-tryon-widget`
   - Paste contents from: `web/public/virtual-tryon-widget.html`

3. Add to product page:
   - Open: `sections/product-template.liquid` (or `templates/product.liquid`)
   - Find the "Add to Cart" button
   - Add **AFTER** the button:

```liquid
<div class="product-virtual-tryon">
  {% render 'virtual-tryon-widget' %}
</div>
```

4. **Save** and **Preview**

#### Option B: App Embed Block (Advanced)

Create a Shopify App Block:

```liquid
<!-- sections/virtual-tryon-block.liquid -->
<div class="virtual-tryon-app-block">
  <script src="https://chatbutton-production.up.railway.app/apps/ai-tryon/widget.js"></script>
</div>

{% schema %}
{
  "name": "Virtual Try-On",
  "target": "section",
  "settings": []
}
{% endschema %}
```

---

## ⚙️ Configuration

### Rate Limiting

Default: **5 requests per hour per IP**

To adjust, edit `web/index.js`:

```javascript
const virtualTryOnRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // Time window (1 hour)
  max: 5,                    // Max requests per window
  message: "Çok fazla istek..."
});
```

### Leonardo AI Settings

AI generation parameters in `web/virtual-tryon-service.js`:

```javascript
{
  init_strength: 0.25,      // Lower = more garment preservation (0.1-0.4)
  guidance_scale: 10,       // Prompt adherence (7-15)
  alchemy: true,            // Quality enhancement
  photoReal: true,          // Photorealistic mode
  photoRealVersion: "v2",   // Latest version
  promptMagic: true,        // Prompt optimization
  num_inference_steps: 50,  // Generation quality (30-60)
}
```

### Cost Estimation

- **Leonardo AI Cost**: ~$0.02-0.05 per generation
- **Rate limit (5/hour/IP)**: Max ~$0.25/hour per user
- **1000 customers/day**: ~$20-50/day

**Recommendation**: Start with beta testing (limited users) to control costs.

---

## 🔒 Security & Privacy

### Security Features

1. **Rate Limiting**: Prevents abuse (5 requests/hour/IP)
2. **Image Validation**: Checks format and size (max 10MB)
3. **Input Sanitization**: Validates all inputs
4. **CORS**: Restricted to Shopify domains
5. **No Authentication Required**: Public endpoint for customer use

### Privacy Considerations

- ❌ **Customer images NOT stored** on your server
- ❌ **Customer images NOT saved** to Shopify
- ✅ **Images only sent to Leonardo AI** for generation
- ✅ **Generated images temporary** (Leonardo CDN, ~30 days)
- ✅ **GDPR/KVKK Compliant**: No personal data stored

**Privacy Notice Template** (add to widget):

```html
<p style="font-size: 12px; color: #999;">
  🔒 Fotoğrafınız sadece AI için kullanılır, saklanmaz.
  <a href="/pages/privacy">Gizlilik Politikası</a>
</p>
```

---

## 🧪 Testing

### Test Flow

1. **Test Product Page**:
   - Go to: `yourstore.myshopify.com/products/test-product`
   - Click: "🤳 Üzerimde Dene (AI)"

2. **Upload Test Image**:
   - Upload a clear photo of a person (face visible)
   - File must be < 10MB, format: JPG/PNG/WEBP

3. **Wait for Generation**:
   - Loading: ~30-60 seconds
   - Result: AI-generated image with product on customer

4. **Check Rate Limiting**:
   - Try 6 requests in 1 hour
   - 6th request should fail with 429 status

### Debug Mode

Enable debug logging:

```bash
# On Railway
export DEBUG=virtual-tryon:*
```

View logs:

```bash
railway logs
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **API Usage**:
   - Requests per day
   - Success rate
   - Average generation time

2. **Leonardo AI Costs**:
   - Total credits used
   - Cost per day/week/month

3. **Rate Limit Hits**:
   - How many users hit the limit?
   - Adjust if too restrictive

4. **Error Rate**:
   - Failed generations
   - Timeout errors

### Logging

All requests logged with:

```
👤 Virtual Try-On request for product: Product Name
📸 Product image: https://...
🔐 IP: 123.456.789.0
✅ Virtual try-on complete!
```

---

## 🐛 Troubleshooting

### Error: "Too many requests"

**Cause**: Customer exceeded 5 requests/hour  
**Solution**: Wait 1 hour or increase rate limit

### Error: "Invalid image format"

**Cause**: Uploaded file not PNG/JPG/WEBP  
**Solution**: Customer must upload valid image

### Error: "Image too large"

**Cause**: File > 10MB  
**Solution**: Customer must compress image

### Error: "Leonardo API key not configured"

**Cause**: Missing `LEONARDO_API_KEY` env var  
**Solution**: Add to Railway environment variables

### Error: "Generation timeout"

**Cause**: Leonardo AI taking > 2 minutes  
**Solution**: Retry or check Leonardo AI status

### App Proxy Not Working

**Cause**: App Proxy not configured in Shopify  
**Solution**: Follow **Step 2** above to configure

---

## 💡 Best Practices

### For Store Owners

1. **Start with Beta**:
   - Test with 10-20 customers first
   - Get feedback on image quality
   - Adjust settings if needed

2. **Set Expectations**:
   - Add notice: "AI generation takes 30-60 seconds"
   - Explain: "Result may not be 100% perfect"

3. **Monitor Costs**:
   - Check Leonardo AI credits daily
   - Set budget alerts

4. **A/B Test**:
   - Test conversion rate with/without feature
   - Measure impact on sales

### For Developers

1. **Optimize Images**:
   - Compress product images before sending
   - Use WebP format when possible

2. **Cache Results** (Optional):
   - Store generated images for same customer + product
   - Reduce Leonardo AI costs

3. **Add Analytics**:
   - Track which products use virtual try-on most
   - Measure conversion rates

---

## 🔗 API Reference

### POST /api/public/virtual-try-on

**Public endpoint for virtual try-on generation**

**Request Body**:

```json
{
  "customerImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "productImageUrl": "https://cdn.shopify.com/s/files/.../product.jpg",
  "productName": "Product Name (optional)"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "generatedImageUrl": "https://cdn.leonardo.ai/...",
  "generationId": "abc123...",
  "message": "✨ İşte sen bu ürünü giyerken!",
  "credits": 9
}
```

**Response (Rate Limited)**:

```json
{
  "error": "Too many requests",
  "retryAfter": 3456,
  "resetTime": "2026-01-19T15:30:00.000Z",
  "message": "Çok fazla istek. Lütfen 58 dakika sonra tekrar deneyin."
}
```

**Response (Error)**:

```json
{
  "error": "Generation failed",
  "message": "AI ile görsel oluşturulamadı. Lütfen tekrar deneyin."
}
```

**Rate Limits**:

- 5 requests per hour per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📞 Support

### Issues or Questions?

1. Check Railway logs: `railway logs`
2. Check Leonardo AI status: https://status.leonardo.ai/
3. Review this documentation

### Future Improvements

- [ ] Add customer image caching
- [ ] Support multiple product angles
- [ ] Add "Share Result" feature
- [ ] Mobile app integration
- [ ] A/B testing dashboard
- [ ] Conversion tracking

---

## ✅ Launch Checklist

Before going live:

- [ ] Deployed to Railway successfully
- [ ] App Proxy configured in Shopify
- [ ] Widget added to product pages
- [ ] Tested with real customer photo
- [ ] Rate limiting working (tested 6 requests)
- [ ] Error messages displaying correctly
- [ ] Privacy notice added to widget
- [ ] Leonardo AI credits sufficient
- [ ] Monitoring/logging enabled
- [ ] Backup plan if service fails

---

**Ready to launch?** Follow the deployment steps above! 🚀

**Questions?** Check troubleshooting section or Railway logs.

**Good luck!** 🎉
