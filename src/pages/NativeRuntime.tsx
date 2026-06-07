import { StatusBadge } from '@/components/StatusBadge'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import { ShieldAlert, ArrowRight, Layers, Activity, CheckCircle2 } from 'lucide-react'

const runtimeLayers = [
  { name: 'ECHO Runtime', coverage: 78, missing: 12 },
  { name: 'World Runtime', coverage: 54, missing: 28 },
  { name: 'Entity Runtime', coverage: 49, missing: 34 },
  { name: 'Item Runtime', coverage: 62, missing: 19 },
  { name: 'UI Runtime', coverage: 81, missing: 8 },
  { name: 'Renderer Runtime', coverage: 67, missing: 15 },
  { name: 'Networking Runtime', coverage: 88, missing: 5 },
  { name: 'Save Runtime', coverage: 44, missing: 31 },
  { name: 'PackOS Runtime', coverage: 92, missing: 3 },
]

const migrationBoard = [
  { name: 'Registry calls', state: 'native_ready', count: 142 },
  { name: 'Network payloads', state: 'in_migration', count: 89 },
  { name: 'Screen opening', state: 'adapter_candidate', count: 56 },
  { name: 'Resource loading', state: 'needs_tests', count: 203 },
  { name: 'Entity spawning', state: 'blocked', count: 78 },
  { name: 'World save access', state: 'detected', count: 134 },
  { name: 'Commands', state: 'native_ready', count: 45 },
  { name: 'Client rendering hooks', state: 'adapter_candidate', count: 112 },
]

interface NativeRuntimeProps {
  scan: WorkspaceScan | null
}

export default function NativeRuntime({ scan }: NativeRuntimeProps) {
  const modules = scan?.modules || []
  const overall = modules.length ? Math.round(modules.reduce((acc: number, m: any) => acc + (m.nativeReadiness || 0), 0) / modules.length) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Native Runtime</h2>
        <p className="text-sm text-echo-muted mt-1">Moving ECHO beyond NeoForge and Minecraft dependency. {scan && <span className="text-echo-accent font-mono text-xs">(live)</span>}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-echo-border bg-echo-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
              <Activity className="w-4 h-4 text-echo-accent" />
              Native Readiness Dashboard
            </h3>
            <span className="text-2xl font-bold text-echo-accent font-mono">{overall}%</span>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Registry abstraction', value: 92 },
              { label: 'Network abstraction', value: 88 },
              { label: 'Screen abstraction', value: 81 },
              { label: 'Resource abstraction', value: 70 },
              { label: 'World access abstraction', value: 54 },
              { label: 'Save bridge', value: 44 },
              { label: 'Renderer bridge', value: 67 },
              { label: 'Entity bridge', value: 49 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-echo-muted">{item.label}</span>
                  <span className="text-xs text-echo-text font-mono">{item.value}%</span>
                </div>
                <div className="w-full bg-echo-elevated rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.value >= 80 ? 'bg-echo-success' : item.value >= 60 ? 'bg-echo-warning' : 'bg-echo-danger'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
          <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-echo-accent" />
            Runtime Layers
          </h3>
          <div className="space-y-2.5">
            {runtimeLayers.map((layer) => (
              <div key={layer.name} className="flex items-center justify-between p-2 rounded bg-echo-elevated">
                <span className="text-xs text-echo-text font-medium">{layer.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-echo-muted font-mono">{layer.coverage}%</span>
                  <span className="text-[10px] text-echo-danger font-mono">{layer.missing} missing</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-echo-accent" />
            Migration Board
          </h3>
          <button className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5" /> Create Migration Task
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['Detected','Adapter Candidates','In Migration','Needs Tests','Native Ready','Blocked'].map(col => (
            <div key={col} className="space-y-2">
              <h4 className="text-[10px] font-semibold text-echo-muted uppercase tracking-wider text-center">{col}</h4>
              {migrationBoard.filter(m => m.state === col.toLowerCase().replace(/ /g, '_')).map(item => (
                <div key={item.name} className="p-2 rounded border border-echo-border bg-echo-elevated">
                  <p className="text-xs text-echo-text font-medium">{item.name}</p>
                  <p className="text-[10px] text-echo-muted font-mono">{item.count} calls</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
        <h3 className="text-sm font-semibold text-echo-text mb-4">Module Native Readiness {scan && <span className="text-echo-accent text-xs font-mono">(live)</span>}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map((mod: any) => (
            <div key={mod.id} className="p-3 rounded bg-echo-elevated border border-echo-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-echo-text font-medium">{mod.name}</span>
                {mod.nativeReadiness >= 80 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-echo-success" />
                ) : mod.nativeReadiness >= 60 ? (
                  <Activity className="w-3.5 h-3.5 text-echo-warning" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-echo-danger" />
                )}
              </div>
              <div className="w-full bg-echo-surface rounded-full h-1.5 mb-1">
                <div
                  className={`h-1.5 rounded-full ${
                    mod.nativeReadiness >= 80 ? 'bg-echo-success' : mod.nativeReadiness >= 60 ? 'bg-echo-warning' : 'bg-echo-danger'
                  }`}
                  style={{ width: `${mod.nativeReadiness}%` }}
                />
              </div>
              <span className="text-[10px] text-echo-muted font-mono">{mod.nativeReadiness}% ready</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
