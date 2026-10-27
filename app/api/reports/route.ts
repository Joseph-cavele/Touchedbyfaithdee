import { NextResponse } from "next/server"
import { getReports } from "@/features/reports/server/get-reports"
import { requireOwner } from "@/lib/auth-guard"

export async function GET() {
  const denied = await requireOwner()
  if (denied) return denied

  const reports = await getReports()
  return NextResponse.json(reports)
}
