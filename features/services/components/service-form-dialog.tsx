"use client"

import { useEffect } from "react"
import { useForm, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  serviceInputSchema,
  COMBO_CATEGORY,
  DEFAULT_SERVICE_CATEGORY,
  SERVICE_CATEGORIES,
  type ServiceInputValues,
} from "@/features/services/schema"
import { useCreateService } from "@/features/services/hooks/use-create-service"
import { useUpdateService } from "@/features/services/hooks/use-update-service"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { ImageUploadField } from "@/components/dashboard/image-upload-field"
import type { Service } from "@/types"

type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

function toCategory(value?: string): ServiceCategory {
  return SERVICE_CATEGORIES.includes(value as ServiceCategory)
    ? (value as ServiceCategory)
    : DEFAULT_SERVICE_CATEGORY
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
  /** Lock the form to one category (the Combos page) and hide its picker. */
  category?: ServiceCategory
}) {
  const createService = useCreateService()
  const updateService = useUpdateService()
  const isEditing = !!service
  const isPending = createService.isPending || updateService.isPending
  const noun = category === COMBO_CATEGORY ? "combo" : "service"

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ServiceInputValues>({
    resolver: zodResolver(serviceInputSchema),
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service?.price,
      duration: service?.duration ?? 30,
      category: category ?? toCategory(service?.category),
      image: service?.image ?? "",
      includes: service?.includes ?? [],
    },
  })

  // The checklist belongs to combos; other services never show the field.
  const isCombo = useWatch({ control, name: "category" }) === COMBO_CATEGORY

  useEffect(() => {
    if (open) {
      reset({
        name: service?.name ?? "",
        description: service?.description ?? "",
        price: service?.price,
        duration: service?.duration ?? 30,
        category: category ?? toCategory(service?.category),
        image: service?.image ?? "",
        includes: service?.includes ?? [],
      })
    }
  }, [open, service, category, reset])

  async function onSubmit(formValues: ServiceInputValues) {
    // Re-filing a combo as another category drops its checklist.
    const values = isCombo ? formValues : { ...formValues, includes: [] }
    try {
      if (isEditing) {
        await updateService.mutateAsync({ id: service.id, ...values })
        toast.success(`${capitalize(noun)} updated`)
      } else {
        await createService.mutateAsync(values)
        toast.success(`${capitalize(noun)} added`)
      }
      onOpenChange(false)
    } catch {
      toast.error(`Could not save ${noun}. Please try again.`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${noun}` : `Add ${noun}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="service-name">Name</FieldLabel>
              <Input id="service-name" {...register("name")} />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="service-description">Description</FieldLabel>
              <Textarea id="service-description" {...register("description")} />
              {errors.description && <FieldError>{errors.description.message}</FieldError>}
            </Field>
            <Field>
              <Controller
                control={control}
                name="image"
                render={({ field }) => (
                  <ImageUploadField
                    label={`${capitalize(noun)} photo`}
                    aspect="wide"
                    folder="services"
                    description={
                      isCombo
                        ? "Shown on the home page and the booking page. JPG, PNG or WEBP, up to 5MB."
                        : "Shown on the booking page. JPG, PNG or WEBP, up to 5MB."
                    }
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
              {errors.image && <FieldError>{errors.image.message}</FieldError>}
            </Field>
            {isCombo && (
              <Field>
                <FieldLabel htmlFor="service-includes">What&rsquo;s included</FieldLabel>
                <Controller
                  control={control}
                  name="includes"
                  render={({ field }) => (
                    <Textarea
                      id="service-includes"
                      rows={4}
                      placeholder={'Basic hair installation\nOccasional makeup'}
                      // One item per line. Blank lines are kept while typing
                      // and dropped by the schema on save.
                      value={(field.value ?? []).join("\n")}
                      onChange={(e) => field.onChange(e.target.value.split("\n"))}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  One item per line — shown as a checklist on the home page.
                </p>
                {errors.includes && <FieldError>{errors.includes.message}</FieldError>}
              </Field>
            )}
            {!category && (
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <FieldError>{errors.category.message}</FieldError>}
              </Field>
            )}
            <Field orientation="responsive">
              <div className="flex-1">
                <FieldLabel htmlFor="service-price">Price (R)</FieldLabel>
                <Input
                  id="service-price"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Price on request"
                  {...register("price", {
                    // Blank means "Price on request" — undefined, never 0.
                    setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
                  })}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank to show &ldquo;Price on request&rdquo;.
                </p>
                {errors.price && <FieldError>{errors.price.message}</FieldError>}
              </div>
              <div className="flex-1">
                <FieldLabel htmlFor="service-duration">Duration (min)</FieldLabel>
                <Input
                  id="service-duration"
                  type="number"
                  step="5"
                  {...register("duration", { valueAsNumber: true })}
                />
                {errors.duration && <FieldError>{errors.duration.message}</FieldError>}
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEditing ? "Save changes" : `Add ${noun}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
