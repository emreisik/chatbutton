# Deployment Guide - WhatsApp Chat Button

This guide covers deploying your Shopify app to production.

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] App works correctly on development store
- [ ] All features tested (settings save, button displays, WhatsApp link works)
- [ ] Code is committed to Git
- [ ] Environment variables documented
- [ ] Production hosting platform chosen
- [ ] Domain/subdomain ready (optional)

## Deployment Options

### Option 1: Vercel (Recommended for Next.js/Node)

#### Prerequisites
- Vercel account
- Git repository (GitHub, GitLab, or Bitbucket)

#### Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Configure Build Settings**
   
   Create `vercel.json` in project root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "web/index.js",
         "use": "@vercel/node"
       },
       {
         "src": "web/frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "web/index.js"
       },
       {
         "src": "/(.*)",
         "dest": "web/frontend/$1"
       }
     ],
     "env": {
       "SHOPIFY_API_KEY": "@shopify-api-key",
       "SHOPIFY_API_SECRET": "@shopify-api-secret"
     }
   }
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Add Environment Variables**
   ```bash
   vercel env add SHOPIFY_API_KEY
   vercel env add SHOPIFY_API_SECRET
   vercel env add SCOPES
   ```

6. **Production Deploy**
   ```bash
   vercel --prod
   ```

7. **Get Deployment URL**
   Vercel will provide a URL like: `https://your-app.vercel.app`

### Option 2: Heroku

#### Prerequisites
- Heroku account
- Heroku CLI installed

#### Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create whatsapp-chat-button
   ```

3. **Add Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. **Configure Environment Variables**
   ```bash
   heroku config:set SHOPIFY_API_KEY=your_key
   heroku config:set SHOPIFY_API_SECRET=your_secret
   heroku config:set SCOPES=write_online_store_pages,read_products
   heroku config:set NODE_ENV=production
   ```

5. **Create Procfile**
   
   Create `Procfile` in root:
   ```
   web: cd web && npm start
   ```

6. **Update package.json**
   
   Add to root `package.json`:
   ```json
   {
     "scripts": {
       "heroku-postbuild": "cd web/frontend && npm install && npm run build"
     }
   }
   ```

7. **Deploy**
   ```bash
   git push heroku main
   ```

8. **Open App**
   ```bash
   heroku open
   ```

### Option 3: DigitalOcean App Platform

#### Steps

1. **Create DigitalOcean Account**
   Visit [cloud.digitalocean.com](https://cloud.digitalocean.com)

2. **Create New App**
   - Click "Create" → "Apps"
   - Connect your Git repository
   - Select branch (e.g., `main`)

3. **Configure Build Settings**
   - **Build Command**: `cd web/frontend && npm install && npm run build && cd ../.. && npm install`
   - **Run Command**: `cd web && node index.js`
   - **HTTP Port**: 8080

4. **Add Environment Variables**
   ```
   SHOPIFY_API_KEY=your_key
   SHOPIFY_API_SECRET=your_secret
   SCOPES=write_online_store_pages,read_products
   PORT=8080
   NODE_ENV=production
   ```

5. **Deploy**
   Click "Create Resources" to deploy

### Option 4: AWS (Advanced)

For AWS deployment using Elastic Beanstalk:

1. Install AWS CLI and EB CLI
2. Configure AWS credentials
3. Create Elastic Beanstalk application
4. Deploy using `eb deploy`

Detailed AWS setup is beyond this guide. See [AWS Documentation](https://aws.amazon.com/elasticbeanstalk/).

### Option 5: Fly.io

#### Steps

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Create fly.toml**
   ```toml
   app = "whatsapp-chat-button"
   
   [build]
     builder = "heroku/buildpacks:20"
   
   [env]
     PORT = "8080"
     NODE_ENV = "production"
   
   [[services]]
     http_checks = []
     internal_port = 8080
     protocol = "tcp"
     
     [[services.ports]]
       handlers = ["http"]
       port = 80
       
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

4. **Deploy**
   ```bash
   fly launch
   fly secrets set SHOPIFY_API_KEY=your_key
   fly secrets set SHOPIFY_API_SECRET=your_secret
   fly deploy
   ```

## Post-Deployment Steps

### 1. Update Shopify Partner Dashboard

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Navigate to **Apps** → Your App → **Configuration**
3. Update URLs:
   - **App URL**: `https://your-production-domain.com`
   - **Allowed redirection URLs**:
     - `https://your-production-domain.com/api/auth/callback`
     - `https://your-production-domain.com/auth/callback`
     - `https://your-production-domain.com/auth/shopify/callback`

### 2. Update shopify.app.toml

```toml
application_url = "https://your-production-domain.com"

[auth]
redirect_urls = [
  "https://your-production-domain.com/api/auth/callback",
  "https://your-production-domain.com/auth/callback",
  "https://your-production-domain.com/auth/shopify/callback"
]
```

### 3. Test Production App

1. Reinstall app on a test store using production URL
2. Configure settings
3. Enable app embed
4. Test all features

### 4. Set Up Monitoring

