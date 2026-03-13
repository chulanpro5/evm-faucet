import { NextResponse } from "next/server"
import { migrate } from "@/lib/db/schema"
import { getTokens, getConfig } from "@/lib/db/queries"

migrate()

export async function GET() {
  const config = getConfig()
  const tokens = getTokens(true)

  const nativeOption = config
    ? {
        key: "native",
        symbol: config.nativeSymbol || "ETH",
        dripAmount: config.nativeDrip,
        decimals: 18,
        type: "native" as const,
      }
    : null

  const erc20Options = tokens.map((t) => ({
    key: t.address,
    symbol: t.symbol,
    dripAmount: t.dripAmount,
    decimals: t.decimals,
    type: "erc20" as const,
  }))

  return NextResponse.json({
    tokens: nativeOption ? [nativeOption, ...erc20Options] : erc20Options,
  })
}
