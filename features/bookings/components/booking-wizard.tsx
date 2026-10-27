                                                                                                                                                                                                                                                  "use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Loader2,
  Phone,
  Scissors,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react"
import {
  createBookingSchema,
  type CreateBookingFormValues,
} from "@/features/bookings/schema"
import { DEFAULT_SERVICE_CATEGORY, SERVICE_CATEGORIES } from "@/features/services/schema"
import { useServices } from "@/features/bookings/hooks/use-services"
import { useStylists } from "@/features/bookings/hooks/use-stylists"
import { useCreateBooking } from "@/features/bookings/hooks/use-create-booking"
import { HairstyleUpload } from "@/features/bookings/components/hairstyle-upload"
import { startPayment } from "@/features/bookings/start-payment"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { stockPhotos, serviceThumb } from "@/lib/stock-photos"
import { serviceImageByName } from "@/lib/salon-services"
import {
  SALON_PHONE,
  SALON_PHONE_DISPLAY,
  WHATSAPP_MESSAGES,
  whatsappLink,
} from "@/lib/salon-contact"
import { formatPrice, formatTotal } from "@/lib/currency"
import {
  isSlotTaken,
  runsPastClosing,
  TIME_SLOTS,
  toMinutes,
  type BusyInterval,
} from "@/features/bookings/availability"
import { useAvailability } from "@/features/bookings/hooks/use-availability"
import { ONLINE_PAYMENTS_ENABLED } from "@/features/bookings/schema"
import type { PaymentMethod, Service, Stylist } from "@/types"


const STEPS = [
  { key: "service", label: "Service", icon: Scissors },
  { key: "staff", label: "Staff", icon: Users },
  { key: "datetime", label: "Date & Time", icon: CalendarDays },
  { key: "details", label: "Your Details", icon: UserRound },
  { key: "review", label: "Review & Confirm", icon: BadgeCheck },
] as const

