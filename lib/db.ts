import mongoose from "mongoose"
import "@/lib/models"

// Sanitize the URI: hosting dashboards (e.g. Vercel) often keep surrounding
// quotes or stray whitespace/newlines pasted into the value, which makes
// mongoose throw "Invalid scheme". Trim those so a correctly-typed connection
// string still works even if it was pasted with quotes.
const MONGODB_URI = process.env.MONGODB_URI?.trim().replace(/^["']|["']$/g, "")

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }
global.mongooseCache = cache

export async function connectDB() {
  if (cache.conn) return cache.conn

  if (!MONGODB_URI) {
    const message = "MONGODB_URI environment variable is not set"
    console.error(`❌ MongoDB connection failed: ${message}`)
    throw new Error(message)
  }

  if (!/^mongodb(\+srv)?:\/\//.test(MONGODB_URI)) {
    // Show the leading characters (not the credentials) so the actual mistake —
    // a stray quote, the "MONGODB_URI=" prefix, etc. — is visible in the logs.
    const message =
      `MONGODB_URI has an invalid scheme (value starts with "${MONGODB_URI.slice(0, 14)}…"). ` +
      `It must start with "mongodb://" or "mongodb+srv://" — check your host's env var for quotes or a wrong value.`
    console.error(`❌ MongoDB connection failed: ${message}`)
    throw new Error(message)
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI)
      .then((conn) => {
        const { host, port, name } = conn.connection
        console.log(`✅ MongoDB connected — ${host}:${port}/${name}`)
        return conn
      })
      .catch((err) => {
        // Clear the cached promise so the next request retries instead of
        // forever re-awaiting this rejected connection attempt.
        cache.promise = null
        console.error(`❌ MongoDB connection failed: ${err.message}`)
        throw err
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}
