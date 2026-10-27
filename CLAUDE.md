@AGENTS.md

# Touchedbyfaithdee Studio

Salon booking system for **Touchedbyfaithdee Studio**: a marketing site, online booking and an owner dashboard. Built on Next.js (see AGENTS.md: read `node_modules/next/dist/docs/` before writing code), MongoDB via Mongoose, Tailwind.

The codebase started as the La-fe Beauty Parlor site and was rebranded. La-fe is a separate business with its own repository and live database. Nothing here should point at, copy from or write to La-fe's.

## The business

| | |
| --- | --- |
| Owner and only stylist | Kegomoditse Faith Diale |
| Phone / WhatsApp | 073 979 0375 (second line: 073 070 0375, calls only) |
| Email | faithdiale4@gmail.com |
| Address | 2389 Rangaka Street, Tlhabane, 0309 (North West) |
| Hours | Monday – Sunday, 08:30 – 18:00 (also the booking window) |

Still to come from the owner (marked `TODO(client)` in the code): the website domain (`SALON_SITE_URL` is still La-fe's), social media links, and client testimonials.

## Where things live

Each of these is the **one copy**. Import from them; never re-declare a value elsewhere.

- `lib/salon-contact.ts`: name, phone, email, address, map, hours, socials, WhatsApp links. `lib/models/Settings.ts` holds the same details as the dashboard's defaults and is kept in step by hand.
- `lib/salon-services.ts`: services, prices and durations. Drives `/`, `/services`, and (through `npm run seed`) the database the booking wizard reads.
- `lib/salon-assets.ts`: every photo slot and the logo. The studio's photos are in `public/Touched-by-services/`; the logo is `public/logo/touchedbyfaithdee-logo.png`.
- `features/services/schema.ts`: service categories (`Makeup`, `Hair`, `Combos`). Must match `SalonServiceCategory`.

## Services (owner, 2026-10-27)

| Service | Category | Price |
| --- | --- | --- |
| Occasional makeup | Makeup | R750 |
| Matric dance makeup | Makeup | R750 |
| Bridal Makeup and Go | Makeup | R1 700 |
| Bridal Full Day | Makeup | R3 700 (whole day: opening to closing) |
| Basic hair installation | Hair | R300 |
| Frontal ponytail (own fibre) | Hair | R600 |
| Messy updo bun | Hair | R850 |

Every other service is a 2-hour appointment. `price: null` shows "Price on request", never R0.

## Database

- `MONGODB_URI` (in `.env`, never committed) must name the database in its path: `…mongodb.net/touchedbyfaithdee`. `scripts/db-env.ts` refuses to run any script against a database whose name doesn't contain `touchedbyfaithdee`.
- `npm run seed` upserts the services from `lib/salon-services.ts` and the owner login (`OWNER_EMAIL` / `OWNER_NAME`). It never deletes; remove a service in the dashboard or by hand.
- Stylists are managed in the dashboard, not seeded. Faith's service list is empty, which the booking wizard reads as "offers every service".
- The service list is cached on disk (`unstable_cache`, 5 minutes). After changing the database outside the app, clear `.next/dev/cache/fetch-cache` (dev) or `.next/cache/fetch-cache` (build). A dev server started before `.env` changed keeps its old connection, so restart it.

## Brand

- Logo: gold script wordmark "Touchedbyfaithdee" with a star, shown with a small "STUDIO" caption.
- Palette (`app/globals.css`; the hero and services sections use it through `components/site/la-fe-brand.tsx`, an internal name):

| Name | Hex |
| --- | --- |
| Champagne Gold | `#B08A43` |
| Warm Ivory | `#F8EEDF` |
| Rose Gold | `#C78E7B` |
| Espresso Black | `#211A12` |
| White | `#FFFFFF` |

- The logo's own gold is `#C69100` (the tab icon's star uses it).
- Tagline in use: "Your Beauty Is Our Priority". It came from La-fe's poster; confirm or replace with the owner.

## Rules

- Never invent business facts: prices, contact details, policies (no "house calls" or deposits unless the owner confirms them), ratings, reviews or testimonials. Ask, or leave the `TODO(client)` in place.
- Photos labelled as the studio's work (gallery, service photos) must be the studio's own. Describe what each photo shows in its `alt`.
- Don't install new packages, change the framework, or restructure the app without being asked.
- Don't deploy. Hosting needs the same environment variables as `.env`.
- Run `npx tsc --noEmit -p .` and `npx eslint` on changed files before handing work back.
