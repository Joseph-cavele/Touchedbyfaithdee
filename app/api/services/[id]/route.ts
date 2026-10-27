import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { connectDB } from "@/lib/db"
import { ServiceModel } from "@/lib/models/Service"
import { serviceInputSchema } from "@/features/services/schema"
import { requireOwner } from "@/lib/auth-guard"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  const body = await req.json()
  const parsed = serviceInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service data", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  /* A blank price means "Price on request". JSON drops undefined, so an
     absent price has to be removed explicitly — otherwise clearing the field
     in the dashboard would silently keep the old figure. */
  const { price, ...rest } = parsed.data
  const update =
    price === undefined ? { $set: rest, $unset: { price: 1 } } : { $set: { ...rest, price } }
  const service = await ServiceModel.findByIdAndUpdate(id, update, {
    returnDocument: "after",
  })

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  revalidateTag("services", { expire: 0 })
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json({ id: String(service._id) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  await connectDB()
  const service = await ServiceModel.findByIdAndDelete(id)

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  revalidateTag("services", { expire: 0 })
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json({ id })
}
