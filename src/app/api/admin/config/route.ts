import { NextRequest, NextResponse } from "next/server"
import { migrate } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { getConfig, updateConfig } from "@/lib/db/queries"
import { encryptPrivateKey } from "@/lib/crypto"
import { configSchema } from "@/lib/validation"

migrate()

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const config = getConfig()
  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = configSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { privateKey, ...rest } = parsed.data
    const update: Parameters<typeof updateConfig>[0] = { ...rest }

    if (privateKey) {
      const { ciphertext, iv, authTag } = encryptPrivateKey(privateKey)
      update.poolPkEnc = ciphertext
      update.iv = iv
      update.authTag = authTag
    }

    updateConfig(update)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
