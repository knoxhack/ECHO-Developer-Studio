import { useAuth } from '@/hooks/useAuth'
import { StatusBadge } from '@/components/StatusBadge'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import {
  Activity, AlertTriangle, Box, CheckCircle2, Cpu, FileCheck, Gamepad2,
  Layers, Package, Rocket, ScrollText, Shield, Terminal, TrendingUp, Zap,
} from 'lucide-react'

function StatCard({ icon, label, value, sub, color = 'text-echo-text' }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-echo-border bg-echo-surface p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded bg-echo-elevated flex items-center justify-center">{icon}</div>
        <span className="text-xs font-medium text-echo-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <p className="text-xs text-echo-muted mt-1">{sub}</p>}
    </div>
  )
}

interface MissionControlProps {
  scan: WorkspaceScan | null
}

export default function MissionControl({ scan }: MissionControlProps) {
  const { user, can } = useAuth()
  const modules = scan?.modules || []
  const healthy = modules.filter((m: any) => m.status === 'healthy').length
  const warnings = modules.filter((m: any) => m.status === 'warning').length
  const blockers = modules.filter((m: any) => m.status === 'blocker').length
  const pendingReviews = 0 // populated via GitHub integration in Phase 4

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Mission Control</h2>
        <p className="text-sm text-echo-muted mt-1">ECHO operations bridge — ecosystem health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="w-4 h-4 text-echo-accent" />} label="Stack Health" value={`${Math.round((healthy / modules.length) * 100) || 0}%`} sub={`${healthy}/${modules.length} modules healthy`} />
        <StatCard icon={<Cpu className="w-4 h-4 text-echo-accent" />} label="Native Readiness" value="78%" sub="Registry abstraction: 92%" />
        <StatCard icon={<Package className="w-4 h-4 text-echo-warning" />} label="PackOS Status" value={`${warnings} warnings`} sub="Validation rules active" color="text-echo-warning" />
        <StatCard icon={<Rocket className="w-4 h-4 text-echo-success" />} label="Launcher Catalog" value="Ready" sub="All channels synchronized" color="text-echo-success" />
        <StatCard icon={<Gamepad2 className="w-4 h-4 text-echo-danger" />} label="Ashfall Beta" value="1 blocker" sub="CombatCore regression" color="text-echo-danger" />
        <StatCard icon={<FileCheck className="w-4 h-4 text-echo-info" />} label="Addon Reviews" value={`${pendingReviews} pending`} sub="7 total in queue" color="text-echo-info" />
        <StatCard icon={<Box className="w-4 h-4 text-echo-accent" />} label="Official Releases" value="2 in progress" sub="Ashfall + Nexus Protocol" />
        <StatCard icon={<Zap className="w-4 h-4 text-echo-warning" />} label="Critical Diagnostics" value="0 open" sub="Last incident: 14h ago" color="text-echo-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-echo-border bg-echo-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-echo-accent" />
              Platform Health {scan && <span className="text-echo-accent text-xs font-mono">(live)</span>}
            </h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-echo-muted"><span className="w-2 h-2 rounded-full bg-echo-success" /> Healthy {healthy}</span>
              <span className="flex items-center gap-1.5 text-echo-muted"><span className="w-2 h-2 rounded-full bg-echo-warning" /> Warnings {warnings}</span>
              <span className="flex items-center gap-1.5 text-echo-muted"><span className="w-2 h-2 rounded-full bg-echo-danger" /> Blockers {blockers}</span>
            </div>
          </div>
          <div className="space-y-2">
            {modules.slice(0, 8).map((mod: any) => (
              <div key={mod.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-echo-elevated transition-colors">
                <div className="flex items-center gap-3">
                  <StatusBadge status={mod.status} />
                  <span className="text-sm font-medium text-echo-text">{mod.name}</span>
                  <span className="text-xs text-echo-muted font-mono">{mod.version}</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-echo-muted">
                  <span className="font-mono">Native {mod.nativeReadiness}%</span>
                  <span className="font-mono">API {mod.apiStability}%</span>
                  <span className="font-mono">Tests {mod.testCoverage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-echo-accent" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {can('run_validation') && (
                <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-echo-success" /> Run Full Stack Validation
                </button>
              )}
              {can('run_build') && (
                <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                  <Box className="w-3.5 h-3.5 text-echo-accent" /> Build Ashfall Beta
                </button>
              )}
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <ScrollText className="w-3.5 h-3.5 text-echo-info" /> Open PackOS Policy
              </button>
              {can('view_addon_review') && (
                <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-echo-warning" /> Review Addon Submissions
                </button>
              )}
              {can('manage_ai_agents') && (
                <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-echo-accent" /> Start Native Migration Agent
                </button>
              )}
              {can('publish_catalog') && (
                <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                  <Rocket className="w-3.5 h-3.5 text-echo-success" /> Publish Launcher Catalog Update
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-echo-accent" />
              Role Summary
            </h3>
            <div className="space-y-2 text-xs text-echo-muted">
              <div className="flex justify-between"><span>Role</span> <span className="text-echo-text capitalize">{user.role.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span>Access</span> <span className="text-echo-text">Official Platform</span></div>
              <div className="flex justify-between"><span>Signing</span> <span className="text-echo-text">{can('sign_artifact') ? 'Allowed' : 'Not allowed'}</span></div>
              <div className="flex justify-between"><span>Addon Review</span> <span className="text-echo-text">{can('approve_addon') ? 'Allowed' : 'Not allowed'}</span></div>
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-echo-accent" />
              Active Builds
            </h3>
            <div className="space-y-3">
              {(scan?.experiences || []).map((exp: any) => (
                <div key={exp.id} className="flex items-center justify-between">
                  <span className="text-xs text-echo-text font-medium">{exp.name}</span>
                  <StatusBadge status={exp.buildStatus || exp.status} />
                </div>
              ))}
              {!(scan?.experiences?.length) && (
                <p className="text-xs text-echo-muted">No experiences configured.</p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-echo-border">
                <span className="text-xs text-echo-text font-medium">ECHO Core</span>
                <StatusBadge status="healthy" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {blockers > 0 && (
        <div className="rounded-lg border border-echo-danger/30 bg-echo-danger/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-echo-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-echo-danger">Release Blockers Detected</h4>
            <p className="text-xs text-echo-muted mt-1">
              {blockers} module(s) have blocker status. Review the Core Modules page for details.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
