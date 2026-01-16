# 🚀 WhatsApp Chat Button - Başlatma Rehberi

Tebrikler! Uygulamanız hazır. İşte yapmanız gerekenler:

## ✅ Yapılan Güncellemeler

- ✅ Client ID eklendi
- ✅ API Secret eklendi
- ✅ Mağaza URL'i eklendi
- ✅ `.env` dosyası oluşturuldu

## 🎯 Şimdi Terminal'de Şu Komutları Çalıştırın

### 1. Bağımlılıkları Yükle (İlk kez, ~2 dakika)

```bash
cd /Users/emre/Desktop/whatsapp
npm install
```

Ardından:

```bash
cd web
npm install
```

Ardından:

```bash
cd frontend
npm install
```

Root'a dön:

```bash
cd ../..
```

### 2. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

## 📋 Ne Olacak?

Sunucu başladığında şöyle bir şey göreceksiniz:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Uygulamanızı kurmak için bu URL'yi açın:               │
│  https://web-health-developer.myshopify.com/admin/...   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 🔧 Kurulum Adımları

### 1. URL'yi Kopyalayın ve Açın
Terminal'de çıkan kurulum URL'sini tarayıcınızda açın.

### 2. Uygulamayı Kurun
- "Install app" (Uygulamayı Kur) butonuna tıklayın
- İzinleri onaylayın

### 3. Ayarları Yapılandırın
Uygulama açıldığında şunları girin:

**WhatsApp Telefon Numarası:**
- Ülke kodu ile birlikte (örn: `+905551234567`)
- Boşluk ve özel karakter olmadan

**Varsayılan Mesaj:**
```
Merhaba! Yardıma ihtiyacım var...
```

**Buton Konumu:**
- `bottom-right` (Sağ alt - önerilen)
- `bottom-left` (Sol alt)
- `top-right` (Sağ üst)
- `top-left` (Sol üst)

**Etkinleştir:**
- ✅ İşaretleyin

**Kaydet** butonuna tıklayın.

### 4. App Embed'i Aktifleştirin (ÇOK ÖNEMLİ!)

Buton görünmesi için bunu yapmalısınız:

1. Shopify admin'de **Online Store → Themes** (Çevrimiçi Mağaza → Temalar)
2. Aktif temanızda **Customize** (Özelleştir) butonuna tıklayın
3. Sol sidebar'da aşağı kaydırın
4. **App embeds** (Uygulama Yerleştirmeleri) bölümünü bulun
5. **WhatsApp Chat Button**'u bulun ve **açın** (toggle ON)
6. Sağ üstteki **Save** (Kaydet) butonuna tıklayın

### 5. Mağazanızda Test Edin

1. Mağazanızın anasayfasını ziyaret edin: https://web-health-developer.myshopify.com/
2. Yeşil WhatsApp butonunu görmelisiniz
3. Butona tıklayarak WhatsApp'ın açıldığını doğrulayın
4. Mobil'de de test edin (telefon veya tarayıcı DevTools)

## 🎨 Özelleştirme (İsteğe Bağlı)

### Buton Rengini Değiştir

`extensions/whatsapp-button/blocks/whatsapp-button.liquid` dosyasını açın:

```css
#whatsapp-chat-button {
  background: #25D366; /* İstediğiniz renge değiştirin */
}
```

### Buton Boyutunu Değiştir

```css
#whatsapp-chat-button {
  width: 70px;  /* Varsayılan: 60px */
  height: 70px;
}
```

## 🐛 Sorun Giderme

### "Cannot find module" hatası
```bash
# Tüm bağımlılıkları yükleyin
npm install
cd web && npm install
cd frontend && npm install
```

### Buton görünmüyor
- ✓ App embed aktif mi? (Tema özelleştiricide)
- ✓ "Etkinleştir" toggle'ı açık mı?
- ✓ Telefon numarası girilmiş mi?
- ✓ Tarayıcı önbelleğini temizleyin

### Ayarlar kaydedilmiyor
- ✓ Tarayıcı konsolu (F12) hatalarını kontrol edin
- ✓ Terminal'de sunucu hatalarını kontrol edin
- ✓ Dev sunucusu çalışıyor mu?

### Port zaten kullanımda
```bash
# Farklı bir port belirtin
PORT=3001 npm run dev
```

## 📱 WhatsApp Telefon Numarası Formatı

✅ **Doğru:**
- `+905551234567` (Türkiye)
- `+12025551234` (ABD)

❌ **Yanlış:**
- `5551234567` (+ eksik)
- `+90 555 123 45 67` (boşluklar)
- `+90-555-123-4567` (tire işaretleri)

## 📖 Dokümantasyon

- **README.md** - Tam dokümantasyon
- **QUICKSTART.md** - Hızlı başlangıç (İngilizce)
- **SETUP.md** - Detaylı kurulum (İngilizce)
- **DEPLOYMENT.md** - Canlıya alma (İngilizce)

## 💡 İpuçları

1. **Dev sunucusunu çalışır tutun** - Değişikliklerde otomatik yenilenir
2. **Gizli modda test edin** - Müşterilerin gördüğünü görün
3. **Sağ alt konumu kullanın** - En yüksek tıklama oranı
4. **Mesajı kısa tutun** - 1-2 cümle yeterli
5. **Ülke kodunu unutmayın** - Zorunlu format: `+90...`

## ✅ Kontrol Listesi

- [ ] Bağımlılıklar yüklendi (`npm install`)
- [ ] Dev sunucu başlatıldı (`npm run dev`)
- [ ] Uygulama dev mağazaya kuruldu
- [ ] Ayarlar yapılandırıldı (telefon, mesaj, konum)
- [ ] App embed tema özelleştiricide aktifleştirildi
- [ ] Buton mağazada görünüyor
- [ ] Tıklama WhatsApp'ı açıyor
- [ ] Mobil'de test edildi

## 🎉 Hazırsınız!

Tüm adımları tamamladığınızda, web-health-developer.myshopify.com mağazanızda çalışan bir WhatsApp chat butonu olacak!

**Başarılar!** 🚀

---

**Sorularınız için:** Diğer dokümantasyon dosyalarını inceleyin veya koddaki yorumları okuyun.
