"use client"

import { useState } from "react"
import { CalendarClock, CalendarX, Check, Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { apiErrorMessage } from "@/lib/api-client"
import { useDeleteBooking } from "@/features/bookings/hooks/use-delete-booking"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { TIME_SLOTS } from "@/features/bookings/availability"

function reminderStatus(
  sentAt?: string,
  skippedAt?: string,
  scheduled = false,
  lastError?: string
) {
  if (sentAt) return `Sent ${new Date(sentAt).toLocaleString()}`
  if (skippedAt) return "Skipped (short notice)"
  if (!scheduled) return "Not scheduled"
  if (lastError) return `Failed; retrying (${lastError})`
  return "Scheduled"
}

export function BookingManagementRowActions({ booking }: { booking: BookingListItem }) {
  const [viewOpen, setViewOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [bookingDate, setBookingDate] = useState(booking.bookingDate)
  const [bookingTime, setBookingTime] = useState(booking.bookingTime)
  const updateStatus = useUpdateBookingStatus()
  const deleteBooking = useDeleteBooking()

  const canCancel = ["PENDING", "PENDING_PAYMENT", "CONFIRMED"].includes(booking.status)
  const canReview = booking.status === "PENDING" || booking.status === "PENDING_PAYMENT"
  const canReschedule = booking.status === "PENDING" || booking.status === "CONFIRMED"

  function approveBooking() {
    updateStatus.mutate(
      { id: booking.id, status: "CONFIRMED" },
      {
        onSuccess: (data) => {
          toast.success("Booking approved")
          if (data?.emailSent === false) {
            toast.warning("Booking approved, but the customer email could not be sent.")
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Could not approve booking.")),
      }
    )
  }

  function rejectBooking() {
    updateStatus.mutate(
      { id: booking.id, status: "REJECTED", reason: rejectionReason || undefined },
      {
        onSuccess: (data) => {
          toast.success("Booking rejected")
          if (data?.emailSent === false) {
            toast.warning("Booking rejected, but the customer email could not be sent.")
          }
          setRejectOpen(false)
          setRejectionReason("")
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Could not reject booking.")),
      }
    )
  }

  function saveReschedule() {
    updateStatus.mutate(
      { id: booking.id, bookingDate, bookingTime },
      {
        onSuccess: () => {
          toast.success("Appointment time updated")
          setRescheduleOpen(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Could not reschedule booking.")),
      }
    )
  }

  function confirmCancel() {
    updateStatus.mutate(
      { id: booking.id, status: "CANCELLED" },
      {
        onSuccess: () => {
          toast.success("Booking cancelled")
          setCancelOpen(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Could not cancel booking. Please try again.")),
      }
    )
  }

  function confirmDelete() {
    deleteBooking.mutate(booking.id, {
      onSuccess: () => {
        toast.success("Booking deleted")
        setDeleteOpen(false)
      },
      onError: (error) => toast.error(apiErrorMessage(error, "Could not delete booking. Please try again.")),
    })
  }

  return (
    <div className="flex items-center gap-1">
      {canReview && (
        <>
          <button
            type="button"
            title="Approve booking"
            aria-label="Approve booking"
            disabled={updateStatus.isPending}
            onClick={approveBooking}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Check className="size-3.5" />
            Approve
          </button>
          <button
            type="button"
            title="Reject booking"
            aria-label="Reject booking"
            disabled={updateStatus.isPending}
            onClick={() => setRejectOpen(true)}
            className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            Reject
          </button>
        </>
      )}
      {canReschedule && (
        <button
          type="button"
          aria-label="Reschedule booking"
          title="Reschedule booking"
          onClick={() => {
            setBookingDate(booking.bookingDate)
            setBookingTime(booking.bookingTime)
            setRescheduleOpen(true)
          }}
          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <CalendarClock className="size-4" />
        </button>
      )}
      <button
        type="button"
        aria-label="View booking"
        onClick={() => setViewOpen(true)}
        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Eye className="size-4" />
      </button>
      {/* Cancel only applies to appointments still to come; it emails the customer. */}
      <button
        type="button"
        aria-label="Cancel booking"
        title="Cancel booking"
        disabled={!canCancel}
        onClick={() => setCancelOpen(true)}
        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <CalendarX className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Delete booking"
        title="Delete booking"
        onClick={() => setDeleteOpen(true)}
        className="inline-flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
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
            {booking.status === "REJECTED" && booking.rejectionReason && (
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Rejection reason</span>
                <span>{booking.rejectionReason}</span>
              </div>
            )}
            <div className="mt-2 border-t pt-2">
              <p className="mb-2 font-medium">Reminder delivery</p>
              <div className="flex flex-col gap-1">
                <span>
                  Owner after 3 hours:{" "}
                  {booking.ownerReminderSentAt
                    ? `Sent ${new Date(booking.ownerReminderSentAt).toLocaleString()}`
                    : booking.status === "PENDING"
                      ? booking.ownerReminderLastError
                        ? `Failed; retrying (${booking.ownerReminderLastError})`
                        : "Waiting"
                      : "Not scheduled"}
                </span>
                <span>
                  Customer 24-hour:{" "}
                  {reminderStatus(
                    booking.customer24HourReminderSentAt,
                    booking.customer24HourReminderSkippedAt,
                    booking.status === "CONFIRMED",
                    booking.customer24HourReminderLastError
                  )}
                </span>
                <span>
                  Customer 2-hour:{" "}
                  {reminderStatus(
                    booking.customer2HourReminderSentAt,
                    booking.customer2HourReminderSkippedAt,
                    booking.status === "CONFIRMED",
                    booking.customer2HourReminderLastError
                  )}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject booking</DialogTitle>
            <DialogDescription>
              {booking.customerName}&apos;s request will be rejected and the customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`management-rejection-${booking.id}`}>Reason (optional)</Label>
            <Textarea
              id={`management-rejection-${booking.id}`}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Add a short message for the customer"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Keep booking
            </Button>
            <Button variant="destructive" disabled={updateStatus.isPending} onClick={rejectBooking}>
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Reject booking
            </Button>
          </DialogFooter>
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

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule booking</DialogTitle>
            <DialogDescription>
              Availability will be checked before the new appointment time is saved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reschedule-date-${booking.id}`}>Date</Label>
              <Input
                id={`reschedule-date-${booking.id}`}
                type="date"
                value={bookingDate}
                onChange={(event) => setBookingDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`reschedule-time-${booking.id}`}>Time</Label>
              <select
                id={`reschedule-time-${booking.id}`}
                value={bookingTime}
                onChange={(event) => setBookingTime(event.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Keep current time
            </Button>
            <Button disabled={updateStatus.isPending} onClick={saveReschedule}>
              {updateStatus.isPending && <Loader2 className="size-4 animate-spin" />}
              Save new time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete booking</DialogTitle>
            <DialogDescription>
              {booking.customerName}&apos;s booking on {booking.bookingDate} at{" "}
              {booking.bookingTime} will be removed for good, along with its revenue and
              counts on the dashboard. No email is sent. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              disabled={deleteBooking.isPending}
              onClick={confirmDelete}
            >
              {deleteBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
