# WhatsApp Chat Button - Shopify App

A production-ready Shopify app that adds a floating WhatsApp chat button to your storefront. Built with Shopify CLI, React, and Polaris.

## Features

- 🎨 **Beautiful Admin Panel** - Built with Shopify Polaris for a native feel
- 📱 **Mobile & Desktop Ready** - Responsive design that works everywhere
- 🎯 **Flexible Positioning** - Choose from 4 corner positions
- ⚡ **App Embed** - No ScriptTag API, uses modern App Embed blocks
- 💾 **No Database** - Settings stored in Shopify metafields
- ♿ **Accessible** - Follows WCAG guidelines
- 🎭 **Customizable** - Phone number, default message, position, and enable/disable

## Tech Stack

- **Shopify CLI** - App scaffolding and deployment
- **Node.js + Express** - Backend server
- **React** - Frontend UI framework
- **Shopify Polaris** - UI components
- **Theme App Extension** - Storefront integration
- **Metafields** - Settings storage

## Prerequisites

- Node.js 18 or higher
- Shopify Partner account
- Shopify CLI installed (`npm install -g @shopify/cli @shopify/app`)
- A development store

## Installation

### 1. Clone and Install Dependencies

```bash
cd whatsapp
npm install
cd web/frontend
npm install
cd ../..
```

### 2. Configure Shopify App

Create a new app in your Shopify Partner dashboard:

1. Go to https://partners.shopify.com
2. Navigate to Apps → Create app
3. Choose "Create app manually"
4. Fill in app details and create

### 3. Update Configuration

Update `shopify.app.toml` with your app credentials:

```toml
client_id = "YOUR_CLIENT_ID"
application_url = "YOUR_APP_URL"
dev_store_url = "YOUR_DEV_STORE.myshopify.com"
```

### 4. Start Development Server

```bash
npm run dev
```

This will:
- Start the Express backend server
- Build the React frontend
- Deploy the theme extension
- Open a tunnel for development

### 5. Install App on Development Store

1. Follow the URL provided by the CLI
2. Install the app on your development store
3. Open the app to configure settings

### 6. Enable App Embed

1. Go to **Online Store → Themes** in your Shopify admin
2. Click **Customize** on your active theme
3. Click on **App embeds** in the left sidebar (scroll down)
4. Enable **WhatsApp Chat Button**
5. Save your theme

## Configuration

### Admin Panel Settings

Access the app from your Shopify admin to configure:

| Setting | Description | Example |
|---------|-------------|---------|
| **Phone Number** | WhatsApp number with country code | `+1234567890` |
| **Default Message** | Pre-filled message text | `Hi! I need help with...` |
| **Position** | Button placement on screen | `bottom-right` |
| **Enable/Disable** | Show or hide the button | ✓ Enabled |

### Position Options

- **Bottom Right** - Most common placement
- **Bottom Left** - Alternative bottom placement
- **Top Right** - Above the fold
- **Top Left** - Alternative top placement

## Project Structure

```
whatsapp/
├── extensions/
│   └── whatsapp-button/          # Theme App Extension
│       ├── shopify.extension.toml
│       ├── blocks/
│       │   └── whatsapp-button.liquid  # Main button block
│       └── assets/
│           └── whatsapp-icon.svg
├── web/
│   ├── index.js                  # Express server
│   ├── shopify.js                # Shopify API configuration
│   ├── gdpr.js                   # GDPR webhook handlers
│   └── frontend/
│       ├── App.jsx               # React admin panel
│       ├── index.html
│       └── vite.config.js
├── shopify.app.toml              # App configuration
├── package.json
└── README.md
```

## How It Works

### 1. Settings Storage

Settings are stored in **app metafields** under the `whatsapp_chat` namespace:

- `phone_number` - WhatsApp phone number
- `default_message` - Pre-filled message
- `position` - Button position
- `enabled` - Enable/disable state

### 2. Admin Panel

The React app provides an interface to:
- Configure all settings
- Save to Shopify metafields via GraphQL API
- Show preview and instructions

### 3. Storefront Integration

