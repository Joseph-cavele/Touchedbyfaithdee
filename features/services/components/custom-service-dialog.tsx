"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiErrorMessage } from "@/lib/api-client"
import { CUSTOM_SERVICE_CATEGORIES, customServiceInputSchema, type CustomServiceInputValues } from "@/features/services/schema"
import { useCreateService } from "@/features/services/hooks/use-create-service"
import type { Service } from "@/types"

export function CustomServiceDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (service: Service, savedToCatalogue: boolean) => void
}) {
  const createService = useCreateService()
  const [saveToCatalogue, setSaveToCatalogue] = useState(true)
  const [serverError, setServerError] = useState("")
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomServiceInputValues>({
    resolver: zodResolver(customServiceInputSchema),
    defaultValues: { name: "", category: "Hair", price: undefined, duration: 120, description: "" },
  })

  function close() {
    onOpenChange(false)
    setServerError("")
    setSaveToCatalogue(true)
    reset({ name: "", category: "Hair", price: undefined, duration: 120, description: "" })
  }

  async function submit(values: CustomServiceInputValues) {
    setServerError("")
    if (saveToCatalogue) {
      try {
        const service = await createService.mutateAsync(values)
        onAdd(service, true)
        toast.success(`${service.name} added to the service catalogue`)
        close()
      } catch (error) {
        const message = apiErrorMessage(error, "Could not save this service.")
        setServerError(message)
        toast.error(message)
      }
      return
    }

    onAdd(
      {
        id: globalThis.crypto.randomUUID(),
        ...values,
        isActive: false,
      },
      false
    )
    toast.success(`${values.name} added to this booking`)
    close()
  }

  const pending = createService.isPending

  return (
    <Dialog open={open} onOpenChange={(value) => !value && !pending && close()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a custom service</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Add a one-time service or save it for future bookings.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-3" noValidate>
          {serverError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="custom-service-name">Service name</FieldLabel>
            <Input id="custom-service-name" autoFocus {...register("name")} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>
          <Field>
            <FieldLabel htmlFor="custom-service-category">Category</FieldLabel>
            <select
              id="custom-service-category"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
              {...register("category")}
            >
              {CUSTOM_SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <FieldError>{errors.category.message}</FieldError>}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="custom-service-price">Price (R)</FieldLabel>
              <Input
                id="custom-service-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                {...register("price", { setValueAs: (value) => value === "" ? undefined : Number(value) })}
              />
              {errors.price && <FieldError>{errors.price.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="custom-service-duration">Duration (minutes)</FieldLabel>
              <Input
                id="custom-service-duration"
                type="number"
                min="1"
                step="5"
                {...register("duration", { setValueAs: (value) => value === "" ? undefined : Number(value) })}
              />
              {errors.duration && <FieldError>{errors.duration.message}</FieldError>}
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="custom-service-description">Description (optional)</FieldLabel>
            <Textarea id="custom-service-description" rows={2} {...register("description")} />
            {errors.description && <FieldError>{errors.description.message}</FieldError>}
          </Field>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              checked={saveToCatalogue}
              onChange={(event) => setSaveToCatalogue(event.target.checked)}
              className="mt-0.5 size-4 accent-[var(--lz-gold)]"
            />
            <span>
              <span className="block font-medium">Save to service catalogue</span>
              <span className="text-xs text-muted-foreground">
                Make this service available for future bookings.
              </span>
            </span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {saveToCatalogue ? "Save and add service" : "Add to booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
