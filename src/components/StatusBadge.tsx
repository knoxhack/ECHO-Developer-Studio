import { cn } from '@/lib/utils'
import type { ModuleStatus } from '@/types'

interface StatusBadgeProps {
  status: ModuleStatus | string
  className?: string
}

const statusStyles: Record<string, string> = {
  healthy: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blocker: 'bg-red-500/10 text-red-400 border-red-500/20',
  in_review: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  new: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  automated: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  needs_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  changes_requested: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  passing: 'bg-green-500/10 text-green-400 border-green-500/20',
  unstable: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failing: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.warning
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize', style, className)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
