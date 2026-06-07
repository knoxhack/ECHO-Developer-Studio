import { useState, useEffect, useCallback } from 'react'
import electronAPI from '@/lib/electronAPI'

export interface WorkspaceScan {
  path: string
  modules: any[]
  addons: any[]
  experiences: any[]
}

export function useWorkspace(workspacePath: string | null) {
  const [scan, setScan] = useState<WorkspaceScan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performScan = useCallback(async () => {
    if (!workspacePath) { setScan(null); return }
    setLoading(true)
    setError(null)
    try {
      const result = await electronAPI.scanWorkspace(workspacePath)
      setScan(result as WorkspaceScan)
      await electronAPI.watchWorkspace(workspacePath)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [workspacePath])

  useEffect(() => {
    performScan()
    const cleanup = electronAPI.onWorkspaceChange(() => {
      performScan()
    })
    return () => {
      cleanup()
      electronAPI.unwatchWorkspace()
    }
  }, [performScan])

  return { scan, loading, error, rescan: performScan }
}
