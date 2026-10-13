import { PHONE_SCHEMA, CONTACT_EMAIL, GOOGLE_PROFILE_URL } from "./contactDetails.ts";

/**
 * Organization JSON-LD for every page (rendered by app/layout.tsx): a graph
 * with EducationalOrganization (the brand/course provider) + LocalBusiness
 * (the Pontefract HQ) so Google can populate both knowledge panels and local
 * SERPs.
 *
 * Kept in a plain .ts module so tests/phase4a.test.mts can import and parse it.
 * The address must match the Google Business Profile and the footer
 * (ADDRESS_ONE_LINE). No aggregateRating: review counts are never published.
 */
/** The Pontefract HQ, shared by every JSON-LD block that carries geo. */
export const GEO = {
  "@type": "GeoCoordinates",
  latitude: 53.6917,
  longitude: -1.3104,
};

const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Unit 3, Royals Business Park, King St",
  addressLocality: "Pontefract",
  addressRegion: "West Yorkshire",
  postalCode: "WF8 4AH",
  addressCountry: "GB",
};

export const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://ptlaunchlab.co.uk/#org",
      name: "PT Launch Lab",
      alternateName: "PT Launch Lab Ltd",
      url: "https://ptlaunchlab.co.uk",
      logo: {
        "@type": "ImageObject",
        url: "https://ptlaunchlab.co.uk/logo.png",
        width: 512,
        height: 512,
      },
      image: "https://ptlaunchlab.co.uk/og-image.png",
      description:
        "NCFE Level 3 Personal Trainer qualification, 100% online, built by gym owners. Ofqual regulated, CIMSPA recognised. Business mentorship and a guaranteed gym introduction included.",
      foundingDate: "2024",
      founders: [
        { "@type": "Person", name: "Callum Brown" },
        { "@type": "Person", name: "Ryan Robinson" },
      ],
      email: CONTACT_EMAIL,
      telephone: PHONE_SCHEMA,
      address: ADDRESS,
      areaServed: {
        "@type": "Country",
        name: "United Kingdom",
      },
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        name: "NCFE Level 2 & 3 Personal Trainer Qualification",
        credentialCategory: "certificate",
        educationalLevel: "Level 3",
        recognizedBy: [
          { "@type": "Organization", name: "Ofqual" },
          { "@type": "Organization", name: "CIMSPA" },
          { "@type": "Organization", name: "NCFE" },
        ],
      },
      sameAs: [
        "https://www.youtube.com/@ptlaunchlab",
        "https://www.instagram.com/ptlaunchlab",
        "https://www.tiktok.com/@pt.launch.lab",
        "https://www.facebook.com/profile.php?id=61583011678458",
        "https://find-and-update.company-information.service.gov.uk/company/16596168",
        GOOGLE_PROFILE_URL,
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://ptlaunchlab.co.uk/#localbusiness",
      name: "PT Launch Lab",
      url: "https://ptlaunchlab.co.uk",
      image: "https://ptlaunchlab.co.uk/og-image.png",
      telephone: PHONE_SCHEMA,
      email: CONTACT_EMAIL,
      priceRange: "££",
      address: ADDRESS,
      geo: GEO,
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "17:00",
        },
      ],
      // The Google Business Profile is this local listing.
      sameAs: [GOOGLE_PROFILE_URL],
      parentOrganization: { "@id": "https://ptlaunchlab.co.uk/#org" },
    },
    {
      "@type": "WebSite",
      "@id": "https://ptlaunchlab.co.uk/#website",
      url: "https://ptlaunchlab.co.uk",
      name: "PT Launch Lab",
      publisher: { "@id": "https://ptlaunchlab.co.uk/#org" },
      inLanguage: "en-GB",
    },
  ],
};
