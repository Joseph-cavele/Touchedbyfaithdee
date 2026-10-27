import { NextRequest, NextResponse } from "next/server"
import { uploadImage, UPLOAD_FOLDERS, type UploadFolder } from "@/lib/cloudinary"
import { requireOwner } from "@/lib/auth-guard"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP images are allowed" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller" },
      { status: 400 }
    )
  }

  /* Unrecognised values fall back to `hairstyles` rather than being rejected:
     the folder only decides where the file is filed, so a bad one is not
     worth failing an otherwise valid upload over. Validated against the map
     rather than trusted, so the request cannot name an arbitrary path. */
  const requested = formData.get("folder")
  const folder: UploadFolder =
    typeof requested === "string" && requested in UPLOAD_FOLDERS
      ? (requested as UploadFolder)
      : "hairstyles"

  /* Customers upload hairstyle reference photos from the booking form without
     an account, so "hairstyles" stays public. Service and stylist photos are
     dashboard uploads — owner only. */
  if (folder !== "hairstyles") {
    const denied = await requireOwner()
    if (denied) return denied
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

  try {
    const url = await uploadImage(base64, folder)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 })
  }
}
