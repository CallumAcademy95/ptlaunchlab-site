// Partner gym logos. Plain data (no "use client") so server components can
// read it as well as the client GymPartners carousel.
//
// `lightTile`: the logo is drawn in dark ink and vanishes on navy, so it sits
// on a light tile wherever tiles are used.
// Measured from the PNGs: mean luminance of the opaque pixels below ~128.
// Set it when adding a logo.
//
// `mono`: the same logo as white-on-transparent, trimmed to its edges, used
// by the home page proof band marquee (`monoSize` = its pixel size). Made
// from `src`; the filled badges (MOF, Ultimate Shred) are luminance-keyed so
// they keep their detail instead of turning into solid white discs, and Iron
// Wolf comes from iron-wolf-gym-white.png. Add one when adding a logo.
//
// `dark` is unused by any rendering (kept for a future light/dark logo
// swap that was never wired up) — do not rely on it to affect layout.
export const gymPartners = [
  { name: "Leodis 24/7 Gym",       src: "/logos/leodis-gym.png",          dark: false, lightTile: true, mono: "/logos/mono/leodis.png", monoSize: [163, 108] },
  { name: "Iron Wolf Gym",         src: "/logos/iron-wolf-gym.png",       dark: false, lightTile: true, mono: "/logos/mono/iron-wolf.png", monoSize: [388, 108] },
  { name: "1079 Fitness",          src: "/logos/1079-fitness.png",        dark: false, lightTile: true, mono: "/logos/mono/1079-fitness.png", monoSize: [415, 108] },
  { name: "Ultimate Shred",        src: "/logos/ultimate-shred.png",      dark: true, lightTile: false, mono: "/logos/mono/ultimate-shred.png", monoSize: [109, 108] },
  { name: "6FitGym",               src: "/logos/6fit-gym.png",            dark: true, lightTile: false, mono: "/logos/mono/6fit.png", monoSize: [147, 108] },
  { name: "MOF Gym",               src: "/logos/mof.png",                 dark: true, lightTile: true, mono: "/logos/mono/mof.png", monoSize: [108, 108] },
  { name: "Muscle Bound Gym",      src: "/logos/muscle bound gym.png",    dark: true, lightTile: true, mono: "/logos/mono/muscle-bound.png", monoSize: [510, 108] },
  { name: "Ebor Gym",              src: "/logos/EBOR GYM.png",            dark: false, lightTile: false, mono: "/logos/mono/ebor.png", monoSize: [196, 108] },
  { name: "HITIO Gym Orpington",   src: "/logos/hitio-gym.png",           dark: true, lightTile: false, mono: "/logos/mono/hitio.png", monoSize: [168, 46] },
  // Added 2026-09-13. These are partners with a commercial record in
  // pp_partners — fee_per_learner_pence, a promo code, the lot — and they were
  // missing from this wall while three gyms with NO such record were on it.
  // Their logos already existed under /gym-logos/ for their own landing pages.
  { name: "Gym n Go",              src: "/gym-logos/gym-n-go.png",        dark: false, lightTile: false, mono: "/logos/mono/gym-n-go.png", monoSize: [258, 108] },
  { name: "Xcelerate Gyms",        src: "/gym-logos/xcelerate.png",       dark: false, lightTile: false, mono: "/logos/mono/xcelerate.png", monoSize: [514, 108] },
  { name: "ATP Fitness Felixstowe", src: "/logos/atp-fitness.png",        dark: true, lightTile: false, mono: "/logos/mono/atp-fitness.png", monoSize: [105, 108] },
  // Dark ink (black bodybuilder) on transparent, so a light tile. The mono copy
  // keys only the black ink, which leaves the lettering as white outlines.
  { name: "Muscle Makers Gym",     src: "/logos/muscle-makers.png",       dark: false, lightTile: true, mono: "/logos/mono/muscle-makers.png", monoSize: [113, 108] },
  // ⚠️ Superflex 2.0 Gym is also a partner in pp_partners (promo SUPERFLEXPT)
  // and still missing here, because no logo file exists anywhere in the repo.
  // Drop one at public/logos/superflex.png and add the row.
];
