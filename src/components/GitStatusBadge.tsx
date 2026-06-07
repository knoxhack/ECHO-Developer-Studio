import { GitBranch, AlertCircle } from 'lucide-react'

interface GitStatusBadgeProps {
  branch?: string
  dirty?: boolean
  ahead?: number
  behind?: number
}

export function GitStatusBadge({ branch, dirty, ahead, behind }: GitStatusBadgeProps) {
  if (!branch) return null

  const parts: string[] = [branch]
  if (ahead && ahead > 0) parts.push(`+${ahead}`)
  if (behind && behind > 0) parts.push(`-${behind}`)
  if (dirty) parts.push('M')

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
      dirty ? 'bg-echo-warning/10 text-echo-warning' : 'bg-echo-accent/10 text-echo-accent'
    }`}>
      <GitBranch className="w-3 h-3" />
      {parts.join(' ')}
      {dirty && <AlertCircle className="w-3 h-3" />}
    </span>
  )
}
