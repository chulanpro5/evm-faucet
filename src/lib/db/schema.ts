import db from "./index"

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      rpc_url       TEXT NOT NULL DEFAULT '',
      chain_id      INTEGER NOT NULL DEFAULT 1,
      native_symbol TEXT NOT NULL DEFAULT 'ETH',
      native_drip   TEXT NOT NULL DEFAULT '0',
      explorer_url  TEXT NOT NULL DEFAULT '',
      pool_pk_enc   TEXT,
      iv            TEXT,
      auth_tag      TEXT,
      updated_at    INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tokens (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      address      TEXT NOT NULL UNIQUE,
      symbol       TEXT NOT NULL,
      decimals     INTEGER NOT NULL DEFAULT 18,
      drip_amount  TEXT NOT NULL DEFAULT '0',
      enabled      INTEGER NOT NULL DEFAULT 1,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS drip_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient     TEXT NOT NULL,
      token_type    TEXT NOT NULL CHECK (token_type IN ('native', 'erc20')),
      token_address TEXT,
      amount        TEXT NOT NULL,
      tx_hash       TEXT,
      status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      error_msg     TEXT,
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    INSERT OR IGNORE INTO config (id, updated_at) VALUES (1, unixepoch());
  `)
}
