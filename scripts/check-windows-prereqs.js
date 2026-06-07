#!/usr/bin/env node
/**
 * Checks Windows prerequisites for building the ECHO Developer Studio installer.
 * Run: node scripts/check-windows-prereqs.js
 */

const { execSync } = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function check(label, ok, message) {
  const status = ok ? `${GREEN}OK${RESET}` : `${RED}FAIL${RESET}`
  console.log(`  [${status}] ${label}${message ? ': ' + message : ''}`)
  return ok
}

console.log('\nECHO Developer Studio — Windows Build Prerequisites\n')

let allOk = true

// OS Check
allOk &= check('Operating System', os.platform() === 'win32', os.platform())

// Node.js version
try {
  const nodeVersion = process.version
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10)
  allOk &= check('Node.js >= 18', major >= 18, nodeVersion)
} catch {
  allOk &= check('Node.js version', false, 'unknown')
}

// npm
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim()
  allOk &= check('npm', true, npmVersion)
} catch {
  allOk &= check('npm', false, 'not found')
}

// Git
try {
  const gitVersion = execSync('git --version', { encoding: 'utf-8' }).trim()
  allOk &= check('Git', true, gitVersion)
} catch {
  allOk &= check('Git', false, 'not found (needed for workspace scanning)')
}

// Windows Developer Mode (needed for electron-builder symlinks)
let devMode = false
try {
  const regQuery = execSync(
    'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" /v AllowDevelopmentWithoutDevLicense',
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
  )
  devMode = regQuery.includes('0x1')
} catch {
  devMode = false
}

if (devMode) {
  allOk &= check('Windows Developer Mode', true, 'enabled')
} else {
  allOk &= check('Windows Developer Mode', false, 'disabled')
  console.log(`\n  ${YELLOW}⚠ Windows Developer Mode is OFF${RESET}`)
  console.log(`     This is required for electron-builder to extract code-signing tools.`)
  console.log(`\n  ${YELLOW}To enable Developer Mode:${RESET}`)
  console.log(`     1. Open Settings → Privacy & Security → For developers`)
  console.log(`     2. Toggle ON "Developer Mode"`)
  console.log(`     3. Restart your terminal/IDE`)
  console.log(`\n  ${YELLOW}Alternative (if you can't enable Developer Mode):${RESET}`)
  console.log(`     Use portable or zip builds instead:`)
  console.log(`     npm run dist:win:portable   → single .exe (no install)`)
  console.log(`     npm run dist:win:zip        → unzip and run`)
}

// Check if winCodeSign cache exists
const winCodeSignCache = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign')
const winCodeSignExists = fs.existsSync(winCodeSignCache)
allOk &= check('winCodeSign cache', winCodeSignExists, winCodeSignExists ? 'found' : 'not cached yet')

// Check build/icons exists
const iconsDir = path.join(process.cwd(), 'build', 'icons')
const iconsExist = fs.existsSync(iconsDir) && fs.readdirSync(iconsDir).length > 0
allOk &= check('App icons', iconsExist, iconsExist ? 'found' : 'missing — using default Electron icon')

console.log('\n' + (allOk
  ? `${GREEN}All prerequisites met. You can build the NSIS installer with:${RESET}\n   npm run dist:win:nsis`
  : `${YELLOW}Some prerequisites are missing. Fix the issues above, then run:${RESET}\n   npm run dist:win`)
)

console.log('\nBuild targets available:')
console.log('  npm run dist:win:nsis      → Windows installer (.exe Setup)')
console.log('  npm run dist:win:portable  → Portable single .exe (no install)')
console.log('  npm run dist:win:zip       → ZIP archive (unzip and run)')
console.log('  npm run dist:win           → All Windows targets')
console.log('')
