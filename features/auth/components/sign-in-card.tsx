"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { SignInCard2 } from "@/components/ui/sign-in-card-2"
import { loginCodeSchema, loginEmailSchema } from "@/features/auth/schema"

/** Seconds before "send a new code" unlocks — matches the server cooldown. */
const RESEND_COOLDOWN_S = 60

/* What the owner sees for each failure code thrown by auth.ts. */
function verifyErrorMessage(code: string | undefined) {
  if (code?.startsWith("invalid_") && code !== "invalid_format") {
    const left = Number(code.slice("invalid_".length))
    return `That code isn't right. You have ${left} ${left === 1 ? "try" : "tries"} left.`
  }
  switch (code) {
    case "invalid_format":
      return "Enter the 6-digit code from your email."
    case "expired":
      return "That code has expired. Send a new code and try again."
    case "too_many_attempts":
      return "Too many wrong tries — that code no longer works. Send a new code."
    case "not_owner":
      return "This email doesn't have access to the dashboard."
    default:
      return "We couldn't sign you in with that code. Please try again."
  }
}

/** Only same-site paths — never bounce the owner to another website. */
function safeTarget(callbackUrl: string | null) {
  return callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/dashboard"
}

/**
 * Passwordless sign-in for the glass card: email → emailed code → dashboard.
 * Only the owner and the emails the owner allows can sign in. The code is
 * created and emailed by /api/login-code and checked in auth.ts.
 */
export function SignInCard() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [resendIn])

  async function requestCode() {
    const parsed = loginEmailSchema.safeParse({ email })
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Enter a valid email address")
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setNotice(null)

    try {
      const res = await fetch("/api/login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        retryAfterSeconds?: number
      }

      if (!res.ok) {
        // A cooldown means a code is already on its way — move on to the
        // code step rather than strand the owner on the email step.
        if (res.status === 429) {
          setStep("code")
          setResendIn(data.retryAfterSeconds ?? RESEND_COOLDOWN_S)
        }
        const message = data.message ?? "We couldn't send the code. Please try again."
        setFormError(message)
        toast.error(message)
        return
      }

      setStep("code")
      setResendIn(RESEND_COOLDOWN_S)
      setNotice(`We sent a 6-digit code to ${parsed.data.email}. It expires in 10 minutes.`)
      toast.success("Code sent — check your email")
    } catch {
      const message = "We couldn't reach the server. Check your connection and try again."
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function verify(code: string) {
    const parsed = loginCodeSchema.safeParse({ email, code })
    if (!parsed.success) {
      setFormError(parsed.error.issues.at(-1)?.message ?? "Enter the 6-digit code from your email.")
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setNotice(null)

    let result
    try {
      result = await signIn("credentials", { ...parsed.data, redirect: false })
    } catch {
      const message = "Something went wrong while signing in. Please try again."
      setFormError(message)
      toast.error(message)
      setIsSubmitting(false)
      return
    }

    if (result?.error || result?.ok === false) {
      const message = verifyErrorMessage(result?.code)
      setFormError(message)
      toast.error(message)
      setIsSubmitting(false)
      return
    }

    // Hard navigation so the server sees the freshly-set session cookie; a
    // client-side push can be bounced back to /login before it lands.
    // isSubmitting stays true so the spinner shows through the redirect.
    window.location.assign(safeTarget(searchParams.get("callbackUrl")))
  }

  return (
    <SignInCard2
      step={step}
      email={email}
      onEmailChange={(value) => {
        setEmail(value)
        setFormError(null)
      }}
      onRequestCode={requestCode}
      onVerify={verify}
      onResend={requestCode}
      onChangeEmail={() => {
        setStep("email")
        setFormError(null)
        setNotice(null)
      }}
      resendIn={resendIn}
      isLoading={isSubmitting}
      error={formError}
      notice={notice}
    />
  )
}
