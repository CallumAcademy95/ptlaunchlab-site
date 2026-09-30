// scripts/lib/october-campaign.mjs
/**
 * The October Academy Campaign copy, as data.
 *
 * October is a REVEAL month: no discount, no code, no deadline. The offer is
 * the proposition — two NCFE qualifications on one course, through the gym.
 *
 * Kept apart from any renderer or page so `npm run test:unit` can run the claim
 * gate and the white-label rule over every string before a partner ever sees
 * one. That ordering matters: copy is cheap to fix here and expensive to fix
 * once it is in nine ad accounts.
 *
 * THREE RULES EVERY STRING BELOW OBEYS
 *
 * 1. No job-offer language. Not "interview", "guarantee", "hire", "recruit",
 *    "vacancy" or "job". Partly the v3.0 agreement, which makes the gym "solely
 *    a distribution and referral partner"; partly Meta, which treats employment
 *    ads as a Special Ad Category and forces a 15 MILE minimum radius —
 *    roughly fourteen times the area of the four miles the campaign wants.
 *
 * 2. We are never named. The academy belongs to the gym and this copy is read
 *    by its members. The master spec suggested "powered by PT Launch Lab" in
 *    the primary text; that is dropped, because it contradicts both the
 *    existing white-label gate (tests/brandLeaks.test.mts) and the spec's own
 *    stated philosophy that the gym is the face.
 *
 * 3. No claim that study happens physically at the gym. The academy is locally
 *    represented by the gym; the learning is flexible and online. "Through
 *    {{gymName}}" is accurate. "Studied at {{gymName}}" is not, for a learner
 *    who never sets foot in a classroom.
 */
import { applyPlaybookTokens } from "../../app/lib/partner-playbook-tokens.ts";

/**
 * What the gym pastes into Meta. One primary text, two headline options so the
 * ad set can carry both, one description.
 *
 * Headline A leads on the gym because local recognition is the thing a national
 * provider cannot copy. Headline B leads on the offer. Run both.
 */
export const AD_COPY = {
  primaryText: [
    "Ever thought about qualifying as a personal trainer?",
    "",
    "{{gymName}} now has its own PT Academy.",
    "",
    "You study towards two nationally recognised qualifications — the NCFE Level 2 Certificate in Gym Instructing and the NCFE Level 3 Certificate in Personal Training — with flexible online learning built to fit around work and everything else.",
    "",
    "Two qualifications. One course. Through your gym in {{town}}.",
    "",
    "Have a look at what's involved.",
  ].join("\n"),
  headlineA: "Become a Personal Trainer with {{gymName}}",
  headlineB: "Two Qualifications. One Course.",
  description: "Discover the {{gymName}} PT Academy",
};

/**
 * For the gym's own feed and stories. Shorter, written to be read by someone
 * who already follows the gym, so it can assume the relationship.
 */
export const ORGANIC_COPY = {
  post: [
    "Something we don't shout about enough: {{gymName}} has its own PT Academy.",
    "",
    "If you've ever thought about turning what you already do into a career, you can study towards the NCFE Level 2 Gym Instructing and Level 3 Personal Training qualifications through us — flexible, online, built around your life.",
    "",
    "Two qualifications. One course.",
    "",
    "Link in bio, or ask any of the team.",
  ].join("\n"),
  story: [
    "Ever thought about becoming a PT?",
    "{{gymName}} has its own academy.",
    "Swipe up / link below.",
  ].join("\n"),
};

/**
 * The email the gym sends its own members. Deliberately plain and short — it is
 * from their gym, not from a marketing department.
 */
export const MEMBER_EMAIL = {
  subject: "Ever thought about becoming a PT?",
  body: [
    "Hi {{firstName}},",
    "",
    "Quick one, and it's not about your membership.",
    "",
    "{{gymName}} has its own PT Academy. If becoming a personal trainer has ever crossed your mind, you can study towards two nationally recognised qualifications — NCFE Level 2 Gym Instructing and Level 3 Personal Training — through us.",
    "",
    "It's online and flexible, so people do it around full-time work.",
    "",
    "Have a look and see what you think. And if you've got questions, just ask one of us next time you're in.",
    "",
    "{{gymName}}",
  ].join("\n"),
};

/**
 * The conversation the owner has on the gym floor. Not a script to read out —
 * an opener plus what to do with the answer.
 *
 * The prompt is deliberately "who do people go to", never "who gives everyone
 * advice". Unsolicited gym advice is resented, and the member who hands it out
 * is not the one we want. The signal is being ASKED.
 */
export const OUTREACH = {
  opener:
    "Bit of a random one — we've been thinking about who'd actually make a good PT, and your name came up. Have you ever thought about it?",
  thenWhat: [
    "Then stop talking and let them answer. That is the whole technique.",
    "If they have thought about it, they will tell you, usually in detail, and usually including the thing that has stopped them.",
    "If they have not, you have planted something and it cost you nothing.",
    "Don't explain the course, don't mention the price, don't sell. You are finding out whether the thought has ever crossed their mind.",
  ],
  whoToLookFor: [
    "The one people walk over to — not the one handing out advice.",
    "Patient with beginners.",
    "Genuinely enjoys helping, rather than being seen to help.",
    "Has been through their own transformation and remembers what day one felt like.",
    "Your staff already send nervous newcomers to them.",
    "Explains things without making anyone feel stupid.",
    "Has mentioned doing something in fitness before.",
  ],
  ownerQuestion: "Who have you looked at and thought: you'd actually make a good PT?",
};

/**
 * Every string a gym will see, flattened — what the gate runs over.
 *
 * The JSDoc type is load-bearing: a bare `tokens = null` default makes
 * TypeScript infer the parameter as `null`, so every caller that passes real
 * tokens fails to compile even though the JavaScript is fine.
 *
 * @param {Record<string, string> | null} [tokens]
 * @returns {string[]}
 */
export function allOctoberStrings(tokens = null) {
  const raw = [
    AD_COPY.primaryText,
    AD_COPY.headlineA,
    AD_COPY.headlineB,
    AD_COPY.description,
    ORGANIC_COPY.post,
    ORGANIC_COPY.story,
    MEMBER_EMAIL.subject,
    MEMBER_EMAIL.body,
    OUTREACH.opener,
    ...OUTREACH.thenWhat,
    ...OUTREACH.whoToLookFor,
    OUTREACH.ownerQuestion,
  ];
  return tokens ? raw.map((s) => applyPlaybookTokens(s, tokens)) : raw;
}

/** The campaign's own numbers, in one place so the page and the email agree. */
export const CAMPAIGN = {
  month: "October",
  title: "Your October Academy Campaign",
  goal: "Get your PT academy seen locally",
  recommendedSpendGbp: 150,
  commissionGbp: 500,
  setupMinutes: 10,
  radiusMiles: 4,
  // A reveal month. If this is ever non-null the page must show the code and
  // the deadline, because that becomes the reason to act.
  promoCode: null,
};
