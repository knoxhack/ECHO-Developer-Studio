import { useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'

interface DangerDialogProps {
  open: boolean
  title: string
  description: string
  confirmText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function DangerDialog({ open, title, description, confirmText = 'CONFIRM', onConfirm, onCancel }: DangerDialogProps) {
  const [input, setInput] = useState('')
  if (!open) return null

  const confirmed = input === confirmText

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-echo-danger/30 bg-echo-surface p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-echo-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-echo-danger" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-echo-danger">{title}</h3>
            <p className="text-xs text-echo-muted">High-risk action gated</p>
          </div>
        </div>

        <p className="text-sm text-echo-text mb-4">{description}</p>

        <div className="mb-4">
          <label className="text-xs text-echo-muted mb-1 block">Type <span className="font-mono text-echo-danger">{confirmText}</span> to proceed</label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-lg bg-echo-elevated border border-echo-border text-sm text-echo-text p-2.5 focus:outline-none focus:border-echo-danger font-mono uppercase"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-echo-elevated text-echo-text text-sm font-medium hover:bg-echo-border transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (confirmed) { onConfirm(); setInput('') } }}
            disabled={!confirmed}
            className="px-4 py-2 rounded-lg bg-echo-danger/10 text-echo-danger text-sm font-medium hover:bg-echo-danger/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" /> Confirm Action
          </button>
        </div>
      </div>
    </div>
  )
}
