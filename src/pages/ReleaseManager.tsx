import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { DangerDialog } from '@/components/DangerDialog'
import { useAuth } from '@/hooks/useAuth'
import electronAPI from '@/lib/electronAPI'
import { Send, Box, FileText, Lock, Rocket, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

interface ReleaseManagerProps {
  workspacePath: string | null
}

const MOCK_RELEASES = [
  {
    id: 'ashfall-1.2.1',
    name: 'Ashfall Vanguard Beta 1.2.1',
    type: 'Official experience release',
    build: 'passed',
    packos: 'passed_with_warnings',
    native: 'partial',
    signing: 'ready',
    launcherMeta: 'generated',
    docs: 'generated',
    supportBundle: 'ready',
    approval: 'pending',
  },
  {
    id: 'nexus-1.1.0',
    name: 'Nexus Protocol 1.1.0',
    type: 'Official addon release',
    build: 'passed',
    packos: 'passed',
    native: 'ready',
    signing: 'signed',
    launcherMeta: 'published',
    docs: 'generated',
    supportBundle: 'ready',
    approval: 'approved',
  },
]

export default function ReleaseManager({ workspacePath }: ReleaseManagerProps) {
  const { user } = useAuth()
  const [releases, setReleases] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [dangerOpen, setDangerOpen] = useState(false)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineStep, setPipelineStep] = useState(0)

  useEffect(() => {
    if (!workspacePath) {
      setReleases(MOCK_RELEASES)
      setSelected(MOCK_RELEASES[0])
      return
    }
    electronAPI.listReleases(workspacePath).then((rels) => {
      const mapped = rels.map((r: any) => ({
        id: r.name,
        name: r.name,
        type: 'Workspace release',
        build: 'unknown',
        packos: 'unknown',
        native: 'unknown',
        signing: 'unknown',
        launcherMeta: 'unknown',
        docs: 'unknown',
        supportBundle: 'unknown',
        approval: 'pending',
      }))
      setReleases(mapped.length ? mapped : MOCK_RELEASES)
      setSelected(mapped[0] || MOCK_RELEASES[0])
    })
  }, [workspacePath])

  const startPipeline = async () => {
    if (!workspacePath) return
    setDangerOpen(true)
  }

  const confirmPipeline = async () => {
    setDangerOpen(false)
    setPipelineRunning(true)
    setPipelineStep(0)

    const steps = [
      'Select target',
      'Run validation',
      'Run builds',
      'Run tests',
      'Generate changelog',
      'Generate release notes',
      'Package artifacts',
      'Sign artifacts',
      'Publish metadata',
      'Final approval',
    ]

    for (let i = 0; i < steps.length; i++) {
      setPipelineStep(i)
      await new Promise((r) => setTimeout(r, 800))
    }

    await electronAPI.auditAppend({
      actor: user.name,
      action: 'Prepared release candidate',
      target: selected.name,
      risk: 'high',
    })

    setPipelineRunning(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Release Manager</h2>
        <p className="text-sm text-echo-muted mt-1">Official release pipeline and artifact management.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={startPipeline}
          disabled={pipelineRunning}
          className="px-4 py-2 rounded-md bg-echo-accent text-echo-bg text-sm font-semibold hover:bg-echo-accentHover transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Rocket className="w-4 h-4" /> {pipelineRunning ? 'Running...' : 'Prepare Official ECHO Release'}
        </button>
      </div>

      {pipelineRunning && (
        <div className="rounded-lg border border-echo-accent/30 bg-echo-accent/5 p-4">
          <p className="text-sm text-echo-accent font-medium mb-2">Release Pipeline Running...</p>
          <div className="flex gap-2 flex-wrap">
            {['Select target','Run validation','Run builds','Run tests','Generate changelog','Generate release notes','Package artifacts','Sign artifacts','Publish metadata','Final approval'].map((step, i) => (
              <span key={step} className={`px-2 py-1 rounded text-[10px] font-medium ${
                i < pipelineStep ? 'bg-echo-success/10 text-echo-success' :
                i === pipelineStep ? 'bg-echo-accent/10 text-echo-accent animate-pulse' :
                'bg-echo-elevated text-echo-muted'
              }`}>
                {i + 1}. {step}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {releases.map((rel) => (
            <button
              key={rel.id}
              onClick={() => setSelected(rel)}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${
                selected.id === rel.id
                  ? 'border-echo-accent/30 bg-echo-accent/5'
                  : 'border-echo-border bg-echo-surface hover:bg-echo-elevated'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-echo-text">{rel.name}</span>
                <StatusBadge status={rel.approval} />
              </div>
              <p className="text-xs text-echo-muted">{rel.type}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 rounded-lg border border-echo-border bg-echo-surface p-5 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-echo-text flex items-center gap-2">
                <Send className="w-5 h-5 text-echo-accent" />
                {selected.name}
              </h3>
              <p className="text-xs text-echo-muted mt-1">{selected.type}</p>
            </div>
            <StatusBadge status={selected.approval} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded bg-echo-elevated p-3">
              <p className="text-[10px] text-echo-muted uppercase tracking-wider">Build</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className={`w-4 h-4 ${selected.build === 'passed' ? 'text-echo-success' : 'text-echo-danger'}`} />
                <span className="text-sm font-semibold text-echo-text capitalize">{selected.build}</span>
              </div>
            </div>
            <div className="rounded bg-echo-elevated p-3">
              <p className="text-[10px] text-echo-muted uppercase tracking-wider">PackOS</p>
              <div className="flex items-center gap-2 mt-1">
                {selected.packos === 'passed' ? (
                  <CheckCircle2 className="w-4 h-4 text-echo-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-echo-warning" />
                )}
                <span className="text-sm font-semibold text-echo-text capitalize">{selected.packos.replace(/_/g, ' ')}</span>
              </div>
            </div>
            <div className="rounded bg-echo-elevated p-3">
              <p className="text-[10px] text-echo-muted uppercase tracking-wider">Native</p>
              <span className="text-sm font-semibold text-echo-text capitalize">{selected.native}</span>
            </div>
            <div className="rounded bg-echo-elevated p-3">
              <p className="text-[10px] text-echo-muted uppercase tracking-wider">Signing</p>
              <div className="flex items-center gap-2 mt-1">
                <Lock className={`w-4 h-4 ${selected.signing === 'signed' ? 'text-echo-success' : 'text-echo-warning'}`} />
                <span className="text-sm font-semibold text-echo-text capitalize">{selected.signing}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Release Artifacts</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['JARs','Pack ZIPs','Launcher metadata','PackOS lockfile','Changelog','Discord post','YouTube description','Beta tester guide','Support bundle template'].map((art) => (
                <div key={art} className="flex items-center gap-2 p-2 rounded bg-echo-elevated border border-echo-border">
                  <Box className="w-3.5 h-3.5 text-echo-accent" />
                  <span className="text-xs text-echo-text">{art}</span>
                </div>
              ))}
            </div>
          </div>

          {selected.approval === 'pending' && (
            <div className="flex items-center gap-3 pt-2">
              <button className="px-4 py-2 rounded-md bg-echo-success/10 text-echo-success text-xs font-medium hover:bg-echo-success/20 transition-colors">
                Approve Release
              </button>
              <button className="px-4 py-2 rounded-md bg-echo-danger/10 text-echo-danger text-xs font-medium hover:bg-echo-danger/20 transition-colors">
                Reject Release
              </button>
            </div>
          )}
        </div>
      </div>

      <DangerDialog
        open={dangerOpen}
        title="Confirm Release Preparation"
        description={`You are about to prepare ${selected.name}. This will build, validate, package, and potentially sign artifacts. This action will be permanently logged.`}
        onConfirm={confirmPipeline}
        onCancel={() => setDangerOpen(false)}
      />
    </div>
  )
}
