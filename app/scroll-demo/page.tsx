import type { Metadata } from "next"

import ScrollAdventure from "@/components/ui/animated-scroll"

/**
 * Standalone route for the scroll-jacked panel deck.
 *
 * It gets its own page rather than a slot on the marketing site because it
 * listens on `window` and fills the viewport — sharing a page with normal
 * content would have the wheel driving the panels and the document at once.
 *
 * No SiteHeader/SiteFooter: the root layout adds neither (each page composes
 * its own), and a fixed header over a full-bleed deck would clip the panels.
 */
export const metadata: Metadata = {
  title: "Scroll deck — demo",
  // Kept out of search results: this is a component demo carrying stock
  // photography, not a page the salon wants customers landing on.
  robots: { index: false, follow: false },
}

export default function ScrollDemoPage() {
  return <ScrollAdventure />
}
