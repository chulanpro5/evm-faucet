import { createPublicClient, createWalletClient, http } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { getEnvConfig } from "@/lib/config"

function getChain() {
  const cfg = getEnvConfig()
  return {
    id: cfg.chainId,
    name: "Custom",
    nativeCurrency: { name: cfg.nativeSymbol, symbol: cfg.nativeSymbol, decimals: 18 },
    rpcUrls: { default: { http: [cfg.rpcUrl] } },
  } as const
}

export function getPublicClient() {
  const cfg = getEnvConfig()
  return createPublicClient({ transport: http(cfg.rpcUrl), chain: getChain() })
}

export function getWalletClient() {
  const cfg = getEnvConfig()
  const account = privateKeyToAccount(cfg.privateKey)
  const walletClient = createWalletClient({
    account,
    transport: http(cfg.rpcUrl),
    chain: getChain(),
  })
  return { walletClient, account }
}

export function getPoolAddress() {
  const cfg = getEnvConfig()
  return privateKeyToAccount(cfg.privateKey).address
}
