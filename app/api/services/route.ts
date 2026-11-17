import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { connectDB } from "@/lib/db"
import { ServiceModel } from "@/lib/models/Service"
import { DEFAULT_SERVICE_CATEGORY, serviceInputSchema } from "@/features/services/schema"
import { getServices } from "@/features/services/server/get-services"
import { requireOwner } from "@/lib/auth-guard"
import { SALON_ID } from "@/lib/salon-identity"
import { assignLegacyServicesToSalon, normalizedServiceName, salonServiceFilter } from "@/features/services/server/ownership"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("includeInactive") === "true") {
    const denied = await requireOwner()
    if (denied) return denied
    await connectDB()
    await assignLegacyServicesToSalon()
    const services = await ServiceModel.find(salonServiceFilter()).sort({ name: 1 }).lean()
    return NextResponse.json(
      services.map((service) => ({
        id: String(service._id),
        name: service.name,
        description: service.description ?? "",
        price: service.price ?? undefined,
        duration: service.duration,
        category: service.category ?? DEFAULT_SERVICE_CATEGORY,
        image: service.image,
        includes: service.includes?.length ? service.includes : undefined,
        isActive: service.isActive ?? true,
      }))
    )
  }

  return NextResponse.json(await getServices())
}

export async function POST(req: NextRequest) {
  const denied = await requireOwner()
  if (denied) return denied

  const body = await req.json()
  const parsed = serviceInputSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service data", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await connectDB()
  const duplicate = await ServiceModel.findOne({
    $and: [salonServiceFilter(), { name: parsed.data.name }],
  }).collation({ locale: "en", strength: 2 })
  if (duplicate) {
    return NextResponse.json({ error: "A service with that name already exists." }, { status: 409 })
  }

  let service
  try {
    service = await ServiceModel.create({
      ...parsed.data,
      salonId: SALON_ID,
      normalizedName: normalizedServiceName(parsed.data.name),
      isActive: true,
    })
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "A service with that name already exists." }, { status: 409 })
    }
    throw error
  }

  // A new service changes both the services list and the dashboard's
  // services-performance/revenue figures.
  revalidateTag("services", { expire: 0 })
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json(
    {
      id: String(service._id),
      name: service.name,
      description: service.description ?? "",
      price: service.price,
      duration: service.duration,
      category: service.category,
      isActive: service.isActive,
    },
    { status: 201 }
  )
}
