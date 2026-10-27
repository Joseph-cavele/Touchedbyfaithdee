import { Suspense } from "react"
import type { Metadata } from "next"
import { SignInCard } from "@/features/auth/components/sign-in-card"

export const metadata: Metadata = {
  title: "Sign in — Touchedbyfaithdee Studio",
}

export default function LoginPage() {
  return (
    // SignInCard reads `callbackUrl` via useSearchParams, which opts the route
    // into client rendering unless it sits behind a Suspense boundary.
    <Suspense>
      <SignInCard />
    </Suspense>
  )
}
