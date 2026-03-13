import { NextResponse } from "next/server"
import { migrate } from "@/lib/db/schema"
import { getConfig, getTokens } from "@/lib/db/queries"
import { getPublicClient, getPoolAddress } from "@/lib/blockchain/client"
import { ERC20_ABI } from "@/lib/blockchain/erc20"
import type { Address } from "viem"

migrate()

export async function GET() {
  const config = getConfig()
  if (!config) return NextResponse.json({ status: "not_configured" }, { status: 503 })

  try {
    const publicClient = getPublicClient()
    const poolAddress = await getPoolAddress()

    let nativeBalance: string | null = null
    const tokenBalances: Record<string, string> = {}

    if (poolAddress) {
      const balance = await publicClient.getBalance({ address: poolAddress })
      nativeBalance = balance.toString()

      const tokens = getTokens(true)
      for (const token of tokens) {
        try {
          const bal = await publicClient.readContract({
            address: token.address as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [poolAddress],
          })
          tokenBalances[token.symbol] = (bal as bigint).toString()
        } catch {
          tokenBalances[token.symbol] = "error"
        }
      }
    }

    // Test RPC connectivity
    await publicClient.getBlockNumber()

    return NextResponse.json({
      status: "ok",
      poolAddress,
      nativeBalance,
      nativeSymbol: config.nativeSymbol,
      tokenBalances,
      chainId: config.chainId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed"
    return NextResponse.json({ status: "error", error: message }, { status: 503 })
  }
}
