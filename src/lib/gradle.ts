import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

export interface GradleBuildInfo {
  version: string
  group: string
  hasWrapper: boolean
  wrapperPath: string
  javaVersion?: string
}

export function readGradleBuild(modulePath: string): GradleBuildInfo {
  const buildFile = path.join(modulePath, 'build.gradle')
  const kotlinBuildFile = path.join(modulePath, 'build.gradle.kts')
  const gradlew = path.join(modulePath, 'gradlew')
  const gradlewBat = path.join(modulePath, 'gradlew.bat')

  const hasWrapper = fs.existsSync(gradlew) || fs.existsSync(gradlewBat)

  let content = ''
  if (fs.existsSync(buildFile)) content = fs.readFileSync(buildFile, 'utf-8')
  else if (fs.existsSync(kotlinBuildFile)) content = fs.readFileSync(kotlinBuildFile, 'utf-8')

  const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/)
  const groupMatch = content.match(/group\s*=\s*['"]([^'"]+)['"]/)

  return {
    version: versionMatch?.[1] || '0.0.0',
    group: groupMatch?.[1] || 'com.echolabs',
    hasWrapper,
    wrapperPath: hasWrapper ? (fs.existsSync(gradlewBat) ? gradlewBat : gradlew) : '',
  }
}

export function findArtifacts(modulePath: string): string[] {
  const libsDir = path.join(modulePath, 'build', 'libs')
  if (!fs.existsSync(libsDir)) return []
  return fs.readdirSync(libsDir).filter((f) => f.endsWith('.jar')).map((f) => path.join(libsDir, f))
}

export interface TestResults {
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  suites: Array<{ name: string; tests: number; failures: number; time: number }>
}

export function readTestResults(modulePath: string): TestResults | null {
  const resultsDir = path.join(modulePath, 'build', 'test-results', 'test')
  if (!fs.existsSync(resultsDir)) return null

  const xmlFiles = fs.readdirSync(resultsDir).filter((f) => f.endsWith('.xml'))
  if (xmlFiles.length === 0) return null

  let total = 0, passed = 0, failed = 0, skipped = 0, duration = 0
  const suites: TestResults['suites'] = []

  for (const xmlFile of xmlFiles) {
    const content = fs.readFileSync(path.join(resultsDir, xmlFile), 'utf-8')
    const testsuiteMatch = content.match(/<testsuite[^>]*\sname="([^"]*)"[^>]*\stests="(\d+)"[^>]*\sfailures="(\d+)"[^>]*\stime="([\d.]+)"/)
    if (testsuiteMatch) {
      const [, name, tests, failures, time] = testsuiteMatch
      const t = parseInt(tests, 10)
      const f = parseInt(failures, 10)
      total += t
      failed += f
      passed += t - f
      duration += parseFloat(time)
      suites.push({ name, tests: t, failures: f, time: parseFloat(time) })
    }
  }

  return { total, passed, failed, skipped, duration, suites }
}

export function runGradleTask(
  modulePath: string,
  tasks: string[],
  onOutput: (line: string) => void,
  onError: (line: string) => void,
  onClose: (code: number) => void
): ReturnType<typeof spawn> {
  const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
  const child = spawn(gradlew, tasks, {
    cwd: modulePath,
    shell: process.platform === 'win32',
    env: process.env,
  })

  child.stdout?.on('data', (data) => {
    data.toString().split('\n').forEach((line: string) => { if (line.trim()) onOutput(line) })
  })
  child.stderr?.on('data', (data) => {
    data.toString().split('\n').forEach((line: string) => { if (line.trim()) onError(line) })
  })
  child.on('close', (code) => { onClose(code ?? 0) })

  return child
}
