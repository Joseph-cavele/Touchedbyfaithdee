"use client"

import { useState } from "react"
import { Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUpdateBookingStatus } from "@/features/bookings/hooks/use-update-booking-status"
import type { BookingListItem } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function BookingManagementRowActions({ booking }: { booking: BookingListItem }) {
  const [viewOpen, setViewOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const updateStatus = useUpdateBookingStatus()

  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED"

  function confirmCancel() {
    updateStatus.mutate(
      { id: booking.id, status: "CANCELLED" },
      {
        onSuccess: () => {
          toast.success("Booking cancelled")
          setCancelOpen(false)
        },
        onError: () => toast.error("Could not cancel booking. Please try again."),
      }
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="View booking"
        onClick={() => setViewOpen(true)}
        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Eye className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Cancel booking"
        disabled={!canCancel}
        onClick={() => setCancelOpen(true)}
        className="inline-flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-30"
      >
        <Trash2 className="size-4" />
      </button>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{booking.customerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stylist</span>
              <span>{booking.stylistName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Services</span>
              <span className="text-right">{booking.serviceNames.join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date & time</span>
              <span>
                {booking.bookingDate} · {booking.bookingTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{booking.totalDisplay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{booking.status}</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel booking</DialogTitle>
            <DialogDescription>
              {booking.customerName}&apos;s appointment on {booking.bookingDate} at{" "}
              {booking.bookingTime} will be cancelled and they&apos;ll receive an email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={updateStatus.isPending}
              onClick={confirmCancel}
            >
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Cancel booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
