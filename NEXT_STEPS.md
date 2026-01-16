# ✅ Your App is Configured!

Your Shopify app credentials have been added. Here's what to do next:

## 🎯 Immediate Next Steps

### 1. Install Dependencies (5 minutes)

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd web
npm install

# Install frontend dependencies
cd frontend
npm install

# Return to root
cd ../..
```

### 2. Start Development Server (1 minute)

```bash
npm run dev
```

This will:
- Start your Express backend server
- Build the React admin panel
- Deploy the theme extension
- Create a secure tunnel
- Give you an installation URL

### 3. Install on Development Store

Once the server starts, you'll see something like:

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  To install your app, open this URL:            │
│  https://your-dev-store.myshopify.com/admin/... │
│                                                  │
└──────────────────────────────────────────────────┘
```

1. Copy that URL
2. Open it in your browser
3. Click "Install app"
4. Grant the requested permissions

### 4. Configure Your WhatsApp Settings

After installation:

1. The app will open in your Shopify admin
2. Fill in:
   - **Phone Number**: Your WhatsApp number with country code (e.g., `+1234567890`)
   - **Default Message**: Pre-filled text (e.g., `Hi! I need help with...`)
   - **Position**: Choose where button appears (e.g., `bottom-right`)
   - **Enable**: Check to activate
3. Click **Save**

### 5. Enable App Embed

**This is important!** The button won't show until you enable it:

1. Go to **Online Store → Themes** in Shopify admin
2. Click **Customize** on your active theme
3. In the left sidebar, scroll down
4. Click on **App embeds** (near the bottom)
5. Find **WhatsApp Chat Button**
6. Toggle it **ON**
7. Click **Save** in the top-right corner

### 6. Test on Your Storefront

1. Visit your store's homepage
2. Look for the green WhatsApp button
3. Click it to verify WhatsApp opens
4. Test on mobile too (use your phone or browser DevTools)

## 🎨 Customization (Optional)

### Change Button Color

Edit `/Users/emre/Desktop/whatsapp/extensions/whatsapp-button/blocks/whatsapp-button.liquid`:

```css
#whatsapp-chat-button {
  background: #25D366; /* Change to any color */
}
```

### Change Button Size

```css
#whatsapp-chat-button {
  width: 70px;  /* Default is 60px */
  height: 70px;
}
```

### Hide on Specific Pages

In the same Liquid file, add conditions:

```liquid
{% unless template == 'cart' %}
  <!-- Button renders here -->
{% endunless %}
```

## 🚀 When Ready to Deploy

Follow the **DEPLOYMENT.md** guide to deploy to production.

Popular options:
- **Vercel** (recommended) - Free tier available
- **Heroku** - $5-7/month
- **Fly.io** - Free tier available

## 📋 Checklist

- [ ] Dependencies installed
- [ ] Dev server started (`npm run dev`)
- [ ] App installed on dev store
- [ ] Settings configured (phone, message, position)
- [ ] App embed enabled in theme customizer
- [ ] Button appears on storefront
- [ ] Click opens WhatsApp correctly
- [ ] Tested on mobile

## 🆘 Troubleshooting

### "Cannot find module" errors
```bash
# Make sure all dependencies are installed
npm install
cd web && npm install
cd frontend && npm install
```

### Button not appearing
- ✓ App embed enabled in theme customizer?
- ✓ Enable toggle is ON in settings?
- ✓ Phone number is filled in?
- ✓ Clear browser cache and refresh

### Settings not saving
- ✓ Check browser console (F12) for errors
- ✓ Check terminal for server errors
- ✓ Make sure dev server is running

### Port already in use
```bash
# If port 3000 is busy, the CLI will automatically use another port
# Or specify a different port:
PORT=3001 npm run dev
```

## 📖 Documentation

- **QUICKSTART.md** - Fast 15-minute setup
- **SETUP.md** - Detailed installation
- **README.md** - Complete documentation
- **ARCHITECTURE.md** - How it works
- **DEPLOYMENT.md** - Deploy to production

## 💡 Pro Tips

1. **Keep the dev server running** - It auto-reloads on changes
2. **Test in incognito** - See what customers see (no admin bar)
3. **Use bottom-right position** - Gets highest click-through rate
4. **Keep message short** - 1-2 sentences max
5. **Include country code** - Required format: `+1234567890`

## 🎯 Your Credentials

Your app is configured with your Shopify API credentials.

These are stored in:
- `shopify.app.toml` (Client ID)
- `.env` (Both credentials - **keep this file secure!**)

**⚠️ Important**: Never commit `.env` to Git (it's already in `.gitignore`)

## 🎉 You're All Set!

Run this command to start:

```bash
npm run dev
```

Then follow the installation URL that appears!

---

**Need help?** Check the documentation files or review the inline code comments.

**Good luck!** 🚀
