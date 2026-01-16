# Architecture Documentation

Technical architecture overview of the WhatsApp Chat Button Shopify App.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Shopify Ecosystem                       │
│                                                               │
│  ┌─────────────┐         ┌──────────────┐                   │
│  │   Shopify   │◄────────┤  App Server  │                   │
│  │   Admin     │  OAuth  │   (Node.js)  │                   │
│  └──────┬──────┘         └──────┬───────┘                   │
│         │                       │                            │
│         │ Install               │ API Calls                  │
│         │                       │ (GraphQL)                  │
│         ▼                       ▼                            │
│  ┌─────────────────────────────────────┐                    │
│  │      Shopify App Metafields         │                    │
│  │  - phone_number                     │                    │
│  │  - default_message                  │                    │
│  │  - position                         │                    │
│  │  - enabled                          │                    │
│  └─────────────────────────────────────┘                    │
│                       │                                      │
│                       │ Read via Liquid                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────┐                   │
│  │    Storefront (Theme App Extension)  │                   │
│  │  - Floating WhatsApp Button          │                   │
│  │  - Dynamic positioning               │                   │
│  │  - wa.me link generation             │                   │
│  └──────────────────────────────────────┘                   │
│                       │                                      │
│                       │ Click                                │
│                       ▼                                      │
│              ┌─────────────────┐                            │
│              │    WhatsApp     │                            │
│              │   (External)    │                            │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. App Server (Node.js + Express)

**Location**: `/web/index.js`

**Responsibilities**:
- OAuth authentication with Shopify
- Serve admin UI (React app)
- Provide API endpoints for settings
- Handle GDPR webhooks

**Tech Stack**:
- Node.js 18+
- Express.js
- Shopify API Library
- Shopify App Bridge

**Endpoints**:
```
GET  /api/auth                 - Initiate OAuth
GET  /api/auth/callback        - OAuth callback
POST /api/webhooks             - Webhook receiver
GET  /api/settings             - Get app settings
POST /api/settings             - Save app settings
```

### 2. Admin Panel (React + Polaris)

**Location**: `/web/frontend/App.jsx`

**Responsibilities**:
- Provide settings configuration UI
- Communicate with backend API
- Display instructions and preview

**Components**:
- Form inputs (phone, message, position)
- Toggle (enable/disable)
- Save button
- Instructions card
- Preview card

**State Management**:
- React hooks (useState, useEffect)
- No external state library (keeping it simple)

**UI Library**:
- Shopify Polaris components

### 3. Theme App Extension

**Location**: `/extensions/whatsapp-button/`

**Responsibilities**:
- Render floating button on storefront
- Read settings from metafields
- Handle button interactions
- Apply dynamic styling

**Files**:
- `shopify.extension.toml` - Extension config
- `blocks/whatsapp-button.liquid` - Main template
- `assets/whatsapp-icon.svg` - Button icon

**Rendering Flow**:
```liquid
1. Read metafields (phone, message, position, enabled)
2. Check if enabled && phone number exists
3. Render button with dynamic positioning
4. Apply CSS styles
5. Initialize JavaScript handlers
```

### 4. Data Storage

**Method**: Shopify App Metafields

**Namespace**: `whatsapp_chat`

**Schema**:
```javascript
{
  "whatsapp_chat.phone_number": {
    type: "json",
    value: "+1234567890"
  },
  "whatsapp_chat.default_message": {
    type: "json",
    value: "Hi! I need help with..."
  },
  "whatsapp_chat.position": {
    type: "json",
    value: "bottom-right"
  },
  "whatsapp_chat.enabled": {
    type: "json",
    value: true
  }
}
```

**Why Metafields?**
- No database needed
- Built into Shopify
- Automatically replicated
- Accessible in Liquid
- Free storage

## Data Flow

### Settings Save Flow

```
┌─────────────┐
│ Admin Panel │
│   (React)   │
└──────┬──────┘
       │
       │ POST /api/settings
       │ { phoneNumber, message, position, enabled }
       ▼
┌─────────────────┐
│  Express Server │
│   Validates     │
└──────┬──────────┘
       │
       │ GraphQL Mutation
       │ metafieldsSet
       ▼
┌─────────────────────┐
│ Shopify Metafields  │
│   (Persistent)      │
└─────────────────────┘
```

