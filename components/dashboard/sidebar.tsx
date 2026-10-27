"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import NextImage from "next/image"
import { LogOut, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { salonImages } from "@/lib/salon-assets"
import { useNotifications } from "@/features/notifications/hooks/use-notifications"
import { useDashboardNav } from "@/components/dashboard/dashboard-nav-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { navItems } from "@/components/dashboard/nav-items"
import { laFePalette, laFeScript, Lotus } from "@/components/site/la-fe-brand"

function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/* Mirrors the public site header's lockup — script wordmark over a gold
   caption — so the sidebar reads as the same brand as the site. */
function SidebarBrand() {
  return (
    <span className="flex flex-col items-end leading-none">
      <NextImage
        src={salonImages.logo.src}
        alt=""
        width={452}
        height={150}
        className="h-10 w-auto"
      />
      <span className="text-brand-accent-ink -mt-1 text-[9px] font-semibold tracking-[0.28em]">
        STUDIO
      </span>
    </span>
  )
}

/** The tagline under the nav, with the logo's lotus — the poster's sign-off. */
function SidebarTagline() {
  return (
    <div style={laFePalette} className="flex flex-col items-center gap-1.5 px-4 pb-4 text-center">
      <span aria-hidden className="flex items-center gap-2">
        <span className="h-px w-8 bg-brand-accent/50" />
        <Lotus />
        <span className="h-px w-8 bg-brand-accent/50" />
      </span>
      <span className={`${laFeScript.className} text-xl leading-tight text-brand-accent-ink`}>
        Your Beauty Is Our Priority
      </span>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data } = useNotifications()

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = !item.href.includes("#") && pathname === item.href

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center justify-between gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_10px_24px_-12px_color-mix(in_srgb,var(--lz-gold)_90%,transparent)]"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {item.label}
            </span>
            {"badge" in item && item.badge && !!data?.unreadCount && (
              <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white">
                {data.unreadCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Who is signed in. Plain text, not a menu.
 *
 * This was a dropdown whose only action was "Sign out". With that promoted to
 * a button of its own below, the menu had nothing left to open — so the email
 * it used to hide behind a click is simply shown, which is the thing you
 * actually want when checking whose session you are looking at.
 */
function SidebarUser({
  name,
  email,
}: {
  name?: string | null
  email?: string | null
}) {
  return (
    <div className="flex items-center gap-2 border-t border-sidebar-border p-3">
      <Avatar className="size-8">
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-medium">{name ?? "Admin"}</span>
        <span className="truncate text-xs text-sidebar-foreground/60">
          {email ?? "Admin"}
        </span>
      </div>
    </div>
  )
}

/**
 * Sign out, in one click.
 *
 * The action already existed behind the user card's dropdown here and behind
 * the topbar avatar's, but both need a click to discover before the click
 * that does the thing — on a shared salon machine, logging out is something
 * you want to be able to do on the way out the door.
 *
 * The pending state matters more than it looks: `signOut` posts to the auth
 * endpoint and only then redirects, so on a slow connection the button would
 * otherwise sit there looking untouched and invite a second press.
 */
function SidebarSignOut() {
  const [pending, setPending] = useState(false)

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true)
        signOut({ callbackUrl: "/login" })
      }}
      className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3 text-left text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  )
}

export function Sidebar({
  name,
  email,
}: {
  name?: string | null
  email?: string | null
}) {
  const { mobileNavOpen, setMobileNavOpen } = useDashboardNav()
  const pathname = usePathname()

  useEffect(() => {
    setMobileNavOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {/* Desktop sidebar */}
      {/* Espresso island (`dark`): every token inside resolves to the dark
          set, so the gold reads as gold and the text as ivory. */}
      <aside className="dark sticky top-0 hidden h-svh print:!hidden w-64 shrink-0 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground sm:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <SidebarBrand />
        </div>
        <SidebarNav />
        <SidebarTagline />
        <SidebarUser name={name} email={email} />
        <SidebarSignOut />
      </aside>

      {/* Mobile drawer */}
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 sm:hidden data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Popup className="dark fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-sidebar text-sidebar-foreground outline-none sm:hidden data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
              <SidebarBrand />
              <DialogPrimitive.Close
                aria-label="Close navigation"
                className="inline-flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            <SidebarTagline />
            <SidebarUser name={name} email={email} />
            <SidebarSignOut />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}
