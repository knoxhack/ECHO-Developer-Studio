import { useAuth } from '@/hooks/useAuth'
import { StatusBadge } from '@/components/StatusBadge'
import electronAPI from '@/lib/electronAPI'
import { useState, useEffect } from 'react'
import { Lock, ShieldAlert, FileKey, RotateCcw, CheckCircle2, AlertTriangle, History } from 'lucide-react'

export default function Signing() {
  const { can } = useAuth()
  const [auditLog, setAuditLog] = useState<any[]>([])

  useEffect(() => {
    electronAPI.auditRead().then((log) => setAuditLog((log as any[]).filter((a) => a.action.toLowerCase().includes('sign'))))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Signing</h2>
        <p className="text-sm text-echo-muted mt-1">Artifact signing, verification, and key management.</p>
      </div>

      {!can('sign_artifact') && (
        <div className="rounded-lg border border-echo-danger/30 bg-echo-danger/5 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-echo-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-echo-danger">Access Restricted</h4>
            <p className="text-xs text-echo-muted mt-1">Your role does not have signing permissions. Contact a signing admin.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
                <FileKey className="w-4 h-4 text-echo-accent" />
                Signing Tools
              </h3>
              <StatusBadge status="ready" />
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded bg-echo-elevated border border-echo-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-echo-accent" />
                    <span className="text-sm font-medium text-echo-text">Sign Artifact</span>
                  </div>
                  <span className="text-[10px] text-echo-danger font-medium uppercase">High Risk</span>
                </div>
                <p className="text-xs text-echo-muted mb-3">
                  Signing this artifact marks it as official ECHO content. Only sign artifacts built from trusted official repositories.
                </p>
                <div className="flex gap-2">
                  <button disabled={!can('sign_artifact')} className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Select Artifact to Sign
                  </button>
                  <button disabled={!can('sign_artifact')} className="px-3 py-1.5 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Verify Signature
                  </button>
                </div>
              </div>

              <div className="p-4 rounded bg-echo-elevated border border-echo-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-echo-warning" />
                    <span className="text-sm font-medium text-echo-text">Key Rotation</span>
                  </div>
                  <span className="text-[10px] text-echo-danger font-medium uppercase">High Risk</span>
                </div>
                <p className="text-xs text-echo-muted mb-3">
                  Rotate official signing keys. This requires secondary approval and will invalidate previous signatures after grace period.
                </p>
                <button disabled={!can('sign_artifact')} className="px-3 py-1.5 rounded-md bg-echo-warning/10 text-echo-warning text-xs font-medium hover:bg-echo-warning/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Initiate Key Rotation
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-echo-accent" />
              Signing Audit Log
            </h3>
            <div className="space-y-2">
              {auditLog.filter(a => a.action.toLowerCase().includes('sign')).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2.5 rounded bg-echo-elevated">
                  <div className="flex items-center gap-3">
                    <Lock className="w-3.5 h-3.5 text-echo-accent" />
                    <div>
                      <p className="text-xs text-echo-text font-medium">{entry.action}</p>
                      <p className="text-[10px] text-echo-muted">{entry.target} • {entry.actor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-echo-muted font-mono">{new Date(entry.timestamp).toLocaleString()}</p>
                    <StatusBadge status={entry.risk} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3">Key Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-echo-elevated">
                <span className="text-xs text-echo-text">Primary Signing Key</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-echo-success" />
                  <span className="text-xs text-echo-success">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-echo-elevated">
                <span className="text-xs text-echo-text">Backup Key</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-echo-success" />
                  <span className="text-xs text-echo-success">Ready</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-echo-elevated">
                <span className="text-xs text-echo-text">Key Expiry</span>
                <span className="text-xs text-echo-muted font-mono">2027-01-15</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-echo-elevated">
                <span className="text-xs text-echo-text">Last Rotation</span>
                <span className="text-xs text-echo-muted font-mono">2025-06-01</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-echo-warning/30 bg-echo-warning/5 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-echo-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-echo-warning">Restricted Section</h4>
              <p className="text-xs text-echo-muted mt-1">
                Only owner, release_admin, and signing_admin roles can sign artifacts. All actions are permanently logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
