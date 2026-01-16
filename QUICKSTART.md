# Quick Start Guide - WhatsApp Chat Button

Get your WhatsApp chat button running in 15 minutes! ⚡

## Prerequisites (5 min)

1. ✅ Node.js 18+ installed
2. ✅ Shopify Partner account created
3. ✅ Development store set up
4. ✅ WhatsApp number ready

## Step 1: Install Shopify CLI (2 min)

```bash
npm install -g @shopify/cli @shopify/app
```

Verify:
```bash
shopify version
```

## Step 2: Create Shopify App (3 min)

1. Go to [partners.shopify.com](https://partners.shopify.com/)
2. Click **Apps** → **Create app** → **Create app manually**
3. Name it "WhatsApp Chat Button"
4. Save your Client ID and Secret

## Step 3: Install Dependencies (2 min)

```bash
cd whatsapp
npm install

cd web
npm install

cd frontend
npm install

cd ../..
```

## Step 4: Link Your App (1 min)

```bash
shopify app config link
```

Select your app from the list.

## Step 5: Start Development (1 min)

```bash
npm run dev
```

This will:
- Start the server
- Create a tunnel
- Provide an installation URL

## Step 6: Install & Configure (3 min)

1. Open the installation URL
2. Install on your dev store
3. Enter your settings:
   - **Phone**: `+1234567890` (your number with country code)
   - **Message**: `Hi! I need help with...`
   - **Position**: `bottom-right`
   - **Enable**: ✓ Checked
4. Click **Save**

## Step 7: Enable App Embed (2 min)

1. Go to **Online Store** → **Themes**
2. Click **Customize** on your active theme
3. Scroll down in sidebar → **App embeds**
4. Toggle ON "WhatsApp Chat Button"
5. **Save**

## Step 8: Test! (1 min)

1. Visit your storefront
2. Look for the green WhatsApp button
3. Click it
4. Verify WhatsApp opens with your number

## ✅ Done!

Your WhatsApp chat button is now live! 🎉

## Next Steps

### Customize Position
Go back to app admin → Change position → Save → Refresh storefront

### Change Colors
Edit `/extensions/whatsapp-button/blocks/whatsapp-button.liquid`:
```css
#whatsapp-chat-button {
  background: #25D366; /* Change this color */
}
```

### Deploy to Production
When ready, follow **DEPLOYMENT.md** to go live.

## Troubleshooting

### Button not showing?
- ✓ Check app embed is enabled
- ✓ Verify "Enable" toggle is ON
- ✓ Confirm phone number is filled in
- ✓ Clear browser cache

### Settings not saving?
- ✓ Check browser console for errors
- ✓ Verify you're logged into Shopify admin
- ✓ Try reinstalling the app

### WhatsApp link not working?
- ✓ Ensure phone has country code (e.g., `+1`)
- ✓ Remove spaces and special characters
- ✓ Test format: `+1234567890`

## Commands Reference

```bash
# Start development
npm run dev

# Link app
shopify app config link

# Check app info
npm run info

# Deploy (production)
npm run deploy
```

## File Structure

```
whatsapp/
├── extensions/whatsapp-button/   # Storefront button
├── web/                          # Backend server
│   ├── index.js                  # Main server file
│   └── frontend/                 # Admin panel
│       └── App.jsx               # React UI
└── shopify.app.toml              # App config
```

## Important Files

- **Admin Panel**: `web/frontend/App.jsx`
- **Storefront Button**: `extensions/whatsapp-button/blocks/whatsapp-button.liquid`
- **Server**: `web/index.js`
- **Config**: `shopify.app.toml`

## Key Settings

### Phone Number Format
- ✅ Correct: `+1234567890`
- ❌ Wrong: `1234567890` (missing +)
- ❌ Wrong: `+1 (234) 567-8900` (spaces/special chars)

### Positions Available
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

## Need More Help?

📖 **Full Setup Guide**: See SETUP.md
🏗 **Architecture**: See ARCHITECTURE.md
🚀 **Deployment**: See DEPLOYMENT.md
📚 **Main Docs**: See README.md

## Testing Checklist

- [ ] Button appears on homepage
- [ ] Button appears on product pages
- [ ] Button appears on collection pages
- [ ] Click opens WhatsApp
- [ ] Works on mobile
- [ ] Works on desktop
- [ ] All 4 positions work
- [ ] Enable/disable toggle works

## Pro Tips

💡 **Tip 1**: Test on mobile by scanning QR code in dev console
💡 **Tip 2**: Use +1234567890 format for international compatibility
💡 **Tip 3**: Keep default message short and friendly
💡 **Tip 4**: Bottom-right position gets highest engagement
💡 **Tip 5**: Test in incognito mode to see fresh customer view

## Support Channels

- **Documentation**: Check all .md files
- **Shopify Docs**: [shopify.dev](https://shopify.dev)
- **Community**: [community.shopify.com](https://community.shopify.com)

## What's Next?

Once you've confirmed everything works:

1. ✅ Customize colors/styling
2. ✅ Test thoroughly
3. ✅ Deploy to production (DEPLOYMENT.md)
4. ✅ Monitor performance
5. ✅ Submit to App Store (optional)

---

**Success!** 🎊 You now have a working WhatsApp chat button on your Shopify store.

For detailed information, see the comprehensive guides in the other documentation files.
