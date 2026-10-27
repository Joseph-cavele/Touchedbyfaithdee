import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { StylistModel } from "@/lib/models/Stylist"
import { stylistInputSchema, stylistWriteData } from "@/features/stylists/schema"
import { requireOwner } from "@/lib/auth-guard"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  const body = await req.json()
  const parsed = stylistInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid stylist data", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  const stylist = await StylistModel.findByIdAndUpdate(id, stylistWriteData(parsed.data), {
    returnDocument: "after",
  })

  if (!stylist) {
    return NextResponse.json({ error: "Stylist not found" }, { status: 404 })
  }

  return NextResponse.json({ id: String(stylist._id) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  await connectDB()
  const stylist = await StylistModel.findByIdAndDelete(id)

  if (!stylist) {
    return NextResponse.json({ error: "Stylist not found" }, { status: 404 })
  }

  return NextResponse.json({ id })
}
