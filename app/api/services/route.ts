import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { connectDB } from "@/lib/db"
import { ServiceModel } from "@/lib/models/Service"
import { serviceInputSchema } from "@/features/services/schema"
import { getServices } from "@/features/services/server/get-services"
import { requireOwner } from "@/lib/auth-guard"

export async function GET() {
  const services = await getServices()
  return NextResponse.json(services)
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
  const service = await ServiceModel.create(parsed.data)

  // A new service changes both the services list and the dashboard's
  // services-performance/revenue figures.
  revalidateTag("services", { expire: 0 })
  revalidateTag("dashboard", { expire: 0 })

  return NextResponse.json({ id: String(service._id) }, { status: 201 })
}
