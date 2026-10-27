"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { settingsSchema, type SettingsFormValues } from "@/features/settings/schema"
import { useSettings, useUpdateSettings } from "@/features/settings/hooks/use-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"

const EMPTY: SettingsFormValues = {
  salonName: "",
  tagline: "",
  email: "",
  phone: "",
  address: "",
  openingHours: "",
  notificationEmail: "",
  emailNotifications: true,
}

export function SettingsForm() {
  const { data, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  async function onSubmit(values: SettingsFormValues) {
    try {
      const saved = await updateSettings.mutateAsync(values)
      reset(saved)
      toast.success("Settings saved")
    } catch {
      toast.error("Could not save settings. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Salon Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="salonName">Salon name</FieldLabel>
                <Input id="salonName" {...register("salonName")} />
                {errors.salonName && <FieldError>{errors.salonName.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="tagline">Tagline</FieldLabel>
                <Input id="tagline" {...register("tagline")} />
                {errors.tagline && <FieldError>{errors.tagline.message}</FieldError>}
              </Field>
              <Field orientation="responsive">
                <div className="flex-1">
                  <FieldLabel htmlFor="email">Contact email</FieldLabel>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && <FieldError>{errors.email.message}</FieldError>}
                </div>
                <div className="flex-1">
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input id="phone" {...register("phone")} />
                  {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Textarea id="address" {...register("address")} />
                {errors.address && <FieldError>{errors.address.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="openingHours">Opening hours</FieldLabel>
                <Input id="openingHours" {...register("openingHours")} />
                {errors.openingHours && <FieldError>{errors.openingHours.message}</FieldError>}
              </Field>

              <div className="border-t pt-5">
                <Field>
                  <FieldLabel htmlFor="notificationEmail">
                    Booking notification email
                  </FieldLabel>
                  <Input
                    id="notificationEmail"
                    type="email"
                    placeholder="Where new-booking alerts are sent"
                    {...register("notificationEmail")}
                  />
                  {errors.notificationEmail && (
                    <FieldError>{errors.notificationEmail.message}</FieldError>
                  )}
                </Field>
                <Controller
                  control={control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <label className="mt-3 flex w-fit items-center gap-2 text-sm">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      Email me when a new booking is requested
                    </label>
                  )}
                />
              </div>
            </FieldGroup>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateSettings.isPending || !isDirty}>
                {updateSettings.isPending && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
