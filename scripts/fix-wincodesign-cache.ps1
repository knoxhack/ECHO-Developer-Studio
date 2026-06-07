#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Fixes the electron-builder winCodeSign cache extraction on Windows without Developer Mode.
.DESCRIPTION
    electron-builder downloads a 7z archive containing code-signing tools. The archive contains
    macOS symlinks that fail to extract on Windows without Developer Mode. This script extracts
    the archive while ignoring symlinks, creating regular files instead.
.NOTES
    Run from an elevated PowerShell prompt: Right-click → Run as Administrator
#>

$cacheDir = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
$archiveUrl = "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"

Write-Host "ECHO Developer Studio — Fix winCodeSign Cache" -ForegroundColor Cyan
Write-Host ""

# Find 7-Zip or use the one bundled with electron-builder
$bundled7z = "node_modules\7zip-bin\win\x64\7za.exe"
$sevenZip = if (Test-Path $bundled7z) { $bundled7z } else { "7z.exe" }

if (-not (Test-Path $sevenZip)) {
    Write-Host "7-Zip not found. Please install 7-Zip or ensure node_modules is installed." -ForegroundColor Red
    exit 1
}

Write-Host "Using 7-Zip: $sevenZip" -ForegroundColor Gray

# Clean cache
if (Test-Path $cacheDir) {
    Write-Host "Cleaning existing cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $cacheDir
}

New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null

# Download
$archivePath = "$cacheDir\winCodeSign.7z"
Write-Host "Downloading winCodeSign..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $archiveUrl -OutFile $archivePath -UseBasicParsing

# Extract with symlink handling
# -snl: store symlinks as links (requires dev mode)
# -snld: store symlinks as files (the workaround)
$extractDir = "$cacheDir\2.6.0"
Write-Host "Extracting (ignoring symlinks)..." -ForegroundColor Yellow
& $sevenZip x -y -snld -o"$extractDir" "$archivePath" 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 2) {
    Write-Host "Extraction failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

# Create empty files for the missing symlinks so electron-builder doesn't re-download
$missingLinks = @(
    "darwin\10.12\lib\libcrypto.dylib",
    "darwin\10.12\lib\libssl.dylib"
)

foreach ($link in $missingLinks) {
    $linkPath = Join-Path $extractDir $link
    if (-not (Test-Path $linkPath)) {
        New-Item -ItemType File -Path $linkPath -Force | Out-Null
        Write-Host "  Created placeholder: $link" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "winCodeSign cache fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now build Windows targets:" -ForegroundColor Cyan
Write-Host "  npm run dist:win:nsis      → Installer (.exe Setup)"
Write-Host "  npm run dist:win:portable  → Single .exe (no install)"
Write-Host "  npm run dist:win:zip       → ZIP archive"
