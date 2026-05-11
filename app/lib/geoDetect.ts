import { headers } from "next/headers";
import { yorkshireLocations } from "./yorkshireLocations";

// Vercel injects geo headers on every request at the edge. We use these
// to render the homepage hero variant most relevant to the visitor.
//
// - x-vercel-ip-country         : ISO 3166-1 alpha-2 (e.g. "GB")
// - x-vercel-ip-country-region  : ISO 3166-2 sub-region code (e.g. "LDS" for Leeds)
// - x-vercel-ip-city            : URL-encoded city name (e.g. "Leeds")
//
// We classify a visitor as "Yorkshire" if either the region code or city
// name matches a known Yorkshire entry. The region check catches counties
// (Vercel returns county-level ISO codes); the city check is the safety net.

const YORKSHIRE_REGION_CODES = new Set([
  // ISO 3166-2:GB codes for Yorkshire metropolitan boroughs and counties
  "BFD", "BNS", "CLD", "DNC", "ERY", "HUL", "KIR",
  "LDS", "NYK", "RTH", "SHF", "WKF", "YOR",
  // Some providers prefix with "GB-"
  "GB-BFD", "GB-BNS", "GB-CLD", "GB-DNC", "GB-ERY", "GB-HUL", "GB-KIR",
  "GB-LDS", "GB-NYK", "GB-RTH", "GB-SHF", "GB-WKF", "GB-YOR",
]);

const YORKSHIRE_CITY_NAMES = new Set(
  yorkshireLocations.map((l) => l.name.toLowerCase()),
);

export interface VisitorGeo {
  country: string;
  region: string;
  city: string;
  isUK: boolean;
  isYorkshire: boolean;
}

export async function getVisitorGeo(): Promise<VisitorGeo> {
  const h = await headers();
  const country = (h.get("x-vercel-ip-country") || "").toUpperCase();
  const region = (h.get("x-vercel-ip-country-region") || "").toUpperCase();
  const cityRaw = h.get("x-vercel-ip-city") || "";

  let city = "";
  try {
    city = decodeURIComponent(cityRaw).toLowerCase();
  } catch {
    city = cityRaw.toLowerCase();
  }

  const isUK = country === "GB";
  const isYorkshire =
    isUK &&
    (YORKSHIRE_REGION_CODES.has(region) ||
      YORKSHIRE_CITY_NAMES.has(city));

  return { country, region, city, isUK, isYorkshire };
}
