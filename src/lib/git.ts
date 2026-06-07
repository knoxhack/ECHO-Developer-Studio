import { execSync, spawn } from 'child_process'
import path from 'path'

export interface GitInfo {
  branch: string
  lastCommit: string
  lastCommitDate: string
  ahead: number
  behind: number
  dirty: boolean
  untracked: number
  modified: number
  staged: number
  remoteUrl: string
}

function runGit(cwd: string, args: string[]): string {
  try {
    return execSync(`git ${args.join(' ')}`, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim()
  } catch {
    return ''
  }
}

export function getGitInfo(modulePath: string): GitInfo {
  const branch = runGit(modulePath, ['rev-parse', '--abbrev-ref', 'HEAD'])
  const lastCommit = runGit(modulePath, ['log', '-1', '--format=%s'])
  const lastCommitDate = runGit(modulePath, ['log', '-1', '--format=%ar'])
  const remoteUrl = runGit(modulePath, ['remote', 'get-url', 'origin'])

  let ahead = 0, behind = 0
  const ab = runGit(modulePath, ['rev-list', '--left-right', '--count', `${branch}...origin/${branch}`])
  if (ab) {
    const parts = ab.split('\t')
    if (parts.length === 2) {
      ahead = parseInt(parts[0], 10) || 0
      behind = parseInt(parts[1], 10) || 0
    }
  }

  const status = runGit(modulePath, ['status', '--porcelain'])
  const lines = status.split('\n').filter(Boolean)
  const untracked = lines.filter((l) => l.startsWith('??')).length
  const modified = lines.filter((l) => l.startsWith(' M') || l.startsWith('M ') || l.startsWith('MM')).length
  const staged = lines.filter((l) => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ') || l.startsWith('R ')).length

  return {
    branch,
    lastCommit: lastCommit || 'No commits',
    lastCommitDate: lastCommitDate || '',
    ahead,
    behind,
    dirty: lines.length > 0,
    untracked,
    modified,
    staged,
    remoteUrl,
  }
}

export function getGitLog(modulePath: string, limit = 20): Array<{ hash: string; message: string; date: string; author: string }> {
  const out = runGit(modulePath, ['log', `-${limit}`, '--format=%H|%s|%ar|%an'])
  if (!out) return []
  return out.split('\n').filter(Boolean).map((line) => {
    const [hash, message, date, author] = line.split('|')
    return { hash: hash || '', message: message || '', date: date || '', author: author || '' }
  })
}

export function getGitDiff(modulePath: string, commit?: string): string {
  if (commit) {
    return runGit(modulePath, ['show', '--stat', commit])
  }
  return runGit(modulePath, ['diff', '--stat'])
}
