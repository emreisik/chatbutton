# WhatsApp Chat Button - Setup Guide

Complete step-by-step guide to get your WhatsApp chat button running on Shopify.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] Shopify Partner account ([Sign up](https://partners.shopify.com/))
- [ ] Shopify CLI installed
- [ ] A Shopify development store
- [ ] WhatsApp Business account (or personal number)

## Step 1: Install Shopify CLI

```bash
npm install -g @shopify/cli @shopify/app
```

Verify installation:

```bash
shopify version
```

## Step 2: Set Up Shopify Partner Account

1. Go to [partners.shopify.com](https://partners.shopify.com/)
2. Sign up or log in
3. Complete your partner profile

## Step 3: Create Development Store

1. In Partner Dashboard, go to **Stores**
2. Click **Add store**
3. Select **Development store**
4. Fill in store details
5. Click **Save**

## Step 4: Create Shopify App

1. In Partner Dashboard, go to **Apps**
2. Click **Create app**
3. Select **Create app manually**
4. Fill in:
   - **App name**: "WhatsApp Chat Button"
   - **App URL**: Leave blank for now (will update after deployment)
5. Click **Create app**

## Step 5: Configure App Permissions

1. In your app settings, go to **Configuration**
2. Under **App API access scopes**, add:
   - `write_online_store_pages`
   - `read_products`
3. Save changes

## Step 6: Install Project Dependencies

```bash
# In the project root
cd whatsapp
npm install

# Install web server dependencies
cd web
npm install

# Install frontend dependencies
cd frontend
npm install

# Return to root
cd ../..
```

## Step 7: Link Your App

```bash
shopify app config link
```

Select your app from the list. This will update your `shopify.app.toml` file.

## Step 8: Start Development Server

```bash
npm run dev
```

This command will:
1. Start the Express server
2. Build the frontend React app
3. Deploy the theme extension
4. Open a secure tunnel
5. Provide an installation URL

## Step 9: Install App on Development Store

1. Copy the installation URL from the terminal
2. Paste it in your browser
3. Select your development store
4. Click **Install app**
5. Grant the requested permissions

## Step 10: Configure WhatsApp Settings

1. In your Shopify admin, go to **Apps**
2. Open **WhatsApp Chat Button**
3. Enter your settings:
   - **Phone Number**: Your WhatsApp number with country code (e.g., `+1234567890`)
   - **Default Message**: Pre-filled text (e.g., "Hi! I need help with...")
   - **Position**: Choose button placement
   - **Enable**: Check to activate
4. Click **Save**

## Step 11: Enable App Embed

1. Go to **Online Store → Themes**
2. Click **Customize** on your active theme
3. In the theme editor sidebar, scroll down
4. Click on **App embeds** (near the bottom)
5. Find **WhatsApp Chat Button**
6. Toggle it **ON**
7. Click **Save** in the top right

## Step 12: Test on Storefront

1. Visit your store's homepage
2. Look for the floating WhatsApp button
3. Click it to test the WhatsApp link
4. Verify it opens WhatsApp with your number and message

## Step 13: Customize (Optional)

### Change Button Position

1. Open the app admin panel
2. Select a different position
3. Save and refresh your storefront

### Modify Button Style

Edit `/extensions/whatsapp-button/blocks/whatsapp-button.liquid`:

```css
#whatsapp-chat-button {
  background: #25D366; /* Change color here */
  width: 60px;          /* Change size here */
  height: 60px;
}
```

### Hide on Specific Pages

In the same Liquid file, add conditions:

```liquid
{% unless template == 'cart' %}
  <!-- Button code -->
{% endunless %}
```

## Development Workflow

### Making Changes

1. Edit files in your code editor
2. Changes to backend (web/*.js) require server restart
3. Changes to frontend (web/frontend/*) auto-reload
4. Changes to Liquid (extensions/*) require `shopify app dev` restart

### Viewing Logs

**Backend logs:**
```bash
# Check terminal where `npm run dev` is running
```

**Frontend errors:**
```bash
# Check browser console (F12)
```

**Shopify API errors:**
```bash
# Check Shopify Partner dashboard → Apps → Your App → Logs
```

## Deployment to Production

### Option A: Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow prompts and copy deployment URL

4. Update app URL in Partner Dashboard

### Option B: Deploy to Heroku

1. Install Heroku CLI

2. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

4. Update app URL in Partner Dashboard

### Update App URLs

After deployment:

1. Go to Partner Dashboard → Your App → Configuration
2. Update **App URL** to your production URL
3. Add redirect URLs:
   - `https://your-domain.com/api/auth/callback`
   - `https://your-domain.com/auth/callback`
4. Save changes

## Troubleshooting

### "App couldn't be found"

- Run `shopify app config link` to link your app
- Make sure `client_id` in `shopify.app.toml` is correct

### Button not appearing

- Check app embed is enabled in theme customizer
- Verify "Enable" toggle is ON in app settings
- Check that phone number is filled in
- Clear browser cache

### "Permission denied" errors

- Check app scopes in `shopify.app.toml`
- Reinstall app to grant new permissions
- Verify scopes in Partner Dashboard match

### Settings not saving

- Check browser console for errors
- Verify metafield permissions
- Check server logs for API errors

### WhatsApp link not working

- Ensure phone number has country code (e.g., `+1`)
- Remove spaces and special characters
- Test format: `+[country code][number]`

## Testing Checklist

Before going live:

- [ ] Button appears in all 4 positions
- [ ] Click opens WhatsApp correctly
- [ ] Default message is pre-filled
- [ ] Enable/disable toggle works
- [ ] Mobile responsive (test on phone)
- [ ] Works on different browsers
- [ ] No console errors
- [ ] Settings persist after save

## Getting Help

If you encounter issues:

1. **Check this guide** - Most common issues are covered
2. **Review logs** - Server and browser console
3. **Shopify Docs** - [shopify.dev/docs/apps](https://shopify.dev/docs/apps)
4. **Community Forums** - [community.shopify.com](https://community.shopify.com)

## Next Steps

Once everything is working:

1. Customize button colors and styling
2. Test on different devices
3. Add analytics tracking (optional)
4. Deploy to production
5. Submit to Shopify App Store (optional)

## Quick Reference

### Important Files

| File | Purpose |
|------|---------|
| `shopify.app.toml` | App configuration |
| `web/index.js` | Backend server |
| `web/frontend/App.jsx` | Admin panel UI |
| `extensions/whatsapp-button/blocks/whatsapp-button.liquid` | Storefront button |

### Common Commands

```bash
# Start development
npm run dev

# Link app
shopify app config link

# Deploy
npm run deploy

# Check app info
npm run info

# Generate extension
npm run generate
```

### Environment Variables

Create `.env` file in root:

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=write_online_store_pages,read_products
HOST=https://your-app-url.com
```

---

**Success!** 🎉 Your WhatsApp chat button should now be live on your Shopify store.

Need help? Review the troubleshooting section or check the main README.md file.
