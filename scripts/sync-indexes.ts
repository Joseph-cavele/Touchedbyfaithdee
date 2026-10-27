import "./db-env" // must stay first: loads env and refuses databases that aren't this salon's
import mongoose from "mongoose"
import { connectDB } from "../lib/db"
import "../lib/models"

/**
 * Bring the database's indexes in line with what the schemas declare.
 *
 * Mongoose's `autoIndex` creates missing indexes on its own but never drops
 * ones that are no longer declared, so a schema that loses an index leaves the
 * old one behind — still consuming writes and RAM, invisible from the code.
 * `syncIndexes()` closes that gap: it creates what's missing AND drops what
 * isn't declared, per model.
 *
 * Run it after changing any `schema.index(...)` call:
 *
 *   npm run sync-indexes
 *
 * Safe to re-run — it's a no-op once the database already matches.
 *
 * Note it will drop indexes you created by hand in Atlas but never declared in
 * a schema. That's the intent (the schemas are the source of truth), but it's
 * worth knowing before the first run against production.
 */
async function main() {
  await connectDB()

  const modelNames = mongoose.modelNames().sort()
  console.log(`Syncing indexes for ${modelNames.length} models…\n`)

  for (const name of modelNames) {
    const model = mongoose.model(name)
    try {
      // Resolves to the list of index names that were DROPPED; created ones
      // are silent, so report both sides by diffing against the declaration.
      const dropped = await model.syncIndexes()
      const current = await model.collection.indexes()
      const kept = current.map((i) => i.name).filter(Boolean)

      console.log(`${name}`)
      console.log(`  active:  ${kept.join(", ")}`)
      if (dropped.length) {
        console.log(`  dropped: ${dropped.join(", ")}`)
      }
      console.log()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`${name}\n  FAILED: ${message}\n`)
      process.exitCode = 1
    }
  }

  await mongoose.disconnect()
  console.log(process.exitCode ? "Finished with errors." : "Indexes are in sync.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
