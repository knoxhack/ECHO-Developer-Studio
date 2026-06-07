import { useAuth } from '@/hooks/useAuth'
import { Shield, User, Bell, Lock, FolderOpen, RefreshCw, LogOut } from 'lucide-react'
import electronAPI from '@/lib/electronAPI'

interface HeaderProps {
  workspacePath: string | null
  onRescan: () => void
  onLogout: () => void
  scanLoading: boolean
}

export function Header({ workspacePath, onRescan, onLogout, scanLoading }: HeaderProps) {
  const { user } = useAuth()

  const pickWorkspace = async () => {
    const path = await electronAPI.selectFolder()
    if (path) {
      await electronAPI.storeSet('workspacePath', path)
      window.location.reload()
    }
  }

  return (
    <header className="h-14 border-b border-echo-border bg-echo-surface flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-echo-accent/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-echo-accent" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-echo-text">ECHO Developer Studio</h1>
          <p className="text-[10px] text-echo-muted uppercase tracking-wider">Internal Command Center</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {workspacePath ? (
          <div className="flex items-center gap-2 text-xs text-echo-muted mr-2">
            <FolderOpen className="w-3.5 h-3.5 text-echo-accent" />
            <span className="max-w-[200px] truncate font-mono">{workspacePath}</span>
            <button onClick={onRescan} disabled={scanLoading} className="p-1 hover:bg-echo-elevated rounded transition-colors">
              <RefreshCw className={`w-3 h-3 ${scanLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        ) : (
          <button onClick={pickWorkspace} className="flex items-center gap-1.5 px-2 py-1 rounded bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors mr-2">
            <FolderOpen className="w-3.5 h-3.5" /> Select Workspace
          </button>
        )}

        <div className="flex items-center gap-2 text-xs text-echo-muted pl-3 border-l border-echo-border">
          <Lock className="w-3.5 h-3.5" />
          <span className="capitalize">{user.role.replace(/_/g, ' ')}</span>
        </div>
        <button className="relative p-1.5 hover:bg-echo-elevated rounded transition-colors">
          <Bell className="w-4 h-4 text-echo-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-echo-danger rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-echo-border">
          <div className="w-7 h-7 rounded-full bg-echo-accent/10 flex items-center justify-center">
            <User className="w-4 h-4 text-echo-accent" />
          </div>
          <span className="text-xs text-echo-text font-medium">{user.name}</span>
        </div>
        <button onClick={onLogout} className="p-1.5 hover:bg-echo-elevated rounded transition-colors text-echo-muted hover:text-echo-danger" title="Logout">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
