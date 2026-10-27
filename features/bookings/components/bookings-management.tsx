"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useBookings } from "@/features/bookings/hooks/use-bookings"
import { BookingManagementRowActions } from "@/features/bookings/components/booking-management-row-actions"
import { AddWalkInButton } from "@/features/bookings/components/walk-in-dialog"
import type { BookingStatus } from "@/types"

const TABS: { label: string; status?: BookingStatus }[] = [
  { label: "All" },
  { label: "Awaiting payment", status: "PENDING_PAYMENT" },
  { label: "Pending", status: "PENDING" },
  { label: "Confirmed", status: "CONFIRMED" },
  { label: "Cancelled", status: "CANCELLED" },
  { label: "Completed", status: "COMPLETED" },
]

const statusVariant: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_PAYMENT: "outline",
  PENDING: "secondary",
  CONFIRMED: "default",
  CANCELLED: "destructive",
  COMPLETED: "outline",
  NO_SHOW: "outline",
}

/** Marks a booking recorded on the dashboard for a walk-in client. */
function WalkInTag() {
  return (
    <span className="ml-2 inline-flex rounded-full bg-brand-rose/15 px-2 py-0.5 align-middle text-[10px] font-semibold tracking-wide text-brand-text uppercase">
      Walk-in
    </span>
  )
}

export function BookingsManagement() {
  const [tab, setTab] = useState<string>("All")
  const activeStatus = TABS.find((t) => t.label === tab)?.status
  const { data, isLoading, isError } = useBookings(activeStatus)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle>Bookings Management</CardTitle>
        <AddWalkInButton />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1 border-b pb-3">
          {TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(t.label)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.label
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Could not load bookings.
          </p>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No bookings in this view.
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {data.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 break-words font-medium">
                      {booking.customerName}
                      {booking.walkIn && <WalkInTag />}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={statusVariant[booking.status]}>
                        {booking.status}
                      </Badge>
                      <BookingManagementRowActions booking={booking} />
                    </div>
                  </div>
                  <p className="break-words text-sm text-muted-foreground">
                    {booking.serviceNames.join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>With {booking.stylistName}</span>
                    <span>
                      {booking.bookingDate}, {booking.bookingTime}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Stylist</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.customerName}
                        {booking.walkIn && <WalkInTag />}
                      </TableCell>
                      <TableCell>{booking.serviceNames.join(", ")}</TableCell>
                      <TableCell>{booking.stylistName}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {booking.bookingDate}, {booking.bookingTime}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[booking.status]}>{booking.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <BookingManagementRowActions booking={booking} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
