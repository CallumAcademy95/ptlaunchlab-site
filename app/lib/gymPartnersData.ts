// Partner gym logos. Plain data (no "use client") so server components can
// read it as well as the client GymPartners carousel.
//
// `lightTile`: the logo is drawn in dark ink and vanishes on navy, so it sits
// on a light tile wherever tiles are used (the home page proof strip).
// Measured from the PNGs: mean luminance of the opaque pixels below ~128.
// Set it when adding a logo.
//
// `dark` is unused by any rendering (kept for a future light/dark logo
// swap that was never wired up) — do not rely on it to affect layout.
export const gymPartners = [
  { name: "Leodis 24/7 Gym",       src: "/logos/leodis-gym.png",          dark: false, lightTile: true  },
  { name: "Iron Wolf Gym",         src: "/logos/iron-wolf-gym.png",       dark: false, lightTile: true  },
  { name: "1079 Fitness",          src: "/logos/1079-fitness.png",        dark: false, lightTile: true  },
  { name: "Ultimate Shred",        src: "/logos/ultimate-shred.png",      dark: true, lightTile: false },
  { name: "6FitGym",               src: "/logos/6fit-gym.png",            dark: true, lightTile: false },
  { name: "MOF Gym",               src: "/logos/mof.png",                 dark: true, lightTile: true  },
  { name: "Muscle Bound Gym",      src: "/logos/muscle bound gym.png",    dark: true, lightTile: true  },
  { name: "Ebor Gym",              src: "/logos/EBOR GYM.png",            dark: false, lightTile: false },
  { name: "HITIO Gym Orpington",   src: "/logos/hitio-gym.png",           dark: true, lightTile: false },
  // Added 2026-09-13. These are partners with a commercial record in
  // pp_partners — fee_per_learner_pence, a promo code, the lot — and they were
  // missing from this wall while three gyms with NO such record were on it.
  // Their logos already existed under /gym-logos/ for their own landing pages.
  { name: "Gym n Go",              src: "/gym-logos/gym-n-go.png",        dark: false, lightTile: false },
  { name: "Xcelerate Gyms",        src: "/gym-logos/xcelerate.png",       dark: false, lightTile: false },
  { name: "ATP Fitness Felixstowe", src: "/logos/atp-fitness.png",        dark: true, lightTile: false },
  // ⚠️ Superflex 2.0 Gym is also a partner in pp_partners (promo SUPERFLEXPT)
  // and still missing here, because no logo file exists anywhere in the repo.
  // Drop one at public/logos/superflex.png and add the row.
];
