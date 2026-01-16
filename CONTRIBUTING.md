# Contributing to WhatsApp Chat Button

Thank you for considering contributing to the WhatsApp Chat Button app! This document provides guidelines for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help create a positive environment

## How to Contribute

### Reporting Bugs

If you find a bug:

1. **Check existing issues** - Someone may have already reported it
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, Node version, Shopify CLI version)

Example:
```markdown
**Bug**: Button not appearing on mobile

**Steps to Reproduce**:
1. Install app
2. Configure settings
3. Enable app embed
4. View on mobile device

**Expected**: Button should appear in bottom-right corner
**Actual**: Button doesn't appear

**Environment**:
- iOS 15.2 Safari
- Theme: Dawn 3.0
```

### Suggesting Features

For feature requests:

1. **Check existing issues** first
2. **Create a feature request** with:
   - Clear description of the feature
   - Use case / problem it solves
   - Potential implementation approach
   - Examples from other apps (if applicable)

### Contributing Code

#### 1. Fork and Clone

```bash
git clone https://github.com/yourusername/whatsapp-chat-button.git
cd whatsapp-chat-button
```

#### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

#### 3. Make Changes

Follow these guidelines:

**JavaScript/JSX**:
- Use ES6+ syntax
- Follow existing code style
- Add comments for complex logic
- Keep functions small and focused

**React Components**:
```javascript
// Good: Clear component with props
function WhatsAppButton({ position, phoneNumber, message }) {
  return (
    <a href={`https://wa.me/${phoneNumber}?text=${message}`}>
      <Icon />
    </a>
  );
}
```

**Liquid**:
- Follow Shopify Liquid style guide
- Comment complex logic
- Use semantic variable names

**CSS**:
- Use BEM or semantic class names
- Mobile-first responsive design
- Support dark mode (if applicable)

#### 4. Test Your Changes

**Manual Testing**:
- Test on development store
- Test all positions (4 corners)
- Test on mobile and desktop
- Test in multiple browsers

**Automated Testing** (if applicable):
```bash
npm test
```

#### 5. Commit Changes

Use clear, descriptive commit messages:

```bash
git commit -m "Add: Support for custom button colors"
git commit -m "Fix: Button positioning on mobile Safari"
git commit -m "Docs: Update installation instructions"
```

Commit message format:
- `Add:` - New feature
- `Fix:` - Bug fix
- `Update:` - Updates to existing feature
- `Remove:` - Removed feature/code
- `Docs:` - Documentation changes
- `Refactor:` - Code refactoring
- `Test:` - Test changes

#### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request with:
- **Clear title** describing the change
- **Description** explaining what and why
- **Related issue** number (if applicable)
- **Screenshots** (for UI changes)
- **Testing notes** - How you tested it

Example PR description:
```markdown
## Description
Adds support for custom button colors via admin panel

## Related Issue
Closes #42

## Changes
- Added color picker to admin panel
- Updated Liquid template to apply custom colors
- Added CSS custom properties support

## Testing
- [x] Tested color picker functionality
- [x] Tested on desktop (Chrome, Firefox, Safari)
- [x] Tested on mobile (iOS Safari, Chrome Mobile)
- [x] Verified backwards compatibility

## Screenshots
![Color Picker](screenshot.png)
```

### Code Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, it will be merged
4. Your contribution will be credited

## Development Setup

### Prerequisites

- Node.js 18+
- Shopify CLI
- Development store
- Partner account

### Installation

```bash
# Install dependencies
npm install
cd web && npm install
cd frontend && npm install

# Start development server
npm run dev
```

### Project Structure

```
whatsapp/
├── extensions/           # Theme App Extension
│   └── whatsapp-button/
│       ├── blocks/       # Liquid blocks
│       └── assets/       # Static assets
├── web/                  # Backend
│   ├── index.js         # Express server
│   ├── shopify.js       # Shopify config
│   └── frontend/        # React admin panel
└── docs/                # Documentation
```

## Style Guide

### JavaScript

```javascript
// Use const/let, not var
const phoneNumber = "+1234567890";
let position = "bottom-right";

// Use arrow functions
const formatPhone = (phone) => phone.replace(/\D/g, "");

// Use template literals
const url = `https://wa.me/${phoneNumber}`;

// Use async/await over promises
async function loadSettings() {
  const response = await fetch("/api/settings");
  return await response.json();
}
```

### React

```jsx
// Functional components with hooks
function SettingsForm() {
  const [phone, setPhone] = useState("");
  
  return (
    <TextField
      value={phone}
      onChange={setPhone}
      label="Phone Number"
    />
  );
}
```

### CSS

```css
/* Use meaningful class names */
.whatsapp-button {
  /* Group related properties */
  display: flex;
  align-items: center;
  
  /* Visual properties */
  background: #25D366;
  border-radius: 50%;
  
  /* Transitions last */
  transition: transform 0.3s ease;
}

/* Mobile-first responsive */
.whatsapp-button {
  width: 56px;
  height: 56px;
}

@media (min-width: 768px) {
  .whatsapp-button {
    width: 60px;
    height: 60px;
  }
}
```

## Testing Guidelines

### Manual Testing Checklist

- [ ] Button appears in all 4 positions
- [ ] Click opens WhatsApp correctly
- [ ] Settings save and load properly
- [ ] Enable/disable toggle works
- [ ] Mobile responsive
- [ ] Works in Chrome, Firefox, Safari
- [ ] No console errors
- [ ] Accessible (keyboard navigation, screen readers)

### Browser Support

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Chrome Mobile

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Test with screen readers
- Ensure color contrast meets WCAG AA

## Documentation

When adding features:

1. **Update README.md** - Main documentation
2. **Update SETUP.md** - If setup changes
3. **Add inline comments** - For complex code
4. **Update CHANGELOG.md** - Document changes

## Release Process

Maintainers follow this release process:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create Git tag
4. Deploy to production
5. Create GitHub release
6. Announce in community

## Community

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions

## Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Credited in release notes
- Acknowledged in documentation

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

Thank you for contributing! Your help makes this project better for everyone. 🎉
