"use client"

import { useSyncExternalStore } from "react"
import axios from "axios"
import { useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Sparkles,
} from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"
import { fadeUp } from "@/lib/motion"
import {
  SALON_ADDRESS,
  SALON_EMAIL,
  SALON_HOURS,
  SALON_MAP_QUERY,
  SALON_PHONE,
  SALON_PHONE_DISPLAY,
  WHATSAPP_MESSAGES,
  whatsappLink,
} from "@/lib/salon-contact"
import {
  contactMessageSchema,
  DEFAULT_DIAL_CODE,
  DIAL_CODES,
  type ContactMessageValues,
} from "@/features/contact/schema"

/* ══════════════════════════════════════════════════════════════════════
   REAL-WORLD DETAILS — every value here is a public claim about the
   business. The address drives the map pin and the directions link, so a
   wrong one sends customers to the wrong street.

   All of it is imported, never re-declared. This file used to keep its own
   copies alongside site-header.tsx's, which is how a placeholder number
   survived here after the real one had been set.

   Opening hours come from SALON_HOURS too — the same values the booking
   wizard builds its time slots from.
   ══════════════════════════════════════════════════════════════════════ */
const PHONE = SALON_PHONE_DISPLAY
const WHATSAPP = whatsappLink(WHATSAPP_MESSAGES.general)
const EMAIL = SALON_EMAIL

/* Same hours every day, but kept as seven rows because the list highlights
   the current day — and a day that changes then only needs its own row
   edited. Nothing parses these strings except the `=== "Closed"` check that
   greys a row out. Keep lib/models/Settings.ts in step. */
const DAILY = `${SALON_HOURS.open} – ${SALON_HOURS.close}`
const openingHours = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
].map((day) => ({ day, hours: DAILY }))

/* Hardcoded rather than read from lib/date.ts: SALON_TIMEZONE has no
   NEXT_PUBLIC_ prefix, so it does not reach the browser and would silently
   resolve to undefined here. The literal is the same default. */
const SALON_TIMEZONE = "Africa/Johannesburg"

/* Shared, and built from the geocoder-friendly form rather than the printed
   one — see SALON_MAP_ADDRESS for why the unit number is left out. */
const mapQuery = SALON_MAP_QUERY

/* Which row to highlight is a client-only fact — the server would have to
   guess, and a wrong guess is a hydration mismatch. `useSyncExternalStore`
   is the sanctioned way to say that: the server snapshot is `null` (no row
   highlighted, a perfectly fine first paint) and the client snapshot is the
   real weekday. There is nothing to subscribe to, so `subscribe` returns a
   no-op unsubscribe; the day simply won't change under a visitor who leaves
   the tab open across midnight, which is not worth a timer.

   All three live at module scope because React requires stable references. */
/* The fields below that render their own error message. Anything the schema
   can reject that is NOT in this set has no visible control to attach an
   error to, so a failure on one would leave the button doing nothing at all
   — no toast, no message, no submission. That is exactly how a schema/form
   mismatch hides: silently. `onInvalid` surfaces those as a toast instead. */
const INLINE_ERROR_FIELDS = new Set(["name", "email", "phone", "message"])

const subscribe = () => () => {}
const getServerWeekday = () => null
const getSalonWeekday = () =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: SALON_TIMEZONE,
  }).format(new Date())

