import { NextResponse } from "next/server"
import { getDashboardData } from "@/features/dashboard/server/get-dashboard-data"
import { requireOwner } from "@/lib/auth-guard"

export async function GET() {
  const denied = await requireOwner()
  if (denied) return denied

  const data = await getDashboardData()
  return NextResponse.json(data)
}
