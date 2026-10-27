"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { startPayment } from "@/features/bookings/start-payment"

/**
 * Retries checkout against the SAME booking, so the customer keeps their slot
 * and their details instead of filling the wizard in again. The server issues
 * a fresh Paystack reference per attempt — reusing the failed one would be
 * rejected as a duplicate.
 */
export function RetryPaymentButton({ bookingId }: { bookingId: string }) {
  const [pending, setPending] = useState(false)

  async function onRetry() {
    setPending(true)
    try {
      await startPayment(bookingId)
      // On success the browser is navigating to Paystack; leave the button
      // spinning rather than flicking back to idle mid-redirect.
    } catch (err) {
      setPending(false)
      toast.error(
        err instanceof Error ? err.message : "Could not start the payment. Please try again."
      )
    }
  }

  return (
    <button
      type="button"
      onClick={onRetry}
      disabled={pending}
      className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-8 py-3.5 font-ui text-sm font-semibold text-brand-on-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Redirecting…" : "Try payment again"}
    </button>
  )
}
