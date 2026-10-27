"use client"

import { Control, Controller } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { useServices } from "@/features/bookings/hooks/use-services"
import type { CreateBookingFormValues } from "@/features/bookings/schema"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { formatPrice } from "@/lib/currency"

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function ServiceSelector({
  control,
  error,
}: {
  control: Control<CreateBookingFormValues>
  error?: string
}) {
  const { data: services, isLoading, isError } = useServices()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading services...
      </div>
    )
  }

  if (isError || !services?.length) {
    return (
      <p className="text-sm text-destructive">
        Could not load services. Please refresh the page.
      </p>
    )
  }

  return (
    <Controller
      control={control}
      name="serviceIds"
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          {services.map((service) => {
            const checked = field.value?.includes(service.id) ?? false
            return (
              <FieldLabel
                key={service.id}
                htmlFor={`service-${service.id}`}
                className="flex-row items-start justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={checked}
                    onCheckedChange={(value) => {
                      const next = value
                        ? [...(field.value ?? []), service.id]
                        : (field.value ?? []).filter((id) => id !== service.id)
                      field.onChange(next)
                    }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{service.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {service.description}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end text-sm">
                  <span className="font-medium">{formatPrice(service.price)}</span>
                  <span className="text-muted-foreground">
                    {formatDuration(service.duration)}
                  </span>
                </div>
              </FieldLabel>
            )
          })}
          {error && <FieldError>{error}</FieldError>}
        </div>
      )}
    />
  )
}
