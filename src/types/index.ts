export interface FaucetConfig {
  id: number
  rpcUrl: string
  chainId: number
  nativeSymbol: string
  nativeDrip: string // wei string
  explorerUrl: string
  pkConfigured: boolean
}

export interface Token {
  id: number
  address: string
  symbol: string
  decimals: number
  dripAmount: string // smallest unit string
  enabled: boolean
}

export interface DripLog {
  id: number
  recipient: string
  tokenType: "native" | "erc20"
  tokenAddress: string | null
  amount: string
  txHash: string | null
  status: "pending" | "sent" | "failed"
  errorMsg: string | null
  createdAt: number
}

export interface DripRequest {
  recipient: string
  tokenKey: "native" | string // 'native' or ERC20 address
}

export interface DripResult {
  txHash: string
  amount: string
  tokenSymbol: string
  explorerUrl: string
}
