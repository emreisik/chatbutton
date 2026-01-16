#!/bin/bash
# Run this script to create your .env file
# Usage: bash CREATE_ENV_FILE.sh

cat > .env << 'EOF'
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=write_online_store_pages,read_products

# App URL (will be auto-generated during development)
HOST=

# Environment
NODE_ENV=development
EOF

echo "✅ .env file created successfully!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. cd web && npm install"
echo "3. cd frontend && npm install"
echo "4. cd ../.. && npm run dev"
