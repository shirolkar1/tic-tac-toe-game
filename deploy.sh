#!/bin/bash

echo "🚀 Deploying Tic Tac Toe Game to Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Run tests first
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Aborting deployment."
    exit 1
fi

echo "✅ Tests passed!"

# Build the project
echo "🏗️ Building project..."
npm run build

# Check for deployment tools and deploy
if command -v vercel &> /dev/null; then
    echo "🌐 Deploying to Vercel..."
    vercel --prod
elif command -v netlify &> /dev/null; then
    echo "🌐 Deploying to Netlify..."
    netlify deploy --prod --dir=src
elif command -v surge &> /dev/null; then
    echo "🌐 Deploying to Surge..."
    surge src/
else
    echo "⚠️ No deployment tool found. Please install one of:"
    echo "  - Vercel: npm i -g vercel"
    echo "  - Netlify: npm i -g netlify-cli"
    echo "  - Surge: npm i -g surge"
    echo ""
    echo "Or manually deploy the 'src' folder to your hosting provider."
fi

echo "✅ Deployment process completed!"