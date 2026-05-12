import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import SalaryCalculatorClient from "./SalaryCalculatorClient";

const PAGE_URL = "https://ptlaunchlab.co.uk/pt-salary-calculator";
const TODAY = new Date().toISOString().split("T")[0];

export const metadata: Metadata = {
  title: "Personal Trainer Salary Calculator UK 2026 | PT Launch Lab",
  description:
    "Estimate what you'd earn as a UK personal trainer. Pick your employment path, region, and experience — see year 1, year 2-3, and year 4+ projections. Free interactive tool.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    title: "Personal Trainer Salary Calculator UK 2026",
    description:
      "Estimate your PT income by employment path, region, and experience. Year 1 → Year 4+ projections.",
    url: PAGE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Personal Trainer Salary Calculator UK",
  url: PAGE_URL,
  description:
    "Free interactive calculator that estimates UK personal trainer earnings across year 1, 2-3, and 4+ time horizons based on employment path, region, experience and hours per week.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  inLanguage: "en-GB",
  datePublished: `${TODAY}T12:00:00Z`,
  dateModified: `${TODAY}T12:00:00Z`,
  provider: {
    "@type": "Organization",
    name: "PT Launch Lab",
    url: "https://ptlaunchlab.co.uk",
    logo: "https://ptlaunchlab.co.uk/logo.png",
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <Breadcrumbs trail={[{ name: "PT Salary Calculator", url: PAGE_URL }]} />
      <Nav />
      <main className="pt-[72px]">
        <SalaryCalculatorClient />
      </main>
      <Footer />
    </>
  );
}
