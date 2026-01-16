# 📦 Shopify Product List App

Modern Shopify app for viewing and managing your store products.

## ✨ Features

- 📦 **Product List** - View all your store products
- 💰 **Price Display** - See product prices at a glance
- 📊 **Inventory Tracking** - Monitor stock levels
- 🎨 **Clean UI** - Built with Shopify Polaris
- ⚡ **Real-time Updates** - Refresh products instantly
- 📱 **Responsive Design** - Works on all devices

## 🚀 Live Demo

**Admin Panel:** [https://chatbutton-production.up.railway.app/](https://chatbutton-production.up.railway.app/)

## 📸 Screenshot

```
┌──────────────────────────────────────┐
│ Ürünlerim                    Toplam 5│
├──────────────────────────────────────┤
│ Ürün          Fiyat   Stok    Durum  │
├──────────────────────────────────────┤
│ 📦 T-Shirt   $29.99  15 stok  Aktif  │
│ 📦 Hoodie    $49.99  8 stok   Aktif  │
│ 📦 Socks     $12.99  Yok      Aktif  │
│ 📦 Jeans     $79.99  23 stok  Aktif  │
│ 📦 Jacket    $199.99 5 stok   Taslak │
└──────────────────────────────────────┘
```

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Shopify Polaris
- **Deployment:** Railway
- **Platform:** Shopify App

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/emreisik/chatbutton.git
cd chatbutton
```

### 2. Install Dependencies
```bash
npm install
cd web && npm install
cd frontend && npm install
```

### 3. Configure Shopify
```bash
# Update shopify.app.toml with your:
# - client_id
# - dev_store_url
```

### 4. Run Development Server
```bash
npm run dev
# or
shopify app dev
```

## 🌐 Deployment

### Railway Deployment

1. **Connect GitHub:**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repo
   - Railway auto-deploys on push

2. **Configure:**
   - Railway uses `nixpacks.toml` automatically
   - No environment variables needed for demo

3. **Access:**
   ```
   https://your-app.up.railway.app/
   ```

## 📚 API Endpoints

### Get Products
```http
GET /api/products
```

**Response:**
```json
{
  "products": [
    {
      "id": "1",
      "title": "Premium T-Shirt",
      "price": "29.99",
      "inventory": 15,
      "status": "active",
      "image": "https://..."
    }
  ],
  "total": 5
}
```

### Get Single Product
```http
GET /api/products/:id
```

### Health Check
```http
GET /health
```

## 🎨 Features Overview

### Admin Panel
- ✅ Product table with images
- ✅ Price and inventory display
- ✅ Status badges (Active/Draft)
- ✅ Stock indicators
- ✅ Quick view links
- ✅ Statistics sidebar
- ✅ Refresh functionality

### Responsive Design
- ✅ Desktop optimized
- ✅ Mobile friendly
- ✅ Tablet support

## 🔧 Development

### Project Structure
```
├── web/
│   ├── index.js           # Express backend
│   ├── frontend/
│   │   ├── App.jsx        # React admin panel
│   │   ├── index.html     # HTML entry
│   │   └── vite.config.js # Vite config
│   └── package.json       # Backend deps
├── shopify.app.toml       # Shopify config
├── nixpacks.toml          # Railway build
└── package.json           # Root config
```

### Scripts
```bash
npm run dev          # Development server
npm run build        # Build frontend
shopify app deploy   # Deploy to Shopify
```

## 🚀 Future Enhancements

- [ ] Real Shopify Admin API integration
- [ ] Product editing capability
- [ ] Bulk actions
- [ ] Advanced filtering
- [ ] Search functionality
- [ ] Export to CSV
- [ ] Product variants
- [ ] Collections view

## 📝 License

MIT License - feel free to use this app!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

Need help? Create an issue on GitHub!

---

**Built with ❤️ for Shopify merchants**
