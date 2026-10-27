"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

const RESEND_COOLDOWN_S = 60

async function post(body: object) {
  const res = await fetch("/api/settings/owner-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string; retryAfterSeconds?: number }
  return { res, data }
}

/**
 * Settings → Sign-in email: change the one address that can sign in to the
 * dashboard. The new address gets a code and only becomes the sign-in once
 * that code is entered here — then the owner is signed out to sign back in
 * with it.
 */
export function OwnerEmailForm({ currentEmail }: { currentEmail: string }) {
  const [step, setStep] = useState<"idle" | "code">("idle")
  const [newEmail, setNewEmail] = useState("")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  async function sendCode() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { res, data } = await post({ action: "request", email: newEmail })
      if (!res.ok) {
        if (res.status === 429) {
          setStep("code")
          setResendIn(data.retryAfterSeconds ?? RESEND_COOLDOWN_S)
        }
        setError(data.message ?? "We couldn't send the code. Please try again.")
        return
      }
      setStep("code")
      setCode("")
      setResendIn(RESEND_COOLDOWN_S)
      setNotice(`We sent a 6-digit code to ${newEmail.trim()}. Enter it below to confirm.`)
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const { res, data } = await post({ action: "confirm", email: newEmail, code })
      if (!res.ok) {
        setError(data.message ?? "We couldn't confirm that code. Please try again.")
        setBusy(false)
        return
      }
      toast.success("Sign-in email changed — sign in again with your new email.")
      // The session still carries the old address, so start a fresh one.
      await signOut({ callbackUrl: "/login" })
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
      setBusy(false)
    }
  }

  function cancel() {
    setStep("idle")
    setNewEmail("")
    setCode("")
    setError(null)
    setNotice(null)
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Sign-in email</CardTitle>
        <CardDescription>
          The only address that can sign in to this dashboard. Sign-in codes are sent here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (busy) return
            if (step === "idle") sendCode()
            else confirm()
          }}
          noValidate
        >
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <Mail className="size-4 shrink-0 text-brand-accent-ink" aria-hidden />
            <span className="text-muted-foreground">Current:</span>
            <span className="min-w-0 truncate font-medium">{currentEmail}</span>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : (
            notice && (
              <p role="status" className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-xs">
                {notice}
              </p>
            )
          )}

          <Field>
            <FieldLabel htmlFor="new-owner-email">New sign-in email</FieldLabel>
            <Input
              id="new-owner-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={newEmail}
              readOnly={step === "code"}
              aria-invalid={step === "idle" && !!error}
              onChange={(e) => {
                setNewEmail(e.target.value)
                setError(null)
              }}
            />
          </Field>

          {step === "code" && (
            <Field>
              <FieldLabel htmlFor="owner-email-code">6-digit code sent to the new email</FieldLabel>
              <Input
                id="owner-email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                placeholder="000000"
                aria-invalid={!!error}
                className="font-mono tracking-[0.4em]"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  setError(null)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Didn&rsquo;t get it?{" "}
                {resendIn > 0 ? (
                  <span>Resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy}
                    className="font-medium text-brand-accent-ink underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Send a new code
                  </button>
                )}
              </p>
            </Field>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || !newEmail.trim()} className="rounded-full px-4">
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {step === "idle" ? "Send code" : "Confirm & change"}
            </Button>
            {step === "code" && (
              <Button type="button" variant="outline" onClick={cancel} disabled={busy} className="rounded-full px-4">
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            After the change you&rsquo;ll be signed out, then sign in with the new address.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
