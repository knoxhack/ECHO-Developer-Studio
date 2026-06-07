import { useState, useEffect, useCallback } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { useAuth } from '@/hooks/useAuth'
import type { WorkspaceScan } from '@/hooks/useWorkspace'
import electronAPI from '@/lib/electronAPI'
import { Bot, Play, Pause, Zap, GitBranch, AlertTriangle } from 'lucide-react'

const AGENT_CATALOG = [
  { id: 'platform-architect', name: 'Platform Architect', type: 'internal', description: 'Inspects official repos and suggests architecture improvements.', permissions: ['view_platform_stack','view_core_modules'] },
  { id: 'native-migration', name: 'Native Migration Agent', type: 'internal', description: 'Creates migration plans for NeoForge-to-Native transitions.', permissions: ['run_migration_agent','edit_module'] },
  { id: 'packos-agent', name: 'PackOS Policy Agent', type: 'internal', description: 'Validates and suggests PackOS policy improvements.', permissions: ['view_packos','edit_packos_policy'] },
  { id: 'build-sentinel', name: 'Build Sentinel', type: 'internal', description: 'Monitors builds and explains failures with fix suggestions.', permissions: ['run_build','run_validation'] },
  { id: 'release-operator', name: 'Release Operator', type: 'internal', description: 'Prepares release notes and artifact metadata.', permissions: ['package_release','view_release_manager'] },
  { id: 'support-analyst', name: 'Support Analyst', type: 'internal', description: 'Analyzes support bundles and generates player responses.', permissions: ['access_support_bundle'] },
  { id: 'security-agent', name: 'Security Review Agent', type: 'internal', description: 'Reviews diffs and addon submissions for security issues.', permissions: ['view_addon_review','approve_addon'] },
  { id: 'docs-agent', name: 'Docs/Changelog Agent', type: 'internal', description: 'Generates documentation and changelogs from commits.', permissions: ['view_core_modules'] },
]

interface AIAgentsProps {
  workspacePath: string | null
}

export default function AIAgents({ workspacePath }: AIAgentsProps) {
  const { user } = useAuth()
  const [selectedAgentId, setSelectedAgentId] = useState(AGENT_CATALOG[1].id)
  const [tasks, setTasks] = useState<any[]>([])
  const [agentOutput, setAgentOutput] = useState<Record<string, string[]>>({})

  const selectedAgent = AGENT_CATALOG.find((a) => a.id === selectedAgentId) || AGENT_CATALOG[0]

  const refreshTasks = useCallback(async () => {
    const status = await electronAPI.agentStatus() as any[]
    setTasks(status)
  }, [])

  useEffect(() => {
    refreshTasks()
    const interval = setInterval(refreshTasks, 3000)
    return () => clearInterval(interval)
  }, [refreshTasks])

  useEffect(() => {
    const cleanup = electronAPI.onAgentOutput((_event, data) => {
      setAgentOutput((prev) => ({
        ...prev,
        [data.id]: [...(prev[data.id] || []), data.line],
      }))
    })
    return () => cleanup()
  }, [])

  const startAgent = async () => {
    if (!workspacePath) return
    const id = await electronAPI.agentStart(selectedAgent.id, `${selectedAgent.name} analyzing workspace`, {
      workspacePath,
      agent: selectedAgent.id,
    })
    await electronAPI.auditAppend({
      actor: user.name,
      action: 'Started AI agent',
      target: selectedAgent.id,
      risk: 'low',
      taskId: id,
    })
    await refreshTasks()
  }

  const stopAgent = async (taskId: string) => {
    await electronAPI.agentStop(taskId)
    await electronAPI.auditAppend({
      actor: user.name,
      action: 'Stopped AI agent',
      target: taskId,
      risk: 'low',
    })
    await refreshTasks()
  }

  const runningTask = tasks.find((t: any) => t.agentId === selectedAgent.id && t.status === 'running')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">AI Agents</h2>
        <p className="text-sm text-echo-muted mt-1">Internal agent system for ECHO platform engineering. {workspacePath && <span className="text-echo-accent font-mono text-xs">(workspace attached)</span>}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {AGENT_CATALOG.map((agent) => {
            const isRunning = (tasks as any[]).some((t: any) => t.agentId === agent.id && t.status === 'running')
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selectedAgentId === agent.id
                    ? 'border-echo-accent/30 bg-echo-accent/5'
                    : 'border-echo-border bg-echo-surface hover:bg-echo-elevated'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-echo-text">{agent.name}</span>
                  <StatusBadge status={isRunning ? 'running' : 'idle'} />
                </div>
                <p className="text-xs text-echo-muted line-clamp-2">{agent.description}</p>
              </button>
            )
          })}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-echo-text flex items-center gap-2">
                  <Bot className="w-5 h-5 text-echo-accent" />
                  {selectedAgent.name}
                </h3>
                <p className="text-xs text-echo-muted mt-1">{selectedAgent.description}</p>
              </div>
              <div className="flex gap-2">
                {runningTask ? (
                  <button
                    onClick={() => stopAgent(runningTask.id)}
                    className="px-3 py-1.5 rounded-md bg-echo-warning/10 text-echo-warning text-xs font-medium hover:bg-echo-warning/20 transition-colors flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Stop Agent
                  </button>
                ) : (
                  <button
                    onClick={startAgent}
                    disabled={!workspacePath}
                    className="px-3 py-1.5 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Agent
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Type</p>
                <p className="text-sm font-semibold text-echo-text capitalize">{selectedAgent.type}</p>
              </div>
              <div className="rounded bg-echo-elevated p-3">
                <p className="text-[10px] text-echo-muted uppercase tracking-wider">Status</p>
                <p className="text-sm font-semibold text-echo-text capitalize">{runningTask ? 'running' : 'idle'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.permissions.map((perm) => (
                  <span key={perm} className="px-2 py-1 rounded bg-echo-elevated text-xs text-echo-text font-mono border border-echo-border">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {Object.entries(agentOutput).filter(([id]) => tasks.some((t: any) => t.id === id && t.agentId === selectedAgent.id)).map(([id, lines]) => (
              <div key={id} className="rounded bg-echo-elevated p-3 border border-echo-border font-mono text-xs text-echo-muted max-h-40 overflow-y-auto">
                {lines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-echo-accent" />
              Active Tasks
            </h3>
            {tasks.length === 0 ? (
              <p className="text-xs text-echo-muted">No active tasks. Start an agent to begin work.</p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded bg-echo-elevated border border-echo-border">
                    <div>
                      <p className="text-xs text-echo-text font-medium">{task.goal}</p>
                      <p className="text-[10px] text-echo-muted">{task.agentId} • {task.status}</p>
                    </div>
                    <StatusBadge status={task.status === 'running' ? 'healthy' : task.status === 'error' ? 'blocker' : 'idle'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
