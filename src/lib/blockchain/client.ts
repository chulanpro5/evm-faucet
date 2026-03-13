import { createPublicClient, createWalletClient, http, type Address } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getConfigRaw } from "@/lib/db/queries"
import { decryptPrivateKey } from "@/lib/crypto"

function getChainConfig() {
  const config = getConfigRaw()
  if (!config || !config.rpc_url) throw new Error("RPC URL not configured")
  return {
    rpcUrl: config.rpc_url as string,
    chainId: config.chain_id as number,
  }
}

export function getPublicClient() {
  const { rpcUrl, chainId } = getChainConfig()
  return createPublicClient({
    transport: http(rpcUrl),
    chain: {
      id: chainId,
      name: "Custom",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    },
  })
}

export function getWalletClient() {
  const raw = getConfigRaw()
  if (!raw) throw new Error("Faucet not configured")
  if (!raw.pool_pk_enc) throw new Error("Pool wallet private key not configured")

  const pk = decryptPrivateKey(
    raw.pool_pk_enc as string,
    raw.iv as string,
    raw.auth_tag as string
  )

  const account = privateKeyToAccount(pk as `0x${string}`)
  const rpcUrl = raw.rpc_url as string
  const chainId = raw.chain_id as number

  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl),
    chain: {
      id: chainId,
      name: "Custom",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    },
  })

  return { walletClient, account }
}

export async function getPoolAddress(): Promise<Address | null> {
  const raw = getConfigRaw()
  if (!raw?.pool_pk_enc) return null
  try {
    const pk = decryptPrivateKey(
      raw.pool_pk_enc as string,
      raw.iv as string,
      raw.auth_tag as string
    )
    const account = privateKeyToAccount(pk as `0x${string}`)
    return account.address
  } catch {
    return null
  }
}
