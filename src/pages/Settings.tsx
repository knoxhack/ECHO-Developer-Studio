import { useAuth } from '@/hooks/useAuth'
import { StatusBadge } from '@/components/StatusBadge'
import { useStore } from '@/hooks/useStore'
import electronAPI from '@/lib/electronAPI'
import { useState, useEffect } from 'react'
import { Shield, User, Lock, Bell, Eye, ToggleLeft, ToggleRight, Key, Bot, Wrench, GitBranch } from 'lucide-react'

interface SettingsProps {
  onLogout: () => void
}

export default function Settings({ onLogout }: SettingsProps) {
  const { user, can } = useAuth()
  const { settings, clearStore } = useStore()
  const [twoFA, setTwoFA] = useState(true)
  const [auditLogging, setAuditLogging] = useState(true)
  const [approvalRequired, setApprovalRequired] = useState(true)
  const [blockUnsigned, setBlockUnsigned] = useState(true)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [githubToken, setGithubToken] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [claudeKey, setClaudeKey] = useState('')
  const [signingKeyPath, setSigningKeyPath] = useState('')
  const [gradleJavaHome, setGradleJavaHome] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    electronAPI.auditRead().then((log) => setAuditLog(log as any[]))
    electronAPI.storeGet('githubToken').then((v) => { if (v) setGithubToken(v as string) })
    electronAPI.storeGet('openaiKey').then((v) => { if (v) setOpenaiKey(v as string) })
    electronAPI.storeGet('claudeKey').then((v) => { if (v) setClaudeKey(v as string) })
    electronAPI.storeGet('signingKeyPath').then((v) => { if (v) setSigningKeyPath(v as string) })
    electronAPI.storeGet('gradleJavaHome').then((v) => { if (v) setGradleJavaHome(v as string) })
    electronAPI.storeGet('notificationsEnabled').then((v) => { if (v !== undefined) setNotificationsEnabled(v as boolean) })
  }, [])

  const saveSetting = async (key: string, value: unknown) => {
    await electronAPI.storeSet(key, value)
  }

  const handleLogoutClick = async () => {
    await clearStore()
    onLogout()
  }

  const pickSigningKey = async () => {
    const path = await electronAPI.selectFolder()
    if (path) { setSigningKeyPath(path); saveSetting('signingKeyPath', path) }
  }

  const pickGradleJava = async () => {
    const path = await electronAPI.selectFolder()
    if (path) { setGradleJavaHome(path); saveSetting('gradleJavaHome', path) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Settings</h2>
        <p className="text-sm text-echo-muted mt-1">Role-based configuration, security, and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-echo-accent" />
              Account & Role
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded bg-echo-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-echo-accent/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-echo-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-echo-text">{user.name}</p>
                    <p className="text-xs text-echo-muted">{user.email}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-echo-accent/10 text-echo-accent text-xs font-medium capitalize">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-echo-elevated">
                  <p className="text-[10px] text-echo-muted uppercase tracking-wider">Access</p>
                  <p className="text-sm font-semibold text-echo-text">Official Platform</p>
                </div>
                <div className="p-3 rounded bg-echo-elevated">
                  <p className="text-[10px] text-echo-muted uppercase tracking-wider">Permissions</p>
                  <p className="text-sm font-semibold text-echo-text">{user.permissions.length} granted</p>
                </div>
                <div className="p-3 rounded bg-echo-elevated">
                  <p className="text-[10px] text-echo-muted uppercase tracking-wider">Signing</p>
                  <p className="text-sm font-semibold text-echo-text">{can('sign_artifact') ? 'Allowed' : 'Not allowed'}</p>
                </div>
                <div className="p-3 rounded bg-echo-elevated">
                  <p className="text-[10px] text-echo-muted uppercase tracking-wider">Addon Review</p>
                  <p className="text-sm font-semibold text-echo-text">{can('approve_addon') ? 'Allowed' : 'Not allowed'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-echo-accent" />
              Security Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded bg-echo-elevated cursor-pointer hover:bg-echo-border transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-echo-accent" />
                  <div>
                    <p className="text-sm font-medium text-echo-text">Require approval for dangerous actions</p>
                    <p className="text-xs text-echo-muted">Gates publish, sign, and policy changes</p>
                  </div>
                </div>
                <button onClick={() => setApprovalRequired(!approvalRequired)}>
                  {approvalRequired ? <ToggleRight className="w-5 h-5 text-echo-accent" /> : <ToggleLeft className="w-5 h-5 text-echo-muted" />}
                </button>
              </label>
              <label className="flex items-center justify-between p-3 rounded bg-echo-elevated cursor-pointer hover:bg-echo-border transition-colors">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-echo-accent" />
                  <div>
                    <p className="text-sm font-medium text-echo-text">Require 2FA for release actions</p>
                    <p className="text-xs text-echo-muted">Extra verification for signing and publishing</p>
                  </div>
                </div>
                <button onClick={() => setTwoFA(!twoFA)}>
                  {twoFA ? <ToggleRight className="w-5 h-5 text-echo-accent" /> : <ToggleLeft className="w-5 h-5 text-echo-muted" />}
                </button>
              </label>
              <label className="flex items-center justify-between p-3 rounded bg-echo-elevated cursor-pointer hover:bg-echo-border transition-colors">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-echo-accent" />
                  <div>
                    <p className="text-sm font-medium text-echo-text">Enable audit logging</p>
                    <p className="text-xs text-echo-muted">All actions are permanently recorded</p>
                  </div>
                </div>
                <button onClick={() => setAuditLogging(!auditLogging)}>
                  {auditLogging ? <ToggleRight className="w-5 h-5 text-echo-accent" /> : <ToggleLeft className="w-5 h-5 text-echo-muted" />}
                </button>
              </label>
              <label className="flex items-center justify-between p-3 rounded bg-echo-elevated cursor-pointer hover:bg-echo-border transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-echo-accent" />
                  <div>
                    <p className="text-sm font-medium text-echo-text">Block unsigned official artifacts</p>
                    <p className="text-xs text-echo-muted">Reject unofficial builds in validation</p>
                  </div>
                </div>
                <button onClick={() => setBlockUnsigned(!blockUnsigned)}>
                  {blockUnsigned ? <ToggleRight className="w-5 h-5 text-echo-accent" /> : <ToggleLeft className="w-5 h-5 text-echo-muted" />}
                </button>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-echo-accent" />
              GitHub Integration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-echo-muted mb-1">Personal Access Token</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => { setGithubToken(e.target.value); saveSetting('githubToken', e.target.value) }}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full rounded-md bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-2.5 focus:outline-none focus:border-echo-accent font-mono"
                />
                <p className="text-[10px] text-echo-muted mt-1">Used to fetch issues, PRs, and CI status. Stored locally.</p>
              </div>
              <button
                onClick={() => electronAPI.githubClearCache()}
                className="px-3 py-1.5 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors"
              >
                Clear GitHub Cache
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Bot className="w-4 h-4 text-echo-accent" />
              AI Agent Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-echo-muted mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => { setOpenaiKey(e.target.value); saveSetting('openaiKey', e.target.value) }}
                  placeholder="sk-xxxxxxxx"
                  className="w-full rounded-md bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-2.5 focus:outline-none focus:border-echo-accent font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-echo-muted mb-1">Claude API Key</label>
                <input
                  type="password"
                  value={claudeKey}
                  onChange={(e) => { setClaudeKey(e.target.value); saveSetting('claudeKey', e.target.value) }}
                  placeholder="sk-ant-xxxxxxxx"
                  className="w-full rounded-md bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-2.5 focus:outline-none focus:border-echo-accent font-mono"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-echo-accent" />
              Build Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-echo-muted mb-1">Gradle Java Home</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gradleJavaHome}
                    readOnly
                    placeholder="Path to JDK..."
                    className="flex-1 rounded-md bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-2.5 focus:outline-none font-mono"
                  />
                  <button onClick={pickGradleJava} className="px-3 py-2 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20">Browse</button>
                </div>
                <p className="text-[10px] text-echo-muted mt-1">JAVA_HOME used for Gradle builds.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-echo-accent" />
              Signing Configuration
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-echo-muted mb-1">Signing Key Path</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={signingKeyPath}
                    readOnly
                    placeholder="Path to keystore or private key..."
                    className="flex-1 rounded-md bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-2.5 focus:outline-none font-mono"
                  />
                  <button onClick={pickSigningKey} className="px-3 py-2 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20">Browse</button>
                </div>
                <p className="text-[10px] text-echo-muted mt-1">Path to JKS keystore or GPG private key for artifact signing.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogoutClick}
            className="w-full p-3 rounded-lg border border-echo-danger/30 bg-echo-danger/5 text-echo-danger text-sm font-medium hover:bg-echo-danger/10 transition-colors"
          >
            Log Out & Clear Session
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-echo-accent" />
              Notifications
            </h3>
            <div className="space-y-2 text-sm text-echo-muted">
              <label className="flex items-center justify-between p-2 rounded bg-echo-elevated cursor-pointer">
                <span>Desktop notifications</span>
                <button onClick={() => { setNotificationsEnabled(!notificationsEnabled); saveSetting('notificationsEnabled', !notificationsEnabled) }}>
                  {notificationsEnabled ? <ToggleRight className="w-5 h-5 text-echo-accent" /> : <ToggleLeft className="w-5 h-5 text-echo-muted" />}
                </button>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-echo-elevated cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-echo-border bg-echo-surface text-echo-accent" />
                <span>Build failures</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-echo-elevated cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-echo-border bg-echo-surface text-echo-accent" />
                <span>New addon submissions</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-echo-elevated cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-echo-border bg-echo-surface text-echo-accent" />
                <span>Release approvals</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-echo-elevated cursor-pointer">
                <input type="checkbox" className="rounded border-echo-border bg-echo-surface text-echo-accent" />
                <span>Agent task completions</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-echo-elevated cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-echo-border bg-echo-surface text-echo-accent" />
                <span>Security alerts</span>
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3">Recent Audit Activity</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLog.length === 0 && <p className="text-xs text-echo-muted italic">No audit entries yet.</p>}
              {auditLog.slice(0, 20).map((entry: any, i: number) => (
                <div key={i} className="flex items-start justify-between p-2 rounded bg-echo-elevated">
                  <div>
                    <p className="text-xs text-echo-text font-medium">{entry.action}</p>
                    <p className="text-[10px] text-echo-muted">{entry.target}</p>
                  </div>
                  <StatusBadge status={entry.risk || 'low'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
