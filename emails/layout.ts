import {
  SALON_ADDRESS,
  SALON_EMAIL,
  SALON_HOURS_DISPLAY,
  SALON_NAME,
  SALON_PHONE,
  SALON_PHONE_DISPLAY,
  SALON_WHATSAPP,
} from "@/lib/salon-contact"

/* Email clients ignore CSS variables and stylesheets, so the brand palette
   from app/globals.css is repeated here as literals — the one place emails
   read colours from. Keep it in step with --lz-* there.

   The body stays white: many clients force-invert or strip dark
   backgrounds. The salon name on the dark header band is the soft pink
   (≈9.6:1 — the primary would be only ≈2.6:1 there); the primary pink
   paints rules, borders and button fills, with white text on it. */
export const EMAIL_COLORS = {
  dark: "#242124",
  pink: "#C2185B",
  softPink: "#F8BBD0",
  muted: "#6B6267",
  text: "#242124",
} as const

/** Label/value row used by every booking email. */
export const emailRow = (label: string, value: string) =>
  `<tr><td style="padding: 4px 12px 4px 0; color: ${EMAIL_COLORS.muted}; vertical-align: top;">${label}</td><td style="padding: 4px 0;">${value}</td></tr>`

/** Wraps an email body in the salon header and contact footer. */
export function brandedEmail(body: string) {
  const c = EMAIL_COLORS
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; color: ${c.text};">
      <div style="background: ${c.dark}; padding: 20px 24px; border-bottom: 3px solid ${c.pink};">
        <span style="color: ${c.softPink}; font-family: Georgia, serif; font-size: 22px; letter-spacing: 2px;">${SALON_NAME}</span>
      </div>
      <div style="padding: 24px;">
        ${body}
      </div>
      <div style="padding: 16px 24px; border-top: 1px solid #F0DCE4; font-size: 12px; line-height: 1.6; color: ${c.muted};">
        ${SALON_NAME} · ${SALON_ADDRESS}<br />
        ${SALON_HOURS_DISPLAY}<br />
        Phone / WhatsApp: <a href="tel:${SALON_PHONE}" style="color: ${c.text};">${SALON_PHONE_DISPLAY}</a>
        · <a href="https://wa.me/${SALON_WHATSAPP}" style="color: ${c.text};">WhatsApp us</a><br />
        <a href="mailto:${SALON_EMAIL}" style="color: ${c.text};">${SALON_EMAIL}</a>
      </div>
    </div>
  `
}
