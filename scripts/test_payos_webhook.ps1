<#
PowerShell helper to POST a PayOS-style webhook with HMAC-SHA256 signature.
Usage examples:
.
# Basic:
.
$env:PAYOS_KEY = 'your_checksum_key'
.
.
# Run:
.
.
PS> .\scripts\test_payos_webhook.ps1 -Url 'https://<YOUR_WEBHOOK_URL>' -OrderCode '12345678' -Amount 10000
#
# To read body from a file: -BodyFile 'payload.json'
#
# This script sets header `x-payos-signature` with lowercase hex HMAC-SHA256.
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Url,

    [string]$OrderCode = "TEST1234",
    [int]$Amount = 10000,
    [string]$BodyFile = $null,
    [string]$ChecksumKey = $env:PAYOS_KEY,
    [string]$SignatureHeader = 'x-payos-signature'
)

if (-not $ChecksumKey) {
    Write-Error "Checksum key is required. Provide via -ChecksumKey or env PAYOS_KEY."; exit 2
}

if ($BodyFile) {
    if (-not (Test-Path $BodyFile)) { Write-Error "Body file not found: $BodyFile"; exit 3 }
    $body = Get-Content -Raw -Path $BodyFile
} else {
    $payload = @{ code = '00'; data = @{ orderCode = $OrderCode; amount = $Amount; transactionDateTime = (Get-Date).ToString('o') } }
    $body = ($payload | ConvertTo-Json -Depth 10 -Compress)
}

# Compute HMAC-SHA256 (lowercase hex)
$encoding = [System.Text.Encoding]::UTF8
$keyBytes = $encoding.GetBytes($ChecksumKey)
$bodyBytes = $encoding.GetBytes($body)
$hmac = New-Object System.Security.Cryptography.HMACSHA256 $keyBytes
$hash = $hmac.ComputeHash($bodyBytes)
$hex = ([System.BitConverter]::ToString($hash)).Replace('-','').ToLower()

# Send POST
try {
    Write-Host "POSTing to $Url" -ForegroundColor Cyan
    Write-Host "Signature: $hex" -ForegroundColor DarkYellow

    $headers = @{
        'Content-Type' = 'application/json'
        $SignatureHeader = $hex
    }

    $response = Invoke-RestMethod -Uri $Url -Method POST -Body $body -Headers $headers -ContentType 'application/json'
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Error "Request failed: $_"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $respBody = $reader.ReadToEnd()
        Write-Host "Response body:" -ForegroundColor Yellow
        Write-Host $respBody
    }
    exit 1
}
