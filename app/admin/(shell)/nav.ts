// The one list of everywhere in the admin.
//
// Until now there was no navigation at all: five unconnected pages you
// reached by typing the URL, which is why the referrals screen and the
// October campaign page were built and then never opened again.
//
// Pure data, no React, so the sidebar and any future mobile menu read the
// same list and cannot drift apart. `icon` is a string key resolved to a
// lucide component in the one place that renders icons.

export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
  /** Shown under the label in the sidebar on wide screens. */
  hint?: string;
  /** Other path prefixes that belong to this entry (e.g. pages it replaced). */
  alsoActiveOn?: string[];
  /** Sub-paths that have their own entry, so this one must not light up for them. */
  excludeOn?: string[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Partners",
    items: [
      { href: "/admin/partners", label: "Gym partners", icon: "building", hint: "Who they are, what they've done" },
      { href: "/admin/outreach", label: "Gym outreach", icon: "send", hint: "Who we've cold emailed, and when it sends next" },
      { href: "/admin/referrals", label: "Referrals", icon: "gift", hint: "£200 promises and who owes them" },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        href: "/admin/crm",
        label: "CRM",
        icon: "users",
        hint: "Every lead and conversation, and who's in charge of it",
        // The old Leads and Site leads screens now live inside the CRM.
        alsoActiveOn: ["/admin/leads", "/admin/site-leads"],
        excludeOn: ["/admin/crm/calls"],
      },
      { href: "/admin/crm/calls", label: "Calls", icon: "phone", hint: "Booked calls, your hours, and who you're ringing next" },
      { href: "/admin/ads", label: "Ad performance", icon: "chart" },
      { href: "/admin/whatsapp", label: "WhatsApp inbox", icon: "message" },
      { href: "/admin/live-questions", label: "Audience questions", icon: "help" },
    ],
  },
];

/** Flat list, for tests and for anything that does not care about grouping. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items);

/**
 * Is this nav entry the one the current page belongs to?
 *
 * Prefix matching, so /admin/partners/ebor still lights up "Gym partners" —
 * but bounded at a path segment, because a plain `startsWith` would also
 * light up "/admin/partners" for a future "/admin/partnerships".
 */
export function isActiveNav(href: string, pathname: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

/** isActiveNav for a whole entry, including the paths it took over. */
export function isActiveItem(item: AdminNavItem, pathname: string): boolean {
  if ((item.excludeOn ?? []).some((href) => isActiveNav(href, pathname))) return false;
  return [item.href, ...(item.alsoActiveOn ?? [])].some((href) => isActiveNav(href, pathname));
}
