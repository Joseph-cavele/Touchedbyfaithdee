"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * Animated SVG path backdrops.
 *
 * Adapted from the supplied `modern-background-paths` component with four
 * changes that were not optional:
 *
 * 1. `Math.random()` at render scope is replaced by the seeded `noise()` below.
 *    The original computed node positions, grid cells and delays during render,
 *    so the server and the client produced different SVGs and every page load
 *    hydrated with a mismatch. Same fix the repo used for the loc curtain.
 * 2. `framer-motion` → `motion/react`. Same library, current name; the project
 *    already has it, so no new dependency.
 * 3. Reduced motion is honoured — the loop stops and one pattern renders at
 *    rest, rather than four infinite animations running forever.
 * 4. Node and connection counts are capped. The original could emit several
 *    hundred infinitely-animating paths plus 50 pulsing circles on top of a
 *    photographic hero.
 *
 * Colour comes from `currentColor`, so the caller tints it with a text class.
 */

/** Deterministic pseudo-random in [0,1) — server and client agree. */
function noise(seed: number) {
  const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return n - Math.floor(n)
}

const round = (n: number) => Math.round(n * 10) / 10

export type PathPattern = "neural" | "flow" | "geometric" | "spiral"

/* ── Geometric grid ─────────────────────────────────────────────────── */
const geometricCells = (() => {
  const size = 40
  const cells: { id: string; d: string; delay: number }[] = []
  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 12; y++) {
      if (noise(x * 31 + y * 17) > 0.72) {
        cells.push({
          id: `grid-${x}-${y}`,
          d: `M${x * size},${y * size} h${size} v${size} h${-size} Z`,
          delay: round(noise(x * 7 + y * 13) * 5),
        })
      }
    }
  }
  return cells
})()

function GeometricPaths({ reduce }: { reduce: boolean }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice">
      {geometricCells.map((cell) => (
        <motion.path
          key={cell.id}
          d={cell.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          initial={reduce ? { pathLength: 1, opacity: 0.4 } : { pathLength: 0, opacity: 0 }}
          animate={reduce ? undefined : { pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
          transition={{ duration: 8, delay: cell.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

/* ── Organic flow ───────────────────────────────────────────────────── */
const flowLines = Array.from({ length: 12 }, (_, i) => {
  const amplitude = 50 + i * 10
  const offset = i * 60
  return {
    id: `flow-${i}`,
    d: `M-100,${200 + offset} Q200,${200 + offset - amplitude} 500,${200 + offset} T900,${200 + offset}`,
    strokeWidth: 1 + i * 0.3,
    opacity: 0.1 + i * 0.05,
    delay: i * 0.8,
  }
})

function FlowPaths({ reduce }: { reduce: boolean }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice">
      {flowLines.map((line) => (
        <motion.path
          key={line.id}
          d={line.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={line.strokeWidth}
          strokeLinecap="round"
          initial={reduce ? { pathLength: 1, opacity: line.opacity } : { pathLength: 0, opacity: 0 }}
          animate={
            reduce
              ? undefined
              : { pathLength: [0, 1, 0.8, 0], opacity: [0, line.opacity, line.opacity * 0.7, 0] }
          }
          transition={{ duration: 15, delay: line.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

/* ── Neural network ─────────────────────────────────────────────────── */
const NODE_COUNT = 28
const neuralNodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
  id: `node-${i}`,
  x: round(noise(i * 3.7) * 800),
  y: round(noise(i * 9.1 + 5) * 600),
}))

const neuralLinks: { id: string; d: string; delay: number }[] = []
neuralNodes.forEach((node, i) => {
  neuralNodes.forEach((other, j) => {
    // j > i so each pair is considered once, and the link cap keeps the
    // animation count bounded rather than quadratic.
    if (j <= i || neuralLinks.length >= 60) return
    const distance = Math.hypot(node.x - other.x, node.y - other.y)
    if (distance < 150 && noise(i * 13 + j * 29) > 0.45) {
      neuralLinks.push({
        id: `conn-${i}-${j}`,
        d: `M${node.x},${node.y} L${other.x},${other.y}`,
        delay: round(noise(i * 5 + j) * 10),
      })
    }
  })
})

function NeuralPaths({ reduce }: { reduce: boolean }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-15" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      {neuralLinks.map((link) => (
        <motion.path
          key={link.id}
          d={link.d}
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
          initial={reduce ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
          animate={reduce ? undefined : { pathLength: [0, 1, 0], opacity: [0, 0.8, 0] }}
          transition={{ duration: 6, delay: link.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {neuralNodes.map((node, i) => (
        <motion.circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r="2"
          fill="currentColor"
          initial={reduce ? { scale: 1, opacity: 0.6 } : { scale: 0, opacity: 0 }}
          animate={reduce ? undefined : { scale: [0, 1, 1.2, 1], opacity: [0, 0.6, 0.8, 0.6] }}
          transition={{ duration: 4, delay: round(noise(i * 2.3) * 3), repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

/* ── Spirals ────────────────────────────────────────────────────────── */
const spiralArms = Array.from({ length: 8 }, (_, i) => {
  const centerX = 400 + ((i % 4) - 1.5) * 200
  const centerY = 300 + (Math.floor(i / 4) - 0.5) * 200
  const radius = 80 + i * 15
  const turns = 3 + i * 0.5

  let d = `M${centerX + radius},${centerY}`
  for (let angle = 0; angle <= turns * 360; angle += 8) {
    const radian = (angle * Math.PI) / 180
    const r = radius * (1 - angle / (turns * 360))
    d += ` L${round(centerX + r * Math.cos(radian))},${round(centerY + r * Math.sin(radian))}`
  }
  return { id: `spiral-${i}`, d, delay: i * 1.2 }
})

function SpiralPaths({ reduce }: { reduce: boolean }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      {spiralArms.map((spiral) => (
        <motion.path
          key={spiral.id}
          d={spiral.d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={reduce ? undefined : { pathLength: [0, 1, 0] }}
          transition={{ duration: 12, delay: spiral.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  )
}

const RENDERERS: Record<PathPattern, (p: { reduce: boolean }) => React.ReactElement> = {
  neural: NeuralPaths,
  flow: FlowPaths,
  geometric: GeometricPaths,
  spiral: SpiralPaths,
}

export function BackgroundPaths({
  patterns = ["flow", "spiral", "neural", "geometric"],
  intervalMs = 12000,
  className,
}: {
  /** Cycled in order. Pass a single entry to hold one pattern. */
  patterns?: PathPattern[]
  intervalMs?: number
  /** Tint via a text colour class — the SVGs use `currentColor`. */
  className?: string
}) {
  const reduce = !!useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // One pattern, or reduced motion: nothing to cycle.
    if (reduce || patterns.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % patterns.length), intervalMs)
    return () => clearInterval(id)
  }, [reduce, patterns.length, intervalMs])

  const Pattern = RENDERERS[patterns[index] ?? "flow"]

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <motion.div
        key={index}
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 2 }}
        className="absolute inset-0"
      >
        <Pattern reduce={reduce} />
      </motion.div>
    </div>
  )
}

export default BackgroundPaths
