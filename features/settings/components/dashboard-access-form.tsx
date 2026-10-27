"use client"

import { useState } from "react"
import { Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

type DashboardUser = { name: string; email: string }

async function call(method: "POST" | "DELETE", body: object) {
  const res = await fetch("/api/settings/access", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string; users?: DashboardUser[] }
  return { ok: res.ok, data }
}

/**
 * Settings → Dashboard access: the owner decides who else may sign in (by
 * emailed code). Everyone listed gets the dashboard; only the owner can add
 * or remove people. Others see the list read-only.
 */
export function DashboardAccessForm({
  ownerEmail,
  initialUsers,
  canManage,
}: {
  ownerEmail: string
  initialUsers: DashboardUser[]
  canManage: boolean
}) {
  const [users, setUsers] = useState(initialUsers)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState<string | null>(null) // "add" | email being removed
  const [error, setError] = useState<string | null>(null)

  async function add() {
    setBusy("add")
    setError(null)
    try {
      const { ok, data } = await call("POST", { name, email })
      if (!ok) {
        setError(data.message ?? "We couldn't add that email. Please try again.")
        return
      }
      setUsers(data.users ?? users)
      toast.success(`${name.trim()} can now sign in`)
      setName("")
      setEmail("")
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setBusy(null)
    }
  }

  async function remove(user: DashboardUser) {
    setBusy(user.email)
    setError(null)
    try {
      const { ok, data } = await call("DELETE", { email: user.email })
      if (!ok) {
        setError(data.message ?? "We couldn't remove that email. Please try again.")
        return
      }
      setUsers(data.users ?? users.filter((u) => u.email !== user.email))
      toast.success(`${user.name} can no longer sign in`)
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Dashboard access</CardTitle>
        <CardDescription>
          Only these emails can sign in to the dashboard, with a code sent to their inbox.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <ShieldCheck className="size-4 shrink-0 text-brand-accent-ink" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{ownerEmail}</span>
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Owner</span>
          </li>
          {users.map((user) => (
            <li key={user.email} className="flex items-center gap-2 rounded-lg border border-brand-line px-3 py-2 text-sm">
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </span>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(user)}
                  disabled={busy !== null}
                  aria-label={`Remove ${user.name}'s access`}
                  className="cursor-pointer text-destructive hover:bg-destructive/10"
                >
                  {busy === user.email ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
                </Button>
              )}
            </li>
          ))}
          {users.length === 0 && (
            <li className="px-1 text-xs text-muted-foreground">Nobody else has access yet.</li>
          )}
        </ul>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        {canManage ? (
          <form
            className="flex flex-col gap-3 border-t border-brand-line pt-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!busy) add()
            }}
            noValidate
          >
            <p className="text-sm font-medium">Allow someone to sign in</p>
            <Field>
              <FieldLabel htmlFor="access-name">Name</FieldLabel>
              <Input
                id="access-name"
                autoComplete="off"
                placeholder="e.g. Faith"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="access-email">Email</FieldLabel>
              <Input
                id="access-email"
                type="email"
                autoComplete="off"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
              />
            </Field>
            <Button
              type="submit"
              disabled={busy !== null || !name.trim() || !email.trim()}
              className="cursor-pointer self-start rounded-full px-4"
            >
              {busy === "add" ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />}
              Add access
            </Button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">Only the salon owner can change who has access.</p>
        )}
      </CardContent>
    </Card>
  )
}
