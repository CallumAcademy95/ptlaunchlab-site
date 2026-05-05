type Crumb = { name: string; url: string };

const BASE = "https://ptlaunchlab.co.uk";

export default function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const items = [{ name: "Home", url: BASE }, ...trail];
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
