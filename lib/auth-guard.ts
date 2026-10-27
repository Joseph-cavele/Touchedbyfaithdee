import { NextResponse } from "next/server"
import { auth } from "@/auth"

/**
 * Guard for API routes that only the salon owner may call.
 *
 * proxy.ts protects the /dashboard and /stylist PAGES, but its matcher never
 * covered /api — so before this, anyone could read customers and bookings or
 * edit services and settings by calling the API directly. Every owner-only
 * handler now starts with:
 *
 *   const denied = await requireOwner()
 *   if (denied) return denied
 *
 * Returns a 401/403 response to send back, or null when the caller is the owner.
 */
export async function requireOwner(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  }
  if (session.user.role !== "owner") {
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 })
  }
  return null
}
