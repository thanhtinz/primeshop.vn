#!/bin/bash
# Security audit script

echo "🔒 Running Security Audit..."
echo ""

# 1. Check for hardcoded secrets
echo "1️⃣ Checking for hardcoded secrets..."
if grep -r "password\|secret\|api_key\|apikey\|token" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist src/ | grep -v "import\|export\|interface\|type\|const.*=.*process.env"; then
  echo "⚠️  WARNING: Potential hardcoded secrets found!"
else
  echo "✅ No hardcoded secrets found"
fi
echo ""

# 2. Check npm vulnerabilities
echo "2️⃣ Checking npm vulnerabilities..."
npm audit --production
echo ""

# 3. Check for missing security headers
echo "3️⃣ Checking security middleware..."
if grep -q "helmet()" server/src/index.ts; then
  echo "✅ Helmet.js configured"
else
  echo "⚠️  WARNING: Helmet.js not found!"
fi

if grep -q "mongoSanitize()" server/src/index.ts; then
  echo "✅ Input sanitization configured"
else
  echo "⚠️  WARNING: Input sanitization not found!"
fi

if grep -q "xss()" server/src/index.ts; then
  echo "✅ XSS protection configured"
else
  echo "⚠️  WARNING: XSS protection not found!"
fi
echo ""

# 4. Check for exposed .env files
echo "4️⃣ Checking for exposed .env files..."
if [ -f ".env" ] && git ls-files --error-unmatch .env 2>/dev/null; then
  echo "❌ CRITICAL: .env file is tracked by git!"
else
  echo "✅ .env files not tracked"
fi
echo ""

# 5. Check rate limiting
echo "5️⃣ Checking rate limiting..."
if grep -q "rateLimiter" server/src/index.ts; then
  echo "✅ Rate limiting configured"
else
  echo "⚠️  WARNING: Rate limiting not found!"
fi
echo ""

# 6. Check HTTPS enforcement
echo "6️⃣ Checking HTTPS configuration..."
if grep -q "https\|ssl" server/src/index.ts nginx.conf 2>/dev/null; then
  echo "✅ HTTPS configuration found"
else
  echo "⚠️  WARNING: HTTPS not enforced!"
fi
echo ""

# 7. Check build configuration
echo "7️⃣ Checking build security..."
if grep -q "sourcemap.*false" vite.config.ts; then
  echo "✅ Source maps disabled in production"
else
  echo "⚠️  WARNING: Source maps may be enabled!"
fi

if grep -q "obfuscator" vite.config.ts; then
  echo "✅ Code obfuscation configured"
else
  echo "⚠️  INFO: Code obfuscation not configured"
fi
echo ""

echo "🏁 Security audit complete!"
echo ""
echo "Next steps:"
echo "1. Fix any critical issues found above"
echo "2. Run: npm audit fix"
echo "3. Review SECURITY.md for best practices"
echo "4. Test with production build: npm run build"
