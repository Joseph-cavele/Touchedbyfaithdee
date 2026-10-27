/* ══════════════════════════════════════════════════════════════════════
   Imported FIRST by every script that writes to MongoDB (seed,
   reset-password, sync-indexes). Two jobs:

   1. Load env the way Next does: .env.local wins over .env. (Plain
      `dotenv/config` reads only .env, so a URI in .env.local was
      silently ignored by the scripts.)

   2. Refuse to touch any database that isn't clearly this salon's, so a
      leftover or mistyped URI can never let a script write to someone
      else's live data — including La-fe's old database. The database name
      in MONGODB_URI must contain "touchedbyfaithdee", e.g.
        mongodb+srv://USER:PASS@CLUSTER.mongodb.net/touchedbyfaithdee
      A URI with no database name would land in Mongo's default "test"
      database, so that is refused too.
   ══════════════════════════════════════════════════════════════════════ */
import { config } from "dotenv"

config({ path: [".env.local", ".env"], quiet: true })

const uri = process.env.MONGODB_URI?.trim().replace(/^["']|["']$/g, "") ?? ""
const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)\/?([^?]*)/)
const host = match?.[1] ?? "(unparseable)"
const dbName = decodeURIComponent(match?.[2] ?? "")

console.log(`Target MongoDB → host: ${host}  database: ${dbName || "(none — would default to \"test\")"}`)

if (!match || !/touchedbyfaithdee/i.test(dbName)) {
  console.error(
    "❌ Refusing to run: the database name in MONGODB_URI must contain \"touchedbyfaithdee\".\n" +
      "   Put the connection string in .env with the database name in the path,\n" +
      "   e.g. …mongodb.net/touchedbyfaithdee"
  )
  process.exit(1)
}

console.log("✅ Database name is a Touchedbyfaithdee database — continuing.")
