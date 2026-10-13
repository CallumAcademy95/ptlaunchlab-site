import { ADDRESS_ONE_LINE, PHONE_NATIONAL, PHONE_TEL } from "@/app/lib/contactDetails";

/**
 * Name, address and phone, exactly as the Google Business Profile shows them.
 * Rendered in every footer (the shared Footer, the gym academy pages, /funnel
 * and the cold-ad landing pages) so the site and the listing say the same
 * thing. Each footer passes its own classes to keep its styling.
 */
export default function NapLine({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  return (
    <p className={className}>
      PT Launch Lab · {ADDRESS_ONE_LINE} · <a href={`tel:${PHONE_TEL}`} className={linkClassName}>{PHONE_NATIONAL}</a>
    </p>
  );
}
