import { NextRequest, NextResponse } from "next/server"
import { migrate } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { getTokens, upsertToken, deleteToken } from "@/lib/db/queries"
import { tokenSchema } from "@/lib/validation"

migrate()

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ tokens: getTokens() })
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = tokenSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  upsertToken(parsed.data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { address } = await req.json()
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 })

  deleteToken(address)
  return NextResponse.json({ ok: true })
}
