#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Enables Windows Developer Mode so electron-builder can create symbolic links.
.DESCRIPTION
    This is a one-time setup required for building NSIS installers with electron-builder
    on Windows. Developer Mode allows non-admin creation of symlinks, which 7-Zip needs
    to extract the winCodeSign code-signing tools.
.NOTES
    Run from an elevated PowerShell prompt: Right-click → Run as Administrator
#>

Write-Host "ECHO Developer Studio — Enable Windows Developer Mode" -ForegroundColor Cyan
Write-Host ""

# Check if already enabled
$devModePath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock"
$devModeValue = (Get-ItemProperty -Path $devModePath -Name "AllowDevelopmentWithoutDevLicense" -ErrorAction SilentlyContinue).AllowDevelopmentWithoutDevLicense

if ($devModeValue -eq 1) {
    Write-Host "Developer Mode is already enabled." -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now build the NSIS installer with:" -ForegroundColor Cyan
    Write-Host "    npm run dist:win:nsis"
    exit 0
}

# Enable Developer Mode
Write-Host "Enabling Windows Developer Mode..." -ForegroundColor Yellow

New-Item -Path $devModePath -Force | Out-Null
Set-ItemProperty -Path $devModePath -Name "AllowDevelopmentWithoutDevLicense" -Value 1 -Type DWord

# Verify
$devModeValue = (Get-ItemProperty -Path $devModePath -Name "AllowDevelopmentWithoutDevLicense").AllowDevelopmentWithoutDevLicense

if ($devModeValue -eq 1) {
    Write-Host ""
    Write-Host "Developer Mode enabled successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Clear the electron-builder cache:" -ForegroundColor White
    Write-Host "     Remove-Item -Recurse -Force `$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
    Write-Host "  2. Build the NSIS installer:" -ForegroundColor White
    Write-Host "     npm run dist:win:nsis"
    Write-Host ""
    Write-Host "Build targets available:" -ForegroundColor Cyan
    Write-Host "  npm run dist:win:nsis      → Installer (.exe Setup)"
    Write-Host "  npm run dist:win:portable  → Single .exe (no install)"
    Write-Host "  npm run dist:win:zip       → ZIP archive"
} else {
    Write-Host "Failed to enable Developer Mode. You may need to enable it manually:" -ForegroundColor Red
    Write-Host "  Settings → Privacy & Security → For developers → Developer Mode" -ForegroundColor Yellow
}
