# Changelog

All notable changes to the WhatsApp Chat Button app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Multi-agent support with routing
- Business hours scheduling
- Custom button color picker
- Analytics dashboard
- Button impressions tracking
- A/B testing support

## [1.0.0] - 2026-01-16

### Added
- Initial release of WhatsApp Chat Button app
- Admin panel built with React and Shopify Polaris
- Theme App Extension for storefront button
- Settings storage using Shopify metafields
- WhatsApp phone number configuration
- Default message customization
- 4 position options (bottom-right, bottom-left, top-right, top-left)
- Enable/disable toggle
- Floating button with WhatsApp icon
- Mobile and desktop responsive design
- Click-to-chat functionality using wa.me links
- GDPR webhook handlers
- OAuth 2.0 authentication
- Comprehensive documentation
- Setup guide
- Deployment guide
- Privacy policy template
- Contributing guidelines
- Architecture documentation

### Features
- ✨ Beautiful admin interface
- 📱 Mobile-first responsive design
- ♿ Accessible (WCAG compliant)
- 🎨 Clean, modern UI
- ⚡ Performance optimized (<10KB total)
- 🔒 Secure (OAuth, HTTPS)
- 🌍 Works globally (any phone number)
- 💾 No database required
- 🎯 Easy to install and configure

### Technical Details
- Node.js 18+ backend
- Express web server
- React 18 frontend
- Shopify Polaris UI
- Liquid templating
- App Embed extension
- Metafields for storage
- GraphQL API integration

### Documentation
- README.md - Main documentation
- SETUP.md - Installation guide
- DEPLOYMENT.md - Production deployment
- PRIVACY.md - Privacy policy
- CONTRIBUTING.md - Contribution guidelines
- ARCHITECTURE.md - Technical architecture
- CHANGELOG.md - Version history

### Security
- OAuth 2.0 authentication
- HTTPS required
- Input validation
- XSS prevention
- CSRF protection
- GDPR compliant
- CCPA compliant

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Chrome Mobile 90+

### API Endpoints
- `GET /api/settings` - Retrieve app settings
- `POST /api/settings` - Save app settings
- `GET /api/auth` - OAuth initiation
- `GET /api/auth/callback` - OAuth callback
- `POST /api/webhooks` - GDPR webhooks

### Metafields
- `whatsapp_chat.phone_number` - Phone number
- `whatsapp_chat.default_message` - Default message
- `whatsapp_chat.position` - Button position
- `whatsapp_chat.enabled` - Enable status

---

## Version History

### Version Numbering

We use semantic versioning:
- **Major** (1.x.x) - Breaking changes
- **Minor** (x.1.x) - New features (backwards compatible)
- **Patch** (x.x.1) - Bug fixes

### Release Schedule

- **Major releases**: As needed (breaking changes)
- **Minor releases**: Monthly (new features)
- **Patch releases**: Weekly (bug fixes)

### How to Update

Merchants will be notified of updates via:
1. Shopify Partner dashboard notification
2. In-app banner (for major updates)
3. Email (for critical updates)

### Upgrade Path

From any version to latest:
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Redeploy
npm run deploy
```

---

## Future Roadmap

### v1.1.0 (Q1 2026)
- [ ] Button animation options
- [ ] Custom button text label
- [ ] Hide on specific pages option

### v1.2.0 (Q2 2026)
- [ ] Multi-agent support
- [ ] Department routing
- [ ] Agent availability status

### v1.3.0 (Q3 2026)
- [ ] Analytics dashboard
- [ ] Click tracking
- [ ] Conversion metrics

### v2.0.0 (Q4 2026)
- [ ] Complete UI redesign
- [ ] Advanced customization
- [ ] Premium features
- [ ] Multi-language support

---

## Deprecation Policy

We will provide at least **3 months notice** before:
- Removing features
- Breaking API changes
- Dropping browser support

Deprecated features will be marked in:
- Changelog
- Documentation
- In-app warnings

---

## Support

For questions about changes:
- Review this changelog
- Check documentation
- Contact support

---

[Unreleased]: https://github.com/yourusername/whatsapp-chat-button/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/whatsapp-chat-button/releases/tag/v1.0.0
