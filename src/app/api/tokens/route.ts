import { NextResponse } from "next/server"
import { getEnvConfig } from "@/lib/config"

export async function GET() {
  const cfg = getEnvConfig()

  const nativeOption = cfg.nativeDrip
    ? {
        key: "native",
        symbol: cfg.nativeSymbol,
        dripAmount: cfg.nativeDrip,
        decimals: 18,
        type: "native" as const,
      }
    : null

  const erc20Options = cfg.tokens.map((t) => ({
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
