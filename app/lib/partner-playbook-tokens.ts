// Personalising playbook markdown for the partner reading it.
//
// Kept apart from partner-playbook.ts on purpose: that file imports
// supabase-admin, which cannot be loaded in a `node --test` run. Same split, and
// the same reason, as partner-playbook-types.ts.

export interface PlaybookTokens {
  gymName: string;
  town: string;
  promoCode: string | null;
  academyUrl: string;
}

interface GymBrand {
  gymName: string;
  adTown: string;
  promoCode: string | null;
  canonicalPath: string;
}

export function tokensForGym(brand: GymBrand, origin: string): PlaybookTokens {
  return {
    gymName: brand.gymName,
    town: brand.adTown,
    promoCode: brand.promoCode,
    academyUrl: `${origin.replace(/\/$/, "")}${brand.canonicalPath}`,
  };
}

/**
 * Substitute {{token}} values into playbook markdown.
 *
 * Also supports one conditional block, {{#promoCode}}…{{/promoCode}}, which is
 * dropped entirely when the gym has no code. The grandfathered partners (Ebor
 * among them) have promoCode: null, and "Use code null" is the kind of thing
 * that gets pasted straight into a live ad.
 *
 * Runs over all 48 existing entries, so it is inert on markdown with no tokens,
 * and leaves unknown tokens visible rather than blanking them — a stray
 * {{whatever}} is caught in review, an empty sentence is not.
 */
export function applyPlaybookTokens(body: string, tokens: PlaybookTokens): string {
  const withConditionals = body.replace(
    /\{\{#promoCode\}\}([\s\S]*?)\{\{\/promoCode\}\}/g,
    (_match, inner: string) => (tokens.promoCode ? inner : ""),
  );

  return withConditionals.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = (tokens as Record<string, string | null>)[key];
    return typeof value === "string" ? value : match;
  });
}
