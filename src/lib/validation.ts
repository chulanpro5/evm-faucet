import { z } from "zod"

export const dripSchema = z.object({
  recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address"),
  tokenKey: z.string().min(1),
})

export const configSchema = z.object({
  rpcUrl: z.string().url().optional(),
  chainId: z.number().int().positive().optional(),
  nativeSymbol: z.string().min(1).max(10).optional(),
  nativeDrip: z.string().regex(/^\d+$/, "Must be a wei amount in digits").optional(),
  explorerUrl: z.string().optional(),
  privateKey: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, "Must be a 32-byte hex private key (0x + 64 hex chars)")
    .optional(),
})

export const tokenSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address"),
  symbol: z.string().min(1).max(20),
  decimals: z.number().int().min(0).max(18),
  dripAmount: z.string().regex(/^\d+$/, "Must be in smallest unit (digits only)"),
  enabled: z.boolean().default(true),
})

export const loginSchema = z.object({
  secret: z.string().min(1),
})
