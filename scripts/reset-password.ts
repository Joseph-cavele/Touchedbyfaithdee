import "./db-env" // must stay first: loads env and refuses databases that aren't this salon's
import bcrypt from "bcryptjs"
import { connectDB } from "../lib/db"
import { UserModel } from "../lib/models/User"
import { SALON_EMAIL } from "../lib/salon-contact"

// Accounts whose password should be rotated.
const ACCOUNTS = [SALON_EMAIL]

// Updates ONLY the password field of the existing accounts — unlike `seed`,
// this never deletes or re-inserts any data. Run with:
//   SEED_PASSWORD in your .env.local, then `npm run reset-password`
async function resetPasswords() {
  const password = process.env.SEED_PASSWORD

  if (!password || password.length < 8) {
    console.error(
      "❌ Set SEED_PASSWORD (at least 8 characters) in your .env.local before running this."
    )
    process.exit(1)
  }

  await connectDB()
  const passwordHash = await bcrypt.hash(password, 10)

  let updated = 0
  for (const email of ACCOUNTS) {
    const res = await UserModel.updateOne(
      { email },
      { $set: { password: passwordHash } }
    )
    if (res.matchedCount > 0) {
      console.log(`✅ Password updated for ${email}`)
      updated += 1
    } else {
      console.warn(`⚠ No account found for ${email} (skipped)`)
    }
  }

  console.log(
    `\nDone. Updated ${updated} account(s). No other data was touched.`
  )
  process.exit(0)
}

resetPasswords().catch((err) => {
  console.error("❌ Failed to reset passwords:", err)
  process.exit(1)
})
