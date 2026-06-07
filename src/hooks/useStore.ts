import { useState, useEffect, useCallback } from 'react'
import electronAPI from '@/lib/electronAPI'

export function useStoreValue<T>(key: string, defaultValue: T) {
  const [value, setValueState] = useState<T>(defaultValue)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    electronAPI.storeGet(key).then((v: any) => {
      if (mounted) {
        setValueState(v !== undefined ? v : defaultValue)
        setLoaded(true)
      }
    })
    return () => { mounted = false }
  }, [key])

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      const nextValue = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next
      electronAPI.storeSet(key, nextValue)
      return nextValue
    })
  }, [key])

  return { value, setValue, loaded }
}

export function useStore() {
  const workspacePath = useStoreValue<string | null>('workspacePath', null)
  const lastRole = useStoreValue<string>('lastRole', 'viewer')
  const settings = useStoreValue<Record<string, unknown>>('settings', {})

  const clearStore = useCallback(async () => {
    await electronAPI.storeClear()
    window.location.reload()
  }, [])

  return { workspacePath, lastRole, settings, clearStore }
}
