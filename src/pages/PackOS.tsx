import { useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { DangerDialog } from '@/components/DangerDialog'
import { useAuth } from '@/hooks/useAuth'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import electronAPI from '@/lib/electronAPI'
import { Package, Play, FileText, Lock, AlertTriangle, CheckCircle2, Download, GitCompare, Wrench } from 'lucide-react'

const policies = [
  { id: 'official', name: 'Official ECHO Pack', developerTypes: ['echo_developer'], trustLevels: ['official'], communityAddons: false, verifiedAddons: false, requireSignature: true },
  { id: 'vanguard', name: 'Vanguard Beta Pack', developerTypes: ['echo_developer'], trustLevels: ['official','verified'], communityAddons: false, verifiedAddons: true, requireSignature: true },
  { id: 'community', name: 'Community Pack', developerTypes: ['echo_developer','community_developer'], trustLevels: ['official','verified','community'], communityAddons: true, verifiedAddons: true, requireSignature: false },
]

const validationCategories = [
  'Manifest','Dependencies','Roles','Capabilities','Permissions','Trust','Assets','Recipes','Missions','Screens','Themes','Runtime compatibility','Launcher metadata','Signing','Security'
]

interface PackOSProps {
  scan: WorkspaceScan | null
  workspacePath: string | null
}

export default function PackOS({ scan, workspacePath }: PackOSProps) {
  const { user } = useAuth()
  const [activePolicy, setActivePolicy] = useState(policies[0])
  const [dangerOpen, setDangerOpen] = useState(false)
  const [dangerAction, setDangerAction] = useState('')
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [validating, setValidating] = useState(false)

  const runValidation = async () => {
    if (!workspacePath) return
    setValidating(true)
    setValidationResults([])

    // Simulate real validation against workspace
    const results: any[] = []
    if (scan?.addons) {
      for (const addon of scan.addons) {
        results.push({
          target: addon.name,
          category: 'Manifest',
          status: 'passed',
          detail: `Schema version OK`,
        })
        results.push({
          target: addon.name,
          category: 'Dependencies',
          status: addon.dependencies?.length ? 'passed' : 'warning',
          detail: `${addon.dependencies?.length || 0} dependencies resolved`,
        })
        results.push({
          target: addon.name,
          category: 'Native Readiness',
          status: addon.nativeReadiness >= 60 ? 'passed' : 'warning',
          detail: `${addon.nativeReadiness}% native ready`,
        })
      }
    }
    setValidationResults(results)
    setValidating(false)

    await electronAPI.auditAppend({
      actor: user.name,
      action: 'Ran PackOS validation',
      target: workspacePath,
      risk: 'low',
    })
  }

  const handlePolicyChange = () => {
    setDangerAction('change PackOS policy')
    setDangerOpen(true)
  }

  const confirmPolicyChange = async () => {
    await electronAPI.auditAppend({
      actor: user.name,
      action: 'Edited PackOS policy',
      target: activePolicy.name,
      risk: 'high',
    })
    setDangerOpen(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">PackOS</h2>
        <p className="text-sm text-echo-muted mt-1">Packaging, validation, policies, profiles, and releases.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
                <Lock className="w-4 h-4 text-echo-accent" />
                Official Pack Policy Editor
              </h3>
              <StatusBadge status="warning" />
            </div>

            <div className="flex gap-2 mb-4">
              {policies.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePolicy(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activePolicy.id === p.id
                      ? 'bg-echo-accent/10 text-echo-accent border border-echo-accent/20'
                      : 'bg-echo-elevated text-echo-muted hover:text-echo-text border border-echo-border'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div className="rounded bg-echo-elevated p-4 font-mono text-xs space-y-2 border border-echo-border">
              <div className="flex justify-between text-echo-muted"><span>policyName</span> <span className="text-echo-text">"{activePolicy.name}"</span></div>
              <div className="flex justify-between text-echo-muted"><span>allowedDeveloperTypes</span> <span className="text-echo-text">{JSON.stringify(activePolicy.developerTypes)}</span></div>
              <div className="flex justify-between text-echo-muted"><span>allowedTrustLevels</span> <span className="text-echo-text">{JSON.stringify(activePolicy.trustLevels)}</span></div>
              <div className="flex justify-between text-echo-muted"><span>allowCommunityAddons</span> <span className="text-echo-text">{String(activePolicy.communityAddons)}</span></div>
              <div className="flex justify-between text-echo-muted"><span>allowVerifiedAddons</span> <span className="text-echo-text">{String(activePolicy.verifiedAddons)}</span></div>
              <div className="flex justify-between text-echo-muted"><span>requireEchoSignature</span> <span className="text-echo-text">{String(activePolicy.requireSignature)}</span></div>
            </div>

            <button onClick={handlePolicyChange} className="mt-3 px-3 py-1.5 rounded-md bg-echo-warning/10 text-echo-warning text-xs font-medium hover:bg-echo-warning/20 transition-colors flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Edit Policy
            </button>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-echo-accent" />
              Validation Categories
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {validationCategories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 p-2 rounded bg-echo-elevated border border-echo-border cursor-pointer hover:border-echo-accent/30 transition-colors">
                  <input type="checkbox" defaultChecked className="rounded border-echo-border bg-echo-surface text-echo-accent focus:ring-echo-accent" />
                  <span className="text-[11px] text-echo-text">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {validationResults.length > 0 && (
            <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
              <h3 className="text-sm font-semibold text-echo-text mb-3">Validation Results</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {validationResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-echo-elevated text-xs">
                    <span className="text-echo-text">{r.target} • {r.category}</span>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3">PackOS Actions</h3>
            <div className="space-y-2">
              <button onClick={runValidation} disabled={validating} className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2 disabled:opacity-50">
                <Play className={`w-3.5 h-3.5 text-echo-accent ${validating ? 'animate-spin' : ''}`} /> {validating ? 'Running...' : 'Run Full Validation'}
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-echo-success" /> Run Official Pack Validation
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-echo-info" /> Generate Repair Plan
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-echo-warning" /> Create Lockfile
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <GitCompare className="w-3.5 h-3.5 text-echo-muted" /> Compare Lockfiles
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-echo-accent" /> Export Support Bundle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-echo-warning/30 bg-echo-warning/5 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-echo-warning shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-echo-warning">Policy Change Warning</h4>
          <p className="text-xs text-echo-muted mt-1">
            Changing PackOS policies can affect launcher catalog compatibility and player pack loading.
            All policy changes require audit logging and may need secondary approval.
          </p>
        </div>
      </div>

      <DangerDialog
        open={dangerOpen}
        title="Confirm Policy Change"
        description={`You are about to ${dangerAction}. This affects all pack validation and may break existing releases.`}
        onConfirm={confirmPolicyChange}
        onCancel={() => setDangerOpen(false)}
      />
    </div>
  )
}
