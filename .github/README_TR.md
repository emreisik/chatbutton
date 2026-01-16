# WhatsApp Chat Butonu - Shopify Uygulaması

[English](../README.md) | **Türkçe**

Shopify mağazanıza yüzen bir WhatsApp chat butonu ekleyen, üretime hazır, tam özellikli bir uygulama.

## ✨ Özellikler

- 🎨 **Güzel Admin Paneli** - Shopify Polaris ile oluşturulmuş
- 📱 **Mobil & Masaüstü** - Her yerde çalışan responsive tasarım
- 🎯 **Esnek Konumlandırma** - 4 köşe seçeneği
- ⚡ **App Embed** - Modern yaklaşım (ScriptTag API yok)
- 💾 **Veritabanı Yok** - Ayarlar Shopify metafield'larında
- ♿ **Erişilebilir** - WCAG yönergelerini takip eder
- 🎭 **Özelleştirilebilir** - Telefon, mesaj, konum ve etkinleştir/devre dışı bırak

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- Shopify Partner hesabı
- Shopify CLI
- Geliştirme mağazası

### Kurulum

```bash
# Bağımlılıkları yükle
npm install
cd web && npm install
cd frontend && npm install
cd ../..

# Geliştirme sunucusunu başlat
npm run dev
```

### Yapılandırma

1. GitHub'da repo oluşturduktan sonra `shopify.app.toml` dosyasını güncelleyin
2. `.env` dosyası oluşturun (`.env.example`'dan kopyalayın)
3. Shopify Partner Dashboard'dan API kimlik bilgilerini ekleyin
4. Uygulamayı geliştirme mağazanıza kurun
5. Admin panelinden ayarları yapılandırın
6. Tema özelleştiriciden app embed'i etkinleştirin

## 📖 Dokümantasyon

- [English Documentation](../README.md) - Ana dokümantasyon
- [Hızlı Başlangıç](../QUICKSTART.md) - 15 dakikada kurulum
- [Kurulum Rehberi](../SETUP.md) - Detaylı talimatlar
- [Türkçe Başlangıç](../BASLAT.md) - Türkçe rehber
- [Deployment](../DEPLOYMENT.md) - Canlıya alma

## 🛠 Teknoloji Yığını

- **Backend**: Node.js + Express
- **Frontend**: React + Shopify Polaris
- **Extension**: Liquid + Vanilla JavaScript
- **Depolama**: Shopify Metafields
- **Kimlik Doğrulama**: OAuth 2.0

## 📱 Özellikler

### Admin Panel
- WhatsApp telefon numarası girişi
- Varsayılan mesaj metni
- Buton konumu seçici (4 köşe)
- Etkinleştir/devre dışı bırak toggle'ı
- Kaydetme işlevi

### Mağaza Arayüzü
- Yüzen WhatsApp butonu
- Dinamik konumlandırma
- Tıklama ile WhatsApp'ı aç
- Mobil & masaüstü responsive
- Hover animasyonları
- Erişilebilir tasarım

## 🎨 Özelleştirme

### Buton Rengini Değiştir

```css
#whatsapp-chat-button {
  background: #25D366; /* WhatsApp yeşili */
}
```

### Buton Boyutunu Değiştir

```css
#whatsapp-chat-button {
  width: 70px;  /* Varsayılan: 60px */
  height: 70px;
}
```

## 📂 Proje Yapısı

```
chatbuton/
├── extensions/           # Tema App Extension
│   └── whatsapp-button/
├── web/                  # Backend & Admin
│   ├── index.js
│   └── frontend/
├── docs/                 # Dokümantasyon
└── README.md
```

## 🔒 Güvenlik

- OAuth 2.0 kimlik doğrulama
- HTTPS gerekli
- Giriş doğrulama
- XSS koruması
- GDPR uyumlu

## 📄 Lisans

MIT License - Projelerinizde özgürce kullanın ve değiştirin.

## 🤝 Katkıda Bulunma

Katkılar kabul edilir! Lütfen:

1. Repo'yu fork edin
2. Feature branch'i oluşturun
3. Değişikliklerinizi yapın
4. Pull request gönderin

## 💬 Destek

Sorularınız için:
- Dokümantasyonu kontrol edin
- GitHub Issues açın
- [Shopify Community](https://community.shopify.com) forumlarını ziyaret edin

## 🌟 Yıldız Verin!

Bu projeyi faydalı bulduysanız, lütfen GitHub'da yıldız verin! ⭐

---

**Shopify merchant'ları ve geliştiricileri için ❤️ ile yapıldı**
