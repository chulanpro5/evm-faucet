/**
 * All faucet configuration comes from environment variables.
 * No database is used.
 *
 * Required env vars:
 *   FAUCET_RPC_URL       - RPC endpoint
 *   FAUCET_CHAIN_ID      - chain ID (integer)
 *   FAUCET_PRIVATE_KEY   - pool wallet private key (0x + 64 hex)
 *
 * Optional:
 *   FAUCET_NATIVE_SYMBOL   - e.g. "ETH" (default: "ETH")
 *   FAUCET_NATIVE_DRIP     - wei amount to drip, empty/omit to disable native
 *   FAUCET_EXPLORER_URL    - e.g. "https://explorer.example.com/tx/" (trailing slash)
 *   FAUCET_TOKENS          - JSON array of ERC20 token configs (see below)
 *
 * FAUCET_TOKENS format (JSON string):
 *   [{"address":"0x...","symbol":"USDT","decimals":6,"dripAmount":"1000000"}]
 */

export interface TokenConfig {
  address: string
  symbol: string
  decimals: number
  dripAmount: string // smallest unit
}

export interface FaucetEnvConfig {
  rpcUrl: string
  chainId: number
  privateKey: `0x${string}`
  nativeSymbol: string
  nativeDrip: string | null
  explorerUrl: string | null
  tokens: TokenConfig[]
}

let _config: FaucetEnvConfig | null = null

export function getEnvConfig(): FaucetEnvConfig {
  if (_config) return _config

  const rpcUrl = process.env.FAUCET_RPC_URL
  const chainId = process.env.FAUCET_CHAIN_ID
  const pk = process.env.FAUCET_PRIVATE_KEY

  if (!rpcUrl) throw new Error("FAUCET_RPC_URL is required")
  if (!chainId) throw new Error("FAUCET_CHAIN_ID is required")
  if (!pk) throw new Error("FAUCET_PRIVATE_KEY is required")
  if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) throw new Error("FAUCET_PRIVATE_KEY must be 0x + 64 hex chars")

  const tokensRaw = process.env.FAUCET_TOKENS
  let tokens: TokenConfig[] = []
  if (tokensRaw) {
    tokens = JSON.parse(tokensRaw) as TokenConfig[]
  }

  _config = {
    rpcUrl,
    chainId: parseInt(chainId, 10),
    privateKey: pk as `0x${string}`,
    nativeSymbol: process.env.FAUCET_NATIVE_SYMBOL ?? "ETH",
    nativeDrip: process.env.FAUCET_NATIVE_DRIP ?? null,
    explorerUrl: process.env.FAUCET_EXPLORER_URL ?? null,
    tokens,
  }
  return _config
}
