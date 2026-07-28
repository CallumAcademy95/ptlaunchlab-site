// Playbook section constants.
//
// Separate from partner-playbook.ts because that module reads the filesystem,
// and the admin form that offers these sections is a client component — pulling
// `node:fs/promises` into a browser bundle fails the build.

export const PLAYBOOK_TYPES = [
  { key: "social", label: "Social posts" },
  { key: "email", label: "Member emails" },
  { key: "script", label: "In-gym scripts" },
  { key: "campaign", label: "Campaign plays" },
  { key: "idea", label: "Owner ideas" },
] as const;

export type PlaybookType = (typeof PLAYBOOK_TYPES)[number]["key"];
