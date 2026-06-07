import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Permission } from '@/types'
import {
  LayoutDashboard,
  Layers,
  Cpu,
  Package,
  Puzzle,
  Gamepad2,
  Rocket,
  Send,
  ClipboardCheck,
  Activity,
  Bot,
  Terminal,
  Settings,
  ShieldAlert,
  Lock,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  permission: Permission
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { label: 'Mission Control', path: '/', icon: <LayoutDashboard className="w-4 h-4" />, permission: 'view_mission_control' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Platform Stack', path: '/platform-stack', icon: <Layers className="w-4 h-4" />, permission: 'view_platform_stack' },
      { label: 'Core Modules', path: '/core-modules', icon: <Cpu className="w-4 h-4" />, permission: 'view_core_modules' },
      { label: 'Native Runtime', path: '/native-runtime', icon: <ShieldAlert className="w-4 h-4" />, permission: 'view_native_runtime' },
      { label: 'PackOS', path: '/packos', icon: <Package className="w-4 h-4" />, permission: 'view_packos' },
    ],
  },
  {
    label: 'Official Content',
    items: [
      { label: 'Official Addons', path: '/official-addons', icon: <Puzzle className="w-4 h-4" />, permission: 'view_official_addons' },
      { label: 'Official Experiences', path: '/official-experiences', icon: <Gamepad2 className="w-4 h-4" />, permission: 'view_official_experiences' },
    ],
  },
  {
    label: 'Distribution',
    items: [
      { label: 'Launcher', path: '/launcher', icon: <Rocket className="w-4 h-4" />, permission: 'view_launcher' },
      { label: 'Release Manager', path: '/release-manager', icon: <Send className="w-4 h-4" />, permission: 'view_release_manager' },
      { label: 'Release Dashboard', path: '/release-dashboard', icon: <BarChart3 className="w-4 h-4" />, permission: 'view_release_manager' },
      { label: 'Signing', path: '/signing', icon: <Lock className="w-4 h-4" />, permission: 'view_signing' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Addon Review', path: '/addon-review', icon: <ClipboardCheck className="w-4 h-4" />, permission: 'view_addon_review' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Diagnostics', path: '/diagnostics', icon: <Activity className="w-4 h-4" />, permission: 'view_diagnostics' },
      { label: 'AI Agents', path: '/ai-agents', icon: <Bot className="w-4 h-4" />, permission: 'view_ai_agents' },
      { label: 'Terminal', path: '/terminal', icon: <Terminal className="w-4 h-4" />, permission: 'view_terminal' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: <Settings className="w-4 h-4" />, permission: 'view_settings' },
    ],
  },
]

export function Sidebar() {
  const { can } = useAuth()
  const location = useLocation()

  return (
    <aside className="w-64 border-r border-echo-border bg-echo-surface flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 space-y-6">
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) => can(item.permission))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label}>
              <h3 className="px-3 text-[10px] font-semibold text-echo-muted uppercase tracking-wider mb-1">
                {group.label}
              </h3>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors group',
                        isActive
                          ? 'bg-echo-accent/10 text-echo-accent font-medium'
                          : 'text-echo-muted hover:text-echo-text hover:bg-echo-elevated'
                      )}
                    >
                      {item.icon}
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>
      <div className="mt-auto p-4 border-t border-echo-border">
        <div className="rounded-lg bg-echo-elevated p-3">
          <p className="text-[10px] font-mono text-echo-muted uppercase mb-1">ECHO Ecosystem</p>
          <p className="text-xs text-echo-text leading-relaxed">
            Studio builds ECHO. Addon Studio builds for ECHO.
          </p>
        </div>
      </div>
    </aside>
  )
}
