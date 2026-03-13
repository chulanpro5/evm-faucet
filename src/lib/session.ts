import { getIronSession, type SessionOptions } from "iron-session"
import { cookies } from "next/headers"

export interface SessionData {
  isAdmin?: boolean
}

export const sessionOptions: SessionOptions = {
  cookieName: "evm-faucet-session",
  password: process.env.SESSION_PASSWORD ?? "change-me-in-production-32-chars!!",
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
