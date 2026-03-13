import { NextRequest, NextResponse } from "next/server"
import { migrate } from "@/lib/db/schema"
import { requireAdmin } from "@/lib/session"
import { getDripLogs } from "@/lib/db/queries"

migrate()

export async function GET(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)))
  const address = url.searchParams.get("address") ?? undefined
  const status = url.searchParams.get("status") ?? undefined

  const { rows, total } = getDripLogs({ page, limit, address, status })
  return NextResponse.json({ rows, total, page, limit })
}
