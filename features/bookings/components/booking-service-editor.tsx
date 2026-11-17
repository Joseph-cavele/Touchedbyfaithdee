"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useServices } from "@/features/bookings/hooks/use-services"
import { useUpdateBookingServices } from "@/features/bookings/hooks/use-update-booking-services"
import { CustomServiceDialog } from "@/features/services/components/custom-service-dialog"
import { formatCurrency, formatTotal, formatPrice } from "@/lib/currency"
import { apiErrorMessage } from "@/lib/api-client"
import type { BookingListItem, Service } from "@/types"
import type { CustomServiceInputValues } from "@/features/services/schema"

type CustomBookingService = CustomServiceInputValues & { id: string }

export function BookingServiceEditor({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: services, isLoading, isError } = useServices(true)
  const updateServices = useUpdateBookingServices()
  const [serviceIds, setServiceIds] = useState<string[]>(() =>
    (booking.serviceItems ?? []).flatMap((item) => item.serviceId ? [item.serviceId] : [])
  )
  const [customServices, setCustomServices] = useState<CustomBookingService[]>(() =>
    (booking.serviceItems ?? []).flatMap((item, index) =>
      item.serviceId
        ? []
        : [{
            id: `existing-${booking.id}-${index}`,
            name: item.serviceName,
            category: "Other" as const,
            price: item.price ?? 0,
            duration: item.duration,
            description: "",
          }]
    )
  )
  const [customDialogOpen, setCustomDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const selectedCatalog = useMemo(
    () => (services ?? []).filter((service) => serviceIds.includes(service.id)),
    [serviceIds, services]
  )
  const total = formatTotal([
    ...selectedCatalog.map((service) => service.price),
    ...customServices.map((service) => service.price),
  ])

  function addCustomService(service: Service, savedToCatalogue: boolean) {
    if (savedToCatalogue) {
      const addService = (current: Service[] = []) => [
        ...current.filter((item) => item.id !== service.id),
        service,
      ]
      queryClient.setQueryData<Service[]>(["services"], addService)
      queryClient.setQueryData<Service[]>(["services", "all"], addService)
      setServiceIds((ids) => ids.includes(service.id) ? ids : [...ids, service.id])
      return
    }

    setCustomServices((items) => [
      ...items,
      {
        id: service.id,
        name: service.name,
        category: service.category as CustomServiceInputValues["category"],
        price: service.price ?? 0,
        duration: service.duration,
        description: service.description ?? "",
      },
    ])
  }

  function save() {
    updateServices.mutate(
      {
        id: booking.id,
        serviceIds,
        customServices: customServices.map((service) => ({
          name: service.name,
          category: service.category,
          price: service.price,
          duration: service.duration,
          description: service.description,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Booking services updated")
          onOpenChange(false)
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Could not update booking services.")),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && !updateServices.isPending && onOpenChange(false)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit booking services</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Prices are captured on this booking when you save.
          </p>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !services ? (
          <p role="alert" className="text-sm text-destructive">Could not load services. Try again.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="max-h-64 overflow-y-auto rounded-lg border p-3">
              {services.map((service) => {
                const checked = serviceIds.includes(service.id)
                const inactive = service.isActive === false
                return (
                  <label key={service.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-1.5 py-2 text-sm hover:bg-muted/60">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={inactive && !checked}
                        onChange={() => setServiceIds((ids) =>
                          checked ? ids.filter((id) => id !== service.id) : [...ids, service.id]
                        )}
                        className="size-4 accent-[var(--lz-gold)]"
                      />
                      <span>
                        {service.name}
                        {inactive && <span className="ml-1 text-xs text-muted-foreground">(inactive)</span>}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{formatPrice(service.price)}</span>
                  </label>
                )
              })}
            </div>
            {customServices.length > 0 && (
              <ul className="flex flex-col gap-2 rounded-lg border p-3">
                {customServices.map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{service.name} <span className="text-xs text-muted-foreground">Custom</span></span>
                    <span className="flex items-center gap-2">
                      {formatCurrency(service.price)}
                      <button
                        type="button"
                        aria-label={`Remove ${service.name}`}
                        onClick={() => setCustomServices((items) => items.filter((item) => item.id !== service.id))}
                        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="outline" className="w-fit rounded-full" onClick={() => setCustomDialogOpen(true)}>
              <Plus aria-hidden />
              Add custom service
            </Button>
          </div>
        )}
        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm">New total <span className="font-semibold">{total}</span></p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={updateServices.isPending} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isLoading || isError || updateServices.isPending || serviceIds.length + customServices.length === 0}
              onClick={save}
            >
              {updateServices.isPending && <Loader2 className="size-4 animate-spin" />}
              Save services
            </Button>
          </div>
        </DialogFooter>
        <CustomServiceDialog
          open={customDialogOpen}
          onOpenChange={setCustomDialogOpen}
          onAdd={addCustomService}
        />
      </DialogContent>
    </Dialog>
  )
}
