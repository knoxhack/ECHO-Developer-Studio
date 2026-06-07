import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { GitStatusBadge } from '@/components/GitStatusBadge'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import electronAPI from '@/lib/electronAPI'
import { Cpu, Play, GitBranch, FileText, Beaker, ArrowRight, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface CoreModulesProps {
  scan: WorkspaceScan | null
}

export default function CoreModules({ scan }: CoreModulesProps) {
  const modules = scan?.modules || []
  const [selected, setSelected] = useState<any>(modules[0] || null)
  const [gitInfo, setGitInfo] = useState<any>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [building, setBuilding] = useState(false)
  const [buildOutput, setBuildOutput] = useState<string[]>([])
  const [buildId, setBuildId] = useState<string | null>(null)

  useEffect(() => {
    if (selected?.path) {
      electronAPI.getGitStatus(selected.path).then(setGitInfo)
      electronAPI.readTestResults(selected.path).then(setTestResults)
    }
  }, [selected])

  useEffect(() => {
    const cleanup = electronAPI.onBuildOutput((_event, data) => {
      if (data.id !== buildId) return
      if (data.type === 'stdout' || data.type === 'stderr') {
        setBuildOutput((prev) => [...prev, data.line || ''])
      } else if (data.type === 'close') {
        setBuilding(false)
      }
    })
    return () => cleanup()
  }, [buildId])

  const runBuild = useCallback(async () => {
    if (!selected?.path || building) return
    setBuilding(true)
    setBuildOutput([])
    const result = await electronAPI.gradleBuild(selected.path, ['build'])
    setBuildId(result.id)
  }, [selected, building])

  const runTests = useCallback(async () => {
    if (!selected?.path || building) return
    setBuilding(true)
    setBuildOutput([])
    const result = await electronAPI.gradleTest(selected.path)
    setBuildId(result.id)
  }, [selected, building])

  const openRepo = useCallback(() => {
    if (selected?.path) {
      electronAPI.gitRemoteUrl(selected.path).then((url) => {
        if (url) electronAPI.openExternal(url)
      })
    }
  }, [selected])

  if (!selected) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h2 className="text-xl font-semibold text-echo-text">Core Modules</h2>
          <p className="text-sm text-echo-muted mt-1">Official module maintenance, validation, and tooling.</p>
        </div>
        <div className="flex-1 flex items-center justify-center rounded-lg border border-echo-border bg-echo-surface">
          <div className="text-center p-8">
            <Cpu className="w-8 h-8 text-echo-muted mx-auto mb-3" />
            <p className="text-sm text-echo-muted">No modules found.</p>
            <p className="text-xs text-echo-muted mt-1">Select a workspace to discover core modules.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Core Modules</h2>
        <p className="text-sm text-echo-muted mt-1">Official module maintenance, validation, and tooling. {scan && <span className="text-echo-accent font-mono text-xs">(live)</span>}</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-72 shrink-0 overflow-y-auto rounded-lg border border-echo-border bg-echo-surface p-3 space-y-1">
          {modules.map((mod: any) => (
            <button
              key={mod.id}
              onClick={() => setSelected(mod)}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between transition-colors ${
                selected.id === mod.id ? 'bg-echo-accent/10 border border-echo-accent/20' : 'hover:bg-echo-elevated border border-transparent'
              }`}
            >
              <div>
                <div className="text-sm font-medium text-echo-text">{mod.name}</div>
                <div className="text-xs text-echo-muted font-mono">v{mod.version}</div>
              </div>
              <StatusBadge status={mod.status} />
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-echo-text flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-echo-accent" />
                  {selected.name}
                </h3>
                <p className="text-xs text-echo-muted font-mono mt-1">{selected.id} • {selected.owner} • {selected.releaseChannel}</p>
                {gitInfo && (
                  <div className="mt-1.5">
                    <GitStatusBadge
                      branch={gitInfo.branch}
                      dirty={gitInfo.dirty}
                      ahead={gitInfo.ahead}
                      behind={gitInfo.behind}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runBuild}
                  disabled={building}
                  className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  {building ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  {building ? 'Building...' : 'Build'}
                </button>
                <button
                  onClick={runTests}
                  disabled={building}
                  className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Beaker className="w-3.5 h-3.5" /> Test
                </button>
                <button
                  onClick={openRepo}
                  className="px-3 py-1.5 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" /> Repo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">API Stability</p>
                <p className="text-lg font-semibold text-echo-text font-mono">{selected.apiStability}%</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Native Readiness</p>
                <p className="text-lg font-semibold text-echo-text font-mono">{selected.nativeReadiness}%</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Test Coverage</p>
                <p className="text-lg font-semibold text-echo-text font-mono">
                  {testResults ? `${testResults.total} tests` : `${selected.testCoverage}%`}
                </p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Open Issues</p>
                <p className="text-lg font-semibold text-echo-text font-mono">{selected.openIssues}</p>
              </div>
            </div>

            {testResults && (
              <div className="rounded bg-echo-elevated p-3 border border-echo-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-echo-text">Test Results</p>
                  <span className={`text-xs font-medium ${testResults.failed > 0 ? 'text-echo-danger' : 'text-echo-success'}`}>
                    {testResults.failed > 0 ? <XCircle className="w-4 h-4 inline mr-1" /> : <CheckCircle2 className="w-4 h-4 inline mr-1" />}
                    {testResults.passed}/{testResults.total} passed
                  </span>
                </div>
                <div className="w-full bg-echo-surface rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${testResults.failed > 0 ? 'bg-echo-warning' : 'bg-echo-success'}`}
                    style={{ width: `${testResults.total ? (testResults.passed / testResults.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {buildOutput.length > 0 && (
              <div className="rounded bg-echo-elevated p-3 border border-echo-border font-mono text-xs text-echo-muted max-h-48 overflow-y-auto">
                {buildOutput.map((line, i) => (
                  <div key={i} className="truncate">{line}</div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Dependencies</h4>
              <div className="flex flex-wrap gap-2">
                {selected.dependencies?.length === 0 ? (
                  <span className="text-xs text-echo-muted italic">No dependencies (foundation module)</span>
                ) : (
                  selected.dependencies?.map((dep: string) => (
                    <span key={dep} className="px-2 py-1 rounded bg-echo-elevated text-xs text-echo-text font-mono border border-echo-border">
                      {dep}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Module Tools</h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-3 rounded-md bg-echo-elevated text-left hover:bg-echo-border transition-colors">
                  <ArrowRight className="w-4 h-4 text-echo-accent mb-1.5" />
                  <p className="text-xs font-medium text-echo-text">Generate Migration Report</p>
                  <p className="text-[10px] text-echo-muted">Native readiness scan</p>
                </button>
                <button className="p-3 rounded-md bg-echo-elevated text-left hover:bg-echo-border transition-colors">
                  <ArrowRight className="w-4 h-4 text-echo-accent mb-1.5" />
                  <p className="text-xs font-medium text-echo-text">Dependency Impact</p>
                  <p className="text-[10px] text-echo-muted">Downstream analysis</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
