import db from "./index"
import type { FaucetConfig, Token, DripLog } from "@/types"

// Config

export function getConfig(): FaucetConfig | null {
  const row = db
    .prepare(
      "SELECT id, rpc_url, chain_id, native_symbol, native_drip, explorer_url, pool_pk_enc FROM config WHERE id = 1"
    )
    .get() as Record<string, unknown> | undefined

  if (!row) return null

  return {
    id: row.id as number,
    rpcUrl: row.rpc_url as string,
    chainId: row.chain_id as number,
    nativeSymbol: row.native_symbol as string,
    nativeDrip: row.native_drip as string,
    explorerUrl: row.explorer_url as string,
    pkConfigured: !!(row.pool_pk_enc as string | null),
  }
}

export function getConfigRaw() {
  return db
    .prepare("SELECT * FROM config WHERE id = 1")
    .get() as Record<string, unknown> | undefined
}

export function updateConfig(fields: {
  rpcUrl?: string
  chainId?: number
  nativeSymbol?: string
  nativeDrip?: string
  explorerUrl?: string
  poolPkEnc?: string
  iv?: string
  authTag?: string
}) {
  const sets: string[] = []
  const values: unknown[] = []

  if (fields.rpcUrl !== undefined) { sets.push("rpc_url = ?"); values.push(fields.rpcUrl) }
  if (fields.chainId !== undefined) { sets.push("chain_id = ?"); values.push(fields.chainId) }
  if (fields.nativeSymbol !== undefined) { sets.push("native_symbol = ?"); values.push(fields.nativeSymbol) }
  if (fields.nativeDrip !== undefined) { sets.push("native_drip = ?"); values.push(fields.nativeDrip) }
  if (fields.explorerUrl !== undefined) { sets.push("explorer_url = ?"); values.push(fields.explorerUrl) }
  if (fields.poolPkEnc !== undefined) {
    sets.push("pool_pk_enc = ?", "iv = ?", "auth_tag = ?")
    values.push(fields.poolPkEnc, fields.iv, fields.authTag)
  }

  if (sets.length === 0) return
  sets.push("updated_at = unixepoch()")
  values.push(1)

  db.prepare(`UPDATE config SET ${sets.join(", ")} WHERE id = ?`).run(...values)
}

// Tokens

export function getTokens(onlyEnabled = false): Token[] {
  const sql = onlyEnabled
    ? "SELECT * FROM tokens WHERE enabled = 1 ORDER BY symbol"
    : "SELECT * FROM tokens ORDER BY symbol"
  const rows = db.prepare(sql).all() as Record<string, unknown>[]
  return rows.map(rowToToken)
}

export function getTokenByAddress(address: string): Token | null {
  const row = db
    .prepare("SELECT * FROM tokens WHERE address = ?")
    .get(address.toLowerCase()) as Record<string, unknown> | undefined
  return row ? rowToToken(row) : null
}

export function upsertToken(token: Omit<Token, "id">) {
  db.prepare(`
    INSERT INTO tokens (address, symbol, decimals, drip_amount, enabled)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET
      symbol = excluded.symbol,
      decimals = excluded.decimals,
      drip_amount = excluded.drip_amount,
      enabled = excluded.enabled
  `).run(
    token.address.toLowerCase(),
    token.symbol,
    token.decimals,
    token.dripAmount,
    token.enabled ? 1 : 0
  )
}

export function deleteToken(address: string) {
  db.prepare("DELETE FROM tokens WHERE address = ?").run(address.toLowerCase())
}

// Drip log

export function insertDripLog(entry: {
  recipient: string
  tokenType: "native" | "erc20"
  tokenAddress: string | null
  amount: string
}): number {
  const result = db
    .prepare(`
      INSERT INTO drip_log (recipient, token_type, token_address, amount)
      VALUES (?, ?, ?, ?)
    `)
    .run(entry.recipient, entry.tokenType, entry.tokenAddress, entry.amount)
  return result.lastInsertRowid as number
}

export function updateDripLog(
  id: number,
  update: { txHash?: string; status: "sent" | "failed"; errorMsg?: string }
) {
  db.prepare(`
    UPDATE drip_log SET tx_hash = ?, status = ?, error_msg = ? WHERE id = ?
  `).run(update.txHash ?? null, update.status, update.errorMsg ?? null, id)
}

export function getDripLogs(opts: {
  page: number
  limit: number
  address?: string
  status?: string
}): { rows: DripLog[]; total: number } {
  const conditions: string[] = []
  const values: unknown[] = []

  if (opts.address) { conditions.push("recipient = ?"); values.push(opts.address) }
  if (opts.status) { conditions.push("status = ?"); values.push(opts.status) }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const offset = (opts.page - 1) * opts.limit

  const total = (
    db.prepare(`SELECT COUNT(*) as c FROM drip_log ${where}`).get(...values) as { c: number }
  ).c

  const rows = db
    .prepare(`SELECT * FROM drip_log ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...values, opts.limit, offset) as Record<string, unknown>[]

  return { rows: rows.map(rowToLog), total }
}

// Row mappers

function rowToToken(row: Record<string, unknown>): Token {
  return {
    id: row.id as number,
    address: row.address as string,
    symbol: row.symbol as string,
    decimals: row.decimals as number,
    dripAmount: row.drip_amount as string,
    enabled: (row.enabled as number) === 1,
  }
}

function rowToLog(row: Record<string, unknown>): DripLog {
  return {
    id: row.id as number,
    recipient: row.recipient as string,
    tokenType: row.token_type as "native" | "erc20",
    tokenAddress: row.token_address as string | null,
    amount: row.amount as string,
    txHash: row.tx_hash as string | null,
    status: row.status as "pending" | "sent" | "failed",
    errorMsg: row.error_msg as string | null,
    createdAt: row.created_at as number,
  }
}
