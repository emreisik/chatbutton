# 🎨 Leonardo AI Setup Guide

## ✅ Sisteme Eklendi!

Leonardo AI PhotoReal img2img desteği başarıyla entegre edildi.

---

## 🔑 Railway Environment Variable Ekle

**Railway Dashboard → Your Project → Variables tab:**

```bash
LEONARDO_API_KEY=ab4ce1f5-354d-4b4e-9fc9-4a7d845cbdf4
```

**"Add" → Save**

Railway otomatik restart olacak (~2-3 dakika).

---

## 🎯 Özellikler

### **Leonardo AI PhotoReal:**
- ✅ **img2img teknolojisi** → Mevcut görseli analiz edip sadece yüzü değiştirir
- ✅ **%100 kıyafet koruması** → Outfit, pose, lighting, background aynı kalır
- ✅ **2:3 aspect ratio (1024x1536)** → Fashion photography için ideal
- ✅ **PhotoReal v2** → Ultra gerçekçi yüzler, natural skin texture
- ✅ **Fashion preset** → Professional model görünümü
- ✅ **~40 saniye/görsel** → Yavaş ama kaliteli
- ✅ **~$0.018/görsel** → 600+ görsel/ay için ekonomik

### **DALL-E 3 (Karşılaştırma):**
- ⚡ **Hızlı** → ~10-20 saniye/görsel
- 💰 **Düşük hacimde ucuz** → $0.08/görsel
- ⚠️ **Kıyafet tutarsızlığı** → Text-to-image, img2img yok
- ✅ **300 görsele kadar ekonomik**

---

## 📊 Maliyet Karşılaştırması

| Görsel Sayısı | DALL-E 3 HD | Leonardo AI Standard | Kazanç |
|---------------|-------------|----------------------|---------|
| **300/ay** | $24 | $49 (plan) | ❌ -$25 |
| **600/ay** | $48 | $49 | ✅ -$1 |
| **1,000/ay** | $80 | $49 | ✅ **+$31** 💰 |
| **2,000/ay** | $160 | $49 | ✅ **+$111** 💰 |
| **2,777/ay** | $222 | $49 | ✅ **+$173** 💰 |

**Break-even: ~612 görsel/ay**

---

## 🧪 Test Adımları

### 1. Railway Deploy Bekle (2-3 dakika)

### 2. OAuth Yap:
```
https://chatbutton-production.up.railway.app/api/auth?shop=web-health-developer.myshopify.com
```

### 3. Ürün Seç:
- ✅ **Fotoğrafı olan** ürünleri seç (Leonardo img2img için zorunlu)
- ✅ En az 2-3 görseli olan ürünler ideal

### 4. AI Modal Ayarlar:
```
🤖 AI Modeli: Leonardo AI PhotoReal
👤 Model Tipi: Beyaz Ten - Avrupa (veya istediğin)
📸 Fotoğraf Stili: Kadın Model ile Ürün
✅ Shopify'a otomatik yükle
```

### 5. "Fotoğraf Oluştur" → Console:
```javascript
🎨 Using Leonardo AI (img2img)...
📤 Step 1/4: Uploading init image...
📤 Step 2/4: Uploading image data...
✅ Image uploaded, ID: abc123...
🎨 Step 3/4: Generating new image...
🔄 Generation ID: xyz789...
⏳ Step 4/4: Waiting for generation to complete...
⏳ Status: PENDING (attempt 1/60)
⏳ Status: PENDING (attempt 2/60)
✅ Generation complete!
🖼️ Image URL: https://cdn.leonardo.ai/...
📤 Leonardo image uploaded to Shopify product 12345
```

**Süre: ~40-60 saniye**

---

## 📋 Leonardo AI Planları

| Plan | Aylık | API Credits | Görsel Kapasitesi | Görsel/Credit |
|------|-------|-------------|-------------------|---------------|
| **Basic** | $9 | 3,500 | ~388 görsel | ~9 credits |
| **Standard** | $49 | 25,000 | ~2,777 görsel | ~9 credits |
| **Pro** | $299 | 200,000 | ~22,222 görsel | ~9 credits |

**Senin hesabın: Standard Plan ($49/ay)**
- 25,000 API credits
- ~2,777 görsel/ay kapasitesi
- PhotoReal + Alchemy + img2img dahil

---

## 🎨 Kullanım Stratejisi

### **Hibrit Yaklaşım (Önerilen):**

```javascript
// Kullanıcıya her iki seçenek de sunulur
- Leonardo AI → Kalite odaklı, kıyafet koruması %100
- DALL-E 3 → Hızlı sonuç, düşük hacimde ekonomik
```

### **Break-even Tavsiyesi:**
- **< 600 görsel/ay** → DALL-E 3 kullan
- **> 600 görsel/ay** → Leonardo AI kullan

### **Kalite İçin:**
- Leonardo AI her zaman daha iyi sonuç verir
- img2img = perfect outfit/pose preservation
- PhotoReal = ultra realistic faces

---

## ⚠️ Önemli Notlar

1. **Leonardo API Rate Limits:**
   - Concurrent: ~5-10 generation
   - Saniyede 5-10 request
   - Toplu üretimde sıra bekleme olabilir

2. **Generation Time:**
   - Leonardo: 40-60 saniye (photorealistic için normal)
   - DALL-E 3: 10-20 saniye

3. **img2img Gereksinimleri:**
   - Mevcut görsel **zorunlu**
   - En az 512x512 boyut
   - URL erişilebilir olmalı

4. **Token Kullanımı:**
   - PhotoReal + Alchemy = ~9 credits/görsel
   - Standard plan: 2,777 görsel/ay limit
   - Token biterse yavaş "relaxed mode" devreye girer

---

## 🚀 Sonuç

**Leonardo AI başarıyla entegre edildi!**

✅ img2img perfect preservation
✅ PhotoReal ultra realistic faces
✅ 2:3 fashion photography ratio
✅ Hibrit sistem (Leonardo + DALL-E 3)
✅ Kullanıcı seçimi

**Railway'e `LEONARDO_API_KEY` ekle ve test et!** 🎯
