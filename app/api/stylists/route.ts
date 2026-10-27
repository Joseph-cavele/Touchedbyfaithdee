import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { StylistModel } from "@/lib/models/Stylist"
import { stylistInputSchema, stylistWriteData } from "@/features/stylists/schema"
import { getStylists } from "@/features/stylists/server/get-stylists"
import { requireOwner } from "@/lib/auth-guard"

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all")
  /* The plain list (active stylists) feeds the public booking wizard. The
     full list, inactive stylists included, is the dashboard's — owner only. */
  if (all) {
    const denied = await requireOwner()
    if (denied) return denied
  }
  const stylists = await getStylists(!!all)
  return NextResponse.json(stylists)
}

export async function POST(req: NextRequest) {
  const denied = await requireOwner()
  if (denied) return denied

  const body = await req.json()
  const parsed = stylistInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid stylist data", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  const { $set } = stylistWriteData(parsed.data)
  const stylist = await StylistModel.create($set)

  return NextResponse.json({ id: String(stylist._id) }, { status: 201 })
}
