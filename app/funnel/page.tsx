import MoneyHero from "@/app/components/money/MoneyHero";
import PriceBlock from "@/app/components/home/PriceBlock";
import { wasPriceActive } from "@/app/lib/priceDrop";
import FunnelClient from "./FunnelClient";

// /funnel: a server shell so the hero and the price render on the server
// (MoneyHero is a server component; the was-price hint is decided at build,
// as on the home page). The rest of the page, with the prospectus modal, the
// review carousel and the FAQ, is the client component. noindex lives in
// layout.tsx.

/** Build-time hint: hold the was-price space in the pricing card until the browser decides. */
const RESERVE_WAS_PRICE = wasPriceActive(Date.now());

export default function FunnelPage() {
  return (
    <FunnelClient
      hero={
        <MoneyHero
          eyebrow="NCFE LEVEL 2 & 3 · OFQUAL · CIMSPA"
          headline="Become a qualified Personal Trainer,"
          goldTail="around your job."
          subline="Fast-track, run by gym owners who actually hire trainers, with mentorship and a gym introduction included."
          source="funnel-hero"
          image={{ src: "/learner-3.webp", alt: "PT Launch Lab learner who completed the online Level 3 personal training qualification" }}
        />
      }
      pricing={<PriceBlock source="funnel-pricing" bg="base" reserveWasPrice={RESERVE_WAS_PRICE} />}
    />
  );
}