#### Add Error Tracking (Optional)

Use services like:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - Application monitoring

Example with Sentry:

```javascript
// web/index.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Add Uptime Monitoring

Use services like:
- **UptimeRobot** - Free uptime monitoring
- **Pingdom** - Advanced monitoring
- **Better Uptime** - Modern uptime monitoring

### 5. Set Up CI/CD (Optional)

#### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd web/frontend && npm install
      
      - name: Build frontend
        run: cd web/frontend && npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Environment Variables Reference

### Required Variables

```env
# Shopify API credentials
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard

# OAuth scopes
SCOPES=write_online_store_pages,read_products

# App URL
HOST=https://your-production-domain.com
SHOPIFY_APP_URL=https://your-production-domain.com

# Environment
NODE_ENV=production
```

### Optional Variables

```env
# Port (if not using default)
PORT=8080
BACKEND_PORT=8080

# Session storage (for production, use Redis/Prisma)
SESSION_STORAGE=redis
REDIS_URL=redis://your-redis-url

# Error tracking
SENTRY_DSN=your_sentry_dsn

# Analytics
GA_TRACKING_ID=your_google_analytics_id
```

## Database/Storage Considerations

This app uses **metafields** for storage (no database required), but for scaling:

### Option 1: Add Redis for Sessions

```javascript
// web/shopify.js
import { RedisSessionStorage } from '@shopify/shopify-app-session-storage-redis';

const sessionStorage = new RedisSessionStorage(
  process.env.REDIS_URL,
  { db: 0 }
);

const shopify = shopifyApp({
  sessionStorage,
  // ... other config
});
```

### Option 2: Add PostgreSQL with Prisma

```bash
npm install @shopify/shopify-app-session-storage-prisma @prisma/client
```

```javascript
// web/shopify.js
import { PrismaSessionStorage } from '@shopify/shopify-app-session-storage-prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const sessionStorage = new PrismaSessionStorage(prisma);
```

## SSL/HTTPS

All deployment platforms provide free SSL:
- **Vercel**: Automatic SSL
- **Heroku**: Automatic SSL
- **Fly.io**: Automatic SSL
- **DigitalOcean**: Free Let's Encrypt SSL

For custom domains, configure DNS:
1. Add CNAME record pointing to your platform
2. Platform will provision SSL certificate
3. Wait 24-48 hours for DNS propagation

## Custom Domain Setup

### Vercel

```bash
vercel domains add your-domain.com
```

Then update DNS:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### Heroku

```bash
heroku domains:add your-domain.com
```

Then update DNS:
```
Type: CNAME
Name: @
Value: your-app-name.herokuapp.com
```

## Scaling Considerations

For high-traffic stores:

1. **Use CDN** - Serve static assets via CDN
2. **Enable Caching** - Cache API responses
3. **Upgrade Server** - Increase server resources
4. **Load Balancing** - Distribute traffic across servers
5. **Database** - Move from metafields to dedicated DB

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables set correctly
- [ ] No API keys in code
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] GDPR compliance implemented
- [ ] Security headers set

Add security headers in Express:

```javascript
// web/index.js
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
  }
}));
```

## Rollback Strategy

If deployment fails:

### Vercel
```bash
vercel rollback
```

### Heroku
```bash
heroku rollback
```

### Manual Rollback
```bash
git revert HEAD
git push origin main
```

## Monitoring Production

### Key Metrics to Track

1. **Uptime** - Should be 99.9%+
2. **Response Time** - <500ms average
3. **Error Rate** - <1%
4. **API Success Rate** - >99%
5. **Active Installations** - Growing

### Tools

- **Shopify Partner Dashboard** - App analytics
- **Vercel Analytics** - Built-in monitoring
- **Google Analytics** - User behavior
- **Sentry** - Error tracking
- **LogRocket** - Session replay

## Troubleshooting Deployment Issues

### Build Fails

- Check Node.js version matches
- Verify all dependencies installed
- Check build logs for errors

### App Won't Start

- Verify environment variables set
- Check PORT configuration
- Review server logs

### OAuth Errors

- Confirm redirect URLs match exactly
- Check API key/secret correct
- Verify scopes approved

## Cost Estimates

### Vercel
- **Free tier**: Good for testing (100GB bandwidth)
- **Pro tier**: $20/month (1TB bandwidth)

### Heroku
- **Free tier**: Deprecated (use Eco)
- **Eco**: $5/month per dyno
- **Basic**: $7/month per dyno

### DigitalOcean
- **Basic**: $5/month
- **Professional**: $12/month

### Fly.io
- **Free tier**: $0 (limited resources)
- **Paid**: ~$5-10/month

## Next Steps After Deployment

1. ✅ Test thoroughly on production
2. ✅ Monitor for 48 hours
3. ✅ Set up alerts
4. ✅ Document any custom changes
5. ✅ Prepare for Shopify App Store submission (optional)

---

**Congratulations!** 🚀 Your app is now live in production.

For ongoing support, monitor your logs and metrics regularly.
