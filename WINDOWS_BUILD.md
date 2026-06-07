# ECHO Developer Studio — Windows Build Guide

This guide covers how to build a real Windows application — NSIS installer, portable .exe, and ZIP — from the ECHO Developer Studio Electron app.

---

## The Problem

`electron-builder` downloads `winCodeSign` (code-signing tools) as a 7-Zip archive. That archive contains **macOS symbolic links** (`libcrypto.dylib`, `libssl.dylib`) that Windows cannot create without **Developer Mode**. On a standard Windows install, `7za.exe` fails with:

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
```

This causes **every** `electron-builder --win` build to fail — even portable and ZIP targets, because the cache is downloaded up-front.

---

## Solution 1: Enable Windows Developer Mode (Recommended)

Developer Mode is the standard way Electron developers build on Windows. It unlocks symlink creation without admin elevation.

### Option A: PowerShell Script (Automated)

1. Open **PowerShell as Administrator** (Right-click → Run as Administrator)
2. Run:

```powershell
.\scripts\enable-developer-mode.ps1
```

3. If successful, clear the broken cache once:

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
```

4. Build:

```bash
npm run dist:win:nsis      # Installer (.exe Setup)
npm run dist:win:portable  # Single .exe (no install)
npm run dist:win:zip       # ZIP archive
npm run dist:win           # All three
```

### Option B: Manual (Settings UI)

1. Open **Settings → Privacy & Security → For developers**
2. Toggle **Developer Mode** → **On**
3. Restart your terminal/IDE
4. Clear cache and build (same commands as above)

---

## Solution 2: Fix Cache Without Developer Mode

If you **cannot** enable Developer Mode (corporate policy, etc.), run the cache fix script:

1. Open **PowerShell as Administrator**
2. Run:

```powershell
.\scripts\fix-wincodesign-cache.ps1
```

This script:
- Downloads `winCodeSign` manually
- Extracts it while **ignoring symlinks** (treating them as regular files)
- Creates placeholder files for the missing macOS symlinks
- Places the cache where `electron-builder` expects it

After this one-time fix, builds work without Developer Mode.

---

## Solution 3: CI/CD Build (GitHub Actions)

The cleanest approach for production releases: build on GitHub Actions (Linux/macOS runners) where symlink creation is unrestricted.

See `.github/workflows/build.yml` (create this file):

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run dist
      - uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.os }}
          path: release/**
```

The Windows runner on GitHub Actions **does** have Developer Mode enabled, so this just works.

---

## Build Outputs

| Target | Command | Output | Notes |
|---|---|---|---|
| **NSIS Installer** | `npm run dist:win:nsis` | `ECHO-Developer-Studio-0.1.0-Setup.exe` | Full install wizard, Start Menu, Desktop shortcut, uninstaller |
| **Portable** | `npm run dist:win:portable` | `ECHO-Developer-Studio-0.1.0-Portable.exe` | Single .exe, no install, runs from USB |
| **ZIP** | `npm run dist:win:zip` | `ECHO-Developer-Studio-0.1.0-x64.zip` | Unzip and run `ECHO Developer Studio.exe` |

All outputs land in `release/`.

---

## Quick Start: Build Right Now

If you already have the `release/win-unpacked/` folder from a previous build, you can create a ZIP immediately (no Developer Mode needed):

```powershell
Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "release\ECHO-Developer-Studio-0.1.0-win-x64.zip"
```

This ZIP contains the fully functional app. Users unzip it and double-click `ECHO Developer Studio.exe`.

---

## App Icons

The app currently uses the default Electron icon. To use a custom icon:

1. Replace `build/icons/icon.png` with your app icon (256x256 PNG minimum)
2. For Windows, also add `build/icon.ico` (multi-resolution .ico: 16, 32, 48, 64, 128, 256)
3. Rebuild

Generate an .ico from a PNG with ImageMagick:

```bash
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

---

## Prerequisites Check

Run the built-in check before building:

```bash
node scripts/check-windows-prereqs.js
```

This checks:
- Node.js version
- npm availability
- Git installation
- Windows Developer Mode status
- winCodeSign cache state
- App icons presence

---

## Troubleshooting

### "Cannot create symbolic link" error
- **Fix:** Enable Developer Mode OR run `scripts/fix-wincodesign-cache.ps1`

### Build succeeds but no installer appears
- Check `release/` directory
- Check `builder-debug.yml` in `release/` for detailed logs

### App launches but shows white screen
- Ensure `dist/renderer/index.html` exists
- Check `main.cjs` points to correct renderer path

### NSIS installer doesn't create shortcuts
- The installer is configured with `oneClick: false` (wizard mode)
- User must check "Create desktop shortcut" during install
- To force one-click: edit `electron-builder.yml`, set `oneClick: true`

---

## Comparison: How the ECHO Launcher Does It

The ECHO Launcher likely uses one of these approaches:

1. **Developer Mode enabled** on the build machine (most common for solo developers)
2. **GitHub Actions CI** with Windows runner (standard for teams)
3. **Pre-built cache** committed to repo or stored in CI cache

All three approaches produce identical `.exe` installers. Choose the one that fits your workflow.
