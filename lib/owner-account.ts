import { SALON_CONTACT_PERSON } from "@/lib/salon-contact"

/* ══════════════════════════════════════════════════════════════════════
   The dashboard owner — from the environment (.env), never hard-coded, so
   a personal address isn't committed to the repository.

     OWNER_EMAIL   the owner's dashboard sign-in address (emailed code), and
                   where new-booking and contact-form notifications go.
                   Settings → Sign-in email can override the sign-in part,
                   and Settings → Dashboard access lets the owner allow
                   other emails to sign in.
     OWNER_NAME    optional display name for the owner's account; defaults
                   to the salon's contact person.
     DEVELOPER_EMAIL  optional: the developer's sign-in address, for testing
                   the dashboard. Signs in like a Dashboard access user (no
                   owner-only settings) and isn't shown in that list.

   Functions rather than constants: scripts load .env before calling them,
   and the value is read fresh wherever it's needed. Server code only.
   ══════════════════════════════════════════════════════════════════════ */

const clean = (value: string | undefined) => (value ?? "").trim().replace(/^["']|["']$/g, "").trim()

/** OWNER_EMAIL, lower-cased. "" when it isn't set — then nobody can sign in. */
export function ownerEmailFromEnv() {
  return clean(process.env.OWNER_EMAIL).toLowerCase()
}

/** DEVELOPER_EMAIL, lower-cased. "" when it isn't set. */
export function developerEmailFromEnv() {
  return clean(process.env.DEVELOPER_EMAIL).toLowerCase()
}

/** OWNER_NAME, or the salon's contact person. */
export function ownerNameFromEnv() {
  return clean(process.env.OWNER_NAME) || SALON_CONTACT_PERSON
}
