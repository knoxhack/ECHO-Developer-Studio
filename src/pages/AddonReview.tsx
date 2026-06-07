import { useState, useEffect } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { ClipboardCheck, MessageSquare, Ban, CheckCircle2, FileSearch, UserCheck, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const columns = ['new','automated','needs_review','changes_requested','approved','rejected','published','blocked'] as const

const mockSubmissions: any[] = [] // Phase 4: fetch from GitHub API

export default function AddonReview() {
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState<string>('all')
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    // Phase 4: Replace with real GitHub Issues / workspace submissions fetch
    setSubmissions(mockSubmissions)
  }, [])

  const filtered = filter === 'all' ? submissions : submissions.filter((s: any) => s.status === filter)

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Addon Review</h2>
        <p className="text-sm text-echo-muted mt-1">Third-party addon submission queue from ECHO Addon Studio.</p>
      </div>

      {submissions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center rounded-lg border border-echo-border bg-echo-surface">
          <div className="text-center p-8">
            <ClipboardCheck className="w-8 h-8 text-echo-muted mx-auto mb-3" />
            <p className="text-sm text-echo-muted">No submissions in queue.</p>
            <p className="text-xs text-echo-muted mt-1">Connect a workspace or GitHub integration to populate submissions.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', filter === 'all' ? 'bg-echo-accent/10 text-echo-accent' : 'bg-echo-elevated text-echo-muted hover:text-echo-text')}>All</button>
            {columns.map((col) => (
              <button
                key={col}
                onClick={() => setFilter(col)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                  filter === col ? 'bg-echo-accent/10 text-echo-accent' : 'bg-echo-elevated text-echo-muted hover:text-echo-text'
                )}
              >
                {col.replace(/_/g, ' ')} ({submissions.filter((s: any) => s.status === col).length})
              </button>
            ))}
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            <div className="w-80 shrink-0 overflow-y-auto rounded-lg border border-echo-border bg-echo-surface p-3 space-y-2">
              {filtered.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => setSelected(sub)}
                  className={cn(
                    'w-full text-left rounded-md p-3 transition-colors border',
                    selected?.id === sub.id
                      ? 'bg-echo-accent/10 border-echo-accent/20'
                      : 'bg-echo-elevated border-echo-border hover:border-echo-accent/20'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-echo-text">{sub.addonName}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <p className="text-xs text-echo-muted">{sub.developer} • {sub.namespace}</p>
                  <p className="text-[10px] text-echo-muted mt-1">Target: {sub.targetExperience}</p>
                </button>
              ))}
            </div>

            {selected && (
              <div className="flex-1 overflow-y-auto">
                <div className="rounded-lg border border-echo-border bg-echo-surface p-5 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-echo-text flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-echo-accent" />
                        {selected.addonName}
                      </h3>
                      <p className="text-xs text-echo-muted font-mono mt-1">{selected.id} • {selected.namespace} • {selected.developer}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5" /> Run Sandbox Test
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded bg-echo-elevated p-3">
                      <p className="text-[10px] text-echo-muted uppercase tracking-wider">Trust Level</p>
                      <p className="text-sm font-semibold text-echo-text">{selected.trustLevel}</p>
                    </div>
                    <div className="rounded bg-echo-elevated p-3">
                      <p className="text-[10px] text-echo-muted uppercase tracking-wider">Target</p>
                      <p className="text-sm font-semibold text-echo-text">{selected.targetExperience}</p>
                    </div>
                    <div className="rounded bg-echo-elevated p-3">
                      <p className="text-[10px] text-echo-muted uppercase tracking-wider">Request</p>
                      <p className="text-sm font-semibold text-echo-text">{selected.requestType}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Validation Results</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded bg-echo-elevated border border-echo-border">
                        <p className="text-[10px] text-echo-muted uppercase">PackOS</p>
                        <p className="text-xs text-echo-text font-medium mt-1">{selected.packosResult}</p>
                      </div>
                      <div className="p-3 rounded bg-echo-elevated border border-echo-border">
                        <p className="text-[10px] text-echo-muted uppercase">Permissions</p>
                        <p className="text-xs text-echo-text font-medium mt-1">{selected.permissions}</p>
                      </div>
                      <div className="p-3 rounded bg-echo-elevated border border-echo-border">
                        <p className="text-[10px] text-echo-muted uppercase">Native</p>
                        <p className="text-xs text-echo-text font-medium mt-1">{selected.nativeStatus}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Review Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-2 rounded-md bg-echo-success/10 text-echo-success text-xs font-medium hover:bg-echo-success/20 transition-colors flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" /> Approve as Verified
                      </button>
                      <button className="px-3 py-2 rounded-md bg-echo-warning/10 text-echo-warning text-xs font-medium hover:bg-echo-warning/20 transition-colors flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Request Changes
                      </button>
                      <button className="px-3 py-2 rounded-md bg-echo-danger/10 text-echo-danger text-xs font-medium hover:bg-echo-danger/20 transition-colors flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button className="px-3 py-2 rounded-md bg-rose-500/10 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-colors flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" /> Block Addon
                      </button>
                      <button className="px-3 py-2 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5">
                        <FileSearch className="w-3.5 h-3.5" /> Security Analysis
                      </button>
                      <button className="px-3 py-2 rounded-md bg-echo-elevated text-echo-text text-xs font-medium hover:bg-echo-border transition-colors flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Publish to Catalog
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-echo-info/30 bg-echo-info/5 p-3 flex items-start gap-2">
                    <FileSearch className="w-4 h-4 text-echo-info shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-echo-info font-medium">Verified Status</p>
                      <p className="text-[10px] text-echo-muted mt-0.5">
                        Verified means reviewed for compatibility and safety. Verified does not mean made by ECHO.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
