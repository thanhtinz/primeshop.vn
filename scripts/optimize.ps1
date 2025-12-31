# Performance Optimization Script (Windows)
# Run this before deployment

Write-Host "🚀 Starting optimization tasks..." -ForegroundColor Green

# 1. Clean build directories
Write-Host "🧹 Cleaning old builds..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }
if (Test-Path ".vite") { Remove-Item -Recurse -Force .vite }
if (Test-Path "node_modules\.vite") { Remove-Item -Recurse -Force node_modules\.vite }

# 2. Build production bundle
Write-Host "📦 Building production bundle..." -ForegroundColor Yellow
npm run build

# 3. Analyze bundle size
Write-Host "📊 Analyzing bundle size..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Write-Host "`nBundle Contents:" -ForegroundColor Cyan
    Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum | Select-Object `
        @{Name="Total Size (MB)"; Expression={[math]::Round($_.Sum / 1MB, 2)}},
        @{Name="File Count"; Expression={$_.Count}}
    
    Write-Host "`nLargest Files:" -ForegroundColor Cyan
    Get-ChildItem dist -Recurse -File | Sort-Object Length -Descending | Select-Object -First 10 | Format-Table Name, @{Label="Size (KB)"; Expression={[math]::Round($_.Length / 1KB, 2)}}
}

Write-Host "`n✅ Optimization complete!" -ForegroundColor Green
Write-Host "⚡ Your app is ready for deployment!" -ForegroundColor Green
