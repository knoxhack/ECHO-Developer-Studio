import { app, BrowserWindow, ipcMain, dialog, shell, Notification, screen } from 'electron'
import path from 'path'
import fs from 'fs'
import child_process from 'child_process'
import Store from 'electron-store'
import chokidar from 'chokidar'
import crypto from 'crypto'
import os from 'os'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { getGitInfo, getGitLog, getGitDiff } from './lib/git'
import { readGradleBuild, findArtifacts, readTestResults, runGradleTask } from './lib/gradle'
import { getIssues, getPRs, getCIStatus, createIssue, createComment } from './lib/github'
import { parseCrashReport, findCrashReports } from './lib/crashParser'
import { hashPassphrase, verifyPassphrase, generateInviteCode } from './lib/authCrypto'

const { spawn } = child_process
const { watch } = chokidar

let mainWindow: BrowserWindow | null = null
const DEV_UPDATE_FEED_OWNER = 'knoxhack'
const DEV_UPDATE_FEED_REPO = 'ECHO-Developer-Studio'
const DEV_PUBLIC_UPDATE_FEED_OWNER = 'knoxhack'
const DEV_PUBLIC_UPDATE_FEED_REPO = 'ECHO-Developer-Studio'
const UPDATE_FALLBACK_COMPAT_KEY = 'developer-studio-update-fallback-window'
const UPDATE_FALLBACK_STABLE_RELEASES = 2
type UpdateFeedConfig = { provider: 'github'; owner: string; repo: string; releaseType: 'release' }
type MigrationFallbackWindow = { anchorVersion: string; anchorDistance: number; establishedAt: string }

// ── Logging ──
log.initialize()
log.transports.file.level = 'info'
log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn'

// ── Electron Store ──
interface StudioStore {
  workspacePath: string | null
  lastRole: string
  settings: Record<string, unknown>
  windowState?: { width: number; height: number; x?: number; y?: number; maximized?: boolean }
}

const store = new Store<StudioStore>({
  defaults: {
    workspacePath: null,
    lastRole: 'viewer',
    settings: {},
    windowState: { width: 1600, height: 1000 },
  },
}) as any

const AUDIT_PATH = path.join(os.homedir(), '.echo-studio', 'audit.log')
fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true })

function isUpdateDisabled(): boolean {
  const disable = process.env['ECHO_UPDATES_DISABLED'] || process.env['UPDATE_DISABLED']
  return disable === '1' || (disable || '').toLowerCase() === 'true'
}

function isPrereleaseVersion(value: string): boolean {
  return /-\w/.test(value)
}

function parseStableVersion(value: string): { major: number; minor: number; patch: number } | null {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value)
  if (!match) {
    return null
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  }
}

function stableVersionDistance(value: { major: number; minor: number; patch: number }): number {
  return value.major * 1_000_000 + value.minor * 1_000 + value.patch
}

function getCurrentVersionTag(): string {
  return app.getVersion()
}

function resolveUpdateStream(): 'public' | 'internal' {
  const stream = (process.env['ECHO_UPDATE_STREAM'] || process.env['ECHO_UPDATE_TARGET'] || 'public').toLowerCase()
  return stream === 'internal' ? 'internal' : 'public'
}

function getFallbackWindow(): MigrationFallbackWindow | null {
  return store.get(UPDATE_FALLBACK_COMPAT_KEY) as MigrationFallbackWindow | null
}

function supportsMigrationFallback(stableVersion: { major: number; minor: number; patch: number }): boolean {
  const marker = getFallbackWindow()
  if (!marker || !Number.isFinite(marker.anchorDistance)) {
    store.set(UPDATE_FALLBACK_COMPAT_KEY, {
      anchorVersion: getCurrentVersionTag(),
      anchorDistance: stableVersionDistance(stableVersion),
      establishedAt: new Date().toISOString()
    })
    return true
  }

  const currentDistance = stableVersionDistance(stableVersion)
  return currentDistance <= marker.anchorDistance + UPDATE_FALLBACK_STABLE_RELEASES
}

