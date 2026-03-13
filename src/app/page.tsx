"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatUnits } from "viem"
import Link from "next/link"
import { Logo } from "@/components/logo"

interface TokenOption {
  key: string
  symbol: string
  dripAmount: string
  decimals: number
  type: "native" | "erc20"
}

type TxStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; txHash: string; explorerUrl: string; symbol: string; amount: string; decimals: number }
  | { state: "error"; message: string }

export default function FaucetPage() {
  const [tokens, setTokens] = useState<TokenOption[]>([])
  const [selectedToken, setSelectedToken] = useState<string>("")
  const [recipient, setRecipient] = useState("")
  const [status, setStatus] = useState<TxStatus>({ state: "idle" })

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((data) => {
        setTokens(data.tokens ?? [])
        if (data.tokens?.length > 0) setSelectedToken(data.tokens[0].key)
      })
      .catch(() => {})
  }, [])

  const selected = tokens.find((t) => t.key === selectedToken)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recipient || !selectedToken) return
    setStatus({ state: "loading" })

    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, tokenKey: selectedToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ state: "error", message: data.error ?? "Request failed" })
      } else {
        setStatus({
          state: "success",
          txHash: data.txHash,
          explorerUrl: data.explorerUrl,
          symbol: data.tokenSymbol,
          amount: data.amount,
          decimals: selected?.decimals ?? 18,
        })
      }
    } catch {
      setStatus({ state: "error", message: "Network error" })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-sm tracking-tight">EVM Faucet</span>
        </div>
        <Link
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Admin →
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Request Tokens</h1>
            <p className="text-sm text-muted-foreground">
              {selected
                ? `Receive ${formatUnits(BigInt(selected.dripAmount), selected.decimals)} ${selected.symbol}`
                : "Select a token and enter your wallet address"}
            </p>
          </div>

          <Card className="border-border/60 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Token
                  </Label>
                  <Select value={selectedToken} onValueChange={(v) => setSelectedToken(v ?? "")}>
                    <SelectTrigger className="bg-background/60 border-border/60">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokens.map((t) => (
                        <SelectItem key={t.key} value={t.key}>
                          <span className="flex items-center gap-2">
                            {t.symbol}
                            <span className="text-muted-foreground text-xs">
                              {t.type === "native" ? "native" : "ERC20"}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="recipient"
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Recipient Address
                  </Label>
                  <Input
                    id="recipient"
                    placeholder="0x..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="bg-background/60 border-border/60 font-mono text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={status.state === "loading" || !selectedToken}
                >
                  {status.state === "loading" ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    "Request Tokens"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {status.state === "success" && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="size-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Transaction sent
                </CardTitle>
                <CardDescription>
                  {formatUnits(BigInt(status.amount), status.decimals)} {status.symbol} dispatched
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="bg-background/40 rounded-md px-3 py-2 text-xs font-mono text-muted-foreground break-all">
                  {status.explorerUrl !== status.txHash ? (
                    <a
                      href={status.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {status.txHash}
                    </a>
                  ) : (
                    status.txHash
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border/60 text-xs"
                  onClick={() => { setStatus({ state: "idle" }); setRecipient("") }}
                >
                  Request Again
                </Button>
              </CardContent>
            </Card>
          )}

          {status.state === "error" && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5 text-xs shrink-0">Error</Badge>
                  <p className="text-sm text-muted-foreground">{status.message}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border/60 text-xs"
                  onClick={() => setStatus({ state: "idle" })}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
