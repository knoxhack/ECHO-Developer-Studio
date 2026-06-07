import { useState } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { Rocket, Send, FileText, Bell, Activity, Download, CheckCircle2, AlertTriangle, Globe } from 'lucide-react'

const channels = [
  { name: 'stable', status: 'healthy', version: '2.4.1', players: 12403 },
  { name: 'beta', status: 'healthy', version: '2.5.0-beta2', players: 2104 },
  { name: 'vanguard', status: 'warning', version: '2.5.0-v3', players: 412 },
  { name: 'experimental-native', status: 'blocker', version: '0.1.0-exp1', players: 12 },
  { name: 'internal', status: 'healthy', version: '2.5.0-dev', players: 34 },
]

const catalogItems = [
  { name: 'Ashfall', version: '1.2.1', channel: 'vanguard', status: 'ready' },
  { name: 'ECHO Prime', version: '1.0.0', channel: 'stable', status: 'ready' },
  { name: 'Arcana Division', version: '0.9.8', channel: 'beta', status: 'ready' },
  { name: 'Nexus Protocol', version: '1.1.0', channel: 'stable', status: 'ready' },
  { name: 'Blackbox Protocol', version: '1.0.2', channel: 'stable', status: 'ready' },
]

export default function Launcher() {
  const [announcement, setAnnouncement] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-echo-text">Launcher</h2>
        <p className="text-sm text-echo-muted mt-1">Player-facing launcher and catalog management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-echo-text flex items-center gap-2">
                <Rocket className="w-4 h-4 text-echo-accent" />
                Launcher Channels
              </h3>
              <StatusBadge status="healthy" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {channels.map((ch) => (
                <div key={ch.name} className="rounded bg-echo-elevated p-3 border border-echo-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-echo-text uppercase">{ch.name}</span>
                    <StatusBadge status={ch.status} />
                  </div>
                  <p className="text-sm font-mono text-echo-text">{ch.version}</p>
                  <p className="text-[10px] text-echo-muted mt-1">{ch.players.toLocaleString()} active players</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-echo-accent" />
              Catalog Management
            </h3>
            <div className="space-y-2">
              {catalogItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded bg-echo-elevated hover:bg-echo-border transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-echo-success" />
                    <div>
                      <p className="text-sm font-medium text-echo-text">{item.name}</p>
                      <p className="text-[10px] text-echo-muted">Channel: {item.channel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-echo-muted">v{item.version}</span>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3">Push Announcement</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Enter player-facing announcement..."
              className="w-full h-24 rounded-md bg-echo-elevated border border-echo-border text-sm text-echo-text placeholder-echo-muted p-3 resize-none focus:outline-none focus:border-echo-accent"
            />
            <button className="mt-2 w-full px-3 py-2 rounded-md bg-echo-accent/10 text-echo-accent text-xs font-medium hover:bg-echo-accent/20 transition-colors flex items-center justify-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Push to Channels
            </button>
          </div>

          <div className="rounded-lg border border-echo-border bg-echo-surface p-5">
            <h3 className="text-sm font-semibold text-echo-text mb-3">Launcher Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-echo-accent" /> Create Catalog Update
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-echo-success" /> Publish Launcher Metadata
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-echo-info" /> Generate Update Manifest
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-echo-warning" /> Push Player Announcement
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-echo-text hover:bg-echo-elevated transition-colors flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-echo-danger" /> Review Diagnostics
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-echo-warning/30 bg-echo-warning/5 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-echo-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-echo-warning">Experimental Native Channel</h4>
              <p className="text-xs text-echo-muted mt-1">
                The experimental-native channel has a blocker and only 12 active players. Consider redirecting to vanguard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