function resolveTargetChannel(): string {
  if (process.env['ECHO_UPDATE_CHANNEL']) {
    return process.env['ECHO_UPDATE_CHANNEL']
  }
  return isPrereleaseVersion(app.getVersion()) ? 'beta' : 'stable'
}

function resolveUpdateFeed(owner: string, repo: string): UpdateFeedConfig {
  return {
    provider: 'github',
    owner,
    repo,
    releaseType: 'release'
  }
}

function assertUpdateFeedConfig(stream: 'public' | 'internal', feed: UpdateFeedConfig): void {
  const owner = feed.owner.toLowerCase()
  const repo = feed.repo.toLowerCase()
  const expected =
    stream === 'internal'
      ? { owner: DEV_UPDATE_FEED_OWNER, repo: DEV_UPDATE_FEED_REPO }
      : { owner: DEV_PUBLIC_UPDATE_FEED_OWNER, repo: DEV_PUBLIC_UPDATE_FEED_REPO }

  if (owner !== expected.owner.toLowerCase() || repo !== expected.repo.toLowerCase()) {
    throw new Error(`Invalid ${stream} update feed: ${feed.owner}/${feed.repo}. Expected ${expected.owner}/${expected.repo}.`)
  }

  // Dev Studio now ships from one canonical public updater feed.
}

function buildUpdateFeedConfig(): UpdateFeedConfig {
  const stream = resolveUpdateStream()
  const feed =
    stream === 'internal'
      ? resolveUpdateFeed(DEV_UPDATE_FEED_OWNER, DEV_UPDATE_FEED_REPO)
      : getPublicUpdateFeedConfig()
  assertUpdateFeedConfig(stream, feed)
  return feed
}

function buildFallbackUpdateFeedConfig(): UpdateFeedConfig | null {
  return null
}

function getFallbackFeedIfAllowed(): UpdateFeedConfig | null {
  if (resolveUpdateStream() !== 'internal') {
    return null
  }

  const primary = buildUpdateFeedConfig()
  const fallback = buildFallbackUpdateFeedConfig()
  if (!fallback || (fallback.owner === primary.owner && fallback.repo === primary.repo)) {
    return null
  }

  const stableVersion = parseStableVersion(getCurrentVersionTag())
  if (!stableVersion) {
    return null
  }

  if (!supportsMigrationFallback(stableVersion)) {
    return null
  }

  return fallback
}

function getPublicUpdateFeedConfig(): UpdateFeedConfig {
  return resolveUpdateFeed(DEV_PUBLIC_UPDATE_FEED_OWNER, DEV_PUBLIC_UPDATE_FEED_REPO)
}

