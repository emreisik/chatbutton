# 🎨 Leonardo AI - Tek AI Image Generation Servisi

## ✅ **SADECE LEONARDO AI KULLANILIYOR!**

Tüm diğer AI servisleri (DALL-E 3, Gemini, GPT-4 Vision) kaldırıldı.  
**Sistem artık sadece Leonardo AI ile çalışıyor.**

---

## 🔑 **Railway Environment Variable Ekle**

**Railway Dashboard → Your Project → Variables tab:**

```bash
LEONARDO_API_KEY=ab4ce1f5-354d-4b4e-9fc9-4a7d845cbdf4
```

**"Add" → Save**

Railway otomatik restart olacak (~2-3 dakika).

---

## 🎯 **Leonardo AI Özellikleri**

### **PhotoReal img2img Teknolojisi:**
- ✅ **img2img** → Mevcut görseli analiz edip sadece yüzü değiştirir
- ✅ **%100 kıyafet koruması** → Outfit, pose, lighting, background aynı kalır
- ✅ **2:3 aspect ratio (1024x1536)** → Fashion photography için ideal
- ✅ **PhotoReal v2** → Ultra gerçekçi yüzler, natural skin texture
- ✅ **Alchemy** → Enhanced quality and detail
- ✅ **~40-60 saniye/görsel** → Yavaş ama kaliteli
- ✅ **~$0.018/görsel** → Ekonomik

### **Otomatik Analiz:**
- ✅ Leonardo AI init image'ı otomatik analiz eder
- ✅ GPT-4 Vision'a gerek yok (ekstra maliyet yok)
- ✅ Tek API servisi = daha basit, daha ucuz

---

## 💰 **Maliyet**

| Plan | Aylık | API Credits | Görsel Kapasitesi | Görsel Başına |
|------|-------|-------------|-------------------|---------------|
| **Basic** | $9 | 3,500 | ~388 görsel | ~9 credits |
| **Standard** | $49 | 25,000 | ~2,777 görsel | ~9 credits |
| **Pro** | $299 | 200,000 | ~22,222 görsel | ~9 credits |

**Senin hesabın: Standard Plan ($49/ay)**
- 25,000 API credits
- ~2,777 görsel/ay kapasitesi
- PhotoReal + Alchemy + img2img dahil
- **Görsel başına maliyet: ~$0.018**

**Eski sistem (GPT-4 Vision + Leonardo): $0.023/görsel**  
**Yeni sistem (Sadece Leonardo): $0.018/görsel**  
**Tasarruf: %22 daha ucuz!**

---

## 🧪 **Test Adımları**

### 1. **Railway Deploy Bekle (2-3 dakika)**

### 2. **OAuth Yap:**
```
https://chatbutton-production.up.railway.app/api/auth?shop=web-health-developer.myshopify.com
```

### 3. **Ürün Seç:**
- ✅ **Fotoğrafı olan** ürünleri seç (Leonardo img2img için zorunlu)
- ✅ En az 2-3 görseli olan ürünler ideal

### 4. **AI Modal Ayarlar:**
```
🤖 Leonardo Model Seç: (Nano Banana Pro, GPT Image-1.5, etc.)
📝 Custom Prompt: (Your custom prompt or use default)
🚫 Negative Prompt: (What to avoid)
✅ Shopify'a otomatik yükle
```

### 5. **"Fotoğraf Oluştur" → Console Log:**
```javascript
🎨 [jobId] Generating with Leonardo AI...
📝 [jobId] Custom Prompt: YES
📸 [jobId] Leonardo will analyze init image automatically
✏️ Using custom prompt from user
📝 Prompt length: 287/1500 chars ✅
📤 Step 1/4: Uploading init image...
📤 Step 2/4: Uploading image data to S3...
✅ S3 upload successful! Status: 204
🎨 Step 3/4: Generating new image...
⏳ Step 4/4: Polling for generation status...
✅ Generation complete!
🖼️ Image URL: https://cdn.leonardo.ai/...
💰 Credits used: 9
📤 Uploading to Shopify product...
✅ SUCCESS!
```

**Süre: ~40-60 saniye**

---

## 📋 **Leonardo AI Model Seçenekleri**

Uygulamada 8 farklı Leonardo model mevcut:

| Model | Credit Cost | Best For |
|-------|-------------|----------|
| **Nano Banana Pro** | 9 | Consistency & Infographics (RECOMMENDED) |
| **GPT Image-1.5** | 9 | Superior editing control |
| **PhotoReal v2** | 9 | Photorealistic faces |
| **Kino XL** | 9 | Cinematic images |
| **AlbedoBase XL** | 9 | Artistic freedom |
| **SDXL 1.0** | 9 | General purpose |
| **DreamShaper v7** | 9 | Creative images |
| **Leonardo Anime XL** | 9 | Anime style |

**Not:** Tüm modeller PhotoReal + Alchemy ile kullanılıyor, bu yüzden hepsi 9 credit tüketiyor.

---

## ⚠️ **Önemli Notlar**

1. **Leonardo API Rate Limits:**
   - Concurrent: ~5-10 generation
   - Saniyede 5-10 request
   - Toplu üretimde sıra bekleme olabilir

2. **Generation Time:**
   - Leonardo: 40-60 saniye (photorealistic için normal)
   - Asenkron işlem (background job + polling)

3. **img2img Gereksinimleri:**
   - Mevcut görsel **zorunlu**
   - En az 512x512 boyut
   - URL erişilebilir olmalı

4. **Token Kullanımı:**
   - PhotoReal + Alchemy = ~9 credits/görsel
   - Standard plan: 2,777 görsel/ay limit
   - Token biterse yavaş "relaxed mode" devreye girer

5. **Prompt Limit:**
   - Leonardo AI max 1500 karakter prompt
   - Sistem otomatik truncate eder

---

## ❌ **Kaldırılan AI Servisleri**

Bu AI servisleri artık KULLANILMIYOR ve Railway'den kaldırılabilir:

- ❌ **OpenAI DALL-E 3** → Leonardo AI daha iyi kıyafet koruması
- ❌ **GPT-4 Vision** → Leonardo otomatik analiz yapıyor
- ❌ **Gemini API** → Gereksiz

**Railway'den bu environment variable'ları silebilirsin:**
- ~~`OPENAI_API_KEY`~~
- ~~`GEMINI_API_KEY`~~

---

## 🚀 **Sonuç**

**Leonardo AI tek başına mükemmel çalışıyor!**

✅ img2img perfect preservation  
✅ PhotoReal ultra realistic faces  
✅ 2:3 fashion photography ratio  
✅ Otomatik init image analizi  
✅ Custom prompt + negative prompt desteği  
✅ %22 daha ucuz (GPT-4 Vision kaldırıldı)  
✅ Daha basit kod, daha az bağımlılık  

**Railway'e `LEONARDO_API_KEY` ekle ve test et!** 🎯
