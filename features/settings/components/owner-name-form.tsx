"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

/**
 * Settings → Account: the owner's display name (sidebar, greeting, Account
 * card). Saves to the owner account, then refreshes the session and the
 * server-rendered layout so the new name shows everywhere at once.
 */
export function OwnerNameForm({ currentName }: { currentName: string }) {
  const router = useRouter()
  const { update } = useSession()
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unchanged = name.trim() === currentName.trim()

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/settings/owner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string; name?: string }
      if (!res.ok) {
        setError(data.message ?? "We couldn't save your name. Please try again.")
        return
      }
      await update() // re-reads the name into the session (auth.ts jwt callback)
      router.refresh()
      toast.success("Name updated")
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!saving && !unchanged) save()
      }}
      noValidate
    >
      <Field>
        <FieldLabel htmlFor="owner-name">Your name</FieldLabel>
        <div className="flex gap-2">
          <Input
            id="owner-name"
            autoComplete="name"
            value={name}
            aria-invalid={!!error}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          <Button type="submit" disabled={saving || unchanged || !name.trim()} className="cursor-pointer rounded-full px-4">
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            Save
          </Button>
        </div>
      </Field>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
