"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPrice } from "@/lib/currency"
import { useServices } from "@/features/bookings/hooks/use-services"
import { useStylists } from "@/features/bookings/hooks/use-stylists"
import { SERVICE_CATEGORIES } from "@/features/services/schema"
import { walkInSchema } from "@/features/bookings/walk-in-schema"

/** Today's date and the current time (to 5 minutes), in the browser's zone. */
function nowParts() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(Math.floor(d.getMinutes() / 5) * 5)}`,
  }
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * "Add walk-in" — records a client who walked in, and their visit, from the
 * dashboard (POST /api/bookings/walk-in). Opens from its own button, so it
 * can sit on both the Bookings and the Customers pages.
 */
export function AddWalkInButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className={cn("h-9 cursor-pointer rounded-full px-4", className)}>
        <UserPlus aria-hidden />
        Add walk-in
      </Button>
      {/* Mounted only while open, so every visit starts from a clean form
          with the current date and time. */}
      {open && <WalkInDialog onClose={() => setOpen(false)} />}
    </>
  )
}

function WalkInDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const services = useServices()
  const stylists = useStylists()

  const [initial] = useState(nowParts)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [stylistChoice, setStylistChoice] = useState("")
  const [bookingDate, setBookingDate] = useState(initial.date)
  const [bookingTime, setBookingTime] = useState(initial.time)
  const [status, setStatus] = useState<"COMPLETED" | "CONFIRMED">("COMPLETED")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeStylists = useMemo(() => (stylists.data ?? []).filter((s) => s.active), [stylists.data])
  // Default to the first stylist until the owner picks one.
  const stylistId = stylistChoice || activeStylists[0]?.id || ""

  const byCategory = useMemo(() => {
    const list = services.data ?? []
    return SERVICE_CATEGORIES.map((category) => ({
      category,
      items: list.filter((s) => s.category === category),
    })).filter((g) => g.items.length > 0)
  }, [services.data])

  const total = (services.data ?? [])
    .filter((s) => serviceIds.includes(s.id))
    .reduce((sum, s) => sum + (s.price ?? 0), 0)

  function toggleService(id: string) {
    setError(null)
    setServiceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function submit() {
    const values = { name, phone, email, serviceIds, stylistId, bookingDate, bookingTime, status, notes }
    const parsed = walkInSchema.safeParse(values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the details.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/bookings/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string; customerName?: string }
      if (!res.ok) {
        setError(data.message ?? "We couldn't save the walk-in. Please try again.")
        return
      }
      for (const key of ["bookings", "customers", "dashboard", "reports"]) {
        queryClient.invalidateQueries({ queryKey: [key] })
      }
      toast.success(`Walk-in saved for ${data.customerName ?? parsed.data.name}`)
      onClose()
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add walk-in client</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Record a client who came in without booking, and what they had done.
          </p>
        </DialogHeader>

        <form
          id="walk-in-form"
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!saving) submit()
          }}
          noValidate
        >
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          {/* ── Client ─────────────────────────────────────────────────── */}
          <Field>
            <FieldLabel htmlFor="walkin-name">Client name</FieldLabel>
            <Input
              id="walkin-name"
              autoComplete="off"
              autoFocus
              placeholder="e.g. Thandi Mokoena"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(null)
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="walkin-phone">Phone (optional)</FieldLabel>
              <Input
                id="walkin-phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="071 234 5678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setError(null)
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="walkin-email">Email (optional)</FieldLabel>
              <Input
                id="walkin-email"
                type="email"
                autoComplete="off"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
              />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            A returning client is matched by email or phone, so they aren&rsquo;t added twice.
          </p>

          {/* ── Services ───────────────────────────────────────────────── */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Services</legend>
            {services.isLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading services" />
            ) : byCategory.length === 0 ? (
              <p className="text-xs text-muted-foreground">No services yet — add them on the Services page.</p>
            ) : (
              <div className="flex max-h-56 flex-col gap-3 overflow-y-auto rounded-lg border border-brand-line p-3">
                {byCategory.map((group) => (
                  <div key={group.category}>
                    <p className="mb-1 text-[10px] font-semibold tracking-[0.18em] text-brand-accent-ink uppercase">
                      {group.category}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((s) => (
                        <li key={s.id}>
                          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-1.5 py-1 text-sm hover:bg-muted/60">
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={serviceIds.includes(s.id)}
                                onChange={() => toggleService(s.id)}
                                className="size-4 cursor-pointer accent-[var(--lz-gold)]"
                              />
                              {s.name}
                            </span>
                            <span className="text-xs whitespace-nowrap text-muted-foreground">{formatPrice(s.price)}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* ── Visit ──────────────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field className="sm:col-span-1">
              <FieldLabel htmlFor="walkin-stylist">Stylist</FieldLabel>
              <select
                id="walkin-stylist"
                className={cn(selectClass, "cursor-pointer")}
                value={stylistId}
                onChange={(e) => setStylistChoice(e.target.value)}
              >
                {activeStylists.length === 0 && <option value="">No active stylists</option>}
                {activeStylists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="walkin-date">Date</FieldLabel>
              <Input id="walkin-date" type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="walkin-time">Time</FieldLabel>
              <Input id="walkin-time" type="time" step={300} value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Status</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { value: "COMPLETED", label: "Served & paid", hint: "Counts in revenue now" },
                  { value: "CONFIRMED", label: "Booked for later", hint: "Pays in person on the day" },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm transition-colors",
                    status === option.value ? "border-brand-accent bg-brand-accent/10" : "border-brand-line hover:bg-muted/50"
                  )}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <input
                      type="radio"
                      name="walkin-status"
                      value={option.value}
                      checked={status === option.value}
                      onChange={() => setStatus(option.value)}
                      className="cursor-pointer accent-[var(--lz-gold)]"
                    />
                    {option.label}
                  </span>
                  <span className="pl-6 text-xs text-muted-foreground">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field>
            <FieldLabel htmlFor="walkin-notes">Notes (optional)</FieldLabel>
            <Textarea
              id="walkin-notes"
              rows={2}
              placeholder="e.g. lash length, colour, allergies"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </form>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm">
            Total <span className="font-semibold">{formatCurrency(total)}</span>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="cursor-pointer rounded-full px-4">
              Cancel
            </Button>
            <Button type="submit" form="walk-in-form" disabled={saving} className="cursor-pointer rounded-full px-4">
              {saving && <Loader2 className="animate-spin" aria-hidden />}
              Save walk-in
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
