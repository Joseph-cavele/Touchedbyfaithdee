"use client"

import { Control, Controller } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { useStylists } from "@/features/bookings/hooks/use-stylists"
import type { CreateBookingFormValues } from "@/features/bookings/schema"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldError } from "@/components/ui/field"

export function StylistSelector({
  control,
  error,
}: {
  control: Control<CreateBookingFormValues>
  error?: string
}) {
  const { data: stylists, isLoading, isError } = useStylists()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading stylists...
      </div>
    )
  }

  if (isError || !stylists?.length) {
    return (
      <p className="text-sm text-destructive">
        Could not load stylists. Please refresh the page.
      </p>
    )
  }

  return (
    <Controller
      control={control}
      name="stylistId"
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a stylist" />
            </SelectTrigger>
            <SelectContent>
              {stylists.map((stylist) => (
                <SelectItem key={stylist.id} value={stylist.id}>
                  {stylist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <FieldError>{error}</FieldError>}
        </div>
      )}
    />
  )
}
