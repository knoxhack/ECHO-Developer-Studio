import { useState, useEffect } from 'react'
import { Shield, FolderOpen, ArrowRight } from 'lucide-react'
import { RoleCard } from '@/components/RoleCard'
import type { Role } from '@/types'
import electronAPI from '@/lib/electronAPI'

const roles: Role[] = [
  'owner',
  'platform_admin',
  'echo_developer',
  'module_maintainer',
  'runtime_developer',
  'packos_admin',
  'launcher_developer',
  'release_manager',
  'signing_admin',
  'addon_reviewer',
  'support_engineer',
  'viewer',
]

interface LoginGateProps {
  onLogin: (role: Role, workspacePath: string | null) => void
}

export default function LoginGate({ onLogin }: LoginGateProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [workspacePath, setWorkspacePath] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [hasPassphrase, setHasPassphrase] = useState(false)
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)

  useEffect(() => {
    electronAPI.storeGet('passphraseHash').then((hash) => {
      setHasPassphrase(!!hash)
      setIsFirstLaunch(!hash)
    })
  }, [])

  const pickWorkspace = async () => {
    const path = await electronAPI.selectFolder()
    if (path) setWorkspacePath(path)
  }

  const handleLogin = async () => {
    if (!selectedRole) { setError('Select a role'); return }

    if (selectedRole === 'owner') {
      if (!pin) { setError('Enter passphrase'); return }
      if (isFirstLaunch) {
        const hash = await electronAPI.authHashPassphrase(pin)
        await electronAPI.storeSet('passphraseHash', hash)
      } else {
        const result = await electronAPI.authVerifyPassphrase(pin)
        if (!result.valid) { setError('Invalid passphrase'); return }
      }
    }

    await electronAPI.storeSet('lastRole', selectedRole)
    if (workspacePath) await electronAPI.storeSet('workspacePath', workspacePath)
    onLogin(selectedRole, workspacePath)
  }

  return (
    <div className="fixed inset-0 bg-echo-bg flex items-center justify-center z-50">
      <div className="w-full max-w-5xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-echo-accent/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-echo-accent" />
          </div>
          <h1 className="text-2xl font-bold text-echo-text tracking-tight">ECHO Developer Studio</h1>
          <p className="text-sm text-echo-muted mt-2">The official command center for building and shipping the ECHO Platform.</p>
        </div>

        <div className="rounded-2xl border border-echo-border bg-echo-surface p-6 mb-6">
          <h2 className="text-sm font-semibold text-echo-muted uppercase tracking-wider mb-4">Select Workspace</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={pickWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-echo-elevated border border-echo-border hover:border-echo-accent/30 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-echo-accent" />
              <span className="text-sm text-echo-text">{workspacePath || 'Select echo-platform/ folder'}</span>
            </button>
            {workspacePath && (
              <button onClick={() => setWorkspacePath(null)} className="text-xs text-echo-muted hover:text-echo-text">Clear</button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-echo-border bg-echo-surface p-6 mb-6">
          <h2 className="text-sm font-semibold text-echo-muted uppercase tracking-wider mb-4">Select Role</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {roles.map((role) => (
              <RoleCard key={role} role={role} selected={selectedRole === role} onSelect={setSelectedRole} />
            ))}
          </div>
        </div>

        {selectedRole === 'owner' && (
          <div className="rounded-2xl border border-echo-border bg-echo-surface p-6 mb-6">
            <h2 className="text-sm font-semibold text-echo-muted uppercase tracking-wider mb-4">
              {isFirstLaunch ? 'Set Owner Passphrase' : 'Owner Passphrase'}
            </h2>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError('') }}
              placeholder={isFirstLaunch ? 'Set a secure passphrase...' : 'Enter owner passphrase...'}
              className="w-full max-w-md rounded-lg bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-3 focus:outline-none focus:border-echo-accent"
            />
            {isFirstLaunch && (
              <p className="text-xs text-echo-muted mt-2">This passphrase secures owner access. Store it safely.</p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-echo-danger text-center mb-4">{error}</p>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleLogin}
            disabled={!selectedRole}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-echo-accent text-echo-bg font-semibold text-sm hover:bg-echo-accentHover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enter Command Center <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