function setupAutoUpdater(window: BrowserWindow): void {
  if (isUpdateDisabled()) {
    window.webContents.send('update-status', { status: 'disabled', message: 'Update checks are disabled by policy.' })
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.channel = resolveTargetChannel()
  autoUpdater.allowPrerelease = isPrereleaseVersion(app.getVersion()) || (process.env['ECHO_UPDATE_ALLOW_PRERELEASE'] || '').toLowerCase() === 'true'
  const primaryFeed = buildUpdateFeedConfig()
  autoUpdater.setFeedURL(primaryFeed)

  autoUpdater.on('checking-for-update', () => {
    window.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    window.webContents.send('update-status', { status: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    window.webContents.send('update-status', { status: 'not-available' })
  })

  autoUpdater.on('download-progress', (progress) => {
    window.webContents.send('update-status', {
      status: 'downloading',
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    window.webContents.send('update-status', { status: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    log.warn('Auto-update failed on primary feed:', error)
    const fallback = getFallbackFeedIfAllowed()
    const errorMessage = (error as Error).message
    if (!fallback) {
      window.webContents.send('update-status', { status: 'error', message: errorMessage })
      return
    }

    const fallbackMarker = {
      from: `${primaryFeed.owner}/${primaryFeed.repo}`,
      to: `${fallback.owner}/${fallback.repo}`
    }

    log.warn(`Auto-update fallback from ${fallbackMarker.from} -> ${fallbackMarker.to} triggered for ${getCurrentVersionTag()}`)

    window.webContents.send('update-status', {
      status: 'fallback',
      message: `Primary feed unavailable, trying legacy feed ${fallbackMarker.to}.`,
      fallbackOwner: fallback.owner,
      fallbackRepo: fallback.repo
    })

    try {
      autoUpdater.setFeedURL(fallback)
      autoUpdater.checkForUpdates().catch((fallbackError: Error) => {
        window.webContents.send('update-status', {
          status: 'error',
          message: `Primary and fallback feeds failed: ${errorMessage}`,
          fallbackOwner: fallback.owner,
          fallbackRepo: fallback.repo,
          fallbackReason: fallbackError.message
        })
        log.warn('Auto-update fallback failed:', fallbackError.message)
      })
    } catch (fallbackError) {
      window.webContents.send('update-status', {
        status: 'error',
        message: `Primary and fallback feeds failed: ${errorMessage}`,
        fallbackOwner: fallback.owner,
        fallbackRepo: fallback.repo,
      })
      log.warn('Auto-update fallback setup failed:', fallbackError)
    }
  })

  ipcMain.on('update:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })

  void autoUpdater.checkForUpdatesAndNotify()
}

export function getDeveloperStudioPublicUpdateFeed(): { owner: string; repo: string } {
  const feed = getPublicUpdateFeedConfig()
  return { owner: feed.owner, repo: feed.repo }
}

ipcMain.handle('echo:get-update-feed', () => {
  const primary = buildUpdateFeedConfig()
  const fallback = buildFallbackUpdateFeedConfig()
  return {
    primary: {
      owner: primary.owner,
      repo: primary.repo,
    },
    fallback: fallback ? { owner: fallback.owner, repo: fallback.repo } : null,
    channel: resolveTargetChannel(),
    migrationFallbackWindow: {
      allowed: getFallbackFeedIfAllowed() !== null,
      anchor: getFallbackWindow()?.anchorVersion ?? null
    }
  }
})

// ── Helper: ensure audit file ──
function ensureAuditFile() {
  if (!fs.existsSync(AUDIT_PATH)) {
    fs.writeFileSync(AUDIT_PATH, '')
  }
}

// ── Window State ──
function getWindowState() {
  const saved = store.get('windowState') as StudioStore['windowState']
  const display = screen.getPrimaryDisplay().workAreaSize
  const width = Math.min(saved?.width || 1600, display.width)
  const height = Math.min(saved?.height || 1000, display.height)
  return {
    width,
    height,
    x: saved?.x,
    y: saved?.y,
    maximized: saved?.maximized || false,
  }
}

function saveWindowState(win: BrowserWindow) {
  const bounds = win.getBounds()
  store.set('windowState', {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    maximized: win.isMaximized(),
  })
}

// ── Window ──
function createWindow() {
  const state = getWindowState()
  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    minWidth: 1280,
    minHeight: 800,
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (state.maximized) mainWindow.maximize()
  mainWindow.once('ready-to-show', () => { mainWindow?.show() })

  mainWindow.on('close', () => {
    if (mainWindow) saveWindowState(mainWindow)
  })

  mainWindow.on('closed', () => { mainWindow = null })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  }
}

  app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    if (process.env.NODE_ENV !== 'development') {
      const mainWindowInstance = BrowserWindow.getAllWindows()[0]
      if (mainWindowInstance) {
        setupAutoUpdater(mainWindowInstance)
      }
    }
  })

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC: Version ──
ipcMain.handle('echo:get-version', () => app.getVersion())

// ── IPC: File System ──
ipcMain.handle('echo:fs-read', async (_event: any, filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch (e) {
    throw new Error(`Failed to read ${filePath}: ${(e as Error).message}`)
  }
})

ipcMain.handle('echo:fs-read-json', async (_event: any, filePath: string) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (e) {
    throw new Error(`Failed to read JSON ${filePath}: ${(e as Error).message}`)
  }
})

ipcMain.handle('echo:fs-write', async (_event: any, filePath: string, data: string) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, data, 'utf-8')
  } catch (e) {
    throw new Error(`Failed to write ${filePath}: ${(e as Error).message}`)
  }
})

ipcMain.handle('echo:fs-exists', async (_event: any, filePath: string) => {
  return fs.existsSync(filePath)
})

ipcMain.handle('echo:fs-list-dir', async (_event: any, dirPath: string) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
  } catch {
    return []
  }
})

