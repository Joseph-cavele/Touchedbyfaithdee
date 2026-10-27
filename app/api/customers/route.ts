import { NextResponse } from "next/server"
import { getCustomers } from "@/features/customers/server/get-customers"
import { requireOwner } from "@/lib/auth-guard"

export async function GET() {
  const denied = await requireOwner()
  if (denied) return denied

  const customers = await getCustomers()
  return NextResponse.json(customers)
}
