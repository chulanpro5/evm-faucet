import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto"

const ALGORITHM = "aes-256-gcm"

function getMasterKey(): Buffer {
  const key = process.env.MASTER_KEY
  if (!key) throw new Error("MASTER_KEY env var is required")
  const buf = Buffer.from(key, "hex")
  if (buf.length !== 32) throw new Error("MASTER_KEY must be 32 bytes (64 hex chars)")
  return buf
}

export function encryptPrivateKey(plaintext: string): {
  ciphertext: string
  iv: string
  authTag: string
} {
  const masterKey = getMasterKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, masterKey, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    ciphertext: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  }
}

export function decryptPrivateKey(
  ciphertext: string,
  iv: string,
  authTag: string
): string {
  const masterKey = getMasterKey()
  const decipher = createDecipheriv(ALGORITHM, masterKey, Buffer.from(iv, "hex"))
  decipher.setAuthTag(Buffer.from(authTag, "hex"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "hex")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}

export function checkAdminSecret(provided: string): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(secret))
  } catch {
    return false
  }
}
