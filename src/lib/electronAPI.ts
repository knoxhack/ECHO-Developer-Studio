import type { EchoAPI } from '../preload'

const api: EchoAPI = (typeof window !== 'undefined' && (window as any).echoAPI) ? (window as any).echoAPI : {} as EchoAPI

export default api

// Typed wrappers for convenience
export const fsRead = async (filePath: string): Promise<string> => api.fsRead(filePath)
export const fsReadJson = async (filePath: string): Promise<unknown> => api.fsReadJson(filePath)
export const fsWrite = async (filePath: string, data: string): Promise<void> => api.fsWrite(filePath, data)
export const fsExists = async (filePath: string): Promise<boolean> => api.fsExists(filePath)
export const fsListDir = async (dirPath: string): Promise<{ name: string; isDirectory: boolean }[]> => api.fsListDir(dirPath)
export const execCommand = async (command: string, cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> => api.execCommand(command, cwd)
export const execStream = async (command: string, cwd?: string): Promise<string> => api.execStream(command, cwd)
export const selectFolder = async (): Promise<string | null> => api.selectFolder()
export const scanWorkspace = async (dirPath: string): Promise<unknown> => api.scanWorkspace(dirPath)
export const storeGet = async <T>(key: string): Promise<T | undefined> => api.storeGet(key)
export const storeSet = async <T>(key: string, value: T): Promise<void> => api.storeSet(key, value)
export const storeClear = async (): Promise<void> => api.storeClear()
export const auditAppend = async (entry: Record<string, unknown>): Promise<void> => api.auditAppend(entry)
export const auditRead = async (): Promise<unknown[]> => api.auditRead()
export const getVersion = async (): Promise<string> => api.getVersion()
export const openExternal = async (url: string): Promise<void> => api.openExternal(url)

// Workspace
export const readManifest = async (modulePath: string): Promise<unknown | null> => api.readManifest(modulePath)
export const readGradleBuild = async (modulePath: string): Promise<unknown> => api.readGradleBuild(modulePath)
export const runGradleTask = async (modulePath: string, tasks: string[]): Promise<{ exitCode: number }> => api.runGradleTask(modulePath, tasks)
export const getGitStatus = async (modulePath: string): Promise<unknown> => api.getGitStatus(modulePath)
export const readCrashReport = async (crashPath: string): Promise<unknown | null> => api.readCrashReport(crashPath)
export const listReleases = async (workspacePath: string): Promise<Array<{ name: string; path: string }>> => api.listReleases(workspacePath)

// Git
export const gitLog = async (modulePath: string, limit?: number): Promise<Array<{ hash: string; message: string; date: string; author: string }>> => api.gitLog(modulePath, limit)
export const gitBranch = async (modulePath: string): Promise<string> => api.gitBranch(modulePath)
export const gitDiff = async (modulePath: string, commit?: string): Promise<string> => api.gitDiff(modulePath, commit)
export const gitRemoteUrl = async (modulePath: string): Promise<string> => api.gitRemoteUrl(modulePath)

// Build
export const gradleBuild = async (modulePath: string, tasks: string[]): Promise<{ id: string; exitCode: number }> => api.gradleBuild(modulePath, tasks)
export const gradleTest = async (modulePath: string): Promise<{ id: string; exitCode: number }> => api.gradleTest(modulePath)
export const readTestResults = async (modulePath: string): Promise<unknown | null> => api.readTestResults(modulePath)
export const findArtifacts = async (modulePath: string): Promise<string[]> => api.findArtifacts(modulePath)
export const checkGradleWrapper = async (modulePath: string): Promise<{ hasWrapper: boolean }> => api.checkGradleWrapper(modulePath)
export const killBuild = async (id: string): Promise<void> => api.killBuild(id)

// GitHub
export const githubIssues = async (repo: string, state?: 'open' | 'closed' | 'all'): Promise<unknown[]> => api.githubIssues(repo, state)
export const githubPRs = async (repo: string, state?: 'open' | 'closed' | 'all'): Promise<unknown[]> => api.githubPRs(repo, state)
export const githubCIStatus = async (repo: string, ref: string): Promise<unknown> => api.githubCIStatus(repo, ref)
export const githubCreateIssue = async (repo: string, title: string, body: string, labels: string[]): Promise<unknown> => api.githubCreateIssue(repo, title, body, labels)
export const githubComment = async (repo: string, issue: number, body: string): Promise<unknown> => api.githubComment(repo, issue, body)
export const githubClearCache = async (): Promise<void> => api.githubClearCache()

// Agents
export const agentStart = async (agentId: string, goal: string, context: Record<string, unknown>): Promise<string> => api.agentStart(agentId, goal, context)
export const agentStop = async (id: string): Promise<void> => api.agentStop(id)
export const agentStatus = async (id?: string): Promise<unknown> => api.agentStatus(id)
export const agentClear = async (): Promise<void> => api.agentClear()

// Diagnostics
export const findCrashReports = async (workspacePath: string): Promise<string[]> => api.findCrashReports(workspacePath)
export const analyzeSupportBundle = async (bundleJson: string): Promise<unknown> => api.analyzeSupportBundle(bundleJson)

// Release
export const generateChangelog = async (modulePath: string, sinceTag?: string): Promise<string> => api.generateChangelog(modulePath, sinceTag)
export const bumpVersion = async (modulePath: string, newVersion: string): Promise<{ success: boolean; version: string }> => api.bumpVersion(modulePath, newVersion)
export const signArtifact = async (jarPath: string, keyPath: string): Promise<{ success: boolean; stdout: string; stderr: string }> => api.signArtifact(jarPath, keyPath)
export const packageExperience = async (expPath: string, outDir: string): Promise<{ success: boolean; path: string }> => api.packageExperience(expPath, outDir)
export const publishRelease = async (repo: string, tag: string, assetPaths: string[], draft?: boolean): Promise<unknown> => api.publishRelease(repo, tag, assetPaths, draft)

// Auth
export const authHashPassphrase = async (passphrase: string): Promise<string> => api.authHashPassphrase(passphrase)
export const authVerifyPassphrase = async (passphrase: string): Promise<{ valid: boolean; error?: string }> => api.authVerifyPassphrase(passphrase)
export const authGenerateInvite = async (role: string): Promise<{ code: string }> => api.authGenerateInvite(role)
export const authRedeemInvite = async (code: string): Promise<{ valid: boolean; role?: string; error?: string }> => api.authRedeemInvite(code)

// Notifications
export const showNotification = async (title: string, body: string): Promise<void> => api.showNotification(title, body)
