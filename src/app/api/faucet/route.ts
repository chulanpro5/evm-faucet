import { NextRequest, NextResponse } from "next/server"
import { dripSchema } from "@/lib/validation"
import { dripNative, dripERC20 } from "@/lib/blockchain/drip"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = dripSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { recipient, tokenKey } = parsed.data

    const result = tokenKey === "native"
      ? await dripNative(recipient)
      : await dripERC20(recipient, tokenKey)

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
