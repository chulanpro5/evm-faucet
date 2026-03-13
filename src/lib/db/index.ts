import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  _db = new Database(path.join(dataDir, "config.db"))
  _db.pragma("journal_mode = WAL")
  _db.pragma("foreign_keys = ON")
  return _db
}

// Proxy: any property access opens DB lazily
const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = getDb()
    const val = (instance as unknown as Record<string | symbol, unknown>)[prop]
    return typeof val === "function" ? val.bind(instance) : val
  },
})

export default db