const STEP_FIELDS: (keyof CreateBookingFormValues)[][] = [
  ["serviceIds"],
  ["stylistId"],
  ["bookingDate", "bookingTime"],
  ["customerName", "customerEmail", "customerPhone"],
  [],
]

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours} hr`
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  const ap = h >= 12 ? "PM" : "AM"
  const hr = h % 12 || 12
  return `${hr}:${String(m).padStart(2, "0")} ${ap}`
}

function formatDate(iso: string) {
  if (!iso) return ""
  const [y, mo, d] = iso.split("-").map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

const todayISO = () => new Date().toISOString().split("T")[0]

/**
 * `initialServiceId` / `initialCategory` come from /book?service=… links —
 * the home page's per-combo "Book" buttons — and only set where the wizard
 * starts: that service already chosen, its category's tab open. app/book
 * checks both against the real service list before passing them in.
 */
export function BookingWizard({
  initialServiceId,
  initialCategory,
}: {
  initialServiceId?: string
  initialCategory?: (typeof SERVICE_CATEGORIES)[number]
} = {}) {
  const [step, setStep] = useState(0)
  const [activeCategory, setActiveCategory] = useState<(typeof SERVICE_CATEGORIES)[number]>(
    initialCategory ?? DEFAULT_SERVICE_CATEGORY
  )
  const [submitted, setSubmitted] = useState(false)

  const {
    data: services = [],
    isLoading: servicesLoading,
    isError: servicesError,
    refetch: refetchServices,
  } = useServices()
  const {
    data: stylists = [],
    isLoading: stylistsLoading,
    isError: stylistsError,
    refetch: refetchStylists,
  } = useStylists()
  const createBooking = useCreateBooking()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      // Overwritten by whichever finish button is pressed.
      paymentMethod: "IN_PERSON",
      serviceIds: initialServiceId ? [initialServiceId] : [],
      stylistId: "",
      bookingDate: "",
      bookingTime: "",
      description: "",
      notes: "",
      imageUrls: [],
    },
  })

  const values = watch()
  // In the order the client picked them, so the summary reads as they chose.
  const selectedServices = (values.serviceIds ?? [])
    .map((id) => services.find((s) => s.id === id))
    .filter((s): s is Service => !!s)
  const selectedStylist = stylists.find((s) => s.id === values.stylistId)
  const selectedDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  function toggleService(id: string) {
    const ids = values.serviceIds ?? []
    setValue("serviceIds", ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id], {
      shouldValidate: true,
    })
    /* A different set of services means a different list of stylists who can
       do them all, and a different visit length — so the stylist and the
       time picked for the old set no longer stand. Pick them again. */
    setValue("stylistId", "")
    setValue("bookingTime", "")
  }
  const availability = useAvailability(values.stylistId, values.bookingDate)

  /* Resolution order matters. A photo stored on the Service document wins,
     because that is the salon's own upload. Otherwise the curated map keyed
     by service name — every entry there was opened and looked at, so it
     actually shows the service being booked. `serviceThumb` is the last
     resort for a service added to the database but not yet to the catalogue;
     it picks from a small per-category stock pool and will repeat, which is
     precisely why it is no longer the first thing tried. */
  const servicePhoto = (service: Service) => serviceImageByName[service.name]

  const serviceImage = (service: Service) =>
    service.image ||
    servicePhoto(service)?.image ||
    serviceThumb(service.category)

  /* Describes what is in the frame. Falling back to the service name would
     make the alt text a duplicate of the heading beside it, which a screen
     reader then reads twice. */
  const serviceImageAlt = (service: Service) => servicePhoto(service)?.alt ?? ""

  const categoryServices = services.filter(
    (s) => (s.category ?? DEFAULT_SERVICE_CATEGORY) === activeCategory
  )

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[step])
    if (!valid) {
      if (step === 0) toast.error("Please choose a service to continue")
      if (step === 1) toast.error("Please choose a stylist to continue")
      if (step === 2) toast.error("Please pick a date and time")
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  /* Which button is mid-flight, so only that one spins. `busy` disables both,
     because double-submitting creates two bookings for the same slot. */
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null)
  const busy = createBooking.isPending || pendingMethod !== null

  /** Stamps the chosen method onto the form, then runs the normal submit. */
  const submitWith = (method: PaymentMethod) => () => {
    setValue("paymentMethod", method)
    return handleSubmit(onSubmit, onInvalid)()
  }

  async function onSubmit(data: CreateBookingFormValues) {
    setPendingMethod(data.paymentMethod)
    try {
      const booking = await createBooking.mutateAsync(data)

      if (data.paymentMethod === "ONLINE") {
        /* Hands off to Paystack. No success screen here — the booking is not
           confirmed yet, and saying so before the money moves is the one thing
           this flow must never do. The callback route decides what the
           customer sees next. */
        await startPayment(booking.id)
        return
      }

      setPendingMethod(null)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setPendingMethod(null)
      // Surface the server's actual reason (e.g. "Stylist not found",
      // "Invalid booking data") instead of a generic message, so failures
      // are diagnosable rather than silent.
      const serverError =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : undefined
      toast.error(serverError || "Something went wrong. Please try again.")
    }
  }

  // Called when the final submit fails client-side validation, so the Confirm
  // button never just does nothing.
  function onInvalid(formErrors: typeof errors) {
    const firstMessage = Object.values(formErrors).find((e) => e?.message)?.message
    toast.error(
      (firstMessage as string) ||
        "Please complete all required fields before confirming."
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-brand-line/60 bg-brand-surface p-10 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent-ink">
          <Check className="size-7" />
        </span>
        {/* Only the in-person path reaches this screen — the online one hands
            off to Paystack before it. In-person bookings confirm on creation,
            so this no longer promises a confirmation that is still coming;
            it reports one that has already happened. */}
        <h2 className="mt-5 font-display text-2xl font-semibold text-brand-text">
          Your appointment is confirmed!
        </h2>
        <p className="mt-2 text-sm text-brand-muted">
          The slot is yours — a confirmation email is on its way. Payment is
          due at the salon.
        </p>
        <button
          type="button"
          onClick={() => {
            reset()
            setStep(0)
            setSubmitted(false)
          }}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-accent px-6 text-sm font-semibold text-brand-on-accent hover:bg-brand-accent/90"
        >
          Book another appointment
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
      {/* Vertical stepper */}
      <aside className="hidden lg:block">
        <ol className="flex flex-col">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const state = i < step ? "done" : i === step ? "active" : "upcoming"
            return (
              <li key={s.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border transition-colors",
                      state === "active" &&
                        "border-transparent bg-brand-accent text-brand-on-accent",
                      state === "done" &&
                        "border-transparent bg-brand-accent text-brand-on-accent",
                      state === "upcoming" &&
                        "border-brand-line bg-brand-surface text-brand-muted/70"
                    )}
                  >
                    {state === "done" ? (
                      <Check className="size-4" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className={cn(
                        "my-1 h-8 w-px",
                        i < step ? "bg-brand-accent" : "bg-brand-line"
                      )}
                    />
                  )}
                </div>
                <div className="pt-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      state === "upcoming" ? "text-brand-muted/70" : "text-brand-text"
                    )}
                  >
                    {s.label}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* Step content */}
      <section className="rounded-3xl border border-brand-line/60 bg-brand-surface p-5 shadow-sm sm:p-7">
        {/* Mobile step chips */}
        <div className="mb-5 flex items-center gap-1.5 overflow-x-auto lg:hidden">
          {STEPS.map((s, i) => (
            <span
              key={s.key}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                i === step
                  ? "bg-brand-accent text-brand-on-accent"
                  : i < step
                    ? "bg-brand-accent/15 text-brand-accent-ink"
                    : "bg-brand-line/40 text-brand-muted/70"
              )}
            >
              {i + 1}. {s.label}
            </span>
          ))}
        </div>

        {step === 0 && (
          <ServiceStep
            services={services}
            categoryServices={categoryServices}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            selectedIds={values.serviceIds ?? []}
            onToggle={toggleService}
            serviceImage={serviceImage}
            serviceImageAlt={serviceImageAlt}
            isLoading={servicesLoading}
            isError={servicesError}
            onRetry={() => refetchServices()}
          />
        )}

        {step === 1 && (
          <StaffStep
            stylists={stylists}
            selectedServices={selectedServices}
            selectedId={values.stylistId}
            onSelect={(id) => setValue("stylistId", id, { shouldValidate: true })}
            isLoading={stylistsLoading}
            isError={stylistsError}
            onRetry={() => refetchStylists()}
          />
        )}

        {step === 2 && (
          <DateTimeStep
            date={values.bookingDate}
            time={values.bookingTime}
            busy={availability.data ?? []}
            loadingBusy={availability.isFetching}
            duration={selectedDuration}
            onDate={(v) => setValue("bookingDate", v, { shouldValidate: true })}
            onTime={(v) => setValue("bookingTime", v, { shouldValidate: true })}
            errors={{
              date: errors.bookingDate?.message,
              time: errors.bookingTime?.message,
            }}
          />
        )}

        {step === 3 && (
          <DetailsStep
            register={register}
            errors={errors}
            onImages={(urls) =>
              setValue("imageUrls", urls, { shouldValidate: true })
            }
          />
        )}

        {step === 4 && (
          <ReviewStep
            services={selectedServices}
            stylist={selectedStylist}
            date={values.bookingDate}
            time={values.bookingTime}
            name={values.customerName}
            email={values.customerEmail}
          />
        )}

        {/* Nav buttons */}
        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-brand-line px-5 text-sm font-medium text-brand-text hover:bg-brand-bg"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-accent px-6 text-sm font-semibold text-brand-on-accent hover:bg-brand-accent/90"
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          ) : (
            /* Two ways to finish, and the choice is the submit. Both create
               the same booking; only `paymentMethod` differs, which is what
               decides whether the server holds it at PENDING_PAYMENT and
               sends the customer to Paystack. */
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={busy}
                onClick={submitWith("IN_PERSON")}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors disabled:opacity-60",
                  ONLINE_PAYMENTS_ENABLED
                    ? "border border-brand-line text-brand-text hover:border-brand-accent hover:text-brand-accent-ink"
                    : "bg-brand-accent text-brand-on-accent hover:bg-brand-accent/90"
                )}
              >
                {pendingMethod === "IN_PERSON" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {ONLINE_PAYMENTS_ENABLED ? "Pay in person" : "Confirm booking"}
              </button>

              {ONLINE_PAYMENTS_ENABLED && (
              <button
                type="button"
                disabled={busy}
                onClick={submitWith("ONLINE")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 text-sm font-semibold text-brand-on-accent shadow-[0_4px_20px_-5px_color-mix(in_srgb,var(--lz-gold)_35%,transparent)] transition-colors hover:bg-brand-accent/90 disabled:opacity-60"
              >
                {pendingMethod === "ONLINE" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CreditCard className="size-4" aria-hidden />
                )}
                {pendingMethod === "ONLINE" ? "Redirecting…" : "Pay now"}
              </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Summary + help */}
      <aside className="flex flex-col gap-5">
        <BookingSummary
          services={selectedServices}
          stylist={selectedStylist}
          date={values.bookingDate}
          time={values.bookingTime}
          serviceImage={serviceImage}
          serviceImageAlt={serviceImageAlt}
        />

        <div className="rounded-2xl bg-brand-accent/10 p-5 text-center">
          <h3 className="font-display text-lg font-semibold text-brand-accent-ink">
            Need Help?
          </h3>
          <p className="mt-1 text-xs text-brand-muted">
            Call us or message on WhatsApp for any assistance.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm font-medium text-brand-text">
            <a href={`tel:${SALON_PHONE}`} className="flex items-center justify-center gap-2">
              <Phone className="size-4 text-brand-accent-ink" />
              {SALON_PHONE_DISPLAY}
            </a>
            <a
              href={whatsappLink(WHATSAPP_MESSAGES.booking)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="size-4 text-brand-accent-ink" />
              WhatsApp us
            </a>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ---------------- Step 1: Service ---------------- */

function ServiceStep({
  services,
  categoryServices,
  activeCategory,
  setActiveCategory,
  selectedIds,
  onToggle,
  serviceImage,
  serviceImageAlt,
  isLoading,
  isError,
  onRetry,
}: {
  services: Service[]
  categoryServices: Service[]
  activeCategory: (typeof SERVICE_CATEGORIES)[number]
  setActiveCategory: (c: (typeof SERVICE_CATEGORIES)[number]) => void
  selectedIds: string[]
  onToggle: (id: string) => void
  serviceImage: (s: Service) => string
  serviceImageAlt: (s: Service) => string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const countByCategory = (category: string) =>
    services.filter((s) => (s.category ?? DEFAULT_SERVICE_CATEGORY) === category).length

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-brand-text">
        1. Choose Your Service
      </h2>
      <p className="mt-1 text-sm text-brand-muted">
        Select one or more services — combine as many as you like in one visit.
        {selectedIds.length > 0 && (
          <span className="ml-1 font-medium text-brand-accent-ink">
            {selectedIds.length} selected.
          </span>
        )}
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        {/* Category rail. A category with no services (Combos, until the
            owner adds one) gets no tab; the active one always shows, so the
            rail isn't empty while services load. */}
        <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
          {SERVICE_CATEGORIES.filter(
            (category) => category === activeCategory || countByCategory(category) > 0
          ).map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                "flex shrink-0 items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors sm:w-full",
                activeCategory === category
                  ? "border-transparent bg-brand-accent text-brand-on-accent"
                  : "border-brand-line bg-brand-surface text-brand-text hover:border-brand-accent/50"
              )}
            >
              <span>{category}</span>
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  activeCategory === category ? "text-brand-on-accent/70" : "text-brand-muted/70"
                )}
              >
                {countByCategory(category)}
              </span>
            </button>
          ))}
        </div>

        {/* Service cards */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-brand-muted">
              <Loader2 className="size-4 animate-spin" />
              Loading services…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-brand-line py-12 text-center text-sm text-brand-muted">
              Couldn&apos;t load services. Please try again.
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-accent px-4 text-xs font-semibold text-brand-on-accent hover:bg-brand-accent/90"
              >
                Retry
              </button>
            </div>
          ) : categoryServices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-brand-line py-12 text-center text-sm text-brand-muted/70">
              No services in this category yet.
            </div>
          ) : (
            categoryServices.map((service) => {
              const active = selectedIds.includes(service.id)
              return (
                <button
                  key={service.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggle(service.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-brand-accent bg-brand-accent/5"
                      : "border-brand-line hover:border-brand-accent/50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-brand-text">{service.name}</h3>
                      {/* A checkbox, not a radio: several can be on. */}
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                          active
                            ? "border-brand-accent bg-brand-accent text-brand-on-accent"
                            : "border-brand-line"
                        )}
                      >
                        {active && <Check className="size-3.5" />}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-brand-muted">
                      {service.description}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-brand-text">
                        {formatPrice(service.price)}
                      </span>
                      <span className="flex items-center gap-1 text-brand-muted/70">
                        <Clock className="size-3.5" />
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={serviceImage(service)}
                      alt={serviceImageAlt(service)}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Step 2: Staff ---------------- */

function StaffStep({
  stylists,
  selectedServices,
  selectedId,
  onSelect,
  isLoading,
  isError,
  onRetry,
}: {
  stylists: Stylist[]
  selectedServices: Service[]
  selectedId?: string
  onSelect: (id: string) => void
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  // A stylist with no list does everything; otherwise they must offer every
  // service chosen, since one stylist takes the whole visit.
  const eligible = stylists.filter(
    (s) =>
      s.services.length === 0 ||
      selectedServices.every((chosen) => s.services.some((svc) => svc.id === chosen.id))
  )
  const list = eligible.length > 0 ? eligible : stylists
  const narrowed = selectedServices.length > 0 && eligible.length > 0 && eligible.length < stylists.length
  const what = selectedServices.length > 1 ? `all ${selectedServices.length} of your services` : selectedServices[0]?.name

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-brand-text">
        2. Choose Your Stylist
      </h2>
      <p className="mt-1 text-sm text-brand-muted">
        Pick the professional you&apos;d like to book with.
      </p>
      {/* Says why the list is short, so one name doesn't look like a bug. */}
      {narrowed && (
        <p className="mt-2 rounded-lg bg-brand-accent/10 px-3 py-2 text-xs text-brand-accent-ink">
          {eligible.length === 1
            ? `Only ${eligible[0].name} does ${what}. To book with someone else, go back and choose fewer services.`
            : `Showing the stylists who do ${what}.`}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-brand-muted">
          <Loader2 className="size-4 animate-spin" />
          Loading stylists…
        </div>
      ) : isError ? (
        <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-dashed border-brand-line py-12 text-center text-sm text-brand-muted">
          Couldn&apos;t load stylists. Please try again.
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-accent px-4 text-xs font-semibold text-brand-on-accent hover:bg-brand-accent/90"
          >
            Retry
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-brand-line py-12 text-center text-sm text-brand-muted/70">
          No stylists available right now.
        </div>
      ) : (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {list.map((stylist, i) => {
          const active = selectedId === stylist.id
          return (
            <button
              key={stylist.id}
              type="button"
              onClick={() => onSelect(stylist.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-brand-line hover:border-brand-accent/50"
              )}
            >
              <Avatar size="lg" className="size-12">
                {/* The stylist's own photo wins. The stock array behind it is
                    positional — `[i % length]` — so it hands whichever face
                    sits at that index to whoever is standing in that slot.
                    That is harmless for interchangeable stock, but it would
                    put a real person's photograph under a different
                    stylist's name, which the alt text then states as fact.
                    A real photo therefore belongs on the Stylist document,
                    not in the fallback pool. */}
                <AvatarImage
                  src={
                    stylist.image ||
                    stockPhotos.stylistHeadshots[i % stockPhotos.stylistHeadshots.length]
                  }
                  alt={stylist.name}
                />
                <AvatarFallback>
                  {stylist.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-brand-text">{stylist.name}</h3>
                <p className="line-clamp-1 text-xs text-brand-muted">
                  {stylist.services.map((s) => s.name).slice(0, 2).join(", ") ||
                    stylist.bio ||
                    "Salon stylist"}
                </p>
              </div>
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-brand-accent" : "border-brand-line"
                )}
              >
                {active && <span className="size-2.5 rounded-full bg-brand-accent" />}
              </span>
            </button>
          )
        })}
      </div>
      )}
    </div>
  )
}

/* ---------------- Step 3: Date & Time ---------------- */

function DateTimeStep({
  date,
  time,
  busy,
  loadingBusy,
  duration,
  onDate,
  onTime,
  errors,
}: {
  date: string
  time: string
  /** The chosen stylist's booked ranges on `date`. */
  busy: BusyInterval[]
  loadingBusy: boolean
  /** Minutes the selected services take — a slot is taken if any of it overlaps. */
  duration: number
  onDate: (v: string) => void
  onTime: (v: string) => void
  errors: { date?: string; time?: string }
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-brand-text">
        3. Select Date &amp; Time
      </h2>
      <p className="mt-1 text-sm text-brand-muted">
        Choose when you&apos;d like your appointment.
      </p>

      <div className="mt-5 max-w-xs">
        <label className="text-sm font-medium text-brand-text" htmlFor="booking-date">
          Date
        </label>
        <Input
          id="booking-date"
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => onDate(e.target.value)}
          className="mt-1.5"
        />
        {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date}</p>}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-brand-text">
          Available times{loadingBusy && <span className="ml-2 text-xs text-brand-muted">checking…</span>}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {TIME_SLOTS.map((slot) => {
            const tooLate = runsPastClosing(toMinutes(slot), duration)
            const taken = tooLate || isSlotTaken(toMinutes(slot), duration, busy)
            return (
              <button
                key={slot}
                type="button"
                disabled={taken}
                aria-label={
                  taken ? `${formatTime(slot)} — ${tooLate ? "runs past closing" : "already booked"}` : undefined
                }
                onClick={() => onTime(slot)}
                className={cn(
                  "rounded-lg border py-2 text-sm font-medium transition-colors",
                  taken
                    ? "cursor-not-allowed border-brand-line/40 text-brand-muted/60 line-through"
                    : time === slot
                      ? "border-transparent bg-brand-accent text-brand-on-accent"
                      : "border-brand-line text-brand-text hover:border-brand-accent/60"
                )}
              >
                {formatTime(slot)}
              </button>
            )
          })}
        </div>
        {time && runsPastClosing(toMinutes(time), duration) ? (
          <p className="mt-2 text-sm text-destructive">
            Your services would run past closing time from {formatTime(time)}. Please choose an earlier time.
          </p>
        ) : (
          time &&
          isSlotTaken(toMinutes(time), duration, busy) && (
            <p className="mt-2 text-sm text-destructive">
              That time has just been booked. Please choose another.
            </p>
          )
        )}
        {errors.time && <p className="mt-2 text-sm text-destructive">{errors.time}</p>}
      </div>
    </div>
  )
}

/* ---------------- Step 4: Details ---------------- */

function DetailsStep({
  register,
  errors,
  onImages,
}: {
  register: ReturnType<typeof useForm<CreateBookingFormValues>>["register"]
  errors: ReturnType<
    typeof useForm<CreateBookingFormValues>
  >["formState"]["errors"]
  onImages: (urls: string[]) => void
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-brand-text">
        4. Your Details
      </h2>
      <p className="mt-1 text-sm text-brand-muted">
        Tell us who the appointment is for.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-brand-text" htmlFor="name">
            Full name
          </label>
          <Input id="name" className="mt-1.5" {...register("customerName")} />
          {errors.customerName && (
            <p className="mt-1 text-sm text-destructive">
              {errors.customerName.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" className="mt-1.5" {...register("customerEmail")} />
          {errors.customerEmail && (
            <p className="mt-1 text-sm text-destructive">
              {errors.customerEmail.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text" htmlFor="phone">
            Phone number
          </label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+27 82 123 4567"
            className="mt-1.5"
            {...register("customerPhone")}
          />
          {errors.customerPhone && (
            <p className="mt-1 text-sm text-destructive">
              {errors.customerPhone.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-brand-text" htmlFor="notes">
          Notes <span className="text-brand-muted/70">(optional)</span>
        </label>
        <Textarea
          id="notes"
          className="mt-1.5"
          placeholder="Anything we should know before your visit?"
          {...register("notes")}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-brand-text">
          Reference photos <span className="text-brand-muted/70">(optional)</span>
        </p>
        <p className="mb-2 text-sm text-brand-muted">
          Share inspiration for the look you want.
        </p>
        <HairstyleUpload onChange={onImages} error={errors.imageUrls?.message} />
      </div>
    </div>
  )
}

/* ---------------- Step 5: Review ---------------- */

function ReviewStep({
  services,
  stylist,
  date,
  time,
  name,
  email,
}: {
  services: Service[]
  stylist?: Stylist
  date: string
  time: string
  name: string
  email: string
}) {
  const duration = services.reduce((sum, s) => sum + s.duration, 0)
  const rows = [
    { label: services.length > 1 ? "Services" : "Service", value: services.length ? services.map((s) => s.name).join(", ") : undefined },
    { label: "Stylist", value: stylist?.name },
    { label: "Date", value: date ? formatDate(date) : undefined },
    { label: "Time", value: time ? formatTime(time) : undefined },
    { label: "Duration", value: services.length ? formatDuration(duration) : undefined },
    { label: "Name", value: name },
    { label: "Email", value: email },
  ]

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-brand-text">
        5. Review &amp; Confirm
      </h2>
      <p className="mt-1 text-sm text-brand-muted">
        Please review your appointment details before confirming.
      </p>

      <dl className="mt-5 divide-y divide-brand-line rounded-xl border border-brand-line/60">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <dt className="shrink-0 text-brand-muted">{row.label}</dt>
            <dd className="text-right font-medium text-brand-text">{row.value ?? "—"}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3.5">
          <dt className="font-display text-base font-semibold text-brand-text">Total</dt>
          <dd className="font-display text-base font-semibold text-brand-accent-ink">
            {services.length ? formatTotal(services.map((s) => s.price)) : "—"}
          </dd>
        </div>
      </dl>
    </div>
  )
}

/* ---------------- Booking summary sidebar ---------------- */

function BookingSummary({
  services,
  stylist,
  date,
  time,
  serviceImage,
  serviceImageAlt,
}: {
  services: Service[]
  stylist?: Stylist
  date: string
  time: string
  serviceImage: (s: Service) => string
  serviceImageAlt: (s: Service) => string
}) {
  // The photo shows the first service chosen.
  const service = services[0]
  const duration = services.reduce((sum, s) => sum + s.duration, 0)
  const rows = [
    { label: "Staff", value: stylist?.name },
    {
      label: "Date & Time",
      value: date && time ? `${formatDate(date)}, ${formatTime(time)}` : date ? formatDate(date) : undefined,
    },
    { label: "Duration", value: services.length ? formatDuration(duration) : undefined },
  ]

  return (
    <div className="dark rounded-2xl bg-brand-glass p-5 text-white">
      <h3 className="font-display text-lg font-semibold text-brand-accent-ink">
        Your Booking Summary
      </h3>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-brand-surface/10">
          <Image
            src={service ? serviceImage(service) : stockPhotos.salonInterior}
            alt={service ? serviceImageAlt(service) : ""}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <p className="text-xs text-white/50">
          {services.length > 1
            ? `${services.length} services selected.`
            : service
              ? "Your selected service is shown here."
              : "No service selected yet. Please select a service to see the details here."}
        </p>
      </div>

      {services.length > 0 && (
        <ul className="mt-5 flex flex-col">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-white/90">{s.name}</span>
              <span className="shrink-0 text-white/60">{formatPrice(s.price)}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className={cn("flex flex-col", services.length === 0 && "mt-5")}>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm"
          >
            <dt className="text-white/50">{row.label}</dt>
            <dd className="max-w-[55%] truncate text-right font-medium text-white/90">
              {row.value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-lg font-semibold">Total</span>
        <span className="font-display text-lg font-semibold text-brand-accent-ink">
          {services.length ? formatTotal(services.map((s) => s.price)) : "—"}
        </span>
      </div>
    </div>
  )
}
