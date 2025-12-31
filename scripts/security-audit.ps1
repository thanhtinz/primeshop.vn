# Security Audit Script (Windows)

Write-Host "🔒 Running Security Audit..." -ForegroundColor Green
Write-Host ""

# 1. Check for hardcoded secrets
Write-Host "1️⃣ Checking for hardcoded secrets..." -ForegroundColor Yellow
$suspiciousPatterns = Select-String -Path "src\**\*.ts", "src\**\*.tsx", "src\**\*.js" -Pattern "password|secret|api_key|apikey|token" -Exclude "*.d.ts" | Where-Object { $_.Line -notmatch "import|export|interface|type|const.*process\.env" }
if ($suspiciousPatterns) {
    Write-Host "⚠️  WARNING: Potential hardcoded secrets found!" -ForegroundColor Red
    $suspiciousPatterns | ForEach-Object { Write-Host $_.Path -ForegroundColor Gray }
} else {
    Write-Host "✅ No hardcoded secrets found" -ForegroundColor Green
}
Write-Host ""

# 2. Check npm vulnerabilities
Write-Host "2️⃣ Checking npm vulnerabilities..." -ForegroundColor Yellow
npm audit --production
Write-Host ""

# 3. Check for missing security headers
Write-Host "3️⃣ Checking security middleware..." -ForegroundColor Yellow
$indexContent = Get-Content "server\src\index.ts" -Raw

if ($indexContent -match "helmet\(\)") {
    Write-Host "✅ Helmet.js configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Helmet.js not found!" -ForegroundColor Red
}

if ($indexContent -match "mongoSanitize\(\)") {
    Write-Host "✅ Input sanitization configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Input sanitization not found!" -ForegroundColor Red
}

if ($indexContent -match "xss\(\)") {
    Write-Host "✅ XSS protection configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: XSS protection not found!" -ForegroundColor Red
}
Write-Host ""

# 4. Check for exposed .env files
Write-Host "4️⃣ Checking for exposed .env files..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $tracked = git ls-files --error-unmatch .env 2>$null
    if ($tracked) {
        Write-Host "❌ CRITICAL: .env file is tracked by git!" -ForegroundColor Red
    } else {
        Write-Host "✅ .env files not tracked" -ForegroundColor Green
    }
} else {
    Write-Host "✅ .env files not tracked" -ForegroundColor Green
}
Write-Host ""

# 5. Check rate limiting
Write-Host "5️⃣ Checking rate limiting..." -ForegroundColor Yellow
if ($indexContent -match "rateLimiter") {
    Write-Host "✅ Rate limiting configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Rate limiting not found!" -ForegroundColor Red
}
Write-Host ""

# 6. Check build configuration
Write-Host "6️⃣ Checking build security..." -ForegroundColor Yellow
$viteConfig = Get-Content "vite.config.ts" -Raw

if ($viteConfig -match "sourcemap.*false") {
    Write-Host "✅ Source maps disabled in production" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Source maps may be enabled!" -ForegroundColor Red
}

if ($viteConfig -match "obfuscator") {
    Write-Host "✅ Code obfuscation configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  INFO: Code obfuscation not configured" -ForegroundColor Yellow
}
Write-Host ""

# 7. Check dependencies
Write-Host "7️⃣ Checking security packages..." -ForegroundColor Yellow
$packageJson = Get-Content "server\package.json" | ConvertFrom-Json
$securityPackages = @("helmet", "express-mongo-sanitize", "xss-clean", "hpp")
$missing = @()

foreach ($pkg in $securityPackages) {
    if (-not $packageJson.dependencies.$pkg) {
        $missing += $pkg
    }
}

if ($missing.Count -gt 0) {
    Write-Host "⚠️  WARNING: Missing security packages: $($missing -join ', ')" -ForegroundColor Red
} else {
    Write-Host "✅ All security packages installed" -ForegroundColor Green
}
Write-Host ""

Write-Host "🏁 Security audit complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Fix any critical issues found above"
Write-Host "2. Run: npm audit fix"
Write-Host "3. Review SECURITY.md for best practices"
Write-Host "4. Test with production build: npm run build"
