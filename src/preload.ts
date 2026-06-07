import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Version
  getVersion: () => ipcRenderer.invoke('echo:get-version'),

  // File System
  fsRead: (filePath: string) => ipcRenderer.invoke('echo:fs-read', filePath),
  fsReadJson: (filePath: string) => ipcRenderer.invoke('echo:fs-read-json', filePath),
  fsWrite: (filePath: string, data: string) => ipcRenderer.invoke('echo:fs-write', filePath, data),
  fsExists: (filePath: string) => ipcRenderer.invoke('echo:fs-exists', filePath),
  fsListDir: (dirPath: string) => ipcRenderer.invoke('echo:fs-list-dir', dirPath),

  // Dialog
  selectFolder: () => ipcRenderer.invoke('echo:select-folder'),

  // Store
  storeGet: (key: string) => ipcRenderer.invoke('echo:store-get', key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('echo:store-set', key, value),
  storeClear: () => ipcRenderer.invoke('echo:store-clear'),

  // Workspace
  scanWorkspace: (dirPath: string) => ipcRenderer.invoke('echo:scan-workspace', dirPath),
  watchWorkspace: (dirPath: string) => ipcRenderer.invoke('echo:watch-workspace', dirPath),
  unwatchWorkspace: () => ipcRenderer.invoke('echo:unwatch-workspace'),
  readManifest: (modulePath: string) => ipcRenderer.invoke('echo:read-manifest', modulePath),
  readGradleBuild: (modulePath: string) => ipcRenderer.invoke('echo:read-gradle-build', modulePath),
  runGradleTask: (modulePath: string, tasks: string[]) => ipcRenderer.invoke('echo:run-gradle-task', modulePath, tasks),
  getGitStatus: (modulePath: string) => ipcRenderer.invoke('echo:get-git-status', modulePath),
  readCrashReport: (crashPath: string) => ipcRenderer.invoke('echo:read-crash-report', crashPath),
  listReleases: (workspacePath: string) => ipcRenderer.invoke('echo:list-releases', workspacePath),

  // Audit
  auditAppend: (entry: Record<string, unknown>) => ipcRenderer.invoke('echo:audit-append', entry),
  auditRead: () => ipcRenderer.invoke('echo:audit-read'),

  // Execution
  execCommand: (command: string, cwd?: string) => ipcRenderer.invoke('echo:exec', command, cwd),
  execStream: (command: string, cwd?: string) => ipcRenderer.invoke('echo:exec-stream', command, cwd),
  execKill: (id: string) => ipcRenderer.invoke('echo:exec-kill', id),

  // Git
  gitLog: (modulePath: string, limit?: number) => ipcRenderer.invoke('echo:git-log', modulePath, limit),
  gitBranch: (modulePath: string) => ipcRenderer.invoke('echo:git-branch', modulePath),
  gitDiff: (modulePath: string, commit?: string) => ipcRenderer.invoke('echo:git-diff', modulePath, commit),
  gitRemoteUrl: (modulePath: string) => ipcRenderer.invoke('echo:git-remote-url', modulePath),

  // Build
  gradleBuild: (modulePath: string, tasks: string[]) => ipcRenderer.invoke('echo:gradle-build', modulePath, tasks),
  gradleTest: (modulePath: string) => ipcRenderer.invoke('echo:gradle-test', modulePath),
  readTestResults: (modulePath: string) => ipcRenderer.invoke('echo:read-test-results', modulePath),
  findArtifacts: (modulePath: string) => ipcRenderer.invoke('echo:find-artifacts', modulePath),
  checkGradleWrapper: (modulePath: string) => ipcRenderer.invoke('echo:check-gradle-wrapper', modulePath),
  killBuild: (id: string) => ipcRenderer.invoke('echo:kill-build', id),

  // GitHub
  githubIssues: (repo: string, state?: 'open' | 'closed' | 'all') => ipcRenderer.invoke('echo:github-issues', repo, state),
  githubPRs: (repo: string, state?: 'open' | 'closed' | 'all') => ipcRenderer.invoke('echo:github-prs', repo, state),
  githubCIStatus: (repo: string, ref: string) => ipcRenderer.invoke('echo:github-ci-status', repo, ref),
  githubCreateIssue: (repo: string, title: string, body: string, labels: string[]) => ipcRenderer.invoke('echo:github-create-issue', repo, title, body, labels),
  githubComment: (repo: string, issue: number, body: string) => ipcRenderer.invoke('echo:github-comment', repo, issue, body),
  githubClearCache: () => ipcRenderer.invoke('echo:github-clear-cache'),

  // Agents
  agentStart: (agentId: string, goal: string, context: Record<string, unknown>) => ipcRenderer.invoke('echo:agent-start', agentId, goal, context),
  agentStop: (id: string) => ipcRenderer.invoke('echo:agent-stop', id),
  agentStatus: (id?: string) => ipcRenderer.invoke('echo:agent-status', id),
  agentClear: () => ipcRenderer.invoke('echo:agent-clear'),

  // Diagnostics
  findCrashReports: (workspacePath: string) => ipcRenderer.invoke('echo:find-crash-reports', workspacePath),
  analyzeSupportBundle: (bundleJson: string) => ipcRenderer.invoke('echo:analyze-support-bundle', bundleJson),

  // Release
  generateChangelog: (modulePath: string, sinceTag?: string) => ipcRenderer.invoke('echo:generate-changelog', modulePath, sinceTag),
  bumpVersion: (modulePath: string, newVersion: string) => ipcRenderer.invoke('echo:bump-version', modulePath, newVersion),
  signArtifact: (jarPath: string, keyPath: string) => ipcRenderer.invoke('echo:sign-artifact', jarPath, keyPath),
  packageExperience: (expPath: string, outDir: string) => ipcRenderer.invoke('echo:package-experience', expPath, outDir),
  publishRelease: (repo: string, tag: string, assetPaths: string[], draft?: boolean) => ipcRenderer.invoke('echo:publish-release', repo, tag, assetPaths, draft),

  // Auth
  authHashPassphrase: (passphrase: string) => ipcRenderer.invoke('echo:auth-hash-passphrase', passphrase),
  authVerifyPassphrase: (passphrase: string) => ipcRenderer.invoke('echo:auth-verify-passphrase', passphrase),
  authGenerateInvite: (role: string) => ipcRenderer.invoke('echo:auth-generate-invite', role),
  authRedeemInvite: (code: string) => ipcRenderer.invoke('echo:auth-redeem-invite', code),

  // Settings / Notifications
  showNotification: (title: string, body: string) => ipcRenderer.invoke('echo:show-notification', title, body),

  // External
  openExternal: (url: string) => ipcRenderer.invoke('echo:open-external', url),

  // Listeners
  onWorkspaceChange: (callback: (event: any, data: { event: string; path: string }) => void) => {
    ipcRenderer.on('echo:workspace-changed', callback)
    return () => ipcRenderer.removeListener('echo:workspace-changed', callback)
  },
  onExecOutput: (callback: (event: any, data: { id: string; type: string; data?: string; exitCode?: number }) => void) => {
    ipcRenderer.on('echo:exec-output', callback)
    return () => ipcRenderer.removeListener('echo:exec-output', callback)
  },
  onBuildOutput: (callback: (event: any, data: { id: string; type: string; line?: string; exitCode?: number }) => void) => {
    ipcRenderer.on('echo:build-output', callback)
    return () => ipcRenderer.removeListener('echo:build-output', callback)
  },
  onAgentOutput: (callback: (event: any, data: { id: string; line: string }) => void) => {
    ipcRenderer.on('echo:agent-output', callback)
    return () => ipcRenderer.removeListener('echo:agent-output', callback)
  },
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
}

contextBridge.exposeInMainWorld('echoAPI', api)

export type EchoAPI = typeof api
