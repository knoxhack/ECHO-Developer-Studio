import { Shield, Eye, User, Lock, Code, Box, Wrench, Rocket, ClipboardCheck, Activity, Bot, Terminal, Settings } from 'lucide-react'
import type { Role } from '@/types'

const roleIcons: Record<Role, React.ReactNode> = {
  owner: <Shield className="w-6 h-6" />,
  platform_admin: <Settings className="w-6 h-6" />,
  echo_developer: <Code className="w-6 h-6" />,
  module_maintainer: <Wrench className="w-6 h-6" />,
  runtime_developer: <Terminal className="w-6 h-6" />,
  packos_admin: <Box className="w-6 h-6" />,
  launcher_developer: <Rocket className="w-6 h-6" />,
  release_manager: <Rocket className="w-6 h-6" />,
  signing_admin: <Lock className="w-6 h-6" />,
  addon_reviewer: <ClipboardCheck className="w-6 h-6" />,
  support_engineer: <Activity className="w-6 h-6" />,
  viewer: <Eye className="w-6 h-6" />,
}

const roleDescriptions: Record<Role, string> = {
  owner: 'Full system access. Can do everything.',
  platform_admin: 'Manage platform settings, roles, and policies.',
  echo_developer: 'Work on official repos and modules.',
  module_maintainer: 'Approve changes for assigned modules.',
  runtime_developer: 'Access native runtime and loader tools.',
  packos_admin: 'Edit PackOS policies and validation rules.',
  launcher_developer: 'Manage launcher builds and catalog drafts.',
  release_manager: 'Prepare and publish releases.',
  signing_admin: 'Sign official artifacts.',
  addon_reviewer: 'Review third-party submissions.',
  support_engineer: 'Analyze support bundles and create issues.',
  viewer: 'Read-only access to platform data.',
}

interface RoleCardProps {
  role: Role
  selected: boolean
  onSelect: (role: Role) => void
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps) {
  return (
    <button
      onClick={() => onSelect(role)}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all text-left w-full ${
        selected
          ? 'border-echo-accent bg-echo-accent/10 shadow-lg shadow-echo-accent/5'
          : 'border-echo-border bg-echo-surface hover:border-echo-accent/30 hover:bg-echo-elevated'
      }`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
        selected ? 'bg-echo-accent/20 text-echo-accent' : 'bg-echo-elevated text-echo-muted'
      }`}>
        {roleIcons[role]}
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold capitalize ${selected ? 'text-echo-accent' : 'text-echo-text'}`}>
          {role.replace(/_/g, ' ')}
        </p>
        <p className="text-[11px] text-echo-muted mt-1 leading-relaxed">{roleDescriptions[role]}</p>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-echo-accent" />
      )}
    </button>
  )
}
