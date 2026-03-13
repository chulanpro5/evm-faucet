"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [secret, setSecret] = useState("")
  const [error, setError] = useState("")
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => {
        if (r.ok) setAuthed(true)
      })
      .finally(() => setChecking(false))
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLogging(true)
    setError("")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    })
    setLogging(false)
    if (res.ok) {
      setAuthed(true)
    } else {
      setError("Invalid secret")
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setAuthed(false)
    router.push("/")
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4">
        <div className="flex items-center gap-2 mb-2">
          <Logo />
          <span className="font-semibold text-sm">EVM Faucet</span>
        </div>
        <Card className="w-full max-w-sm border-border/60 bg-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="secret"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Admin Secret
                </Label>
                <Input
                  id="secret"
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter admin secret"
                  className="bg-background/60 border-border/60"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={logging}>
                {logging ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to faucet
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Logo />
          <span className="font-semibold text-sm tracking-tight">EVM Faucet</span>
        </Link>
        <span className="text-border/60 select-none">/</span>
        <span className="text-sm text-muted-foreground">Admin</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => router.push("/")}
          >
            Faucet
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-border/60"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