The Theme App Extension:
- Reads settings from metafields
- Renders a floating button with WhatsApp icon
- Opens WhatsApp chat on click using `wa.me` URL
- Applies dynamic CSS positioning
- Handles responsive design

## API Endpoints

### GET `/api/settings`

Retrieves current WhatsApp button settings.

**Response:**
```json
{
  "phoneNumber": "+1234567890",
  "defaultMessage": "Hi! I need help with...",
  "position": "bottom-right",
  "enabled": true
}
```

### POST `/api/settings`

Saves WhatsApp button settings.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "defaultMessage": "Hi! I need help with...",
  "position": "bottom-right",
  "enabled": true
}
```

**Response:**
```json
{
  "success": true
}
```

## Customization

### Changing Button Colors

Edit `/extensions/whatsapp-button/blocks/whatsapp-button.liquid`:

```css
#whatsapp-chat-button {
  background: #25D366; /* WhatsApp green */
}

/* Change to custom color */
#whatsapp-chat-button {
  background: #0066FF; /* Custom blue */
}
```

### Adding Custom Animation

```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

#whatsapp-chat-button {
  animation: pulse 2s infinite;
}
```

### Hiding on Specific Pages

Add condition in the Liquid block:

```liquid
{% unless template == 'cart' %}
  <!-- Button code here -->
{% endunless %}
```

## Testing

### Local Testing

1. Start dev server: `npm run dev`
2. Install on development store
3. Enable app embed in theme customizer
4. Visit your storefront

### Test Cases

- ✓ Button appears in correct position
- ✓ Click opens WhatsApp with correct number
- ✓ Default message is pre-filled
- ✓ Works on mobile and desktop
- ✓ Disable toggle hides button
- ✓ Position changes apply immediately

## Deployment

### 1. Build Production Assets

```bash
cd web/frontend
npm run build
cd ../..
```

### 2. Deploy to Hosting

Choose a hosting platform:

- **Heroku**
- **Vercel**
- **AWS Elastic Beanstalk**
- **DigitalOcean App Platform**
- **Fly.io**

### 3. Update App URLs

In Shopify Partner dashboard, update:
- App URL to production URL
- Allowed redirection URLs

### 4. Submit to Shopify App Store

1. Complete app listing form
2. Add screenshots and description
3. Complete privacy policy
4. Submit for review

## GDPR Compliance

The app includes required GDPR webhook handlers:

- `CUSTOMERS_DATA_REQUEST` - Customer data export
- `CUSTOMERS_REDACT` - Customer data deletion
- `SHOP_REDACT` - Shop data deletion

No customer data is stored by this app, so handlers are placeholders.

## Troubleshooting

### Button Not Appearing

1. Check that app embed is enabled in theme customizer
2. Verify "Enable" toggle is checked in admin panel
3. Ensure phone number is set
4. Check browser console for errors

### Settings Not Saving

1. Check metafield permissions in `shopify.app.toml`
2. Verify app scopes are approved
3. Check server logs for API errors

### WhatsApp Link Not Working

1. Verify phone number includes country code (e.g., `+1`)
2. Remove spaces and special characters
3. Test URL format: `https://wa.me/1234567890`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Liquid block**: <1KB HTML/CSS
- **JavaScript**: ~2KB (minified)
- **SVG icon**: <1KB
- **No external dependencies**
- **Loads asynchronously**

## Security

- ✓ No sensitive data stored
- ✓ HTTPS required
- ✓ Shopify OAuth authentication
- ✓ CSRF protection via App Bridge
- ✓ Input validation on phone number

## Support

For issues or questions:

1. Check this README
2. Review Shopify's [App Development Docs](https://shopify.dev/docs/apps)
3. Check [Shopify Community Forums](https://community.shopify.com)

## License

MIT License - feel free to use and modify for your projects.

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Roadmap

Future enhancements:

- [ ] Multiple WhatsApp agents
- [ ] Business hours scheduling
- [ ] Custom button icon upload
- [ ] Button text label option
- [ ] A/B testing support
- [ ] Analytics dashboard
- [ ] Multi-language support

## Credits

Built with:
- [Shopify Polaris](https://polaris.shopify.com/)
- [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge)
- [WhatsApp API](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat/)

---

Made with ❤️ for Shopify merchants
