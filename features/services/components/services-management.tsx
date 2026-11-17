"use client"

import { useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Power } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useServices } from "@/features/bookings/hooks/use-services"
import { useToggleService } from "@/features/services/hooks/use-toggle-service"
import { ServiceFormDialog } from "@/features/services/components/service-form-dialog"
import { COMBO_CATEGORY, SERVICE_CATEGORIES } from "@/features/services/schema"
import { formatPrice } from "@/lib/currency"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Service } from "@/types"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

/**
 * With `category`, the list and the add/edit form are scoped to that one
 * category — the Combos page is this component with `category="Combos"`.
 * Combos are ordinary services underneath, so they book, pay and report
 * exactly like the rest.
 */
export function ServicesManagement({
  category,
}: {
  category?: (typeof SERVICE_CATEGORIES)[number]
} = {}) {
  const { data: all, isLoading, isError } = useServices(true)
  const isCombos = category === COMBO_CATEGORY
  const noun = isCombos ? "combo" : "service"
  const Noun = isCombos ? "Combo" : "Service"
  const toggleService = useToggleService()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const data = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return (all ?? []).filter((service) => {
      const active = service.isActive !== false
      return (
        (!category || service.category === category) &&
        (categoryFilter === "all" || service.category === categoryFilter) &&
        (statusFilter === "all" || (statusFilter === "active" ? active : !active)) &&
        (!query || `${service.name} ${service.description ?? ""}`.toLocaleLowerCase().includes(query))
      )
    })
  }, [all, category, categoryFilter, search, statusFilter])

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setFormOpen(true)
  }

  function toggleActive(service: Service) {
    const isActive = service.isActive === false
    toggleService.mutate({ id: service.id, isActive }, {
      onSuccess: () => {
        toast.success(`${Noun} ${isActive ? "activated" : "deactivated"}`)
      },
      onError: () => toast.error(`Could not update ${noun}. Please try again.`),
    })
  }

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{Noun}s Management</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add {Noun}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
          <Input
            aria-label={`Search ${noun}s`}
            placeholder={`Search ${noun}s`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {SERVICE_CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="all">All statuses</option>
          </select>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Could not load {noun}s.
          </p>
        ) : !data?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No {noun}s yet. Add your first one.
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {data.map((service) => (
                <li
                  key={service.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="break-words font-medium">{service.name}</span>
                    <Badge className="mt-1 w-fit" variant={service.isActive === false ? "secondary" : "default"}>
                      {service.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(service.price)} · {formatDuration(service.duration)}
                    </span>
                    {isCombos && !!service.includes?.length && (
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {service.includes.join(" · ")}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${noun}`}
                      onClick={() => openEdit(service)}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${service.isActive === false ? "Activate" : "Deactivate"} ${noun}`}
                      title={`${service.isActive === false ? "Activate" : "Deactivate"} ${noun}`}
                      disabled={toggleService.isPending}
                      onClick={() => toggleActive(service)}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                    >
                      {toggleService.isPending ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{Noun}</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                        {service.isActive === false && (
                          <Badge className="ml-2" variant="secondary">Inactive</Badge>
                        )}
                        {isCombos && !!service.includes?.length && (
                          <span className="block max-w-md truncate text-xs font-normal text-muted-foreground">
                            {service.includes.join(" · ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(service.price)}</TableCell>
                      <TableCell>{formatDuration(service.duration)}</TableCell>
                      <TableCell>
                        <Badge variant={service.isActive === false ? "secondary" : "default"}>
                          {service.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${noun}`}
                            onClick={() => openEdit(service)}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`${service.isActive === false ? "Activate" : "Deactivate"} ${noun}`}
                            title={`${service.isActive === false ? "Activate" : "Deactivate"} ${noun}`}
                            disabled={toggleService.isPending}
                            onClick={() => toggleActive(service)}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                          >
                            {toggleService.isPending ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        service={editing}
        category={category}
      />

    </Card>
  )
}
