"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

/* ══════════════════════════════════════════════════════════════════════
   ScrollAdventure — a full-screen, scroll-jacked panel deck.

   Each "page" is split down the middle: the left half slides in from
   below, the right half from above, so consecutive pages shear past each
   other rather than sliding as one block.

   ⚠ It listens on `window`, not on its own element, and it is `h-screen
   overflow-hidden`. That makes it a *standalone page* component — mount
   it on a route of its own. Dropping it into the middle of a longer
   scrolling page means the wheel drives both the panels and the document
   at once, which reads as broken.
   ══════════════════════════════════════════════════════════════════════ */

export type ScrollPanel = {
  heading: string
  description: ReactNode
}

export type ScrollPage = {
  /** Background for the left half. `null` leaves it flat (bare container bg). */
  leftBgImage?: string | null
  rightBgImage?: string | null
  leftContent?: ScrollPanel | null
  rightContent?: ScrollPanel | null
}

/** Demo content. Pass your own `pages` to point this at real assets. */
const defaultPages: ScrollPage[] = [
  {
    leftBgImage:
      "https://images.unsplash.com/photo-1748968218568-a5eac621e65c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1M3x8fGVufDB8fHx8fA%3D%3D",
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: "Welcome Aboard!",
      description: "Hold on to your mouse, things are about to get wild!",
    },
  },
  {
    leftBgImage: null,
    rightBgImage:
      "https://images.unsplash.com/photo-1749315099905-9cf6cabd9126?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0Nnx8fGVufDB8fHx8fA%3D%3D",
    leftContent: {
      heading: "Page 2",
      description: "Spoiler alert: it's still empty. Keep that scroll finger limber!",
    },
    rightContent: null,
  },
  {
    leftBgImage:
      "https://images.unsplash.com/photo-1747893541442-a139096ea39c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMzZ8fHxlbnwwfHx8fHw%3D",
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: "Page 3",
      description: "Plot twist: You've reached the midpoint. Bravo!",
    },
  },
  {
    leftBgImage: null,
    rightBgImage:
      "https://images.unsplash.com/photo-1748164521179-ae3b61c6dd90?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMjR8fHxlbnwwfHx8fHw%3D",
    leftContent: {
      heading: "Page 4",
      description: "One more scroll, I promise—almost there!",
    },
    rightContent: null,
  },
  {
    leftBgImage:
      "https://images.unsplash.com/photo-1742626157052-f5a373a727ef?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMnx8fGVufDB8fHx8fA%3D%3D",
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: "Epic Finale!",
      description: <>:)</>,
    },
  },
]

export type ScrollAdventureProps = {
  pages?: ScrollPage[]
  /**
   * Lock-out between advances, in ms. One trackpad flick fires dozens of
   * wheel events; without this the deck would skip to the end. Keep it at
   * or above the 1000ms CSS transition or panels will cut mid-flight.
   */
  animTime?: number
  className?: string
}

export default function ScrollAdventure({
  pages = defaultPages,
  animTime = 1000,
  className = "bg-black",
}: ScrollAdventureProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const numOfPages = pages.length
  const scrolling = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Functional update, so the handler never closes over `currentPage` —
     that lets the listeners attach once instead of being torn down and
     re-bound on every page change. */
  const step = useCallback(
    (direction: 1 | -1) => {
      if (scrolling.current) return
      scrolling.current = true
      setCurrentPage((page) => {
        const next = page + direction
        return next < 1 || next > numOfPages ? page : next
      })
      timer.current = setTimeout(() => {
        scrolling.current = false
      }, animTime)
    },
    [numOfPages, animTime],
  )

  useEffect(() => {
    const onWheel = (e: WheelEvent) => step(e.deltaY > 0 ? 1 : -1)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
      // The deck owns the viewport; letting the arrows also scroll the
      // document behind it would fight the panel transition.
      e.preventDefault()
      step(e.key === "ArrowDown" ? 1 : -1)
    }

    window.addEventListener("wheel", onWheel)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKeyDown)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [step])

  return (
    <div
      className={`relative h-screen overflow-hidden ${className}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`Panel ${currentPage} of ${numOfPages}`}
    >
      {pages.map((page, i) => {
        const idx = i + 1
        const isActive = currentPage === idx

        /* Halves park on opposite sides of the viewport, so they arrive
           from — and leave in — opposing directions. */
        const leftTrans = isActive ? "translateY(0)" : "translateY(100%)"
        const rightTrans = isActive ? "translateY(0)" : "translateY(-100%)"

        return (
          <div key={idx} className="absolute inset-0" aria-hidden={!isActive}>
            {/* ── Left half ─────────────────────────────────────────── */}
            <div
              className="absolute top-0 left-0 h-full w-1/2 transition-transform duration-1000 motion-reduce:duration-0"
              style={{ transform: leftTrans }}
            >
              <div
                className="h-full w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: page.leftBgImage
                    ? `url(${page.leftBgImage})`
                    : undefined,
                }}
              >
                <div className="flex h-full flex-col items-center justify-center p-8 text-white">
                  {page.leftContent && (
                    <>
                      <h2 className="mb-4 text-center text-2xl uppercase">
                        {page.leftContent.heading}
                      </h2>
                      <div className="text-center text-lg">
                        {page.leftContent.description}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Right half ────────────────────────────────────────── */}
            <div
              className="absolute top-0 left-1/2 h-full w-1/2 transition-transform duration-1000 motion-reduce:duration-0"
              style={{ transform: rightTrans }}
            >
              <div
                className="h-full w-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: page.rightBgImage
                    ? `url(${page.rightBgImage})`
                    : undefined,
                }}
              >
                <div className="flex h-full flex-col items-center justify-center p-8 text-white">
                  {page.rightContent && (
                    <>
                      <h2 className="mb-4 text-center text-2xl uppercase">
                        {page.rightContent.heading}
                      </h2>
                      <div className="text-center text-lg">
                        {page.rightContent.description}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
