// The two bookable calls. Questions are copied verbatim from the Calendly
// event types they replace (checked 15 Oct 2026). Pure module.

export type CallType = "consultation" | "gym_partner";

export interface Question {
  key: string;
  label: string;
  kind: "text" | "string" | "multi";
  required: boolean;
  choices?: string[];
}

export const CALL_TYPES: Record<CallType, { title: string; minutes: number; slug: string; questions: Question[] }> = {
  consultation: {
    title: "Free consultation call",
    minutes: 30,
    slug: "consultation",
    questions: [
      { key: "why", label: "Please share why you want to be a PT and whats your current challenge with your job.", kind: "text", required: true },
      { key: "source", label: "Where did you find us? Or who referred you?", kind: "string", required: true },
    ],
  },
  gym_partner: {
    title: "Gym partnership call",
    minutes: 30,
    slug: "gym-partner",
    questions: [
      { key: "gym", label: "Gym / Studio Name", kind: "string", required: true },
      { key: "interests", label: "What are you most interested in?", kind: "multi", required: false, choices: ["Hosting Learners", "Promoting Courses", "Offering Job Placements"] },
    ],
  },
};

export function callTypeFromSlug(slug: string): CallType | null {
  for (const [k, v] of Object.entries(CALL_TYPES)) if (v.slug === slug) return k as CallType;
  return null;
}
