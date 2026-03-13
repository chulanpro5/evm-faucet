"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatUnits } from "viem"
import type { DripLog, FaucetConfig, Token } from "@/types"

// ─── Config Section ─────────────────────────────────────────────────────────

function ConfigSection() {
  const [config, setConfig] = useState<FaucetConfig | null>(null)
  const [form, setForm] = useState({
    rpcUrl: "",
    chainId: "",
    nativeSymbol: "",
    nativeDrip: "",
    explorerUrl: "",
    privateKey: "",
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((data: FaucetConfig) => {
        setConfig(data)
        setForm({
          rpcUrl: data.rpcUrl ?? "",
          chainId: String(data.chainId ?? ""),
          nativeSymbol: data.nativeSymbol ?? "",
          nativeDrip: data.nativeDrip ?? "",
          explorerUrl: data.explorerUrl ?? "",
          privateKey: "",
        })
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    const body: Record<string, unknown> = {
      rpcUrl: form.rpcUrl || undefined,
      chainId: form.chainId ? parseInt(form.chainId, 10) : undefined,
      nativeSymbol: form.nativeSymbol || undefined,
      nativeDrip: form.nativeDrip || undefined,
      explorerUrl: form.explorerUrl || undefined,
    }
    if (form.privateKey) body.privateKey = form.privateKey

    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setSaving(false)
    const data = await res.json()
    if (res.ok) {
      setMsg({ text: "Configuration saved", ok: true })
      setForm((f) => ({ ...f, privateKey: "" }))
      setConfig((c) => (c ? { ...c, pkConfigured: true } : c))
    } else {
      setMsg({ text: data.error ?? "Save failed", ok: false })
    }
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Chain Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm text-muted-foreground">RPC URL</Label>
              <Input
                placeholder="https://..."
                value={form.rpcUrl}
                onChange={(e) => setForm((f) => ({ ...f, rpcUrl: e.target.value }))}
                className="bg-background/60 border-border/60 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Chain ID</Label>
              <Input
                type="number"
                placeholder="1"
                value={form.chainId}
                onChange={(e) => setForm((f) => ({ ...f, chainId: e.target.value }))}
                className="bg-background/60 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Native Symbol</Label>
              <Input
                placeholder="ETH"
                value={form.nativeSymbol}
                onChange={(e) => setForm((f) => ({ ...f, nativeSymbol: e.target.value }))}
                className="bg-background/60 border-border/60"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm text-muted-foreground">Native Drip Amount (wei)</Label>
              <Input
                placeholder="100000000000000000"
                value={form.nativeDrip}
                onChange={(e) => setForm((f) => ({ ...f, nativeDrip: e.target.value }))}
                className="bg-background/60 border-border/60 font-mono text-sm"
              />
              {form.nativeDrip && /^\d+$/.test(form.nativeDrip) && (
                <p className="text-sm text-muted-foreground">
                  = {formatUnits(BigInt(form.nativeDrip), 18)} {form.nativeSymbol || "tokens"}
                </p>
              )}
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-sm text-muted-foreground">Explorer URL prefix</Label>
              <Input
                placeholder="https://testnet.bscscan.com/tx/"
                value={form.explorerUrl}
                onChange={(e) => setForm((f) => ({ ...f, explorerUrl: e.target.value }))}
                className="bg-background/60 border-border/60 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                Pool Wallet Private Key
                {config?.pkConfigured && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    Configured
                  </Badge>
                )}
              </Label>
              <Input
                type="password"
                placeholder={config?.pkConfigured ? "Leave blank to keep current key" : "0x..."}
                value={form.privateKey}
                onChange={(e) => setForm((f) => ({ ...f, privateKey: e.target.value }))}
                className="bg-background/60 border-border/60 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Configuration"
              )}
            </Button>
            {msg && (
              <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {msg.text}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Tokens Section ──────────────────────────────────────────────────────────

function TokensSection() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [form, setForm] = useState({ address: "", symbol: "", decimals: "18", dripAmount: "" })
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  function load() {
    fetch("/api/admin/tokens")
      .then((r) => r.json())
      .then((data) => setTokens(data.tokens ?? []))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const res = await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: form.address,
        symbol: form.symbol,
        decimals: parseInt(form.decimals, 10),
        dripAmount: form.dripAmount,
        enabled: true,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg({ text: "Token added", ok: true })
      setForm({ address: "", symbol: "", decimals: "18", dripAmount: "" })
      load()
    } else {
      setMsg({ text: data.error ?? "Failed to add token", ok: false })
    }
  }

  async function handleDelete(address: string) {
    await fetch("/api/admin/tokens", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    })
    load()
  }

  async function toggleEnabled(token: Token) {
    await fetch("/api/admin/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...token, enabled: !token.enabled }),
    })
    load()
  }

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          ERC20 Tokens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Token Address</Label>
            <Input
              placeholder="0x..."
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="bg-background/60 border-border/60 font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Symbol</Label>
            <Input
              placeholder="USDT"
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              className="bg-background/60 border-border/60"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Decimals</Label>
            <Input
              type="number"
              value={form.decimals}
              onChange={(e) => setForm((f) => ({ ...f, decimals: e.target.value }))}
              className="bg-background/60 border-border/60"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Drip Amount (smallest unit)</Label>
            <Input
              placeholder="10000000000000000000"
              value={form.dripAmount}
              onChange={(e) => setForm((f) => ({ ...f, dripAmount: e.target.value }))}
              className="bg-background/60 border-border/60 font-mono text-sm"
            />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <Button type="submit" size="sm">
              Add Token
            </Button>
            {msg && (
              <p className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>
                {msg.text}
              </p>
            )}
          </div>
        </form>

        {tokens.length > 0 && (
          <div className="border border-border/60 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-sm text-muted-foreground">Symbol</TableHead>
                  <TableHead className="text-sm text-muted-foreground">Address</TableHead>
                  <TableHead className="text-sm text-muted-foreground">Drip</TableHead>
                  <TableHead className="text-sm text-muted-foreground">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.address} className="border-border/60">
                    <TableCell className="font-medium text-sm">{t.symbol}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {t.address.slice(0, 8)}…{t.address.slice(-6)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatUnits(BigInt(t.dripAmount), t.decimals)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.enabled ? "default" : "secondary"}
                        className="text-xs px-1.5 py-0"
                      >
                        {t.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-border/60"
                          onClick={() => toggleEnabled(t)}
                        >
                          {t.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleDelete(t.address)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tokens.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border/40 rounded-lg">
            No ERC20 tokens configured
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── History Section ─────────────────────────────────────────────────────────

function HistorySection() {
  const [logs, setLogs] = useState<DripLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  function load(p: number) {
    fetch(`/api/admin/history?page=${p}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.rows ?? [])
        setTotal(data.total ?? 0)
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <Card className="border-border/60 bg-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Drip History
          </CardTitle>
          <span className="text-sm text-muted-foreground">{total} total</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-border/60 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-sm text-muted-foreground">Time</TableHead>
                <TableHead className="text-sm text-muted-foreground">Recipient</TableHead>
                <TableHead className="text-sm text-muted-foreground">Token</TableHead>
                <TableHead className="text-sm text-muted-foreground">Amount</TableHead>
                <TableHead className="text-sm text-muted-foreground">Status</TableHead>
                <TableHead className="text-sm text-muted-foreground">Tx Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-border/60">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt * 1000).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.recipient.slice(0, 8)}…{log.recipient.slice(-4)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.tokenType === "native" ? "outline" : "secondary"}
                      className="text-xs px-1.5 py-0"
                    >
                      {log.tokenType === "native" ? "Native" : "ERC20"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{log.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.status === "sent"
                          ? "default"
                          : log.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs px-1.5 py-0"
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.txHash
                      ? `${log.txHash.slice(0, 8)}…`
                      : log.errorMsg
                      ? <span className="text-red-400 truncate max-w-[120px] block">{log.errorMsg}</span>
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                    No drips yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-border/60"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-border/60"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <ConfigSection />
      <TokensSection />
      <HistorySection />
    </div>
  )
}
