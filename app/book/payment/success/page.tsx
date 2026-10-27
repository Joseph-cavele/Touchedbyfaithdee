import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"

export const metadata: Metadata = {
  title: "Payment successful | Touchedbyfaithdee Studio",
  // Nothing here should ever be indexed or shared — it is a receipt.
  robots: { index: false, follow: false },
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex flex-1 flex-col bg-brand-bg text-brand-text selection:bg-brand-accent selection:text-brand-on-accent">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <div className="w-full max-w-md rounded-[28px] bg-brand-surface p-10 text-center shadow-[0_24px_70px_-34px_rgba(0,0,0,0.45)]">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand-accent text-brand-on-accent shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)]">
            <Check className="size-10" strokeWidth={3} aria-hidden />
          </span>

          <h1 className="mt-7 font-display text-2xl font-semibold text-brand-text">
            Payment Successful!
          </h1>

          <p className="mt-3 font-ui text-sm leading-[1.7] text-brand-muted">
            Your payment was processed and your appointment is confirmed. A
            confirmation email is on its way with the details.
          </p>

          <Link
            href="/"
            className="mt-8 block w-full rounded-full bg-brand-accent px-8 py-3.5 font-ui text-sm font-semibold text-brand-on-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:translate-y-0"
          >
            Back to home
          </Link>

          <Link
            href="/services"
            className="mt-3 block font-ui text-xs font-semibold text-brand-muted transition-colors hover:text-brand-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
          >
            Browse other services
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
