import { describe, expect, it } from 'vitest'

import { selectIndexedProductUpdate, type ReleaseIndexProductEntry } from './productUpdateIndex'

const sha = 'a'.repeat(64)

function productEntry(overrides: Partial<ReleaseIndexProductEntry> = {}): ReleaseIndexProductEntry {
  return {
    id: 'echo-developer-studio',
    kind: 'studio',
    version: '0.1.0',
    sourceRepo: 'knoxhack/ECHO-Developer-Studio',
    validation: 'approved',
    artifacts: {
      windowsSetup: {
        file: 'ECHO-Developer-Studio-0.1.0-Setup.exe',
        url: 'https://github.com/knoxhack/ECHO-Developer-Studio/releases/download/v0.1.0/ECHO-Developer-Studio-0.1.0-Setup.exe',
        sha256: sha,
        size: 100
      },
      windowsSetupBlockmap: {
        file: 'ECHO-Developer-Studio-0.1.0-Setup.exe.blockmap',
        url: 'https://github.com/knoxhack/ECHO-Developer-Studio/releases/download/v0.1.0/ECHO-Developer-Studio-0.1.0-Setup.exe.blockmap',
        sha256: sha,
        size: 10
      },
      latestYml: {
        file: 'latest.yml',
        url: 'https://github.com/knoxhack/ECHO-Developer-Studio/releases/download/v0.1.0/latest.yml',
        sha256: sha,
        size: 1
      }
    },
    ...overrides
  }
}

describe('selectIndexedProductUpdate', () => {
  it('selects exact indexed updater artifacts from an approved Release Index product', () => {
    const update = selectIndexedProductUpdate(productEntry(), 'echo-developer-studio')

    expect(update.feed).toEqual({
      provider: 'github',
      owner: 'knoxhack',
      repo: 'ECHO-Developer-Studio',
      releaseType: 'release'
    })
    expect(update.artifacts.latestYml.name).toBe('latest.yml')
    expect(update.artifacts.installer.name).toBe('ECHO-Developer-Studio-0.1.0-Setup.exe')
    expect(update.artifacts.blockmap?.name).toBe('ECHO-Developer-Studio-0.1.0-Setup.exe.blockmap')
  })

  it('rejects warning product entries before updater feed selection', () => {
    expect(() => selectIndexedProductUpdate(productEntry({ validation: 'warning' }), 'echo-developer-studio')).toThrow(/is warning/)
  })

  it('requires latest.yml and installer artifacts with GitHub URLs and SHA-256 hashes', () => {
    expect(() =>
      selectIndexedProductUpdate(productEntry({
        artifacts: {
          latestYml: {
            file: 'latest.yml',
            url: 'https://github.com/knoxhack/ECHO-Developer-Studio/releases/download/v0.1.0/latest.yml',
            sha256: sha
          }
        }
      }), 'echo-developer-studio')
    ).toThrow(/Windows installer/)

    expect(() =>
      selectIndexedProductUpdate(productEntry({
        artifacts: {
          windowsSetup: {
            file: 'ECHO-Developer-Studio-0.1.0-Setup.exe',
            url: 'https://example.com/ECHO-Developer-Studio-0.1.0-Setup.exe',
            sha256: 'not-a-sha'
          },
          latestYml: {
            file: 'latest.yml',
            url: 'https://github.com/knoxhack/ECHO-Developer-Studio/releases/download/v0.1.0/latest.yml',
            sha256: sha
          }
        }
      }), 'echo-developer-studio')
    ).toThrow(/Windows installer/)
  })
})
