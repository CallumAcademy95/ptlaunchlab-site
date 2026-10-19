// Pick a text colour that can be read on a coloured surface.
//
// Gym accents are chosen for their brand, not for white text: Ebor's dark
// accent is white, ATP's and Muscle Makers' are bright yellow and orange,
// Imperium's is a pale gold. A pill filled with the accent therefore cannot
// assume white type. This returns whichever candidate has the higher WCAG
// contrast ratio against the fill.

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The candidate with the higher contrast against `fill` (first wins a tie). */
export function readableOn(fill: string, candidates: string[]): string {
  return candidates.reduce((best, c) => (contrastRatio(c, fill) > contrastRatio(best, fill) ? c : best));
}
