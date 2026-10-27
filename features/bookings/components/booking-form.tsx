"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  createBookingSchema,
  type CreateBookingFormValues,
} from "@/features/bookings/schema"
import { useServices } from "@/features/bookings/hooks/use-services"
import { useStylists } from "@/features/bookings/hooks/use-stylists"
import { useCreateBooking } from "@/features/bookings/hooks/use-create-booking"
import { ServiceSelector } from "@/features/bookings/components/service-selector"
import { StylistSelector } from "@/features/bookings/components/stylist-selector"
import { HairstyleUpload } from "@/features/bookings/components/hairstyle-upload"
import { BookingSummary } from "@/features/bookings/components/booking-summary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"

const todayISO = () => new Date().toISOString().split("T")[0]

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false)
  const { data: services } = useServices()
  const { data: stylists } = useStylists()
  const createBooking = useCreateBooking()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      serviceIds: [],
      stylistId: "",
      bookingDate: "",
      bookingTime: "",
      description: "",
      notes: "",
      imageUrls: [],
    },
  })

  const values = watch()
  const selectedServices = (services ?? []).filter((s) =>
    values.serviceIds?.includes(s.id)
  )
  const selectedStylist = (stylists ?? []).find((s) => s.id === values.stylistId)

  async function onSubmit(data: CreateBookingFormValues) {
    try {
      await createBooking.mutateAsync(data)
      toast.success("Your booking has been submitted successfully!")
      setSubmitted(true)
      reset()
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold">
          Your booking has been submitted successfully!
        </h2>
        <p className="text-muted-foreground">
          The salon will review your request and notify you shortly.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Book another appointment
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8"
        noValidate
      >
        <FieldSet>
          <FieldLegend>Your details</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="customerName">Full name</FieldLabel>
              <Input id="customerName" {...register("customerName")} />
              {errors.customerName && (
                <FieldError>{errors.customerName.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="customerEmail">Email</FieldLabel>
              <Input
                id="customerEmail"
                type="email"
                {...register("customerEmail")}
              />
              {errors.customerEmail && (
                <FieldError>{errors.customerEmail.message}</FieldError>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Select services</FieldLegend>
          <ServiceSelector control={control} error={errors.serviceIds?.message} />
        </FieldSet>

        <FieldSet>
          <FieldLegend>Stylist, date &amp; time</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Stylist</FieldLabel>
              <StylistSelector control={control} error={errors.stylistId?.message} />
            </Field>
            <Field orientation="responsive">
              <div className="flex-1">
                <FieldLabel htmlFor="bookingDate">Date</FieldLabel>
                <Input
                  id="bookingDate"
                  type="date"
                  min={todayISO()}
                  {...register("bookingDate")}
                />
                {errors.bookingDate && (
                  <FieldError>{errors.bookingDate.message}</FieldError>
                )}
              </div>
              <div className="flex-1">
                <FieldLabel htmlFor="bookingTime">Time</FieldLabel>
                <Input id="bookingTime" type="time" {...register("bookingTime")} />
                {errors.bookingTime && (
                  <FieldError>{errors.bookingTime.message}</FieldError>
                )}
              </div>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Hairstyle inspiration</FieldLegend>
          <FieldDescription>
            Upload at least one image of the hairstyle you want.
          </FieldDescription>
          <HairstyleUpload
            onChange={(urls) => setValue("imageUrls", urls, { shouldValidate: true })}
            error={errors.imageUrls?.message}
          />
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">Additional details (optional)</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea id="description" {...register("description")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" {...register("notes")} />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Button type="submit" size="lg" disabled={createBooking.isPending}>
          {createBooking.isPending && <Loader2 className="size-4 animate-spin" />}
          Book Appointment
        </Button>
      </form>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <BookingSummary
          customerName={values.customerName}
          services={selectedServices}
          stylist={selectedStylist}
          bookingDate={values.bookingDate}
          bookingTime={values.bookingTime}
        />
      </div>
    </div>
  )
}
