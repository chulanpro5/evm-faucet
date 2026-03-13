import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  isAdmin?: boolean
}

// iron-session requires password >= 32 chars; pad with # if shorter
function makePassword(pw: string): string {
  return pw.padEnd(32, "#")
}

export const sessionOptions: SessionOptions = {
  cookieName: "evm-faucet-session",
  password: makePassword(process.env.SESSION_PASSWORD ?? "change-me-in-prod"),
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session.isAdmin) {
    return null
  }
  return session
}
