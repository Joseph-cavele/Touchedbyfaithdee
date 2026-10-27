import ScrollAdventure from "@/components/ui/animated-scroll"

/**
 * Usage example for `ScrollAdventure`.
 *
 * No wrapper sizing is needed — the component is already `h-screen`, and
 * nesting it in another `h-screen` box just doubles the constraint. Mount
 * it on a route of its own; see the note at the top of animated-scroll.tsx
 * for why it doesn't belong inside a longer scrolling page.
 */
const DemoOne = () => {
  return <ScrollAdventure />
}

export { DemoOne }
