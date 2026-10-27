/* ══════════════════════════════════════════════════════════════════════
   IMAGE SLOTS — every photograph and the logo the site shows, in one place.

   All photos are the studio's own work, in /public/Touched-by-services/
   (from the owner, 2026-10-27). Seven photos fill every slot, so some
   repeat across pages.

   Every service shows a photo of the work — never the logo; one without its
   own photo falls back to its category's. To fill a slot: add the studio's
   photo to /public/Touched-by-services/, change that one path below, and
   write an `alt` that says what the photo shows.
   ══════════════════════════════════════════════════════════════════════ */

/** The studio's own photo in /public/Touched-by-services. */
const own = (file: string) => encodeURI(`/Touched-by-services/${file}`)

export type ImageSlot = { src: string; alt: string }

/* Each photo described once, so a slot reusing one can't drift from what it
   shows. All 9:16 portraits except md (3:2 landscape). */
const photo = {
  bridal: { src: own("bridal-makeup.jpg"), alt: "Bride in a beaded gown and veil having gloss applied to her lips, seated in a car on her wedding day" },
  md: { src: own("md-makeup.jpg"), alt: "Matric dance look: pink and purple shimmer eyes and a nude lip, worn with a blue beaded gown and a crystal choker" },
  occasion: { src: own("occasional-makeup.jpg"), alt: "Occasion makeup with warm bronze and pink eyes, winged liner, rosy blush and a mauve lip" },
  occasion2: { src: own("occasional-makeup-2.jpg"), alt: "The same occasion look from the side: bronze and pink eyes, glowing blush and a mauve lip" },
  basicInstall: { src: own("basic-hair-installation.jpg"), alt: "Long, straight basic hair installation with a side part, in the studio in front of its pink neon sign" },
  ponytail: { src: own("frontal-ponytail.jpg"), alt: "Sleek frontal ponytail with a smooth, laid hairline" },
  messyBun: { src: own("messy-updo-bun.jpg"), alt: "Messy updo bun with sleek laid edges and loose curled tendrils" },
  /* Salon-interior pictures the owner chose for the About section's
     "Take a look inside" frame (2026-10-27). */
  interiorWashBay: { src: own("interior-1.jpg"), alt: "Salon interior with a lit arch over two black wash chairs, gold-trimmed styling chairs and arched mirrors" },
  interiorMirror: { src: own("interior-2.jpg"), alt: "Cream styling chair in front of a curved, back-lit mirror, with lit shelves of hair products" },
  /* 3:2 landscape — the About video's cover. */
  makeupRoom: { src: own("About us 1.jpg"), alt: "Makeup room with gold-framed olive director's chairs at a lit mirror, ring lights, a grey sofa with pink cushions and rose-gold balloons on the ceiling" },
} satisfies Record<string, ImageSlot>

export const salonImages = {
  /** The studio's logo — pink script wordmark with a star, a brush stroke
      and a fan of makeup brushes — on transparent, trimmed. Header, hero,
      footer, login card, dashboard sidebar. Cut from the owner's
      Touched-by-services/Really-logo.png (2026-10-27), which has a white
      background. The earlier gold wordmark is logo/touchedbyfaithdee-logo.png. */
  logo: {
    src: "/logo/touchedbyfaithdee-logo-pink.png",
    alt: "Touchedbyfaithdee Studio logo",
    width: 1011,
    height: 248,
  },

  /** Kept for lib/stock-photos.ts — the hero photo. */
  hero: photo.basicInstall,

  /** The hero collage's other two frames (the bottom-left one is
      heroMobile): the wide top frame and the bottom-right one; tablets and up. */
  heroCollage: {
    interior: photo.occasion,
    nails: photo.messyBun,
  },

  /** The booking summary's fallback image and the "Book your visit" slide
      on /services — the real studio, with its neon sign. */
  salonInterior: photo.basicInstall,

  /** Login backdrop. */
  salonStation: photo.occasion2,

  /** About section ("Take a look inside"): main frame, which is also the
      cover of the studio's tour video (1280×720, 5 s) that plays in it, and
      the square inset that overlaps it. */
  about: {
    main: photo.makeupRoom,
    inset: photo.interiorMirror,
    video: own("about us video.mp4"),
  },

  /** The hero's portrait — alone on phones, bottom-left of the collage on
      larger screens. */
  heroMobile: photo.basicInstall,

  /** One photo per service category — the /services banner slides, and the
      fallback for any service without its own photo below. */
  category: {
    Makeup: photo.occasion2,
    Hair: photo.messyBun,
  } as Record<string, ImageSlot>,

  /** Per-service photos keyed by the exact service name in
      lib/salon-services.ts. A service left out here falls back to its
      category photo (never the logo). */
  service: {
    "Occasional makeup": photo.occasion,
    "Matric dance makeup": photo.md,
    "Bridal Makeup and Go": photo.bridal,
    "Bridal Full Day": photo.bridal,
    "Basic hair installation": photo.basicInstall,
    "Frontal ponytail (own fibre)": photo.ponytail,
    "Messy updo bun": photo.messyBun,
  } as Record<string, ImageSlot>,

  /** The /book page banner — the salon-interior picture. */
  bookingBanner: photo.interiorWashBay,

  /** "Recent work" gallery (home page) — the studio's own photos only. */
  gallery: [
    { ...photo.bridal, label: "Bridal Makeup" },
    { ...photo.md, label: "Matric Dance Glam" },
    { ...photo.messyBun, label: "Messy Updo Bun" },
    { ...photo.occasion, label: "Occasion Makeup" },
    { ...photo.ponytail, label: "Frontal Ponytail" },
    { ...photo.basicInstall, label: "Basic Installation" },
  ] as { src: string; label: string; alt: string }[],
}

/** A service's own photo, or — for a service added later without one — its
    category's photo. Never the logo: a service always shows the work. */
export const serviceImage = (name: string, category?: string): ImageSlot =>
  salonImages.service[name] ?? (category && salonImages.category[category]) ?? salonImages.category.Makeup
