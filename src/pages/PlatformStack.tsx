import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { GitStatusBadge } from '@/components/GitStatusBadge'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import electronAPI from '@/lib/electronAPI'
import { Layers, GitBranch, Cpu } from 'lucide-react'

interface PlatformStackProps {
  scan: WorkspaceScan | null
}

export default function PlatformStack({ scan }: PlatformStackProps) {
  const modules = scan?.modules || []
  const [gitInfos, setGitInfos] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!modules.length) return
    const fetchGit = async () => {
      const infos: Record<string, any> = {}
      for (const mod of modules) {
        if (mod.path) {
          try {
            infos[mod.id] = await electronAPI.getGitStatus(mod.path)
          } catch {}
        }
      }
      setGitInfos(infos)
    }
    fetchGit()
  }, [modules])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Platform Stack</h2>
        <p className="text-sm text-echo-muted mt-1">Architecture overview of all official ECHO modules and services.</p>
      </div>

      <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
        <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-echo-accent" />
          Module Dependency Graph {scan && <span className="text-echo-accent text-xs font-mono">(live)</span>}
        </h3>
        <div className="font-mono text-xs text-echo-muted space-y-1.5 pl-2 border-l-2 border-echo-accent/30">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-echo-accent" />
            <span className="text-echo-text font-medium">ECHO Core</span>
            <StatusBadge status="healthy" />
          </div>
          <div className="pl-4 space-y-1 border-l border-echo-border ml-2">
            {modules.filter((m: any) => m.id !== 'echo-core').map((mod: any) => (
              <div key={mod.id} className="flex items-center gap-2">
                <GitBranch className="w-3 h-3 text-echo-muted" />
                <span className="text-echo-text">{mod.name}</span>
                <span className="text-echo-muted">v{mod.version}</span>
                <StatusBadge status={mod.status} />
                {gitInfos[mod.id] && (
                  <GitStatusBadge
                    branch={gitInfos[mod.id].branch}
                    dirty={gitInfos[mod.id].dirty}
                    ahead={gitInfos[mod.id].ahead}
                    behind={gitInfos[mod.id].behind}
                  />
                )}
              </div>
            ))}
            {modules.length === 0 && (
              <span className="text-echo-muted italic">No modules discovered. Select a workspace.</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map((mod: any) => (
          <div key={mod.id} className="rounded-lg border border-echo-border bg-echo-surface p-4 hover:border-echo-accent/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-echo-text">{mod.name}</h4>
                <p className="text-xs text-echo-muted font-mono">v{mod.version} • {mod.owner}</p>
                {gitInfos[mod.id] && (
                  <div className="mt-1">
                    <GitStatusBadge
                      branch={gitInfos[mod.id].branch}
                      dirty={gitInfos[mod.id].dirty}
                      ahead={gitInfos[mod.id].ahead}
                      behind={gitInfos[mod.id].behind}
                    />
                  </div>
                )}
              </div>
              <StatusBadge status={mod.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="rounded bg-echo-elevated p-2">
                <p className="text-[10px] text-echo-muted uppercase">Build</p>
                <p className="text-xs text-echo-text font-medium">{mod.buildResult}</p>
              </div>
              <div className="rounded bg-echo-elevated p-2">
                <p className="text-[10px] text-echo-muted uppercase">Channel</p>
                <p className="text-xs text-echo-text font-medium">{mod.releaseChannel}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-echo-muted">API Stability</span>
                <span className="text-echo-text font-mono">{mod.apiStability}%</span>
              </div>
              <div className="w-full bg-echo-elevated rounded-full h-1">
                <div className="bg-echo-accent h-1 rounded-full" style={{ width: `${mod.apiStability}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-echo-muted">Native Readiness</span>
                <span className="text-echo-text font-mono">{mod.nativeReadiness}%</span>
              </div>
              <div className="w-full bg-echo-elevated rounded-full h-1">
                <div className="bg-echo-success h-1 rounded-full" style={{ width: `${mod.nativeReadiness}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-echo-muted">Test Coverage</span>
                <span className="text-echo-text font-mono">{mod.testCoverage}%</span>
              </div>
              <div className="w-full bg-echo-elevated rounded-full h-1">
                <div className="bg-echo-info h-1 rounded-full" style={{ width: `${mod.testCoverage}%` }} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-echo-border flex items-center justify-between text-xs">
              <span className="text-echo-muted">{mod.openIssues} open issues</span>
              <span className="text-echo-muted font-mono">{mod.lastCommit}</span>
            </div>
          </div>
        ))}
        {modules.length === 0 && (
          <div className="col-span-full p-8 text-center rounded-lg border border-echo-border bg-echo-surface">
            <Layers className="w-6 h-6 text-echo-muted mx-auto mb-2" />
            <p className="text-sm text-echo-muted">No modules found. Select a workspace to discover the platform stack.</p>
          </div>
        )}
      </div>
    </div>
  )
}
