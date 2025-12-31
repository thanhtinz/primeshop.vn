#!/bin/bash
# Pre-deployment optimization script

echo "🚀 Starting optimization tasks..."

# 1. Clean build directories
echo "🧹 Cleaning old builds..."
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.vite/

# 2. Optimize images (if imagemin is installed)
if command -v npx &> /dev/null; then
  echo "🖼️ Optimizing images..."
  # Add imagemin script here if needed
fi

# 3. Build production bundle
echo "📦 Building production bundle..."
npm run build

# 4. Analyze bundle size
echo "📊 Analyzing bundle size..."
if [ -d "dist" ]; then
  du -sh dist/*
  echo "Total dist size:"
  du -sh dist/
fi

echo "✅ Optimization complete!"
