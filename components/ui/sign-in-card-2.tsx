"use client"

import { useState } from "react"
import NextImage from "next/image"
import Link from "next/link"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type TargetAndTransition,
  type Transition,
} from "motion/react"
import { ArrowRight, KeyRound, Mail } from "lucide-react"

import { BackgroundPaths } from "@/components/ui/modern-background-paths"
import { cn } from "@/lib/utils"
import { salonImages } from "@/lib/salon-assets"

/**
 * Glass sign-in card with a 3D pointer tilt, a light beam that travels the
 * border, and the marketing hero's backdrop behind it.
 *
 * Deliberately reuses SiteHero's recipe rather than inventing a second dark
 * theme: same salon photograph at the same brightness/saturation, same dark
 * scrim, same gold filaments, same dark glass. Signing in should feel
 * like the same building as the homepage, one room further in.
 *
 * Presentational only — passwordless, in two steps: the email (step
 * "email"), then the 6-digit code emailed to it (step "code"). The parent
 * owns the email, the step and the resend countdown; the card owns the code
 * field. The auth wiring stays in `features/auth`.
 */

/* The styling station rather than the hero's wide room shot — deliberately a
   different corner of the salon, so signing in doesn't feel like the homepage
   repeating itself. Its ring-lit mirror also sits dead centre, which gives the
   gold bloom behind the card a light source in the photograph to grow out
   of instead of floating over a flat scrim. */
const BACKDROP = salonImages.salonStation.src
const LOGO_MARK = salonImages.logo.src

/**
 * The four border beams. Each slides along one edge by animating the offset
 * property it starts pinned to, so `axis` doubles as the animated key.
 */
const BEAMS = [
  { axis: "left", edge: "top-0 left-0 h-[3px] w-1/2 bg-linear-to-r", delay: 0 },
  { axis: "top", edge: "top-0 right-0 h-1/2 w-[3px] bg-linear-to-b", delay: 0.6 },
  { axis: "right", edge: "bottom-0 right-0 h-[3px] w-1/2 bg-linear-to-r", delay: 1.2 },
  { axis: "bottom", edge: "bottom-0 left-0 h-1/2 w-[3px] bg-linear-to-b", delay: 1.8 },
] as const

/** Corner sparks, brightest on the two corners the beams hand off at. */
const CORNERS = [
  { at: "top-0 left-0 size-[5px] blur-[1px]", tint: "bg-brand-line/50", duration: 2, delay: 0 },
  { at: "top-0 right-0 size-[8px] blur-[2px]", tint: "bg-brand-accent/70", duration: 2.4, delay: 0.5 },
  { at: "bottom-0 right-0 size-[8px] blur-[2px]", tint: "bg-brand-accent/70", duration: 2.2, delay: 1 },
  { at: "bottom-0 left-0 size-[5px] blur-[1px]", tint: "bg-brand-line/50", duration: 2.3, delay: 1.5 },
] as const

type FocusedInput = "email" | "code" | null

