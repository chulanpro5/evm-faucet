import { isAddress, type Address } from "viem"
import { getPublicClient, getWalletClient } from "./client"
import { ERC20_ABI } from "./erc20"
import { getEnvConfig } from "@/lib/config"
import type { DripResult } from "@/types"

export async function dripNative(recipient: string): Promise<DripResult> {
  if (!isAddress(recipient)) throw new Error("Invalid recipient address")

  const cfg = getEnvConfig()
  if (!cfg.nativeDrip) throw new Error("Native drip not enabled")

  const publicClient = getPublicClient()
  const { walletClient, account } = getWalletClient()

  const balance = await publicClient.getBalance({ address: account.address })
  const dripAmount = BigInt(cfg.nativeDrip)
  if (balance < dripAmount) {
    throw new Error(`Insufficient pool balance: has ${balance} wei, needs ${dripAmount} wei`)
  }

  const txHash = await walletClient.sendTransaction({
    to: recipient as Address,
    value: dripAmount,
  })

  return {
    txHash,
    amount: cfg.nativeDrip,
    tokenSymbol: cfg.nativeSymbol,
    explorerUrl: cfg.explorerUrl ? `${cfg.explorerUrl}${txHash}` : txHash,
  }
}

export async function dripERC20(recipient: string, tokenAddress: string): Promise<DripResult> {
  if (!isAddress(recipient)) throw new Error("Invalid recipient address")
  if (!isAddress(tokenAddress)) throw new Error("Invalid token address")

  const cfg = getEnvConfig()
  const token = cfg.tokens.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
  if (!token) throw new Error("Token not found or not configured")

  const publicClient = getPublicClient()
  const { walletClient, account } = getWalletClient()

  const balance = await publicClient.readContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })

  const dripAmount = BigInt(token.dripAmount)
  if ((balance as bigint) < dripAmount) {
    throw new Error(`Insufficient token balance: has ${balance} units, needs ${dripAmount}`)
  }

  const txHash = await walletClient.writeContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [recipient as Address, dripAmount],
  })

  return {
    txHash,
    amount: token.dripAmount,
    tokenSymbol: token.symbol,
    explorerUrl: cfg.explorerUrl ? `${cfg.explorerUrl}${txHash}` : txHash,
  }
}
