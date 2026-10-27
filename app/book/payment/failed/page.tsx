import type { Metadata } from "next"
import Link from "next/link"
import { X } from "lucide-react"

import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { RetryPaymentButton } from "@/features/bookings/components/retry-payment-button"

export const metadata: Metadata = {
  title: "Payment unsuccessful | Touchedbyfaithdee Studio",
  robots: { index: false, follow: false },
}

/**
 * The booking is NOT cancelled when payment fails — it is still sitting at
 * PENDING_PAYMENT with the slot held, which is what makes "Try again" mean
 * something. The copy below says so, because the thing a customer whose card
 * just declined most wants to know is whether they lost the appointment.
 */
export default async function PaymentFailedPage(
  props: PageProps<"/book/payment/failed">
) {
  const { booking } = await props.searchParams
  const bookingId = typeof booking === "string" ? booking : undefined

  return (
    <div className="flex flex-1 flex-col bg-brand-bg text-brand-text selection:bg-brand-accent selection:text-brand-on-accent">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-5 py-20">
        <div className="w-full max-w-md rounded-[28px] bg-brand-surface p-10 text-center shadow-[0_24px_70px_-34px_rgba(0,0,0,0.45)]">
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand-line text-brand-accent-ink">
            <X className="size-10" strokeWidth={3} aria-hidden />
          </span>

          <h1 className="mt-7 font-display text-2xl font-semibold text-brand-text">
            Payment didn&rsquo;t go through
          </h1>

          <p className="mt-3 font-ui text-sm leading-[1.7] text-brand-muted">
            Nothing was charged, and{" "}
            <strong className="font-semibold text-brand-text">
              your appointment slot is still held
            </strong>
            . You can try the payment again, or pay in person when you arrive.
          </p>

          {bookingId && <RetryPaymentButton bookingId={bookingId} />}

          <Link
            href="/book"
            className="mt-3 block w-full rounded-full border border-brand-line px-8 py-3.5 font-ui text-sm font-semibold text-brand-text transition-colors duration-300 hover:border-brand-accent hover:text-brand-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
          >
            Back to booking
          </Link>

          <p className="mt-6 font-ui text-xs leading-[1.6] text-brand-muted">
            Still stuck?{" "}
            <Link href="/#contact" className="font-semibold text-brand-accent-ink underline">
              Get in touch
            </Link>{" "}
            and we&rsquo;ll sort it out.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
