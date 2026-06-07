import fs from 'fs'

export interface CrashReport {
  time: string
  description: string
  exception: string
  stackTrace: string[]
  modList: Array<{ modId: string; version: string; state: string }>
  echoModules: string[]
  externalMods: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedFix?: string
}

export function parseCrashReport(filePath: string): CrashReport | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    const timeMatch = content.match(/Time: ([^\n]+)/)
    const descMatch = content.match(/Description: ([^\n]+)/)
    const exceptionMatch = content.match(/([\w.]+Exception): ([^\n]+)/)

    const stackLines: string[] = []
    const lines = content.split('\n')
    let inStack = false
    for (const line of lines) {
      if (line.includes('at ') && line.includes('(')) {
        inStack = true
        stackLines.push(line.trim())
      } else if (inStack && !line.trim().startsWith('at ')) {
        inStack = false
      }
    }

    const modList: CrashReport['modList'] = []
    const echoModules: string[] = []
    const externalMods: string[] = []

    const modSection = content.match(/Loaded Mods:[\s\S]*?(?=\n\n|$)/)
    if (modSection) {
      const modLines = modSection[0].split('\n').slice(1)
      for (const line of modLines) {
        const match = line.match(/([^|]+)\|([^|]+)\|([^|]+)/)
        if (match) {
          const [, modId, version, state] = match.map((s) => s.trim())
          modList.push({ modId, version, state })
          if (modId.toLowerCase().startsWith('echo') || modId.toLowerCase().includes('echo')) {
            echoModules.push(modId)
          } else {
            externalMods.push(modId)
          }
        }
      }
    }

    const exception = exceptionMatch ? `${exceptionMatch[1]}: ${exceptionMatch[2]}` : 'Unknown Exception'
    const severity = classifySeverity(exception, stackLines, echoModules.length)
    const suggestedFix = suggestFix(exception, stackLines)

    return {
      time: timeMatch?.[1] || 'Unknown',
      description: descMatch?.[1] || 'Unknown',
      exception,
      stackTrace: stackLines.slice(0, 20),
      modList,
      echoModules,
      externalMods,
      severity,
      suggestedFix,
    }
  } catch {
    return null
  }
}

function classifySeverity(exception: string, stack: string[], echoModCount: number): CrashReport['severity'] {
  const lower = exception.toLowerCase()
  if (lower.includes('outofmemory') || lower.includes('stackoverflow')) return 'critical'
  if (lower.includes('nullpointer') || lower.includes('illegalstate') || lower.includes('classnotfound')) return 'high'
  if (echoModCount > 0) return 'high'
  if (lower.includes('indexoutofbounds') || lower.includes('arrayindex')) return 'medium'
  if (stack.some((s) => s.includes('render') || s.includes('gui'))) return 'medium'
  return 'low'
}

function suggestFix(exception: string, stack: string[]): string | undefined {
  const lower = exception.toLowerCase()
  if (lower.includes('nullpointer')) return 'Check for missing null checks in the referenced method. Review recent changes to field initialization.'
  if (lower.includes('classnotfound')) return 'Verify all dependencies are declared in build.gradle. Check for renamed/moved classes.'
  if (lower.includes('outofmemory')) return 'Increase JVM heap size (-Xmx). Check for memory leaks in long-running operations.'
  if (lower.includes('nosuchmethod')) return 'Verify API compatibility. The calling code may reference a method that no longer exists.'
  if (stack.some((s) => s.includes('registry'))) return 'Check that all registries are properly initialized during mod construction.'
  return undefined
}

export function findCrashReports(dirPath: string): string[] {
  const crashDir = `${dirPath}/crash-reports`
  if (!fs.existsSync(crashDir)) return []
  return fs.readdirSync(crashDir)
    .filter((f) => f.startsWith('crash-') && f.endsWith('.txt'))
    .map((f) => `${crashDir}/${f}`)
    .sort()
    .reverse()
}
