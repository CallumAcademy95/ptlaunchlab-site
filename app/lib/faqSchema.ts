/**
 * FAQPage JSON-LD, built from the FAQ array a page already renders.
 *
 * Written as a helper rather than hand-authored per page because the schema and
 * the visible copy must say the same thing. Three public pages — /courses,
 * /career-blueprint and /funnel — rendered 19 question/answer pairs between them
 * with no FAQPage markup at all, so an AI search tool saw prose instead of
 * parseable Q&A. Nine other pages already emit it, hand-written, which is how
 * these three came to be missed.
 *
 * Usage, in the page's returned JSX:
 *   <script type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema(faqs)) }} />
 */
export interface FaqItem {
  q: string;
  a: string;
}

export function faqPageSchema(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
