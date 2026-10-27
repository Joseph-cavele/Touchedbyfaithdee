import { NextRequest, NextResponse } from "next/server"
import { isValidObjectId } from "mongoose"
import { getBusyIntervals } from "@/features/bookings/server/get-busy-intervals"

/**
 * Public, read-only: which times a stylist is already booked on a date, so the
 * booking wizard can grey them out. Returns time ranges only — no customer
 * details. The POST /api/bookings check is what actually enforces it.
 */
export async function GET(req: NextRequest) {
  const stylistId = req.nextUrl.searchParams.get("stylistId") ?? ""
  const date = req.nextUrl.searchParams.get("date") ?? ""

  if (!isValidObjectId(stylistId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "stylistId and date (YYYY-MM-DD) are required" }, { status: 400 })
  }

  const busy = await getBusyIntervals(stylistId, date)
  return NextResponse.json({ busy })
}
