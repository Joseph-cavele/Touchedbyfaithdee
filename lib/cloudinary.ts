import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Folders an upload may be filed under.
 *
 * A closed set rather than a caller-supplied string: the folder comes in
 * over an unauthenticated HTTP route, and an arbitrary one would let anyone
 * scatter files anywhere in the account — including on top of a path the
 * salon uses for something else.
 */
export const UPLOAD_FOLDERS = {
  hairstyles: "salon-bookings/hairstyles",
  services: "salon-bookings/services",
  stylists: "salon-bookings/stylists",
} as const

export type UploadFolder = keyof typeof UPLOAD_FOLDERS

/**
 * `hairstyles` stays the default so the customer booking flow — the original
 * and only caller — keeps filing exactly where it always has. Service photos
 * and stylist portraits pass their own, because a portrait sitting in a
 * folder named "hairstyles" is the kind of thing nobody untangles later.
 */
export async function uploadImage(base64: string, folder: UploadFolder = "hairstyles") {
  const result = await cloudinary.uploader.upload(base64, {
    folder: UPLOAD_FOLDERS[folder],
  })
  return result.secure_url
}

export { cloudinary }