### Storefront Render Flow

```
┌──────────────────┐
│  Customer visits │
│    Storefront    │
└────────┬─────────┘
         │
         │ Page Load
         ▼
┌──────────────────────┐
│   Liquid Template    │
│  Reads metafields    │
└────────┬─────────────┘
         │
         │ If enabled
         ▼
┌──────────────────────┐
│  Render HTML/CSS/JS  │
│   WhatsApp Button    │
└────────┬─────────────┘
         │
         │ Customer clicks
         ▼
┌──────────────────────┐
│  Open wa.me link     │
│  in new window       │
└──────────────────────┘
```

## Authentication Flow

### OAuth 2.0 with Shopify

```
1. Merchant clicks "Install App"
   │
   ▼
2. Redirected to /api/auth
   │
   ▼
3. Shopify shows permission screen
   │
   ▼
4. Merchant approves
   │
   ▼
5. Shopify redirects to /api/auth/callback?code=xxx
   │
   ▼
6. App exchanges code for access token
   │
   ▼
7. Token stored in session storage
   │
   ▼
8. Merchant redirected to app admin
```

**Session Storage**:
- Development: In-memory (not persistent)
- Production: Redis or Prisma (recommended)

## API Architecture

### REST API (App Server)

**Authentication**: Shopify OAuth session token

**Endpoints**:

#### GET /api/settings
Returns current app configuration.

**Response**:
```json
{
  "phoneNumber": "+1234567890",
  "defaultMessage": "Hi! I need help with...",
  "position": "bottom-right",
  "enabled": true
}
```

#### POST /api/settings
Saves app configuration.

**Request**:
```json
{
  "phoneNumber": "+1234567890",
  "defaultMessage": "Hi! I need help with...",
  "position": "bottom-right",
  "enabled": true
}
```

**Response**:
```json
{
  "success": true
}
```

### GraphQL API (Shopify)

**Used for**:
- Reading metafields
- Writing metafields

**Example Query (Read)**:
```graphql
{
  app {
    installation {
      metafields(first: 10, namespace: "whatsapp_chat") {
        edges {
          node {
            key
            value
          }
        }
      }
    }
  }
}
```

**Example Mutation (Write)**:
```graphql
mutation CreateAppDataMetafield($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      id
      key
      value
    }
    userErrors {
      field
      message
    }
  }
}
```

## Styling Architecture

### CSS Structure

```css
/* Layout */
#whatsapp-chat-button-wrapper {
  position: fixed;
  z-index: 9999;
}

/* Button styles */
#whatsapp-chat-button {
  /* Visual design */
  background: #25D366;
  border-radius: 50%;
  
  /* Flexbox centering */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Position modifiers */
.whatsapp-button-bottom-right { bottom: 20px; right: 20px; }
.whatsapp-button-bottom-left  { bottom: 20px; left: 20px; }
.whatsapp-button-top-right    { top: 20px; right: 20px; }
.whatsapp-button-top-left     { top: 20px; left: 20px; }

/* Responsive */
@media (max-width: 768px) {
  /* Smaller button on mobile */
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  /* Disable animations */
}
```

### Dynamic Positioning

Position is applied via CSS class based on metafield value:
```liquid
{% assign position = shop.metafields.whatsapp_chat.position %}
<a class="whatsapp-button-{{ position }}">
```

## JavaScript Architecture

### Client-Side (Storefront)

**Location**: Inline in `whatsapp-button.liquid`

**Pattern**: IIFE (Immediately Invoked Function Expression)

```javascript
(function() {
  'use strict';
  
  const WhatsAppButton = {
    init: function() {
      // Initialize button
    },
    setupPositioning: function() {
      // Handle positioning
    },
    setupTracking: function() {
      // Optional analytics
    }
  };
  
  // Initialize
  WhatsAppButton.init();
})();
```

**Why IIFE?**
- Prevents global scope pollution
- Self-executing
- Encapsulates logic

### Admin Panel (React)

**State Management**:
```javascript
const [settings, setSettings] = useState({
  phoneNumber: "",
  defaultMessage: "",
  position: "bottom-right",
  enabled: true
});
```

**Effect Hooks**:
```javascript
useEffect(() => {
  loadSettings(); // Load on mount
}, []);
```

