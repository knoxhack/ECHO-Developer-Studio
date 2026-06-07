import crypto from 'crypto'

const SALT_LEN = 32
const ITERATIONS = 100000
const KEYLEN = 64
const DIGEST = 'sha512'

export function hashPassphrase(passphrase: string): string {
  const salt = crypto.randomBytes(SALT_LEN).toString('hex')
  const hash = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassphrase(passphrase: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const computed = crypto.pbkdf2Sync(passphrase, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'))
}

export function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url')
}