export function SiteContact() {
  const reduce = !!useReducedMotion()

  const today = useSyncExternalStore<string | null>(
    subscribe,
    getSalonWeekday,
    getServerWeekday,
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      dialCode: DEFAULT_DIAL_CODE,
      phone: "",
      message: "",
      marketingOptIn: false,
      website: "",
    },
  })

  async function onSubmit(values: ContactMessageValues) {
    try {
      await apiClient.post("/contact", values)
      toast.success("Message sent — we'll get back to you shortly.")
      reset()
    } catch (err) {
      /* The API distinguishes "we couldn't deliver this" from "you sent too
         many". Collapsing both into "something went wrong" would leave
         someone retrying a message that is never going to arrive, so the
         undeliverable cases point at the phone instead. */
      const status = axios.isAxiosError(err) ? err.response?.status : undefined

      if (status === 429) {
        toast.error("That's a few messages already — please try again shortly.")
      } else if (status === 503 || status === 502) {
        toast.error(
          `We couldn't deliver that message. Please call us on ${PHONE} or use WhatsApp.`,
          { duration: 8000 },
        )
      } else {
        toast.error("Could not send your message. Please try again.")
      }
    }
  }

  /* Runs when validation blocks the submit. Any error on a field with no
     inline message would otherwise be invisible — see INLINE_ERROR_FIELDS. */
  function onInvalid(formErrors: FieldErrors<ContactMessageValues>) {
    const unsurfaced = Object.entries(formErrors).find(
      ([field]) => !INLINE_ERROR_FIELDS.has(field),
    )

    if (unsurfaced) {
      const [field, error] = unsurfaced
      console.error(`Contact form blocked by an unsurfaced error on "${field}"`, error)
      toast.error(
        typeof error?.message === "string"
          ? error.message
          : "Please check the form and try again.",
      )
    }
  }

  const reveal = (delay: number, distance = 20) => ({
    initial: "hidden" as const,
    whileInView: "show" as const,
    viewport: { once: true, amount: 0.15 },
    variants: fadeUp(reduce, delay, distance),
  })

  /* Width is kept out of the shared look on purpose. The dial-code select
     used to append `w-auto` to a string that already had `w-full`; both are
     single-class utilities, so whichever Tailwind emits later wins — and
     `w-full` did. With `shrink-0` the select then took the whole row and
     squeezed the phone input to ~34px, too narrow to tap or type into. */
  const fieldClass =
    "rounded-[12px] border border-brand-line bg-brand-surface px-4 py-3 font-ui text-sm text-brand-text outline-none transition-colors placeholder:text-brand-muted/60 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/25"
  const inputClass = `w-full ${fieldClass}`

  const labelClass = "block font-ui text-xs font-semibold text-brand-text"

  return (
    /* Takes over `#contact` from the footer, which held the anchor only
       because there was nothing better to point the nav at. */
    <section
      id="contact"
      className="scroll-mt-24 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,var(--lz-blush)_0%,var(--lz-bg)_60%)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10 xl:px-16">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ── Left: the form ───────────────────────────────────────── */}
          <div>
            <motion.p
              {...reveal(0, 14)}
              className="flex items-center gap-2 font-ui text-[10px] font-semibold tracking-[0.22em] text-brand-accent-ink uppercase sm:text-[11px]"
            >
              <Sparkles className="size-3" aria-hidden />
              Contact
            </motion.p>

            <motion.h2
              {...reveal(0.08)}
              className="mt-4 font-display text-[clamp(1.9rem,4.2vw,2.9rem)] leading-[1.15] font-medium tracking-[-0.01em] text-brand-text"
            >
              Let&rsquo;s talk
            </motion.h2>

            <motion.p
              {...reveal(0.14)}
              className="mt-4 max-w-md font-ui text-sm leading-[1.7] text-brand-muted sm:text-base"
            >
              Not sure which look is right for you?
              Send us a note and we&rsquo;ll come back to you with an honest
              answer.
            </motion.p>

            <motion.form
              {...reveal(0.2, 24)}
              onSubmit={handleSubmit(onSubmit, onInvalid)}
              // Until the page's JavaScript loads, a submit is the browser's
              // own — and its default GET put the name, email and phone
              // number in the address bar (and so in history and logs).
              method="post"
              noValidate
              className="mt-9 flex flex-col gap-5"
            >
              {/* Honeypot — off-screen rather than display:none, which is the
                  first thing a bot checks for. Never focusable, never read. */}
              <div className="absolute -left-[9999px]" aria-hidden>
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </div>

              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Full name <span className="text-brand-accent-ink">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  className={`mt-2 ${inputClass}`}
                  {...register("name")}
                />
                {errors.name && (
                  <p
                    id="contact-name-error"
                    className="mt-1.5 font-ui text-xs text-red-600"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Email <span className="text-brand-accent-ink">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Type your email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  className={`mt-2 ${inputClass}`}
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    id="contact-email-error"
                    className="mt-1.5 font-ui text-xs text-red-600"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-phone" className={labelClass}>
                  Phone number{" "}
                  <span className="font-normal text-brand-muted">(optional)</span>
                </label>
                {/* The dial code is a separate control because the API stores
                    it separately — the route joins it to the national number.
                    Local customers get "+27" preselected and never touch it. */}
                <div className="mt-2 flex gap-2">
                  <select
                    aria-label="Country dial code"
                    className={`${fieldClass} w-auto shrink-0 pr-2`}
                    {...register("dialCode")}
                  >
                    {DIAL_CODES.map((entry) => (
                      <option key={entry.iso} value={entry.code}>
                        {entry.iso} {entry.code}
                      </option>
                    ))}
                  </select>

                  <input
                    id="contact-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="00 000 0000"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                    // min-w-0: an input's intrinsic width would otherwise stop
                    // it shrinking beside the select on a narrow phone.
                    className={`${fieldClass} min-w-0 flex-1`}
                    {...register("phone")}
                  />
                </div>
                {errors.phone && (
                  <p
                    id="contact-phone-error"
                    className="mt-1.5 font-ui text-xs text-red-600"
                  >
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-message" className={labelClass}>
                  How can we help? <span className="text-brand-accent-ink">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Tell us what you're after — service, hair length, when you'd like to come in."
                  aria-invalid={!!errors.message}
                  aria-describedby={
                    errors.message ? "contact-message-error" : undefined
                  }
                  className={`mt-2 resize-y ${inputClass}`}
                  {...register("message")}
                />
                {errors.message && (
                  <p
                    id="contact-message-error"
                    className="mt-1.5 font-ui text-xs text-red-600"
                  >
                    {errors.message.message}
                  </p>
                )}
              </div>

              {/* The reference also carries a required "I accept the privacy
                  policy" tick. Left out on purpose: the only privacy-policy
                  link on this site points at "#", and gating a form on
                  consent to a document that does not exist is worse than not
                  asking. Add it back the moment that page does — and add the
                  matching `consent` field back to features/contact/schema.ts
                  in the same change, or the form silently stops submitting. */}
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-brand-accent"
                  {...register("marketingOptIn")}
                />
                <span className="font-ui text-xs leading-[1.6] text-brand-muted">
                  I&rsquo;d like to hear about new services and offers{" "}
                  <span className="text-brand-muted/70">(optional)</span>
                </span>
              </label>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-accent px-8 py-3.5 font-ui text-sm font-semibold text-brand-on-accent transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isSubmitting && (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  )}
                  {isSubmitting ? "Sending…" : "Send message"}
                </button>
              </div>
            </motion.form>
          </div>

          {/* ── Right: map, hours, direct lines ──────────────────────── */}
          <div className="flex flex-col gap-6">
            <motion.div
              {...reveal(0.1, 28)}
              className="relative h-[300px] overflow-hidden rounded-[22px] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.45)] sm:h-[340px]"
            >
              {/* The plain /maps?q=…&output=embed form needs no API key and no
                  billing account, unlike the Embed API. Lazy so a map far
                  down the page doesn't cost anything on first paint. */}
              <iframe
                title={`Map showing ${SALON_ADDRESS}`}
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-brand-surface px-4 py-2.5 font-ui text-xs font-semibold text-brand-text shadow-[0_12px_28px_-10px_rgba(0,0,0,0.6)] transition-colors hover:bg-brand-accent hover:text-brand-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              >
                <Navigation className="size-3.5" aria-hidden />
                Get directions
              </a>
            </motion.div>

            <motion.div
              {...reveal(0.16, 28)}
              className="rounded-[22px] bg-brand-surface p-7 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.4)] sm:p-8"
            >
              <h3 className="flex items-center gap-2.5 font-display text-lg font-medium text-brand-text">
                <Clock className="size-4 text-brand-accent-ink" aria-hidden />
                Opening hours
              </h3>

              <dl className="mt-5">
                {openingHours.map((entry) => {
                  const isToday = entry.day === today
                  const closed = entry.hours === "Closed"

                  return (
                    <div
                      key={entry.day}
                      className={`flex items-center justify-between gap-4 border-b border-brand-line/60 py-2.5 last:border-0 ${
                        isToday ? "-mx-3 rounded-lg bg-brand-line/35 px-3" : ""
                      }`}
                    >
                      <dt className="font-ui text-sm text-brand-muted">
                        {entry.day}
                        {isToday && (
                          <span className="ml-2 font-semibold text-brand-accent-ink">
                            Today
                          </span>
                        )}
                      </dt>
                      <dd
                        className={`font-ui text-sm font-semibold ${
                          closed ? "text-brand-muted/70" : "text-brand-text"
                        }`}
                      >
                        {entry.hours}
                      </dd>
                    </div>
                  )
                })}
              </dl>

              <div className="mt-7 flex flex-col gap-4 border-t border-brand-line pt-6">
                <p className="flex items-start gap-3 font-ui text-sm text-brand-muted">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-brand-accent-ink"
                    aria-hidden
                  />
                  {SALON_ADDRESS}
                </p>

                {/* Dial the international form, print the local one. Stripping
                    spaces off the display string, as this used to, yields a
                    bare 0-prefixed number that fails from abroad. */}
                <a
                  href={`tel:${SALON_PHONE}`}
                  className="flex items-center gap-3 font-ui text-sm text-brand-muted transition-colors hover:text-brand-accent-ink"
                >
                  <Phone className="size-4 shrink-0 text-brand-accent-ink" aria-hidden />
                  {PHONE}
                </a>

                <a
                  href={`mailto:${EMAIL}`}
                  className="flex items-center gap-3 font-ui text-sm text-brand-muted transition-colors hover:text-brand-accent-ink"
                >
                  <Mail className="size-4 shrink-0 text-brand-accent-ink" aria-hidden />
                  {EMAIL}
                </a>

                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 font-ui text-sm text-brand-muted transition-colors hover:text-brand-accent-ink"
                >
                  <MessageCircle
                    className="size-4 shrink-0 text-brand-accent-ink"
                    aria-hidden
                  />
                  Message us on WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
