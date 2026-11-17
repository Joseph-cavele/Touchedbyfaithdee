import { NextRequest, NextResponse } from "next/server"
import { isValidObjectId } from "mongoose"
import { revalidateTag } from "next/cache"
import { z } from "zod"
import { connectDB } from "@/lib/db"
import { ServiceModel } from "@/lib/models/Service"
import { serviceInputSchema } from "@/features/services/schema"
import { requireOwner } from "@/lib/auth-guard"
import { SALON_ID } from "@/lib/salon-identity"
import { normalizedServiceName, salonServiceFilter, serviceOwnershipFilter } from "@/features/services/server/ownership"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireOwner()
  if (denied) return denied

  const { id } = await params
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }
  const body = await req.json()
  const activeParsed = z.object({ isActive: z.boolean() }).strict().safeParse(body)
  if (activeParsed.success) {
    await connectDB()
    const service = await ServiceModel.findOneAndUpdate(
      serviceOwnershipFilter(id),
      {
        $set: { isActive: activeParsed.data.isActive, salonId: SALON_ID },
      },
      { returnDocument: "after" }
    )
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }
    revalidateTag("services", { expire: 0 })
    revalidateTag("dashboard", { expire: 0 })
    return NextResponse.json({ id: String(service._id), isActive: service.isActive })
  }

  const parsed = serviceInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service data", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  const duplicate = await ServiceModel.findOne({
    $and: [
      salonServiceFilter(),
      { name: parsed.data.name },
      { _id: { $ne: id } },
    ],
  }).collation({ locale: "en", strength: 2 })
  if (duplicate) {
    return NextResponse.json({ error: "A service with that name already exists." }, { status: 409 })
  }
  /* A blank price means "Price on request". JSON drops undefined, so an
     absent price has to be removed explicitly — otherwise clearing the field
     in the dashboard would silently keep the old figure. */
  const { price, ...rest } = parsed.data
  const update =
    price === undefined
      ? {
          $set: {
            ...rest,
            salonId: SALON_ID,
            normalizedName: normalizedServiceName(parsed.data.name),
          },
          $unset: { price: 1 },
        }
      : {
          $set: {
            ...rest,
            price,
            salonId: SALON_ID,
            normalizedName: normalizedServiceName(parsed.data.name),
          },
        }
  let service
  try {
    service = await ServiceModel.findOneAndUpdate(serviceOwnershipFilter(id), update, {
    returnDocument: "after",
    })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A service with that name already exists." }, { status: 409 })
    }
    throw error
  }

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
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }
  await connectDB()
  const service = await ServiceModel.findOneAndUpdate(
    serviceOwnershipFilter(id),
    { $set: { isActive: false, salonId: SALON_ID } },
    { returnDocument: "after" }
  )

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 })
  }

  revalidateTag("services", { expire: 0 })
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json({ id })
}
