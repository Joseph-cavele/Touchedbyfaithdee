"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { useUploadImage } from "@/features/bookings/hooks/use-upload-image"
import { FieldDescription, FieldError } from "@/components/ui/field"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 5

// crypto.randomUUID only exists in secure contexts (HTTPS or localhost). Over a
// plain-HTTP LAN address (e.g. testing upload from a phone) it's undefined and
// throws, so fall back to a random id there.
function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

interface UploadItem {
  id: string
  previewUrl: string
  status: "uploading" | "done" | "error"
  url?: string
}

export function HairstyleUpload({
  onChange,
  error,
}: {
  onChange: (urls: string[]) => void
  error?: string
}) {
  const [items, setItems] = useState<UploadItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage()

  // Keep the latest onChange without re-firing the effect when its identity changes.
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Emit the uploaded URLs whenever the set of completed uploads changes.
  // Done in an effect (not inside a setItems updater) so we never call the
  // parent's setState during render.
  const doneKey = items
    .filter((i) => i.status === "done" && i.url)
    .map((i) => i.url)
    .join("|")
  useEffect(() => {
    onChangeRef.current(doneKey ? doneKey.split("|") : [])
  }, [doneKey])

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const files = Array.from(fileList)

    if (items.length + files.length > MAX_IMAGES) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`)
      return
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, and WEBP images are allowed`)
        continue
      }
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name}: image must be 5MB or smaller`)
        continue
      }

      const id = makeId()
      const previewUrl = URL.createObjectURL(file)

      setItems((prev) => {
        const next = [...prev, { id, previewUrl, status: "uploading" as const }]
        return next
      })

      try {
        const url = await uploadImage.mutateAsync(file)
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "done" as const, url } : item
          )
        )
      } catch {
        toast.error(`${file.name}: upload failed`)
        setItems((prev) => {
          const next = prev.map((item) =>
            item.id === id ? { ...item, status: "error" as const } : item
          )
          return next
        })
      }
    }
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative size-20 overflow-hidden rounded-lg border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt="Hairstyle inspiration"
              className="size-full object-cover"
            />
            {item.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="size-5 animate-spin text-white" />
              </div>
            )}
            {item.status === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/60 text-xs text-white">
                Failed
              </div>
            )}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Remove image"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {items.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Upload className="size-5" />
            <span className="text-xs">Add</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      <FieldDescription>
        Upload 1-5 images (JPG, PNG, or WEBP, max 5MB each).
      </FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
