// Partners who are not gyms.
//
// The partner portal was written for gyms: front desks, members, gym TV, a
// Meta campaign "around your gym". A mentor partner (PT Mentor Hub, Nov 2026)
// sells to his own audience online, so that copy reads wrong to him. A mentor
// gets the same data with his own wording, his own playbook
// (partner-playbook/partners/<slug>/), only the resources made for him, and no
// gym campaign tab.
//
// A list in code rather than a column, like PAY_IN_FULL_ONLY_PARTNERS in
// pricing.ts: there is one mentor, and adding one is a reviewed change anyway
// (his playbook is committed markdown).

export const MENTOR_PARTNERS: readonly string[] = ["pt-mentor-hub"];

export function isMentorPartner(slug: string | null | undefined): boolean {
  return !!slug && MENTOR_PARTNERS.includes(slug);
}
