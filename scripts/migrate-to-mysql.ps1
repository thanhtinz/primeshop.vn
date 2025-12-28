# PowerShell script to migrate from Supabase to MySQL hooks
# Run from project root: .\scripts\migrate-to-mysql.ps1

$projectRoot = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $projectRoot "src"

Write-Host "🔄 Starting migration from Supabase to MySQL..." -ForegroundColor Cyan

# Files to rename (backup Supabase, activate MySQL)
$filesToRename = @(
    @{
        Supabase = "src/contexts/AuthContext.tsx"
        MySQL = "src/contexts/AuthContext.mysql.tsx"
        Backup = "src/contexts/AuthContext.supabase.tsx"
    },
    @{
        Supabase = "src/hooks/useCategories.ts"
        MySQL = "src/hooks/useCategories.mysql.ts"
        Backup = "src/hooks/useCategories.supabase.ts"
    },
    @{
        Supabase = "src/hooks/useProducts.ts"
        MySQL = "src/hooks/useProducts.mysql.ts"
        Backup = "src/hooks/useProducts.supabase.ts"
    },
    @{
        Supabase = "src/hooks/useOrders.ts"
        MySQL = "src/hooks/useOrders.mysql.ts"
        Backup = "src/hooks/useOrders.supabase.ts"
    },
    @{
        Supabase = "src/hooks/useDeposit.ts"
        MySQL = "src/hooks/useDeposit.mysql.ts"
        Backup = "src/hooks/useDeposit.supabase.ts"
    },
    @{
        Supabase = "src/hooks/useVouchers.ts"
        MySQL = "src/hooks/useVouchers.mysql.ts"
        Backup = "src/hooks/useVouchers.supabase.ts"
    },
    @{
        Supabase = "src/hooks/useNotifications.ts"
        MySQL = "src/hooks/useNotifications.mysql.ts"
        Backup = "src/hooks/useNotifications.supabase.ts"
    },
    @{
        Supabase = "src/hooks/useWishlist.ts"
        MySQL = "src/hooks/useWishlist.mysql.ts"
        Backup = "src/hooks/useWishlist.supabase.ts"
    }
)

Write-Host ""
Write-Host "📁 Renaming hook files..." -ForegroundColor Yellow

foreach ($file in $filesToRename) {
    $supabasePath = Join-Path $projectRoot $file.Supabase
    $mysqlPath = Join-Path $projectRoot $file.MySQL
    $backupPath = Join-Path $projectRoot $file.Backup

    if (Test-Path $supabasePath) {
        if (Test-Path $mysqlPath) {
            # Backup Supabase version
            Write-Host "  Backup: $($file.Supabase) -> $($file.Backup)" -ForegroundColor Gray
            Move-Item $supabasePath $backupPath -Force

            # Activate MySQL version
            Write-Host "  Activate: $($file.MySQL) -> $($file.Supabase)" -ForegroundColor Green
            Move-Item $mysqlPath $supabasePath -Force
        } else {
            Write-Host "  ⚠️ MySQL version not found: $($file.MySQL)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️ Supabase file not found: $($file.Supabase)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔍 Finding files that import from Supabase client..." -ForegroundColor Yellow

# Find all TypeScript/TSX files that import supabase
$files = Get-ChildItem -Path $srcPath -Recurse -Include "*.ts","*.tsx" | 
    Where-Object { 
        $content = Get-Content $_.FullName -Raw
        $content -match "@/integrations/supabase/client" -or $content -match "from '@/integrations/supabase"
    }

Write-Host "Found $($files.Count) files with Supabase imports" -ForegroundColor Cyan

# Display files that need manual migration
Write-Host ""
Write-Host "📝 Files that need manual review:" -ForegroundColor Yellow
foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($projectRoot, "").TrimStart("\")
    Write-Host "  - $relativePath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Migration script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env with VITE_API_URL=http://localhost:3001/api" -ForegroundColor White
Write-Host "2. Start MySQL backend: cd server && npm run dev" -ForegroundColor White
Write-Host "3. Test the application" -ForegroundColor White
Write-Host "4. Manually update remaining files that use supabase client directly" -ForegroundColor White
