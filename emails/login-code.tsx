import { brandedEmail, EMAIL_COLORS } from "@/emails/layout"

interface LoginCodeEmailProps {
  /** The 6-digit code — digits only, so it needs no escaping. */
  code: string
  minutes: number
  /** "login" to sign in; "change-email" to confirm a new sign-in address. */
  purpose?: "login" | "change-email"
}

export function loginCodeEmailHtml({ code, minutes, purpose = "login" }: LoginCodeEmailProps) {
  const c = EMAIL_COLORS
  const copy =
    purpose === "login"
      ? {
          heading: "Your dashboard sign-in code",
          intro: "Enter this code on the Touchedbyfaithdee sign-in page to open your dashboard:",
          ignore: "If you didn't try to sign in, you can ignore this email — no one can get in without the code.",
        }
      : {
          heading: "Confirm your new sign-in email",
          intro: "Enter this code in the Touchedbyfaithdee dashboard (Settings → Sign-in email) to make this address your dashboard sign-in:",
          ignore: "If you didn't ask for this, you can ignore this email — nothing changes without the code.",
        }

  return brandedEmail(`
      <h2 style="margin-top: 0;">${copy.heading}</h2>
      <p>${copy.intro}</p>
      <p style="margin: 24px 0; text-align: center;">
        <span style="display: inline-block; padding: 14px 24px; border: 1px solid ${c.gold}; border-radius: 12px; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: ${c.text};">${code}</span>
      </p>
      <p>It expires in ${minutes} minutes and works once.</p>
      <p style="color: ${c.muted}; font-size: 13px;">${copy.ignore}</p>
  `)
}
