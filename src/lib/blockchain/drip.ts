import { parseEther, isAddress, type Address } from "viem"
import { getPublicClient, getWalletClient } from "./client"
import { ERC20_ABI } from "./erc20"
import { getConfig, getTokenByAddress, insertDripLog, updateDripLog } from "@/lib/db/queries"
import type { DripResult } from "@/types"

export async function dripNative(recipient: string): Promise<DripResult> {
  if (!isAddress(recipient)) throw new Error("Invalid recipient address")

  const config = getConfig()
  if (!config) throw new Error("Faucet not configured")
  if (!config.pkConfigured) throw new Error("Pool wallet not configured")
  if (config.nativeDrip === "0" || !config.nativeDrip) throw new Error("Native drip amount not set")

  const publicClient = getPublicClient()
  const { walletClient, account } = getWalletClient()

  // Pre-flight balance check
  const balance = await publicClient.getBalance({ address: account.address })
  const dripAmount = BigInt(config.nativeDrip)
  if (balance < dripAmount) {
    throw new Error(
      `Insufficient pool balance: has ${balance.toString()} wei, needs ${dripAmount.toString()} wei`
    )
  }

  const logId = insertDripLog({
    recipient,
    tokenType: "native",
    tokenAddress: null,
    amount: config.nativeDrip,
  })

  try {
    const txHash = await walletClient.sendTransaction({
      to: recipient as Address,
      value: dripAmount,
    })

    updateDripLog(logId, { txHash, status: "sent" })

    return {
      txHash,
      amount: config.nativeDrip,
      tokenSymbol: config.nativeSymbol,
      explorerUrl: config.explorerUrl ? `${config.explorerUrl}${txHash}` : txHash,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    updateDripLog(logId, { status: "failed", errorMsg: msg })
    throw err
  }
}

export async function dripERC20(recipient: string, tokenAddress: string): Promise<DripResult> {
  if (!isAddress(recipient)) throw new Error("Invalid recipient address")
  if (!isAddress(tokenAddress)) throw new Error("Invalid token address")

  const token = getTokenByAddress(tokenAddress)
  if (!token) throw new Error("Token not found or not configured")
  if (!token.enabled) throw new Error("Token is disabled")

  const publicClient = getPublicClient()
  const { walletClient, account } = getWalletClient()

  // Pre-flight token balance check
  const balance = await publicClient.readContract({
    address: tokenAddress as Address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })

  const dripAmount = BigInt(token.dripAmount)
  if ((balance as bigint) < dripAmount) {
    throw new Error(
      `Insufficient token balance: has ${balance?.toString()} wei, needs ${dripAmount.toString()} wei`
    )
  }

  const logId = insertDripLog({
    recipient,
    tokenType: "erc20",
    tokenAddress: tokenAddress.toLowerCase(),
    amount: token.dripAmount,
  })

  try {
    const txHash = await walletClient.writeContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient as Address, dripAmount],
    })

    const config = getConfig()
    updateDripLog(logId, { txHash, status: "sent" })

    return {
      txHash,
      amount: token.dripAmount,
      tokenSymbol: token.symbol,
      explorerUrl: config?.explorerUrl ? `${config.explorerUrl}${txHash}` : txHash,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    updateDripLog(logId, { status: "failed", errorMsg: msg })
    throw err
  }
}
