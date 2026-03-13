import { NextResponse } from "next/server"
import { getEnvConfig } from "@/lib/config"
import { getPublicClient, getPoolAddress } from "@/lib/blockchain/client"
import { ERC20_ABI } from "@/lib/blockchain/erc20"
import type { Address } from "viem"

export async function GET() {
  try {
    const cfg = getEnvConfig()
    const publicClient = getPublicClient()
    const poolAddress = getPoolAddress()

    const nativeBalance = (await publicClient.getBalance({ address: poolAddress })).toString()

    const tokenBalances: Record<string, string> = {}
    for (const token of cfg.tokens) {
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

    await publicClient.getBlockNumber()

    return NextResponse.json({
      status: "ok",
      poolAddress,
      nativeBalance,
      nativeSymbol: cfg.nativeSymbol,
      tokenBalances,
      chainId: cfg.chainId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Health check failed"
    return NextResponse.json({ status: "error", error: message }, { status: 503 })
  }
}