// ── IPC: Dialog ──
ipcMain.handle('echo:select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select ECHO Platform Workspace',
  })
  return result.canceled ? null : result.filePaths[0]
})

// ── IPC: Store ──
ipcMain.handle('echo:store-get', async (_event: any, key: string) => {
  return store.get(key)
})

ipcMain.handle('echo:store-set', async (_event: any, key: string, value: unknown) => {
  store.set(key, value)
})

ipcMain.handle('echo:store-clear', async () => {
  store.clear()
})

// ── IPC: Workspace Scan ──
ipcMain.handle('echo:scan-workspace', async (_event: any, dirPath: string) => {
  const result = {
    path: dirPath,
    modules: [] as any[],
    addons: [] as any[],
    experiences: [] as any[],
  }

  const scanDir = (subPath: string, type: 'module' | 'addon' | 'experience') => {
    const fullPath = path.join(dirPath, subPath)
    if (!fs.existsSync(fullPath)) return
    const entries = fs.readdirSync(fullPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const itemPath = path.join(fullPath, entry.name)
      const manifestPath = path.join(itemPath, 'manifest.json')
      const buildDir = path.join(itemPath, 'build', 'libs')
      const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) : null
      const hasBuild = fs.existsSync(buildDir) && fs.readdirSync(buildDir).some((f) => f.endsWith('.jar'))

      // Native readiness scan: look for net.neoforged imports in src/
      let nativeReadiness = 0
      const srcDir = path.join(itemPath, 'src')
      if (fs.existsSync(srcDir)) {
        const javaFiles: string[] = []
        const walk = (dir: string) => {
          for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
            if (f.isDirectory()) walk(path.join(dir, f.name))
            else if (f.name.endsWith('.java')) javaFiles.push(path.join(dir, f.name))
          }
        }
        try { walk(srcDir) } catch {}
        let neoforgeCount = 0
        let totalCount = 0
        for (const file of javaFiles.slice(0, 200)) {
          try {
            const content = fs.readFileSync(file, 'utf-8')
            totalCount++
            if (content.includes('net.neoforged') || content.includes('net.minecraft')) neoforgeCount++
          } catch {}
        }
        nativeReadiness = totalCount === 0 ? 0 : Math.max(0, Math.round((1 - neoforgeCount / totalCount) * 100))
      }

      // Count open issues from .github/issues.json or local
      let openIssues = 0
      const issuesPath = path.join(itemPath, '.github', 'issues.json')
      if (fs.existsSync(issuesPath)) {
        try {
          const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'))
          openIssues = Array.isArray(issues) ? issues.filter((i: any) => i.state === 'open').length : 0
        } catch {}
      }

      const item = {
        id: manifest?.id || entry.name,
        name: manifest?.name || entry.name,
        version: manifest?.version || '0.0.0',
        owner: manifest?.publisher?.name || 'ECHO Labs',
        status: hasBuild ? 'healthy' : openIssues > 10 ? 'blocker' : openIssues > 0 ? 'warning' : 'healthy',
        buildResult: hasBuild ? 'passing' : 'failing',
        dependencies: manifest?.dependencies || [],
        apiStability: manifest?.apiStability || Math.floor(Math.random() * 30) + 70,
        nativeReadiness,
        testCoverage: manifest?.testCoverage || Math.floor(Math.random() * 40) + 50,
        openIssues,
        lastCommit: 'recent',
        releaseChannel: manifest?.releaseChannel || 'stable',
        path: itemPath,
      }

      if (type === 'module') result.modules.push(item)
      else if (type === 'addon') result.addons.push(item)
      else result.experiences.push(item)
    }
  }

  scanDir('core', 'module')
  scanDir('official-addons', 'addon')
  scanDir('experiences', 'experience')
  // Also scan systems/ for core modules
  scanDir('systems', 'module')

  return result
})

// ── IPC: File Watcher ──
let watcher: ReturnType<typeof watch> | null = null

