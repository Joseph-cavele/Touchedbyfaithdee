"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationBell } from "@/features/notifications/components/notification-bell"
import { AvatarMenu } from "@/components/dashboard/avatar-menu"
import { useDashboardNav } from "@/components/dashboard/dashboard-nav-context"
import { navItems } from "@/components/dashboard/nav-items"

/** The current section's name, from the same list the sidebar renders. */
function usePageTitle() {
  const pathname = usePathname()
  return navItems.find((item) => !item.href.includes("#") && item.href === pathname)?.label ?? "Dashboard"
}

export function Topbar({
  name,
  email,
}: {
  name?: string | null
  email?: string | null
}) {
  const { setMobileNavOpen } = useDashboardNav()
  const title = usePageTitle()

  return (
    <header className="sticky top-0 z-30 flex h-16 print:hidden shrink-0 items-center gap-4 border-b border-brand-line bg-brand-surface/85 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={() => setMobileNavOpen(true)}
        className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex flex-col leading-none">
        <span className="hidden text-[9px] font-semibold tracking-[0.28em] text-brand-accent-ink uppercase sm:block">
          Touchedbyfaithdee Studio
        </span>
        <h1 className="font-display text-xl font-medium sm:mt-1">{title}</h1>
      </div>

      <div className="flex-1">
        <Input
          type="search"
          placeholder="Search bookings, customers, stylists..."
          className="ml-auto hidden h-9 max-w-sm rounded-full border-brand-line bg-brand-bg/60 px-4 sm:flex"
        />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <AvatarMenu name={name} email={email} />
      </div>
    </header>
  )
}
