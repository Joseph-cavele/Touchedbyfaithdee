"use client"

import { useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useServices } from "@/features/bookings/hooks/use-services"
import { useDeleteService } from "@/features/services/hooks/use-delete-service"
import { ServiceFormDialog } from "@/features/services/components/service-form-dialog"
import { COMBO_CATEGORY, type SERVICE_CATEGORIES } from "@/features/services/schema"
import { formatPrice } from "@/lib/currency"
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
  const { data: all, isLoading, isError } = useServices()
  const data = category ? all?.filter((s) => s.category === category) : all
  const isCombos = category === COMBO_CATEGORY
  const noun = isCombos ? "combo" : "service"
  const Noun = isCombos ? "Combo" : "Service"
  const deleteService = useDeleteService()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Service | undefined>(undefined)
  const [deleting, setDeleting] = useState<Service | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return
    deleteService.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${Noun} deleted`)
        setDeleting(undefined)
      },
      onError: () => toast.error(`Could not delete ${noun}. Please try again.`),
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
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Could not load {noun}s.
          </p>
        ) : data.length === 0 ? (
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
                      aria-label={`Delete ${noun}`}
                      onClick={() => setDeleting(service)}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
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
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                        {isCombos && !!service.includes?.length && (
                          <span className="block max-w-md truncate text-xs font-normal text-muted-foreground">
                            {service.includes.join(" · ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(service.price)}</TableCell>
                      <TableCell>{formatDuration(service.duration)}</TableCell>
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
                            aria-label={`Delete ${noun}`}
                            onClick={() => setDeleting(service)}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" />
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

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {noun}</DialogTitle>
            <DialogDescription>
              This will permanently remove &quot;{deleting?.name}&quot; from your {noun}s.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteService.isPending}
              onClick={confirmDelete}
            >
              {deleteService.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
