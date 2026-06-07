import { useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import { Puzzle, Play, FileText, ArrowRight, Box, AlertTriangle } from 'lucide-react'

interface OfficialAddonsProps {
  scan: WorkspaceScan | null
}

export default function OfficialAddons({ scan }: OfficialAddonsProps) {
  const addonList = scan?.addons || []
  const [selected, setSelected] = useState<any>(addonList[0] || null)

  if (!selected) return null

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Official Addons</h2>
        <p className="text-sm text-echo-muted mt-1">First-party content module management and validation. {scan && <span className="text-echo-accent font-mono text-xs">(live)</span>}</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-72 shrink-0 overflow-y-auto rounded-lg border border-echo-border bg-echo-surface p-3 space-y-1">
          {addonList.map((addon: any) => (
            <button
              key={addon.id}
              onClick={() => setSelected(addon)}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between transition-colors ${
                selected.id === addon.id ? 'bg-echo-accent/10 border border-echo-accent/20' : 'hover:bg-echo-elevated border border-transparent'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-echo-text">{addon.name}</div>
                <div className="text-xs text-echo-muted font-mono">v{addon.version}</div>
              </div>
              <StatusBadge status={addon.status} />
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-echo-text flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-echo-accent" />
                  {selected.name}
                </h3>
                <p className="text-xs text-echo-muted font-mono mt-1">{selected.id} • v{selected.version}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Run Validation
                </button>
                <button className="px-3 py-1.5 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Release Notes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Build</p>
                <p className="text-lg font-semibold text-echo-text font-mono">Passing</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">PackOS</p>
                <p className="text-lg font-semibold text-echo-text font-mono">Valid</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Pack Inclusion</p>
                <p className="text-lg font-semibold text-echo-text font-mono">{selected.packInclusion ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Release Ready</p>
                <p className="text-lg font-semibold text-echo-text font-mono">{selected.releaseReady ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Health Metrics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-echo-muted">Asset Health</span><span className="text-echo-text font-mono">{selected.assetHealth}%</span></div>
                  <div className="w-full bg-echo-elevated rounded-full h-1.5"><div className="bg-echo-accent h-1.5 rounded-full" style={{ width: `${selected.assetHealth}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-echo-muted">Mission Coverage</span><span className="text-echo-text font-mono">{selected.missionCoverage}%</span></div>
                  <div className="w-full bg-echo-elevated rounded-full h-1.5"><div className="bg-echo-info h-1.5 rounded-full" style={{ width: `${selected.missionCoverage}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-echo-muted">Recipe Coverage</span><span className="text-echo-text font-mono">{selected.recipeCoverage}%</span></div>
                  <div className="w-full bg-echo-elevated rounded-full h-1.5"><div className="bg-echo-success h-1.5 rounded-full" style={{ width: `${selected.recipeCoverage}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-echo-muted">Native Readiness</span><span className="text-echo-text font-mono">{selected.nativeReadiness}%</span></div>
                  <div className="w-full bg-echo-elevated rounded-full h-1.5"><div className={`h-1.5 rounded-full ${selected.nativeReadiness >= 80 ? 'bg-echo-success' : selected.nativeReadiness >= 60 ? 'bg-echo-warning' : 'bg-echo-danger'}`} style={{ width: `${selected.nativeReadiness}%` }} /></div>
                </div>
              </div>
            </div>

            {!selected.releaseReady && (
              <div className="rounded-lg border border-echo-warning/30 bg-echo-warning/5 p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-echo-warning shrink-0 mt-0.5" />
                <p className="text-xs text-echo-muted">This addon is not marked release-ready. Resolve blockers before packaging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
