/* ══════════════════════════════════════════════════════════════════════
   CLIENT TESTIMONIALS — shown on the home page under "What Our Clients Say".

   Only real words from real clients, with their permission to be
   quoted. A review attributed to someone who never said it is a fabricated
   endorsement, so nothing here is invented.

   While this list is empty the section is hidden entirely. Add an entry and
   it appears; with two or more, the carousel arrows, dots and autoplay work.

   Each entry:
     quote     the client's words, as they wrote or said them
     name      as they agreed to be shown — e.g. first name and initial
     location  e.g. "Tlhabane" or "Rustenburg"
     avatar    optional: a photo the client cleared, e.g. "/images/client-x.jpg".
               Without one the card shows their initial.
   ══════════════════════════════════════════════════════════════════════ */

export type Testimonial = {
  quote: string
  name: string
  location: string
  avatar?: string
}

export const testimonials: Testimonial[] = [
  // TODO(client): add real client quotes here.
]
