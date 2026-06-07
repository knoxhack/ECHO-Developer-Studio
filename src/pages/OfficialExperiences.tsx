import { useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import { Gamepad2, Box, Play, FileText, Rocket, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'

interface OfficialExperiencesProps {
  scan: WorkspaceScan | null
}

export default function OfficialExperiences({ scan }: OfficialExperiencesProps) {
  const expList = scan?.experiences || []
  const [selected, setSelected] = useState<any>(expList[0] || null)

  if (!selected) return null

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Official Experiences</h2>
        <p className="text-sm text-echo-muted mt-1">Full official playable experiences and release management. {scan && <span className="text-echo-accent font-mono text-xs">(live)</span>}</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-72 shrink-0 overflow-y-auto rounded-lg border border-echo-border bg-echo-surface p-3 space-y-1">
          {expList.map((exp: any) => (
            <button
              key={exp.id}
              onClick={() => setSelected(exp)}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between transition-colors ${
                selected.id === exp.id ? 'bg-echo-accent/10 border border-echo-accent/20' : 'hover:bg-echo-elevated border border-transparent'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-echo-text">{exp.name}</div>
                <div className="text-xs text-echo-muted">{exp.releaseChannel}</div>
              </div>
              <StatusBadge status={exp.buildStatus || exp.status} />
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-echo-text flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-echo-accent" />
                  {selected.name}
                </h3>
                <p className="text-xs text-echo-muted font-mono mt-1">{selected.id} • {selected.type || 'Official Experience'}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Run Validation
                </button>
                <button className="px-3 py-1.5 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" /> Build Pack
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Target</p>
                <p className="text-sm font-semibold text-echo-text">{selected.target || 'NeoForge'}</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Policy</p>
                <p className="text-sm font-semibold text-echo-text">{selected.policy || 'Official first-party only'}</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Channel</p>
                <p className="text-sm font-semibold text-echo-text">{selected.releaseChannel}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Required Modules</h4>
              <div className="flex flex-wrap gap-2">
                {(selected.requiredModules || []).map((mod: string) => (
                  <span key={mod} className="px-2.5 py-1 rounded bg-echo-elevated text-xs text-echo-text font-mono border border-echo-border flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-echo-success" /> {mod}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Experience Actions</h4>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-2 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" /> Build Experience
                </button>
                <button className="px-3 py-2 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Generate Release Notes
                </button>
                <button className="px-3 py-2 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5" /> Export Beta Package
                </button>
              </div>
            </div>

            {(selected.knownBlockers || 0) > 0 && (
              <div className="rounded-lg border border-echo-danger/30 bg-echo-danger/5 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-echo-danger shrink-0 mt-0.5" />
                <p className="text-xs text-echo-muted">{selected.knownBlockers} release blocker(s) detected. Resolve before publishing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
