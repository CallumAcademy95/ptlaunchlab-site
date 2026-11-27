"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/partners", label: "My Academy" },
  { href: "/partners/october", label: "Academy campaign" },
  { href: "/partners/resources", label: "Resources" },
  { href: "/partners/sales", label: "Enrolments" },
  { href: "/partners/payments", label: "Payments" },
  { href: "/partners/playbook", label: "Playbook" },
] as const;

/** `mentor`: a mentor partner (app/lib/partnerKind.ts) has no gym campaign tab. */
export default function PartnerNav({ mentor = false }: { mentor?: boolean }) {
  const pathname = usePathname();
  const links = mentor ? LINKS.filter((l) => l.href !== "/partners/october") : LINKS;

  return (
    <nav aria-label="Partner portal" className="border-b border-white/10 bg-deep">
      <div className="mx-auto max-w-5xl px-6">
        <ul className="flex gap-1 overflow-x-auto">
          {links.map(({ href, label }) => {
            // "/partners" must match exactly or it would light up on every page.
            const active = href === "/partners" ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    active
                      ? "border-gold text-gold"
                      : "border-transparent text-soft hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
