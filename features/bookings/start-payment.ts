import { apiClient } from "@/lib/api-client"

/**
 * Asks the server to open a Paystack checkout for a booking and sends the
 * browser there.
 *
 * Shared by the wizard and the retry button so there is one definition of
 * "start paying", and one place where the redirect happens.
 *
 * `window.location.assign` rather than the Next router: Paystack's checkout is
 * a different origin, and the App Router cannot navigate off-site.
 */
export async function startPayment(bookingId: string) {
  const { data } = await apiClient.post<{ authorizationUrl?: string }>(
    "/payments/initialize",
    { bookingId }
  )

  if (!data?.authorizationUrl) {
    throw new Error("The payment provider did not return a checkout link.")
  }

  window.location.assign(data.authorizationUrl)
}
