import axios from "axios"

export const apiClient = axios.create({
  baseURL: "/api",
})

export function apiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (data && typeof data === "object") {
      if ("error" in data && typeof data.error === "string") return data.error
      if ("message" in data && typeof data.message === "string") return data.message
    }
    return error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}
