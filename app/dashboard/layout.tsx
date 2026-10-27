import { auth } from "@/auth"
import { Topbar } from "@/components/dashboard/topbar"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DashboardNavProvider } from "@/components/dashboard/dashboard-nav-context"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <DashboardNavProvider>
      {/* `lafe-dash` scopes the dashboard's card styling (app/globals.css). */}
      <div className="lafe-dash flex min-h-full flex-1">
        <Sidebar name={session?.user?.name} email={session?.user?.email} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar name={session?.user?.name} email={session?.user?.email} />
          {/* Ivory ground with a faint rose bloom top-right and a gold one low
              left, as on the public site. */}
          <div className="min-w-0 flex-1 overflow-x-hidden bg-brand-bg bg-[radial-gradient(45%_40%_at_100%_0%,color-mix(in_srgb,var(--lz-rose)_14%,transparent),transparent_70%),radial-gradient(40%_35%_at_0%_100%,color-mix(in_srgb,var(--lz-gold)_10%,transparent),transparent_70%)]">
            {children}
          </div>
        </div>
      </div>
    </DashboardNavProvider>
  )
}
