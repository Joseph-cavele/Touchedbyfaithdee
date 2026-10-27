import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BookingRowActions } from "@/features/bookings/components/booking-row-actions"
import type { UpcomingAppointment } from "@/types"

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
}

export function UpcomingAppointmentsTable({
  appointments,
}: {
  appointments: UpcomingAppointment[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No upcoming appointments
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {appointments.map((appt) => (
                <li
                  key={appt.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 break-words font-medium">
                      {appt.customerName}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={statusVariant[appt.status] ?? "secondary"}>
                        {appt.status}
                      </Badge>
                      <BookingRowActions bookingId={appt.id} status={appt.status} />
                    </div>
                  </div>
                  <p className="break-words text-sm text-muted-foreground">
                    {appt.serviceNames.join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>With {appt.stylistName}</span>
                    <span>
                      {appt.bookingDate} · {appt.bookingTime}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop/tablet: table (scrolls horizontally if needed) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Stylist</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell className="font-medium">{appt.customerName}</TableCell>
                      <TableCell>{appt.serviceNames.join(", ")}</TableCell>
                      <TableCell>{appt.stylistName}</TableCell>
                      <TableCell>{appt.bookingDate}</TableCell>
                      <TableCell>{appt.bookingTime}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[appt.status] ?? "secondary"}>
                          {appt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <BookingRowActions bookingId={appt.id} status={appt.status} />
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
