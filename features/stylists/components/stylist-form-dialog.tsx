"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { stylistInputSchema, type StylistInputValues } from "@/features/stylists/schema"
import { useCreateStylist } from "@/features/stylists/hooks/use-create-stylist"
import { useUpdateStylist } from "@/features/stylists/hooks/use-update-stylist"
import { useServices } from "@/features/bookings/hooks/use-services"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ImageUploadField } from "@/components/dashboard/image-upload-field"
import type { Stylist } from "@/types"

export function StylistFormDialog({
  open,
  onOpenChange,
  stylist,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  stylist?: Stylist
}) {
  const createStylist = useCreateStylist()
  const updateStylist = useUpdateStylist()
  const { data: services } = useServices()
  const isEditing = !!stylist
  const isPending = createStylist.isPending || updateStylist.isPending

  const defaultValues: StylistInputValues = {
    name: stylist?.name ?? "",
    email: stylist?.email ?? "",
    phone: stylist?.phone ?? "",
    bio: stylist?.bio ?? "",
    image: stylist?.image ?? "",
    workingHours: stylist?.workingHours ?? "",
    active: stylist?.active ?? true,
    services: stylist?.services.map((s) => s.id) ?? [],
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StylistInputValues>({
    resolver: zodResolver(stylistInputSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stylist, reset])

  async function onSubmit(values: StylistInputValues) {
    try {
      if (isEditing) {
        await updateStylist.mutateAsync({ id: stylist.id, ...values })
        toast.success("Stylist updated")
      } else {
        await createStylist.mutateAsync(values)
        toast.success("Stylist added")
      }
      onOpenChange(false)
    } catch {
      toast.error("Could not save stylist. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit stylist" : "Add stylist"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="stylist-name">Name</FieldLabel>
              <Input id="stylist-name" {...register("name")} />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            <Field orientation="responsive">
              <div className="flex-1">
                <FieldLabel htmlFor="stylist-email">Email (optional)</FieldLabel>
                <Input id="stylist-email" type="email" {...register("email")} />
                {errors.email && <FieldError>{errors.email.message}</FieldError>}
              </div>
              <div className="flex-1">
                <FieldLabel htmlFor="stylist-phone">Phone (optional)</FieldLabel>
                <Input id="stylist-phone" {...register("phone")} />
                {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="stylist-bio">Bio</FieldLabel>
              <Textarea id="stylist-bio" {...register("bio")} />
            </Field>
            <Field>
              <Controller
                control={control}
                name="image"
                render={({ field }) => (
                  <ImageUploadField
                    label="Portrait"
                    aspect="square"
                    folder="stylists"
                    description="Shown when customers pick a stylist. JPG, PNG or WEBP, up to 5MB."
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              {errors.image && <FieldError>{errors.image.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="stylist-hours">Working hours</FieldLabel>
              <Input
                id="stylist-hours"
                placeholder="Mon-Sat 9:00 AM - 6:00 PM"
                {...register("workingHours")}
              />
            </Field>
            <Field>
              <FieldLabel>Specialties</FieldLabel>
              <Controller
                control={control}
                name="services"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {(services ?? []).map((service) => {
                      const checked = field.value?.includes(service.id) ?? false
                      return (
                        <label
                          key={service.id}
                          htmlFor={`stylist-service-${service.id}`}
                          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
                        >
                          <Checkbox
                            id={`stylist-service-${service.id}`}
                            checked={checked}
                            onCheckedChange={(value) => {
                              const next = value
                                ? [...(field.value ?? []), service.id]
                                : (field.value ?? []).filter((id) => id !== service.id)
                              field.onChange(next)
                            }}
                          />
                          {service.name}
                        </label>
                      )
                    })}
                  </div>
                )}
              />
            </Field>
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <label className="flex w-fit items-center gap-2 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  Active (visible for new bookings)
                </label>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add stylist"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