ipcMain.handle('echo:watch-workspace', async (_event: any, dirPath: string) => {
  if (watcher) { await watcher.close(); watcher = null }
  if (!dirPath || !fs.existsSync(dirPath)) return false

  watcher = watch(dirPath, {
    ignored: /(^|[\/\\])\..|node_modules|\.gradle|build/,
    persistent: true,
    ignoreInitial: true,
  })

  watcher.on('all', (event: string, filePath: string) => {
    if (!mainWindow) return
    mainWindow.webContents.send('echo:workspace-changed', { event, path: filePath })
  })

  return true
})

ipcMain.handle('echo:unwatch-workspace', async () => {
  if (watcher) { await watcher.close(); watcher = null }
  return true
})

// ── IPC: Audit Log ──
ipcMain.handle('echo:audit-append', async (_event: any, entry: Record<string, unknown>) => {
  ensureAuditFile()
  const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n'
  fs.appendFileSync(AUDIT_PATH, line)
})

ipcMain.handle('echo:audit-read', async () => {
  ensureAuditFile()
  const raw = fs.readFileSync(AUDIT_PATH, 'utf-8')
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line) } catch { return null }
    })
    .filter(Boolean)
    .reverse()
})

// ── IPC: Shell Execution ──
const activeProcesses = new Map<string, ReturnType<typeof spawn>>()

ipcMain.handle('echo:exec', async (_event: any, command: string, cwd?: string) => {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, cwd: cwd || process.cwd(), env: process.env })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (data) => { stdout += data.toString() })
    child.stderr?.on('data', (data) => { stderr += data.toString() })
    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode: exitCode ?? 0 })
    })
  })
})

ipcMain.handle('echo:exec-stream', async (_event: any, command: string, cwd?: string) => {
  const id = crypto.randomUUID()
  const child = spawn(command, { shell: true, cwd: cwd || process.cwd(), env: process.env })
  activeProcesses.set(id, child)

  child.stdout?.on('data', (data) => {
    if (mainWindow) mainWindow.webContents.send('echo:exec-output', { id, type: 'stdout', data: data.toString() })
  })
  child.stderr?.on('data', (data) => {
    if (mainWindow) mainWindow.webContents.send('echo:exec-output', { id, type: 'stderr', data: data.toString() })
  })
  child.on('close', (exitCode) => {
    activeProcesses.delete(id)
    if (mainWindow) mainWindow.webContents.send('echo:exec-output', { id, type: 'close', exitCode })
  })

  return id
})

ipcMain.handle('echo:exec-kill', async (_event: any, id: string) => {
  const proc = activeProcesses.get(id)
  if (proc) {
    proc.kill('SIGTERM')
    activeProcesses.delete(id)
  }
})

// ── IPC: Open External ──
ipcMain.handle('echo:open-external', async (_event: any, url: string) => {
  await shell.openExternal(url)
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 1: WORKSPACE DATA HELPERS
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('echo:read-manifest', async (_event: any, modulePath: string) => {
  const manifestPath = path.join(modulePath, 'manifest.json')
  if (!fs.existsSync(manifestPath)) return null
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) } catch { return null }
})

ipcMain.handle('echo:read-gradle-build', async (_event: any, modulePath: string) => {
  return readGradleBuild(modulePath)
})

ipcMain.handle('echo:run-gradle-task', async (_event: any, modulePath: string, tasks: string[]) => {
  return new Promise((resolve) => {
    runGradleTask(modulePath, tasks, () => {}, () => {}, (code) => {
      resolve({ exitCode: code })
    })
  })
})

ipcMain.handle('echo:get-git-status', async (_event: any, modulePath: string) => {
  return getGitInfo(modulePath)
})

ipcMain.handle('echo:read-crash-report', async (_event: any, crashPath: string) => {
  return parseCrashReport(crashPath)
})

ipcMain.handle('echo:list-releases', async (_event: any, workspacePath: string) => {
  const releasesDir = path.join(workspacePath, 'releases')
  if (!fs.existsSync(releasesDir)) return []
  return fs.readdirSync(releasesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ name: e.name, path: path.join(releasesDir, e.name) }))
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 2: GIT INTEGRATION
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('echo:git-log', async (_event: any, modulePath: string, limit = 20) => {
  return getGitLog(modulePath, limit)
})

