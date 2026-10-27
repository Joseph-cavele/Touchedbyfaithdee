"use client"

import { useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useAllStylists } from "@/features/stylists/hooks/use-all-stylists"
import { useDeleteStylist } from "@/features/stylists/hooks/use-delete-stylist"
import { StylistFormDialog } from "@/features/stylists/components/stylist-form-dialog"
import type { Stylist } from "@/types"

export function StylistsManagement() {
  const { data, isLoading, isError } = useAllStylists()
  const deleteStylist = useDeleteStylist()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Stylist | undefined>(undefined)
  const [deleting, setDeleting] = useState<Stylist | undefined>(undefined)

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(stylist: Stylist) {
    setEditing(stylist)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return
    deleteStylist.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Stylist removed")
        setDeleting(undefined)
      },
      onError: () => toast.error("Could not remove stylist. Please try again."),
    })
  }

  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Stylists Management</CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add Stylist
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !data ? (
          <p className="py-8 text-center text-sm text-destructive">
            Could not load stylists.
          </p>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No stylists yet. Add your first one.
          </p>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {data.map((stylist) => (
                <li
                  key={stylist.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 break-words font-medium">
                      {stylist.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={stylist.active ? "default" : "destructive"}>
                        {stylist.active ? "Active" : "Inactive"}
                      </Badge>
                      <button
                        type="button"
                        aria-label="Edit stylist"
                        onClick={() => openEdit(stylist)}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove stylist"
                        onClick={() => setDeleting(stylist)}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p className="break-words text-sm text-muted-foreground">
                    {stylist.services.map((s) => s.name).join(", ") || "All services"}
                  </p>
                </li>
              ))}
            </ul>

            {/* Desktop/tablet: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stylist</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((stylist) => (
                    <TableRow key={stylist.id}>
                      <TableCell className="font-medium">{stylist.name}</TableCell>
                      <TableCell>
                        {stylist.services.map((s) => s.name).join(", ") || "All services"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stylist.active ? "default" : "destructive"}>
                          {stylist.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label="Edit stylist"
                            onClick={() => openEdit(stylist)}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove stylist"
                            onClick={() => setDeleting(stylist)}
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

      <StylistFormDialog open={formOpen} onOpenChange={setFormOpen} stylist={editing} />

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove stylist</DialogTitle>
            <DialogDescription>
              This will permanently remove &quot;{deleting?.name}&quot; from your team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteStylist.isPending}
              onClick={confirmDelete}
            >
              {deleteStylist.isPending && <Loader2 className="size-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
