# ECHO Developer Studio — Agent Notes

## Build
- `npm run build:electron` — clean build of main + renderer
- `npm run dist` — build + package with electron-builder
- Main process: `vite.main.config.ts` -> `dist/main.cjs`
- Renderer: `vite.config.ts` -> `dist/renderer/`
- Preload: tsc -> `dist/preload.js`
- Clean output: stray `dist/lib/` and `dist/main.js` from tsc are auto-removed

## Dev
- `npm run dev:win` — Vite dev server + Electron (Windows, recommended)
- `npm run dev` — cross-platform variant

## Known Environment Gotcha
If `ELECTRON_RUN_AS_NODE` is set in the environment, `require("electron")` returns a path string instead of the Electron API, causing `TypeError: Cannot read properties of undefined (reading 'whenReady')`. The `dev` and `dev:win` scripts now explicitly clear this variable before launching Electron.

## IPC Architecture (Production-Ready)
All phases are implemented. New handlers are organized by phase in `src/main.ts`:

### Phase 1: Data Foundation
- `echo:read-manifest` — parse manifest.json
- `echo:read-gradle-build` — parse build.gradle for version/group
- `echo:run-gradle-task` — generic gradle wrapper executor
- `echo:get-git-status` — git status for a module path
- `echo:read-crash-report` — parse crash-*.txt files
- `echo:list-releases` — scan releases/ directory

### Phase 2: Git Integration
- `echo:git-log` — commit history
- `echo:git-branch` — current branch
- `echo:git-diff` — diff stats
- `echo:git-remote-url` — origin URL

### Phase 3: Build System
- `echo:gradle-build` — run gradle tasks with streaming output
- `echo:gradle-test` — run tests with streaming output
- `echo:read-test-results` — parse JUnit XML
- `echo:find-artifacts` — list build/libs/*.jar
- `echo:check-gradle-wrapper` — verify gradlew exists
- `echo:kill-build` — terminate a running build

### Phase 4: GitHub Integration
- `echo:github-issues` — fetch issues (cached 5 min)
- `echo:github-prs` — fetch PRs (cached 5 min)
- `echo:github-ci-status` — fetch CI status (cached 5 min)
- `echo:github-create-issue` — create issue via API
- `echo:github-comment` — post comment
- `echo:github-clear-cache` — bust cache

### Phase 5: AI Agent Engine
- `echo:agent-start` — spawn agent with goal + context
- `echo:agent-stop` — kill agent
- `echo:agent-status` — get task status
- `echo:agent-clear` — clear all tasks
- Events: `echo:agent-output` streams agent progress

### Phase 6: Diagnostics
- `echo:find-crash-reports` — discover crash files
- `echo:analyze-support-bundle` — parse player support JSON

### Phase 7: Release Pipeline
- `echo:generate-changelog` — git log since tag
- `echo:bump-version` — update manifest.json + build.gradle
- `echo:sign-artifact` — jarsigner wrapper
- `echo:package-experience` — ZIP packaging
- `echo:publish-release` — GitHub Releases API (draft)

### Phase 8: Authentication
- `echo:auth-hash-passphrase` — pbkdf2 hash
- `echo:auth-verify-passphrase` — verify hash
- `echo:auth-generate-invite` — create invite code
- `echo:auth-redeem-invite` — validate invite code

### Phase 9: Settings & Notifications
- `echo:show-notification` — OS desktop notification

## Utility Files
- `src/lib/git.ts` — Git command wrappers
- `src/lib/gradle.ts` — Gradle helpers + JUnit XML parser
- `src/lib/github.ts` — GitHub REST API client
- `src/lib/crashParser.ts` — Minecraft crash report parser
- `src/lib/authCrypto.ts` — pbkdf2 passphrase hashing

## Components
- `GitStatusBadge` — shows branch + ahead/behind + dirty indicator
- `ErrorBoundary` — wraps every route, catches renderer crashes

## Keyboard Shortcuts
- `Ctrl+1` — Mission Control
- `Ctrl+2` — Platform Stack
- `Ctrl+3` — Core Modules
- `Ctrl+R` — Rescan workspace
- `Ctrl+Shift+T` — Terminal
- `Ctrl+B` — Core Modules (build shortcut)

## Polish
- **Window state persistence** — size, position, and maximized state saved to `electron-store`, restored on launch
- **electron-log** — structured logging to file (`%appdata%/echo-developer-studio/logs/`), console silenced in production
- **electron-updater** — auto-checks for GitHub releases on startup (silent in dev)
- **Error boundaries** — every route wrapped; crashes show reload UI instead of blank screen
- **Clean build output** — `npm run build:electron` deletes stray tsc artifacts automatically
- **No console.log** in production paths (boundary + diagnostics cleaned)

## Removed
- `src/data/modules.ts` — all static mock data deleted
- All page files now use live `scan` data or IPC with empty-state fallbacks
