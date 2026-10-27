"use client"

import { useState } from "react"
import { MoreVertical, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUpdateBookingStatus } from "@/features/bookings/hooks/use-update-booking-status"
import type { BookingStatus } from "@/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type ActionableStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

const ACTIONS_BY_STATUS: Record<BookingStatus, { label: string; status: ActionableStatus }[]> = {
  /* Awaiting an online payment. "Confirm" is deliberately offered: a customer
     whose card failed often just pays in the chair, and the salon needs to be
     able to say so. It does NOT mark the booking paid — paymentStatus is only
     ever set to PAID by a verified Paystack transaction, never by a click. */
  PENDING_PAYMENT: [
    { label: "Confirm (paid in person)", status: "CONFIRMED" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  PENDING: [
    { label: "Confirm", status: "CONFIRMED" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Mark completed", status: "COMPLETED" },
    { label: "Mark no-show", status: "NO_SHOW" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
}

export function BookingRowActions({
  bookingId,
  status,
}: {
  bookingId: string
  status: BookingStatus
}) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState("")
  const updateStatus = useUpdateBookingStatus()

  const actions = ACTIONS_BY_STATUS[status] ?? []
  if (actions.length === 0) return null

  function applyStatus(nextStatus: ActionableStatus, cancelReason?: string) {
    updateStatus.mutate(
      { id: bookingId, status: nextStatus, reason: cancelReason },
      {
        onSuccess: (data) => {
          toast.success(
            nextStatus === "CONFIRMED"
              ? "Booking confirmed"
              : nextStatus === "CANCELLED"
                ? "Booking cancelled"
                : nextStatus === "COMPLETED"
                  ? "Booking marked completed"
                  : "Booking marked no-show"
          )
          // The API tried to email the customer but the provider rejected it
          // (emailSent === false) — let the owner know instead of failing silently.
          if (data?.emailSent === false) {
            toast.warning(
              "Status updated, but the confirmation email couldn't be sent to the customer. Check your Resend email settings."
            )
          }
          setCancelOpen(false)
          setReason("")
        },
        onError: () => toast.error("Could not update booking. Please try again."),
      }
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Booking actions"
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.status}
              onClick={() =>
                action.status === "CANCELLED"
                  ? setCancelOpen(true)
                  : applyStatus(action.status)
              }
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking</DialogTitle>
            <DialogDescription>
              The customer will receive a cancellation email. You can optionally
              include a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Stylist unavailable"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={updateStatus.isPending}
              onClick={() => applyStatus("CANCELLED", reason || undefined)}
            >
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
