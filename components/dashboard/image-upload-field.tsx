"use client"

import { useRef, useState } from "react"
import NextImage from "next/image"
import { ImagePlus, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { useUploadImage } from "@/features/bookings/hooks/use-upload-image"
import type { UploadFolder } from "@/lib/cloudinary"
import { FieldDescription } from "@/components/ui/field"
import { cn } from "@/lib/utils"

/**
 * Single-image picker for the dashboard's service and stylist forms.
 *
 * Deliberately not `HairstyleUpload`, which is the customer-facing control:
 * that one takes up to five reference photos and reports a `string[]`. A
 * service or a stylist has exactly one picture, and a control that lets the
 * owner add five of them would be asking a question the model cannot answer.
 *
 * Uploads through the same `/api/upload` Cloudinary route, so a photo is
 * already hosted by the time the form is submitted and the field holds a URL
 * rather than a pending file. That means a failed upload is reported here and
 * now, instead of surfacing as a failed save after the owner has filled in
 * everything else.
 *
 * Controlled: `value` is the stored URL (or "" for none), and `onChange` is
 * called with the new URL — wire it through react-hook-form's `Controller`.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

export function ImageUploadField({
  value,
  onChange,
  label = "Photo",
  description,
  /** `square` for a stylist portrait, `wide` for a service card. */
  aspect = "square",
  /** Which Cloudinary folder to file this under. */
  folder,
  disabled,
}: {
  value?: string
  onChange: (url: string) => void
  label?: string
  description?: string
  aspect?: "square" | "wide"
  folder?: UploadFolder
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage(folder)
  /* Shown while Cloudinary is still working. A local object URL means the
     owner sees their picture immediately rather than a spinner over nothing,
     which on a slow connection reads as the upload having failed. */
  const [preview, setPreview] = useState<string | null>(null)

  const busy = uploadImage.isPending
  const shown = preview ?? value

  async function handleFile(file: File | undefined) {
    if (!file) return

    /* Checked here as well as in the route. The route is the one that counts
       — this is only so the owner is told what is wrong before waiting for
       an upload that was always going to be refused. */
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed")
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be 5MB or smaller")
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const url = await uploadImage.mutateAsync(file)
      onChange(url)
    } catch {
      toast.error("Could not upload that image. Please try again.")
      setPreview(null)
    } finally {
      URL.revokeObjectURL(localUrl)
      // Let the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg border bg-muted",
            aspect === "square" ? "size-20" : "h-20 w-28"
          )}
        >
          {shown ? (
            <NextImage
              src={shown}
              alt=""
              fill
              sizes="112px"
              className="object-cover"
              /* A blob: preview and a Cloudinary URL are different origins;
                 unoptimized skips the image pipeline for both, which the
                 blob cannot go through at all. */
              unoptimized
            />
          ) : (
            <span className="text-muted-foreground grid size-full place-items-center">
              <ImagePlus className="size-6" aria-hidden />
            </span>
          )}

          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" aria-hidden />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className="border-input hover:bg-accent inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-4" aria-hidden />
              )}
              {value ? "Replace" : "Upload"}
            </button>

            {value && !busy && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setPreview(null)
                  onChange("")
                  if (inputRef.current) inputRef.current.value = ""
                }}
                className="text-muted-foreground hover:text-destructive inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm"
              >
                <X className="size-4" aria-hidden />
                Remove
              </button>
            )}
          </div>

          {description && <FieldDescription>{description}</FieldDescription>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
