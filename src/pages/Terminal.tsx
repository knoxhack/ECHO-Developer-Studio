import { useState, useRef, useEffect, useCallback } from 'react'
import { Terminal as TerminalIcon, Send, Trash2, Play, Square, Copy, ExternalLink } from 'lucide-react'
import electronAPI from '@/lib/electronAPI'

const presets = [
  { label: 'Build all official modules', command: './gradlew build' },
  { label: 'Run Ashfall client', command: './gradlew runClient --mod=ashfall' },
  { label: 'Run PackOS validation', command: './gradlew packosValidate' },
  { label: 'Run Native Loader smoke test', command: './gradlew nativeLoaderSmokeTest' },
  { label: 'Run launcher dev mode', command: 'npm run dev:launcher' },
  { label: 'Run tests', command: './gradlew test' },
  { label: 'Generate datagen', command: './gradlew runData' },
  { label: 'Export beta package', command: './gradlew exportBetaPack' },
]

interface TerminalProps {
  workspacePath: string | null
}

export default function Terminal({ workspacePath }: TerminalProps) {
  const [lines, setLines] = useState<string[]>([
    'ECHO Developer Studio Terminal v0.1.0',
    workspacePath ? `Workspace: ${workspacePath}` : 'No workspace selected. Select one to run commands.',
    '',
  ])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  useEffect(() => {
    const cleanup = electronAPI.onExecOutput((_event, data) => {
      if (data.id !== activeId) return
      if (data.type === 'stdout' || data.type === 'stderr') {
        const text = data.data || ''
        text.split('\n').forEach((line) => {
          if (line.trim()) setLines((prev) => [...prev, line])
        })
      } else if (data.type === 'close') {
        setLines((prev) => [...prev, `\nProcess exited with code ${data.exitCode ?? 0}`, ''])
        setRunning(false)
        setActiveId(null)
      }
    })
    return () => { cleanup() }
  }, [activeId])

  const runCommand = async (cmd: string) => {
    if (!workspacePath) {
      setLines((prev) => [...prev, `$ ${cmd}`, 'Error: No workspace selected.', ''])
      return
    }
    if (running) {
      setLines((prev) => [...prev, 'Error: Another command is already running.', ''])
      return
    }

    setLines((prev) => [...prev, `$ ${cmd}`])
    setRunning(true)

    try {
      const id = await electronAPI.execStream(cmd, workspacePath)
      setActiveId(id)
    } catch (e) {
      setLines((prev) => [...prev, `Error: ${String(e)}`, ''])
      setRunning(false)
    }
  }

  const killCommand = async () => {
    if (activeId) {
      await electronAPI.execKill(activeId)
      setLines((prev) => [...prev, '\nProcess killed.', ''])
      setRunning(false)
      setActiveId(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    runCommand(input.trim())
    setInput('')
  }

  const copyOutput = () => {
    const text = lines.join('\n')
    navigator.clipboard.writeText(text)
  }

  const openInEditor = (line: string) => {
    const match = line.match(/([\w/.-]+\.(java|ts|tsx|json))(?::(\d+))?/)
    if (match && workspacePath) {
      const filePath = match[1].startsWith('/') ? match[1] : `${workspacePath}/${match[1]}`
      electronAPI.openExternal(`file://${filePath}`)
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Terminal</h2>
        <p className="text-sm text-echo-muted mt-1">Repo-aware shell with build presets and command history.</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-72 shrink-0 rounded-lg border border-echo-border bg-echo-surface p-4 space-y-3 overflow-y-auto">
          <h3 className="text-xs font-semibold text-echo-muted uppercase tracking-wider">Command Presets</h3>
          {presets.map((preset) => (
            <button
              key={preset.command}
              onClick={() => runCommand(preset.command)}
              className="w-full text-left p-2.5 rounded-md bg-echo-elevated hover:bg-echo-border transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Play className="w-3 h-3 text-echo-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs text-echo-text font-medium">{preset.label}</span>
              </div>
              <p className="text-[10px] text-echo-muted font-mono mt-1 pl-5">{preset.command}</p>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col rounded-lg border border-echo-border bg-echo-surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-echo-border bg-echo-elevated">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-3.5 h-3.5 text-echo-accent" />
              <span className="text-xs font-medium text-echo-text">{workspacePath ? 'echo-platform' : 'no workspace'}</span>
              {running && <span className="w-2 h-2 rounded-full bg-echo-success animate-pulse" />}
            </div>
            <div className="flex items-center gap-1">
              {running && (
                <button onClick={killCommand} className="p-1.5 hover:bg-echo-danger/10 rounded transition-colors text-echo-danger" title="Kill process">
                  <Square className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={copyOutput} className="p-1.5 hover:bg-echo-border rounded transition-colors" title="Copy output">
                <Copy className="w-3.5 h-3.5 text-echo-muted" />
              </button>
              <button
                onClick={() => setLines([
                  'ECHO Developer Studio Terminal v0.1.0',
                  workspacePath ? `Workspace: ${workspacePath}` : 'No workspace selected.',
                  '',
                ])}
                className="p-1.5 hover:bg-echo-border rounded transition-colors"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5 text-echo-muted" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5">
            {lines.map((line, i) => (
              <div
                key={i}
                onClick={() => openInEditor(line)}
                className={`cursor-default ${
                  line.startsWith('$') ? 'text-echo-accent' :
                  line.startsWith('>') ? 'text-echo-muted' :
                  line.includes('FAILED') || line.includes('error') || line.includes('Error:') ? 'text-echo-danger' :
                  line.includes('PASSED') || line.includes('SUCCESSFUL') || line.includes('BUILD SUCCESSFUL') ? 'text-echo-success' :
                  'text-echo-text'
                } ${line.match(/[\w/.-]+\.(java|ts|tsx|json)(?::\d+)?/) ? 'hover:underline cursor-pointer' : ''}`}
              >
                {line}
                {line.match(/[\w/.-]+\.(java|ts|tsx|json)(?::\d+)?/) && <ExternalLink className="w-3 h-3 inline ml-1 text-echo-muted opacity-0 hover:opacity-100" />}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-echo-border bg-echo-elevated flex items-center gap-2">
            <span className="text-echo-accent font-mono text-xs shrink-0">$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={workspacePath ? 'Enter command...' : 'Select a workspace first...'}
              disabled={!workspacePath}
              className="flex-1 bg-transparent text-xs text-echo-text font-mono placeholder-echo-muted focus:outline-none disabled:opacity-40"
            />
            <button type="submit" disabled={!workspacePath || !input.trim()} className="p-1.5 hover:bg-echo-border rounded transition-colors disabled:opacity-30">
              <Send className="w-3.5 h-3.5 text-echo-accent" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
