import { cache } from "react"
import { QueryClient } from "@tanstack/react-query"

// One QueryClient per request (React.cache is request-scoped on the server),
// used to prefetch data in Server Components before dehydrating to the client.
export const getQueryClient = cache(() => new QueryClient())