ipcMain.handle('echo:git-branch', async (_event: any, modulePath: string) => {
  return getGitInfo(modulePath).branch
})

ipcMain.handle('echo:git-diff', async (_event: any, modulePath: string, commit?: string) => {
  return getGitDiff(modulePath, commit)
})

ipcMain.handle('echo:git-remote-url', async (_event: any, modulePath: string) => {
  return getGitInfo(modulePath).remoteUrl
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 3: BUILD SYSTEM
// ═══════════════════════════════════════════════════════════════

const gradleProcesses = new Map<string, ReturnType<typeof spawn>>()

ipcMain.handle('echo:gradle-build', async (_event: any, modulePath: string, tasks: string[]) => {
  const id = crypto.randomUUID()
  return new Promise((resolve) => {
    const child = runGradleTask(modulePath, tasks, (line) => {
      if (mainWindow) mainWindow.webContents.send('echo:build-output', { id, type: 'stdout', line })
    }, (line) => {
      if (mainWindow) mainWindow.webContents.send('echo:build-output', { id, type: 'stderr', line })
    }, (code) => {
      gradleProcesses.delete(id)
      if (mainWindow) mainWindow.webContents.send('echo:build-output', { id, type: 'close', exitCode: code })
      resolve({ id, exitCode: code })
    })
    gradleProcesses.set(id, child)
  })
})

ipcMain.handle('echo:gradle-test', async (_event: any, modulePath: string) => {
  const id = crypto.randomUUID()
  return new Promise((resolve) => {
    const child = runGradleTask(modulePath, ['test'], (line) => {
      if (mainWindow) mainWindow.webContents.send('echo:build-output', { id, type: 'stdout', line })
    }, (line) => {
      if (mainWindow) mainWindow.webContents.send('echo:build-output', { id, type: 'stderr', line })
    }, (code) => {
      gradleProcesses.delete(id)
      if (mainWindow) mainWindow.webContents.send('echo:build-output', { id, type: 'close', exitCode: code })
      resolve({ id, exitCode: code })
    })
    gradleProcesses.set(id, child)
  })
})

ipcMain.handle('echo:read-test-results', async (_event: any, modulePath: string) => {
  return readTestResults(modulePath)
})

ipcMain.handle('echo:find-artifacts', async (_event: any, modulePath: string) => {
  return findArtifacts(modulePath)
})

ipcMain.handle('echo:check-gradle-wrapper', async (_event: any, modulePath: string) => {
  const hasWrapper = fs.existsSync(path.join(modulePath, 'gradlew')) || fs.existsSync(path.join(modulePath, 'gradlew.bat'))
  return { hasWrapper }
})

ipcMain.handle('echo:kill-build', async (_event: any, id: string) => {
  const proc = gradleProcesses.get(id)
  if (proc) { proc.kill('SIGTERM'); gradleProcesses.delete(id) }
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 4: GITHUB INTEGRATION
// ═══════════════════════════════════════════════════════════════

const githubCache = new Map<string, { data: unknown; ts: number }>()
const GITHUB_CACHE_TTL = 5 * 60 * 1000

function getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = githubCache.get(key)
  if (cached && Date.now() - cached.ts < GITHUB_CACHE_TTL) return Promise.resolve(cached.data as T)
  return fetcher().then((data) => { githubCache.set(key, { data, ts: Date.now() }); return data })
}

ipcMain.handle('echo:github-issues', async (_event: any, repo: string, state: 'open' | 'closed' | 'all' = 'open') => {
  const token = store.get('githubToken') as string | undefined
  return getCached(`issues:${repo}:${state}`, () => getIssues(repo, state, token))
})

ipcMain.handle('echo:github-prs', async (_event: any, repo: string, state: 'open' | 'closed' | 'all' = 'open') => {
  const token = store.get('githubToken') as string | undefined
  return getCached(`prs:${repo}:${state}`, () => getPRs(repo, state, token))
})

ipcMain.handle('echo:github-ci-status', async (_event: any, repo: string, ref: string) => {
  const token = store.get('githubToken') as string | undefined
  return getCached(`ci:${repo}:${ref}`, () => getCIStatus(repo, ref, token))
})

ipcMain.handle('echo:github-create-issue', async (_event: any, repo: string, title: string, body: string, labels: string[]) => {
  const token = store.get('githubToken') as string | undefined
  return createIssue(repo, title, body, labels, token)
})

ipcMain.handle('echo:github-comment', async (_event: any, repo: string, issue: number, body: string) => {
  const token = store.get('githubToken') as string | undefined
  return createComment(repo, issue, body, token)
})

ipcMain.handle('echo:github-clear-cache', async () => {
  githubCache.clear()
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 5: AI AGENT ENGINE
// ═══════════════════════════════════════════════════════════════

interface AgentTask {
  id: string
  agentId: string
  goal: string
  status: 'idle' | 'running' | 'error' | 'completed'
  output: string[]
  startTime?: string
  endTime?: string
}

const agents = new Map<string, AgentTask>()

ipcMain.handle('echo:agent-start', async (_event: any, agentId: string, goal: string, context: Record<string, unknown>) => {
  const id = crypto.randomUUID()
  const task: AgentTask = { id, agentId, goal, status: 'running', output: [], startTime: new Date().toISOString() }
  agents.set(id, task)

  // Simulated agent execution — in production this calls an LLM API
  setTimeout(() => {
    task.output.push(`Agent ${agentId} started: ${goal}`)
    task.output.push(`Context: ${JSON.stringify(context).slice(0, 200)}...`)
    task.output.push('Analyzing workspace...')
    if (mainWindow) mainWindow.webContents.send('echo:agent-output', { id, line: `Agent ${agentId} analyzing...` })

    setTimeout(() => {
      task.status = 'completed'
      task.endTime = new Date().toISOString()
      task.output.push('Task completed successfully.')
      if (mainWindow) mainWindow.webContents.send('echo:agent-output', { id, line: 'Task completed.' })
    }, 5000)
  }, 500)

  return id
})

ipcMain.handle('echo:agent-stop', async (_event: any, id: string) => {
  const task = agents.get(id)
  if (task) { task.status = 'error'; task.endTime = new Date().toISOString(); task.output.push('Stopped by user.') }
})

ipcMain.handle('echo:agent-status', async (_event: any, id?: string) => {
  if (id) return agents.get(id) || null
  return Array.from(agents.values())
})

ipcMain.handle('echo:agent-clear', async (_event: any) => {
  agents.clear()
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 6: DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('echo:find-crash-reports', async (_event: any, workspacePath: string) => {
  return findCrashReports(workspacePath)
})

ipcMain.handle('echo:analyze-support-bundle', async (_event: any, bundleJson: string) => {
  try {
    const bundle = JSON.parse(bundleJson)
    const issues: string[] = []
    const modList = bundle.modList || []
    const echoMods = modList.filter((m: any) => m.modId?.toLowerCase().includes('echo'))
    const externalMods = modList.filter((m: any) => !m.modId?.toLowerCase().includes('echo'))

    if (echoMods.length === 0) issues.push('No ECHO modules detected in support bundle.')
    if (externalMods.length > 50) issues.push('High external mod count may indicate conflicts.')

    return {
      modCount: modList.length,
      echoModCount: echoMods.length,
      externalModCount: externalMods.length,
      issues,
      systemInfo: bundle.systemInfo || {},
    }
  } catch {
    return { error: 'Invalid support bundle JSON' }
  }
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 7: RELEASE PIPELINE
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('echo:generate-changelog', async (_event: any, modulePath: string, sinceTag?: string) => {
  const range = sinceTag ? `${sinceTag}..HEAD` : '-20'
  const log = getGitLog(modulePath, 50)
  let lines = log.map((c) => `- ${c.message} (${c.hash.slice(0, 7)})`).join('\n')
  if (sinceTag) {
    lines = `## Changes since ${sinceTag}\n\n${lines}`
  }
  return lines
})

ipcMain.handle('echo:bump-version', async (_event: any, modulePath: string, newVersion: string) => {
  const manifestPath = path.join(modulePath, 'manifest.json')
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    manifest.version = newVersion
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  }
  const buildFile = path.join(modulePath, 'build.gradle')
  if (fs.existsSync(buildFile)) {
    let content = fs.readFileSync(buildFile, 'utf-8')
    content = content.replace(/version\s*=\s*['"][^'"]+['"]/, `version = '${newVersion}'`)
    fs.writeFileSync(buildFile, content)
  }
  return { success: true, version: newVersion }
})

ipcMain.handle('echo:sign-artifact', async (_event: any, jarPath: string, keyPath: string) => {
  return new Promise((resolve) => {
    const child = spawn('jarsigner', ['-keystore', keyPath, jarPath, 'echolabs'], { shell: true })
    let stdout = '', stderr = ''
    child.stdout?.on('data', (d) => { stdout += d.toString() })
    child.stderr?.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => {
      resolve({ success: code === 0, stdout, stderr })
    })
  })
})

ipcMain.handle('echo:package-experience', async (_event: any, expPath: string, outDir: string) => {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const expName = path.basename(expPath)
  const outFile = path.join(outDir, `${expName}.zip`)
  // Use system zip command
  const zipCmd = process.platform === 'win32'
    ? `powershell -Command "Compress-Archive -Path '${expPath}/*' -DestinationPath '${outFile}' -Force"`
    : `cd "${expPath}" && zip -r "${outFile}" .`

  return new Promise((resolve) => {
    const child = spawn(zipCmd, { shell: true })
    child.on('close', (code) => {
      resolve({ success: code === 0, path: outFile })
    })
  })
})

ipcMain.handle('echo:publish-release', async (_event: any, repo: string, tag: string, assetPaths: string[], draft = true) => {
  const token = store.get('githubToken') as string | undefined
  if (!token) return { error: 'No GitHub token configured' }
  try {
    const release = await apiRequest<{ id: number; upload_url: string }>(`https://api.github.com/repos/${repo}/releases`, token, 'POST', JSON.stringify({ tag_name: tag, draft, name: tag }))
    return { success: true, releaseId: release.id, uploadUrl: release.upload_url }
  } catch (e: any) {
    return { error: e.message }
  }
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 8: AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('echo:auth-hash-passphrase', async (_event: any, passphrase: string) => {
  return hashPassphrase(passphrase)
})

ipcMain.handle('echo:auth-verify-passphrase', async (_event: any, passphrase: string) => {
  const stored = store.get('passphraseHash') as string | undefined
  if (!stored) return { valid: false, error: 'No passphrase set' }
  return { valid: verifyPassphrase(passphrase, stored) }
})

ipcMain.handle('echo:auth-generate-invite', async (_event: any, role: string) => {
  const code = generateInviteCode()
  const invites = (store.get('roleInvites') as any[] || [])
  invites.push({ code, role, used: false, createdAt: new Date().toISOString() })
  store.set('roleInvites', invites)
  return { code }
})

ipcMain.handle('echo:auth-redeem-invite', async (_event: any, code: string) => {
  const invites = (store.get('roleInvites') as any[] || [])
  const invite = invites.find((i) => i.code === code && !i.used)
  if (!invite) return { valid: false, error: 'Invalid or used invite code' }
  invite.used = true
  invite.usedAt = new Date().toISOString()
  store.set('roleInvites', invites)
  return { valid: true, role: invite.role }
})

// ═══════════════════════════════════════════════════════════════
//  PHASE 9: SETTINGS & NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

ipcMain.handle('echo:show-notification', async (_event: any, title: string, body: string) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

// Helper re-export for publish-release
function apiRequest<T>(url: string, token?: string, method = 'GET', body?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const https = require('https')
    const options = {
      method,
      headers: {
        'User-Agent': 'ECHO-Developer-Studio',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
    }
    const req = https.request(url, options, (res: any) => {
      let data = ''
      res.on('data', (chunk: string) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`))
          } else {
            resolve(parsed as T)
          }
        } catch {
          reject(new Error(`Invalid JSON: ${data.slice(0, 200)}`))
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}
