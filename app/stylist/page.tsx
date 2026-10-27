import { auth } from "@/auth"
import { SignOutButton } from "@/features/auth/components/sign-out-button"

export default async function StylistPage() {
  const session = await auth()

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stylist Portal</h1>
          <p className="text-muted-foreground">
            Logged in as {session?.user?.name} ({session?.user?.role})
          </p>
        </div>
        <SignOutButton />
      </div>
    </main>
  )
}
