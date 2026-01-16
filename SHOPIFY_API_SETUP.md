# 🔗 Shopify API Entegrasyonu

## 📋 Şu An Durum

✅ **Kod Hazır** - Backend Shopify Admin API'yi çağırabilir
⚠️ **Access Token Yok** - Şu an mock data gösteriyor

## 🔧 Gerçek Ürünleri Göstermek İçin

### Seçenek 1: Development (Lokal - En Kolay)

```bash
cd /Users/emre/Desktop/whatsapp
shopify app dev
```

Bu komut:
- ✅ Otomatik auth yapar
- ✅ Gerçek ürünleri çeker
- ✅ Config gerekmez

---

### Seçenek 2: Production (Railway - Manuel Setup)

#### Adım 1: Shopify Admin API Access Token Al

1. **Shopify Admin** → **Settings** → **Apps and sales channels**

2. **Develop apps** tıkla

3. **Create an app** tıkla
   - App name: `Product List API`
   - App developer: Kendini seç

4. **Configure Admin API scopes** tıkla
   - ✅ `read_products` scope'u seç
   - Save

5. **Install app** tıkla

6. **Admin API access token** → **Reveal token once**
   - Token'ı kopyala (bir daha gösterilmez!)
   - Örnek: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### Adım 2: Railway'de Environment Variables Ekle

1. **Railway Dashboard** aç
   ```
   https://railway.app/project/chatbutton
   ```

2. **Variables** sekmesine git

3. Ekle:
   ```
   SHOPIFY_STORE=web-health-developer.myshopify.com
   SHOPIFY_ACCESS_TOKEN=shpat_your_actual_token_here
   ```

4. **Deploy** → Railway otomatik restart olur

#### Adım 3: Test Et

```
https://chatbutton-production.up.railway.app/api/products
```

Response:
```json
{
  "products": [...gerçek ürünler...],
  "total": 15,
  "source": "shopify"  ← "mock" değil!
}
```

---

## 🎯 API Özellikleri

### Otomatik Fallback:
- Access token varsa → Shopify'dan çeker ✅
- Access token yoksa → Mock data gösterir ⚠️

### Transform Edilen Data:
```javascript
{
  id: "123456789",
  title: "Premium T-Shirt",
  price: "29.99",
  inventory: 15,
  status: "active",
  image: "https://cdn.shopify.com/..."
}
```

### Desteklenen Özellikler:
- ✅ Product title
- ✅ Price (first variant)
- ✅ Inventory (first variant)
- ✅ Status (active/draft)
- ✅ Image (first image)
- ✅ Max 50 ürün (limit artırılabilir)

---

## 🚀 Hızlı Test (Development)

Terminal'de:
```bash
cd /Users/emre/Desktop/whatsapp
shopify app dev
```

Browser'da:
```
http://localhost:8080
```

**Gerçek mağaza ürünlerini göreceksin!** 🎉

---

## 🔐 Güvenlik Notları

⚠️ **Access token'ı asla GitHub'a pushlamayın!**
- `.env` dosyası `.gitignore`'da
- Sadece Railway'de environment variable olarak ekle

✅ **Token Permissions:**
- Sadece `read_products` yeterli
- `write_products` gerekmez

✅ **Token Lifetime:**
- Token expire olmaz
- Ama iptal edebilirsin

---

## 📊 API Rate Limits

Shopify Admin API:
- **REST API:** 2 req/sec (standard plan)
- **Plus:** 4 req/sec

Uygulamamız:
- Her sayfa yükleme = 1 API call
- Yenile butonu = 1 API call
- Çok az kullanım → Rate limit sorunu yok ✅

---

## 🎯 Sonraki Adımlar

Şu an:
- ✅ Mock data çalışıyor
- ✅ API kodu hazır
- ⏸️ Access token bekleniyor

Gerçek ürünler için:
1. **Lokal test:** `shopify app dev` (5 saniye)
2. **Production:** Railway'e token ekle (2 dakika)

**Hangisini yapayım?** 🚀
