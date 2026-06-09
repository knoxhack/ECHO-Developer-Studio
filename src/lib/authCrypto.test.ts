import { describe, expect, it } from 'vitest'

import { hashPassphrase, verifyPassphrase } from './authCrypto'

describe('authCrypto', () => {
  it('verifies passphrases against generated hashes', () => {
    const stored = hashPassphrase('correct horse battery staple')

    expect(verifyPassphrase('correct horse battery staple', stored)).toBe(true)
    expect(verifyPassphrase('wrong passphrase', stored)).toBe(false)
  })

  it('rejects malformed stored hashes without throwing', () => {
    expect(verifyPassphrase('passphrase', '')).toBe(false)
    expect(verifyPassphrase('passphrase', 'salt:not-a-valid-length')).toBe(false)
  })
})