**Event Handlers**:
```javascript
const handleSave = async () => {
  // Validate and save
};
```

## Performance Considerations

### Bundle Size

- **Liquid template**: <5KB (inline)
- **WhatsApp icon SVG**: <1KB
- **JavaScript**: ~2KB (minified)
- **Total impact**: <10KB

### Loading Strategy

1. Button HTML/CSS loads with page (inline)
2. JavaScript executes after DOM ready
3. Icon is inline SVG (no extra request)
4. No external dependencies

### Caching

- Static assets cached by Shopify CDN
- Metafields cached by Shopify
- No cache invalidation needed

## Security Architecture

### Authentication

- **OAuth 2.0** for merchant authentication
- **Session tokens** for API requests
- **HTTPS** required for all communication

### Authorization

- Merchants can only access their own data
- Scopes limit app permissions
- App Bridge validates requests

### Input Validation

```javascript
// Server-side validation
if (!settings.phoneNumber) {
  return res.status(400).json({ error: "Phone number required" });
}

// Client-side validation
if (!phoneNumber) {
  setBanner({ status: "critical", title: "Phone number required" });
  return;
}
```

### XSS Prevention

- React auto-escapes output
- Liquid auto-escapes output
- No innerHTML usage
- CSP headers recommended

## Scalability

### Current Limitations

- In-memory session storage (development)
- Synchronous API calls
- No request rate limiting

### Scaling Recommendations

1. **Session Storage**
   - Use Redis for sessions
   - Or Prisma with PostgreSQL

2. **Caching**
   - Cache metafield reads
   - Use Shopify's caching headers

3. **Load Balancing**
   - Deploy behind load balancer
   - Use multiple server instances

4. **CDN**
   - Serve static assets via CDN
   - Use Shopify's CDN for extension assets

## Error Handling

### Backend

```javascript
try {
  // API call
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({ error: "Failed to save settings" });
}
```

### Frontend

```javascript
try {
  const response = await fetch("/api/settings");
  if (!response.ok) throw new Error("Failed");
  // Handle response
} catch (error) {
  setBanner({ status: "critical", title: "Error loading settings" });
}
```

### Liquid

```liquid
{% if enabled and phone_number != blank %}
  <!-- Render button -->
{% endif %}
```

## Monitoring & Logging

### Recommended Tools

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: APM
- **Shopify Partner Dashboard**: App metrics

### Key Metrics

- Install rate
- Active installations
- API response time
- Error rate
- Button click-through rate (optional)

## Deployment Architecture

### Development
```
Local Machine → Shopify CLI → ngrok tunnel → Shopify
```

### Production
```
Git Repository → CI/CD → Hosting Platform → Shopify
```

### Hosting Options

1. **Vercel** - Serverless Node.js
2. **Heroku** - Container-based
3. **Fly.io** - Edge deployment
4. **DigitalOcean** - VPS

## Testing Strategy

### Manual Testing

- Settings CRUD operations
- Button visibility
- WhatsApp link generation
- Responsive design
- Browser compatibility

### Automated Testing (Future)

```javascript
// Example unit test
describe('formatPhoneNumber', () => {
  it('should format phone number correctly', () => {
    expect(formatPhoneNumber('+1234567890')).toBe('+1234567890');
  });
});
```

## Dependencies

### Backend
- `@shopify/shopify-api` - Shopify API client
- `@shopify/shopify-app-express` - Express integration
- `express` - Web server
- `serve-static` - Static file serving

### Frontend
- `react` - UI library
- `react-dom` - React renderer
- `@shopify/polaris` - UI components
- `@shopify/app-bridge-react` - Shopify integration

### Build Tools
- `vite` - Frontend bundler
- `@vitejs/plugin-react` - React support

## Future Enhancements

### Potential Improvements

1. **Multi-agent support**
   - Different numbers for different departments
   - Agent availability scheduling

2. **Analytics**
   - Track button impressions
   - Click-through rate
   - Conversion tracking

3. **Customization**
   - Custom button colors
   - Upload custom icon
   - Add button text label

4. **Advanced features**
   - A/B testing
   - Conditional display (by page, product, etc.)
   - Multi-language support

---

This architecture is designed to be simple, maintainable, and scalable while following Shopify best practices.
