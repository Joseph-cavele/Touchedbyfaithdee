import type { Variants } from "motion/react"

/**
 * Shared animation vocabulary for the landing page.
 *
 * Every factory takes `reduce` (from `useReducedMotion`) as its first argument
 * and collapses to a zero-duration, already-arrived state when it's true. That
 * keeps the reduced-motion branch in one place instead of scattering
 * `prefers-reduced-motion` checks through every component.
 *
 * Only `opacity` and `transform` are ever animated. Both are handled by the
 * compositor, so nothing here triggers layout or paint on the main thread —
 * which is what keeps the load sequence at 60 FPS.
 */

/** Custom cubic-bezier: fast out, long settle. The page's house easing. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Fade up from below. The workhorse entrance. */
export const fadeUp = (reduce: boolean, delay = 0, distance = 24): Variants => ({
  hidden: reduce ? { opacity: 1 } : { opacity: 0, y: distance },
  show: {
    opacity: 1,
    y: 0,
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.7, delay, ease: EASE_OUT },
  },
})

/** Spring-loaded rise, for elements that should feel physical (buttons). */
export const springUp = (reduce: boolean, delay = 0): Variants => ({
  hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: reduce
      ? { duration: 0 }
      : { type: "spring", stiffness: 220, damping: 22, delay },
  },
})

/**
 * Parent-only variant. Children inherit `hidden`/`show` automatically, so a
 * staggered group needs no per-child delay bookkeeping — the parent schedules
 * them and the children just declare what they look like.
 */
export const stagger = (delayChildren: number, staggerChildren: number): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})

/**
 * Headline line reveal. The line slides up from 105% of its own height while
 * its parent clips overflow, so the text appears to wipe up from behind a
 * mask — no gradient or pseudo-element required.
 */
export const lineReveal = (reduce: boolean): Variants => ({
  hidden: reduce ? { opacity: 1 } : { opacity: 0, y: "105%" },
  show: {
    opacity: 1,
    y: "0%",
    transition: reduce ? { duration: 0 } : { duration: 0.85, ease: EASE_OUT },
  },
})

/** Cards flying in from the right with a little extra rotation to shed. */
export const flyInFromRight = (reduce: boolean, restRotation: number): Variants => ({
  hidden: reduce
    ? { opacity: 1, rotate: restRotation }
    : { opacity: 0, x: 90, rotate: restRotation + 9 },
  show: {
    opacity: 1,
    x: 0,
    rotate: restRotation,
    transition: reduce
      ? { duration: 0 }
      : { type: "spring", stiffness: 130, damping: 18 },
  },
})
