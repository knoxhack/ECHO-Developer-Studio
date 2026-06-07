import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import electronAPI from '@/lib/electronAPI'
import { Activity, Upload, Search, Bug, FileText, Cpu, HardDrive, MemoryStick, Monitor } from 'lucide-react'

interface DiagnosticsProps {
  workspacePath: string | null
}

export default function Diagnostics({ workspacePath }: DiagnosticsProps) {
  const [bundleText, setBundleText] = useState('')
  const [crashReports, setCrashReports] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workspacePath) return
    setLoading(true)
    electronAPI.findCrashReports(workspacePath).then((paths) => {
      Promise.all(paths.slice(0, 20).map((p) => electronAPI.readCrashReport(p)))
        .then((reports) => setCrashReports(reports.filter(Boolean) as any[]))
        .finally(() => setLoading(false))
    })
  }, [workspacePath])

  const analyzeBundle = async () => {
    if (!bundleText.trim()) return
    await electronAPI.analyzeSupportBundle(bundleText)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Diagnostics</h2>
        <p className="text-sm text-echo-muted mt-1">Support bundles, crashes, logs, and player issue analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
                <Bug className="w-4 h-4 text-echo-accent" />
                Open Incidents
              </h3>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-echo-muted"><span className="w-2 h-2 rounded-full bg-echo-danger" /> High</span>
                <span className="flex items-center gap-1.5 text-echo-muted"><span className="w-2 h-2 rounded-full bg-echo-warning" /> Medium</span>
                <span className="flex items-center gap-1.5 text-echo-muted"><span className="w-2 h-2 rounded-full bg-echo-success" /> Low</span>
              </div>
            </div>
            {!workspacePath ? (
              <div className="p-8 text-center text-echo-muted text-sm">
                <Bug className="w-6 h-6 mx-auto mb-2" />
                Select a workspace to view crash reports.
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-echo-muted text-sm">Scanning crash reports...</div>
            ) : crashReports.length === 0 ? (
              <div className="p-8 text-center text-echo-muted text-sm">No crash reports found. Great!</div>
            ) : (
              <div className="space-y-2">
                {crashReports.map((inc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded bg-echo-elevated hover:bg-echo-border transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        inc.severity === 'critical' || inc.severity === 'high' ? 'bg-echo-danger' : inc.severity === 'medium' ? 'bg-echo-warning' : 'bg-echo-success'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-echo-text">{inc.description || 'Crash Report'}</p>
                        <p className="text-[10px] text-echo-muted">{inc.exception?.slice(0, 60)}... • {inc.time}</p>
                        {inc.suggestedFix && (
                          <p className="text-[10px] text-echo-accent mt-0.5">{inc.suggestedFix}</p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={inc.severity === 'critical' ? 'blocker' : inc.severity} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-echo-accent" />
              Recent Crashes
            </h3>
            <div className="space-y-2">
              {crashReports.slice(0, 3).map((inc: any, idx: number) => (
                <div key={idx} className="p-3 rounded bg-echo-elevated font-mono text-xs text-echo-muted">
                  <p className="font-medium text-echo-text mb-1">{inc.exception}</p>
                  {inc.stackTrace?.slice(0, 3).map((line: string, i: number) => (
                    <p key={i} className="truncate">{line}</p>
                  ))}
                </div>
              ))}
              {crashReports.length === 0 && (
                <p className="text-xs text-echo-muted p-3">No recent crashes.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-echo-accent" />
              Support Bundle Analyzer
            </h3>
            <div className="space-y-3">
              <textarea
                value={bundleText}
                onChange={(e) => setBundleText(e.target.value)}
                placeholder="Paste support bundle JSON here..."
                className="w-full h-32 rounded-md bg-echo-elevated border border-echo-border text-xs text-echo-text placeholder-echo-muted p-3 resize-none focus:outline-none focus:border-echo-accent font-mono"
              />
              <button
                onClick={analyzeBundle}
                disabled={!bundleText.trim()}
                className="w-full px-3 py-2 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors disabled:opacity-40"
              >
                Analyze Bundle
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3">System Health</h3>
            <div className="space-y-3">
              {[
                { label: 'CPU Usage', icon: Cpu, value: '12%' },
                { label: 'Memory', icon: MemoryStick, value: '4.2 GB / 16 GB' },
                { label: 'Disk', icon: HardDrive, value: '142 GB free' },
                { label: 'Display', icon: Monitor, value: '1920x1080 @ 60Hz' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-2 rounded bg-echo-elevated">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 text-echo-muted" />
                    <span className="text-xs text-echo-text">{item.label}</span>
                  </div>
                  <span className="text-xs text-echo-muted font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-echo-accent" />
              Known Issues
            </h3>
            <div className="space-y-2">
              <div className="p-2 rounded bg-echo-elevated text-xs text-echo-muted">
                No known issues linked. Connect GitHub in Settings to match crashes against open issues.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
