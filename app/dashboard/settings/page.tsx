import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { auth } from "@/auth"
import { getQueryClient } from "@/lib/get-query-client"
import { getSettings } from "@/features/settings/server/get-settings"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { SettingsForm } from "@/features/settings/components/settings-form"
import { OwnerEmailForm } from "@/features/settings/components/owner-email-form"
import { OwnerNameForm } from "@/features/settings/components/owner-name-form"
import { DashboardAccessForm } from "@/features/settings/components/dashboard-access-form"
import { getDashboardUsers, getOwnerLoginEmail, normalizeEmail } from "@/features/auth/server/login-code"

function initials(name?: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default async function DashboardSettingsPage() {
  const queryClient = getQueryClient()
  const [session, ownerLoginEmail, dashboardUsers] = await Promise.all([
    auth(),
    getOwnerLoginEmail(),
    getDashboardUsers(),
    queryClient.prefetchQuery({ queryKey: ["settings"], queryFn: getSettings }),
  ])
  // Only the owner manages the sign-in email and who has access.
  const isOwner = normalizeEmail(session?.user?.email ?? "") === ownerLoginEmail

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your salon details and account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <SettingsForm />
        </HydrationBoundary>

        <div className="flex flex-col gap-6">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>
                    {initials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight">
                  <span className="font-medium">
                    {session?.user?.name ?? "Admin"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {session?.user?.email}
                  </span>
                </div>
              </div>
              <OwnerNameForm currentName={session?.user?.name ?? ""} />
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">
                  {session?.user?.role}
                </span>
              </div>
              <SignOutButton />
            </CardContent>
          </Card>

          {isOwner && <OwnerEmailForm currentEmail={ownerLoginEmail} />}
          <DashboardAccessForm
            ownerEmail={ownerLoginEmail}
            initialUsers={dashboardUsers}
            canManage={isOwner}
          />
        </div>
      </div>
    </div>
  )
}