export type SignInCard2Props = {
  step: "email" | "code"
  email: string
  onEmailChange: (email: string) => void
  /** Step "email": send a code to `email`. */
  onRequestCode: () => void
  /** Step "code": check the code the owner typed. */
  onVerify: (code: string) => void
  /** Step "code": email a fresh code. */
  onResend: () => void
  /** Step "code": go back and fix the email. */
  onChangeEmail: () => void
  /** Seconds until another code may be requested; 0 = now. */
  resendIn?: number
  /** Swaps the button label for a spinner and blocks re-submits. */
  isLoading?: boolean
  /** Shown above the fields in red, e.g. "That code isn't right". */
  error?: string | null
  /** Shown above the fields in gold, e.g. "We sent a code to …". */
  notice?: string | null
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export function SignInCard2({
  step,
  email,
  onEmailChange,
  onRequestCode,
  onVerify,
  onResend,
  onChangeEmail,
  resendIn = 0,
  isLoading = false,
  error,
  notice,
}: SignInCard2Props) {
  const [code, setCode] = useState("")
  const [focusedInput, setFocusedInput] = useState<FocusedInput>(null)

  // `useReducedMotion` is null on the server, so coerce before branching —
  // otherwise the first client render disagrees with the HTML and React
  // throws a hydration mismatch.
  const reduce = useReducedMotion() ?? false

  // Pointer-driven 3D tilt. The raw offset from the card's centre maps to a
  // ±10° rotation; leaving the card springs both values back to rest.
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10])
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10])

  function handleMouseMove(e: React.MouseEvent) {
    if (reduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isLoading) return
    if (step === "email") onRequestCode()
    else onVerify(code)
  }

  return (
    <section className="dark bg-brand-glass relative isolate flex min-h-svh w-full flex-1 items-center justify-center overflow-hidden px-4 py-8">
      {/* ── Backdrop ───────────────────────────────────────────────────
          Same treatment as the hero: desaturated and darkened so the
          gold stays the only saturated thing on the page. */}
      <NextImage
        src={BACKDROP}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center brightness-[0.62] saturate-[0.45]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--lz-bg)_74%,transparent)_0%,color-mix(in_srgb,var(--lz-bg)_54%,transparent)_45%,color-mix(in_srgb,var(--lz-bg)_88%,transparent)_100%)]"
      />

      {/* Gold filaments, over the scrim and under the card. */}
      <BackgroundPaths patterns={["flow", "spiral"]} className="text-brand-accent-ink/60" />

      {/* ── Glow stack ─────────────────────────────────────────────────
          Three layers, largest and softest first, so the card sits in a
          pool of light rather than on a flat wash. They breathe out of
          phase with each other, which keeps the pulse from reading as one
          mechanical throb. */}
      <motion.div
        aria-hidden
        className="bg-brand-accent/12 absolute top-1/2 left-1/2 size-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        animate={reduce ? undefined : { opacity: [0.5, 0.8, 0.5], scale: [0.96, 1.05, 0.96] }}
        transition={{ duration: 9, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        aria-hidden
        className="bg-brand-accent/15 absolute top-1/2 left-1/2 size-[34vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        animate={reduce ? undefined : { opacity: [0.3, 0.55, 0.3], scale: [1.04, 0.96, 1.04] }}
        transition={{ duration: 6.5, repeat: Infinity, repeatType: "mirror", delay: 0.8 }}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={reduce ? undefined : { rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="group relative">
            {/* Ambient halo behind the card. */}
            <motion.div
              className="absolute -inset-px rounded-[28px] opacity-0 transition-opacity duration-700 group-hover:opacity-70"
              animate={
                reduce
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 10px 2px color-mix(in_srgb,var(--lz-gold)_6%,transparent)",
                        "0 0 18px 6px color-mix(in_srgb,var(--lz-gold)_12%,transparent)",
                        "0 0 10px 2px color-mix(in_srgb,var(--lz-gold)_6%,transparent)",
                      ],
                      opacity: [0.2, 0.45, 0.2],
                    }
              }
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
            />

            {/* Light beams chasing each other around the border. */}
            <div className="absolute -inset-px overflow-hidden rounded-[28px]">
              {BEAMS.map(({ axis, edge, delay }) => (
                <motion.div
                  key={axis}
                  className={cn(
                    "via-brand-line absolute from-transparent to-transparent opacity-70",
                    edge
                  )}
                  initial={{ filter: "blur(2px)" }}
                  animate={
                    reduce
                      ? undefined
                      : ({
                          [axis]: ["-50%", "100%"],
                          opacity: [0.3, 0.7, 0.3],
                          filter: ["blur(1px)", "blur(2.5px)", "blur(1px)"],
                        } as TargetAndTransition)
                  }
                  transition={
                    {
                      [axis]: {
                        duration: 2.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                        delay,
                      },
                      opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay },
                      filter: { duration: 1.5, repeat: Infinity, repeatType: "mirror", delay },
                    } as Transition
                  }
                />
              ))}

              {CORNERS.map(({ at, tint, duration, delay }) => (
                <motion.div
                  key={at}
                  className={cn("absolute rounded-full", at, tint)}
                  animate={reduce ? undefined : { opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration, repeat: Infinity, repeatType: "mirror", delay }}
                />
              ))}
            </div>

            {/* Rim light. Always on at 45% so the card reads as lit rather
                than merely outlined, and brightens toward the pointer. */}
            <div className="from-brand-accent/20 via-brand-accent/50 to-brand-accent/20 absolute -inset-[0.5px] rounded-[28px] bg-linear-to-r opacity-45 blur-[2px] transition-opacity duration-500 group-hover:opacity-90" />

            {/* Glass card — the hero's dark glass with a gold edge,
                so it lifts off the photograph the same way. */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-brand-glass/70 p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_60px_-15px_color-mix(in_srgb,var(--lz-gold)_45%,transparent)] backdrop-blur-[20px] sm:p-7">
              {/* Logo and header */}
              <div className="mb-5 text-center">
                <motion.h1
                  initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="relative mx-auto w-fit"
                >
                  {/* Halo behind the logo, so it lifts off the glass. */}
                  <motion.span
                    aria-hidden
                    className="bg-brand-accent/25 absolute -inset-x-4 -inset-y-1 rounded-full blur-xl"
                    animate={reduce ? undefined : { opacity: [0.45, 0.85, 0.45] }}
                    transition={{ duration: 3.5, repeat: Infinity, repeatType: "mirror" }}
                  />
                  <NextImage
                    src={LOGO_MARK}
                    alt={salonImages.logo.alt}
                    width={salonImages.logo.width}
                    height={salonImages.logo.height}
                    priority
                    className="relative h-16 w-auto"
                  />
                </motion.h1>

                <motion.p
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="font-ui text-brand-accent-ink -mt-1 text-[10px] font-semibold tracking-[0.22em] uppercase"
                >
                  Studio
                </motion.p>

                <motion.p
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-3 text-sm text-white/70"
                >
                  {step === "email"
                    ? "Enter your email and we’ll send you a sign-in code."
                    : "Enter the 6-digit code we emailed you."}
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                {error ? (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs text-red-100"
                  >
                    {error}
                  </p>
                ) : (
                  notice && (
                    <p
                      role="status"
                      className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-xs text-brand-text"
                    >
                      {notice}
                    </p>
                  )
                )}

                <div className="space-y-3">
                  {/* Email */}
                  <motion.div
                    className={cn("relative", focusedInput === "email" && "z-10")}
                    whileHover={reduce ? undefined : { scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail
                        aria-hidden
                        className={cn(
                          "pointer-events-none absolute left-3 size-4 transition-colors duration-300",
                          focusedInput === "email" ? "text-brand-accent-ink" : "text-white/40"
                        )}
                      />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="Email address"
                        value={email}
                        readOnly={step === "code"}
                        aria-invalid={step === "email" && !!error}
                        onChange={(e) => onEmailChange(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        className={cn(
                          "focus:border-brand-accent/50 focus-visible:ring-brand-accent/30 h-10 w-full border-white/10 bg-white/5 pl-10 text-white transition-all duration-300 placeholder:text-white/35 focus:bg-white/10",
                          step === "code" ? "pr-20 text-white/70" : "pr-3"
                        )}
                      />
                      {step === "code" && (
                        <button
                          type="button"
                          onClick={() => {
                            setCode("")
                            onChangeEmail()
                          }}
                          className="hover:text-brand-accent-ink absolute right-3 cursor-pointer text-xs font-medium text-white/60 transition-colors duration-300"
                        >
                          Change
                        </button>
                      )}
                      {focusedInput === "email" && (
                        <motion.div
                          layoutId="input-highlight"
                          className="absolute inset-0 -z-10 bg-white/5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* One-time code — only once a code has been sent. */}
                  {step === "code" && (
                    <motion.div
                      className={cn("relative", focusedInput === "code" && "z-10")}
                      initial={reduce ? false : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={reduce ? undefined : { scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <KeyRound
                          aria-hidden
                          className={cn(
                            "pointer-events-none absolute left-3 size-4 transition-colors duration-300",
                            focusedInput === "code" ? "text-brand-accent-ink" : "text-white/40"
                          )}
                        />
                        <Input
                          id="code"
                          name="code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          autoFocus
                          required
                          aria-label="6-digit sign-in code"
                          aria-invalid={!!error}
                          placeholder="6-digit code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          onFocus={() => setFocusedInput("code")}
                          onBlur={() => setFocusedInput(null)}
                          className="focus:border-brand-accent/50 focus-visible:ring-brand-accent/30 h-11 w-full border-white/10 bg-white/5 pr-3 pl-10 font-mono text-lg tracking-[0.5em] text-white transition-all duration-300 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-white/35 focus:bg-white/10"
                        />
                        {focusedInput === "code" && (
                          <motion.div
                            layoutId="input-highlight"
                            className="absolute inset-0 -z-10 bg-white/5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Resend — only on the code step, after a short cooldown. */}
                {step === "code" && (
                  <p className="pt-1 text-xs text-white/60">
                    Didn&rsquo;t get it? Check your spam folder, or{" "}
                    {resendIn > 0 ? (
                      <span className="text-white/40">resend in {resendIn}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCode("")
                          onResend()
                        }}
                        disabled={isLoading}
                        className="text-brand-accent-ink cursor-pointer font-medium underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        send a new code
                      </button>
                    )}
                    .
                  </p>
                )}

                {/* Submit */}
                <motion.button
                  whileHover={reduce || isLoading ? undefined : { scale: 1.02 }}
                  whileTap={reduce || isLoading ? undefined : { scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="group/button relative mt-4 w-full cursor-pointer disabled:cursor-wait"
                >
                  <div className="bg-brand-accent/40 absolute inset-0 rounded-full opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-80" />

                  <div
                    className="relative flex h-11 items-center justify-center overflow-hidden rounded-full bg-brand-accent font-medium text-brand-on-accent shadow-[0_10px_30px_-10px_color-mix(in_srgb,var(--lz-gold)_80%,transparent)] transition-all duration-300"
                  >
                    <motion.div
                      className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                      animate={reduce ? undefined : { x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      style={{ opacity: isLoading ? 1 : 0, transition: "opacity 0.3s ease" }}
                    />

                    <AnimatePresence mode="wait" initial={false}>
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="size-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                          <span className="sr-only">
                            {step === "email" ? "Sending code…" : "Signing in…"}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1.5 text-sm font-semibold"
                        >
                          {step === "email" ? "Send code" : "Verify & sign in"}
                          <ArrowRight
                            aria-hidden
                            className="size-3.5 transition-transform duration-300 group-hover/button:translate-x-1"
                          />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                <p className="mt-4 text-center text-xs text-white/45">
                  Only emails the salon owner has added can sign in.
                </p>

                <p className="text-center text-xs">
                  <Link
                    href="/"
                    className="hover:text-brand-accent-ink text-white/55 transition-colors duration-200"
                  >
                    ← Back to home
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/** Alias kept so the upstream demo's `import { Component }` still resolves. */
export { SignInCard2 as Component }
