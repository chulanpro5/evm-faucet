import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { checkAdminSecret } from "@/lib/crypto"
import { loginSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (!checkAdminSecret(parsed.data.secret)) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
    }

    const session = await getSession()
    session.isAdmin = true
    await session.save()

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
