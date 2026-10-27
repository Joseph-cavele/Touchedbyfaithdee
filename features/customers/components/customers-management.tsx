"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCustomers } from "@/features/customers/hooks/use-customers"
import { AddWalkInButton } from "@/features/bookings/components/walk-in-dialog"

export function CustomersManagement() {
  const { data, isLoading, isError } = useCustomers()
  const [query, setQuery] = useState("")

  const filtered = (data ?? []).filter((customer) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    )
  })

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Customers Management</CardTitle>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <AddWalkInButton />
          <div className="relative w-full sm:w-48">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Could not load customers.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No customers found.
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {filtered.map((customer) => (
                <li
                  key={customer.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="break-words font-medium">{customer.name}</span>
                    <span className="break-all text-xs text-muted-foreground">
                      {[customer.email, customer.phone]
                        .filter(Boolean)
                        .join(" · ") || "No contact details"}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {customer.totalBookings} booking
                    {customer.totalBookings === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {customer.phone || "—"}
                      </TableCell>
                      <TableCell>{customer.totalBookings}</TableCell>
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
