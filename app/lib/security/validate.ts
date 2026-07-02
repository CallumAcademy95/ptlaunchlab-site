/**
 * Zod schemas for every form payload + a helper that runs the security
 * checks (validate format, normalise) and returns a structured result.
 *
 * Each `validateXxxSubmission` function returns:
 *   { ok: true,  data: <normalised payload>, sec: <sec check>, signals: [] }
 *   { ok: false, status: 400 | 422, error: string, signals: string[] }
 *
 * Use status 400 for clearly-malformed payloads (will surface to the user)
 * and the silent-drop pattern for honeypot/time-trap hits (status 200, no
 * side effects).
 */

import { z } from "zod";
import { validateEmail } from "./email";
import { validateName } from "./name";
import { validateUKPhone, validateAnyPhone } from "./phone";
import { checkHoneypot, SEC_KEY, type SecCheck } from "./honeypot";

const secSchema = z.object({
  hp: z.string().optional(),
  t:  z.number().optional(),
  n:  z.string().optional(),
}).optional();

// ── Contact ───────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name:    z.string().max(200),
  email:   z.string().max(254).optional().or(z.literal("")),
  phone:   z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(2).max(4000),
  [SEC_KEY]: secSchema,
});

// ── Quiz ──────────────────────────────────────────────────────────────────
// Avatar is the cold-traffic pre-tag from /become-a-personal-trainer-uk,
// /career-change-to-personal-trainer, /retrain-as-a-personal-trainer. It's
// orthogonal to the quiz result (which is a career-path computed from
// answers) — avatar describes WHO the visitor is, result describes WHICH
// path suits them. Used downstream for segmented retargeting and tailored
// result-page framing.
const quizSchema = z.object({
  name:    z.string().max(200),
  email:   z.string().max(254),
  phone:   z.string().max(40),
  result:  z.string().max(64),
  avatar:  z.enum(['starter', 'switcher', 'returner']).optional(),
  answers: z.array(z.object({ label: z.string().max(500) })).max(40).optional(),
  [SEC_KEY]: secSchema,
});

// ── Prospectus ────────────────────────────────────────────────────────────
const prospectusSchema = z.object({
  name:  z.string().max(200),
  email: z.string().max(254),
  phone: z.string().max(40),
  [SEC_KEY]: secSchema,
});

// ── Live session question ────────────────────────────────────────────────────
// Separate from registration on purpose — the question form lives at /ask and
// is reached via the confirmation/reminder emails, so it never adds friction to
// the mailing-list signup. Email ties the question back to the registrant.
const liveQuestionSchema = z.object({
  name:     z.string().max(200).optional().or(z.literal("")),
  email:    z.string().max(254),
  question: z.string().min(5).max(2000),
  [SEC_KEY]: secSchema,
});

// ── Live session registration ───────────────────────────────────────────────
// Low-friction gate for the monthly live webinar/podcast. Email is the asset
// we're capturing, so name + email are required and phone is OPTIONAL — every
// extra required field on a free-event signup costs registrations. The phone,
// when given, joins the WhatsApp reminder flow alongside the email sequence.
const liveRegisterSchema = z.object({
  name:  z.string().max(200),
  email: z.string().max(254),
  phone: z.string().max(40).optional().or(z.literal("")),
  [SEC_KEY]: secSchema,
});

// ── Career Planning Suite ─────────────────────────────────────────────────
// Lead gate on the calculator result. Name + email required, phone optional
// (every extra required field on a free tool costs leads). The calculator
// inputs/results ride along as a snapshot for the admin notification but are
// not part of the security validation.
const careerPlannerSchema = z.object({
  name:  z.string().max(200),
  email: z.string().max(254),
  phone: z.string().max(40).optional().or(z.literal("")),
  [SEC_KEY]: secSchema,
});

// ── Objection Intelligence (Sprint 3) ─────────────────────────────────────
// Micro-survey at warm drop-off points: "what's holding you back?". Anonymous
// by design (email optional) so it stays low-friction — the value is the
// aggregate trend, not the individual. reason is a fixed taxonomy; note + email
// are optional. context tags WHERE the objection was captured.
export const OBJECTION_REASONS = [
  "too_expensive",
  "need_finance",
  "no_time",
  "comparing",
  "need_level2",
  "not_confident",
  "just_researching",
  "other",
] as const;

const objectionSchema = z.object({
  reason:  z.enum(OBJECTION_REASONS),
  note:    z.string().max(1000).optional().or(z.literal("")),
  context: z.string().max(64).optional().or(z.literal("")),
  email:   z.string().max(254).optional().or(z.literal("")),
  [SEC_KEY]: secSchema,
});

// ── Graduate story (Proof Engine capture) ─────────────────────────────────
// Graduates submit their story to be published on /graduates. Name + email +
// story required (email so we can verify/thank them and confirm consent);
// phone optional. The tag fields (previousJob/region/specialism/avatar) are
// optional self-tags that a curator confirms before the entry is added to the
// published graduates DB. `consent` must be true — we publish names + quotes.
const graduateStorySchema = z.object({
  name:        z.string().max(200),
  email:       z.string().max(254),
  phone:       z.string().max(40).optional().or(z.literal("")),
  previousJob: z.string().max(120).optional().or(z.literal("")),
  region:      z.string().max(60).optional().or(z.literal("")),
  specialism:  z.string().max(120).optional().or(z.literal("")),
  avatar:      z.enum(['starter', 'switcher', 'returner']).optional(),
  story:       z.string().min(20).max(2000),
  consent:     z.literal(true),
  [SEC_KEY]: secSchema,
});

// ── Gym partnership ──────────────────────────────────────────────────────
const gymPartnershipSchema = z.object({
  gymName:    z.string().min(2).max(200),
  name:       z.string().max(200),
  email:      z.string().max(254),
  phone:      z.string().max(40),
  location:   z.string().min(2).max(200),
  gymSize:    z.string().max(64).optional().or(z.literal("")),
  referredBy: z.string().max(200).optional().or(z.literal("")),
  [SEC_KEY]: secSchema,
});

// ── Result types ─────────────────────────────────────────────────────────
export type ValidationOk<T> = {
  ok: true;
  data: T;
  signals: string[];   // any soft-fails that didn't reject but are worth logging
};

export type ValidationFail = {
  ok: false;
  silent: boolean;     // true → return 200 OK to caller, drop the lead
  status: 400 | 422;
  error: string;
  signals: string[];
};

export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

function sec(payload: unknown): SecCheck {
  if (!payload || typeof payload !== "object") return { ok: false, reason: "missing" };
  const s = (payload as Record<string, unknown>)[SEC_KEY];
  return checkHoneypot(s);
}

// ── Validators ────────────────────────────────────────────────────────────

export type ContactClean = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export function validateContact(raw: unknown): ValidationResult<ContactClean> {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Missing required fields.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }

  let email = "";
  let phone = "";
  const hasEmail = !!parsed.data.email;
  const hasPhone = !!parsed.data.phone;
  if (!hasEmail && !hasPhone) {
    return { ok: false, silent: false, status: 400, error: "Please provide an email or phone number.", signals: ["no-contact"] };
  }

  if (hasEmail) {
    const ec = validateEmail(parsed.data.email);
    if (!ec.ok) {
      return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
    }
    email = ec.normalised!;
  }
  if (hasPhone) {
    const pc = validateUKPhone(parsed.data.phone);
    if (!pc.ok) {
      return { ok: false, silent: false, status: 422, error: "Please enter a valid UK phone number.", signals: [`phone:${pc.reason}`] };
    }
    phone = pc.normalised!;
  }

  return {
    ok: true,
    data: { name: nameCheck.normalised!, email, phone, message: parsed.data.message.trim() },
    signals: [],
  };
}

export type QuizClean = {
  name: string;
  email: string;
  phone: string;
  result: string;
  avatar?: 'starter' | 'switcher' | 'returner';
  answers: { label: string }[];
};

export function validateQuiz(raw: unknown): ValidationResult<QuizClean> {
  const parsed = quizSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Missing required fields.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }
  const ec = validateEmail(parsed.data.email);
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  const pc = validateUKPhone(parsed.data.phone);
  if (!pc.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid UK phone number.", signals: [`phone:${pc.reason}`] };
  }

  return {
    ok: true,
    data: {
      name: nameCheck.normalised!,
      email: ec.normalised!,
      phone: pc.normalised!,
      result: parsed.data.result,
      avatar: parsed.data.avatar,
      answers: parsed.data.answers ?? [],
    },
    signals: [],
  };
}

export type ProspectusClean = { name: string; email: string; phone: string };

export function validateProspectus(raw: unknown): ValidationResult<ProspectusClean> {
  const parsed = prospectusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Please fill in all fields.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }
  const ec = validateEmail(parsed.data.email);
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  const pc = validateUKPhone(parsed.data.phone);
  if (!pc.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid UK phone number.", signals: [`phone:${pc.reason}`] };
  }
  return {
    ok: true,
    data: { name: nameCheck.normalised!, email: ec.normalised!, phone: pc.normalised! },
    signals: [],
  };
}

export type LiveQuestionClean = { name: string; email: string; question: string };

export function validateLiveQuestion(raw: unknown): ValidationResult<LiveQuestionClean> {
  const parsed = liveQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Please enter your email and a question.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const ec = validateEmail(parsed.data.email);
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  const question = (parsed.data.question ?? "").trim();
  if (question.length < 5) {
    return { ok: false, silent: false, status: 422, error: "Please type your question.", signals: ["question:too-short"] };
  }

  // Name optional — keep it if a real name, otherwise blank.
  let name = "";
  if (parsed.data.name) {
    const nc = validateName(parsed.data.name);
    if (nc.ok) name = nc.normalised!;
  }

  return { ok: true, data: { name, email: ec.normalised!, question }, signals: [] };
}

export type LiveRegisterClean = { name: string; email: string; phone: string };

export function validateLiveRegister(raw: unknown): ValidationResult<LiveRegisterClean> {
  const parsed = liveRegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Please enter your name and email.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }
  const ec = validateEmail(parsed.data.email);
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  // Phone optional — only validate if the visitor chose to give one.
  let phone = "";
  if (parsed.data.phone) {
    const pc = validateUKPhone(parsed.data.phone);
    if (!pc.ok) {
      return { ok: false, silent: false, status: 422, error: "Please enter a valid UK phone number, or leave it blank.", signals: [`phone:${pc.reason}`] };
    }
    phone = pc.normalised!;
  }

  return {
    ok: true,
    data: { name: nameCheck.normalised!, email: ec.normalised!, phone },
    signals: [],
  };
}

export type CareerPlannerClean = { name: string; email: string; phone: string };

export function validateCareerPlanner(raw: unknown): ValidationResult<CareerPlannerClean> {
  const parsed = careerPlannerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Please enter your name and email.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }
  const ec = validateEmail(parsed.data.email);
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  let phone = "";
  if (parsed.data.phone) {
    const pc = validateUKPhone(parsed.data.phone);
    if (!pc.ok) {
      return { ok: false, silent: false, status: 422, error: "Please enter a valid UK phone number, or leave it blank.", signals: [`phone:${pc.reason}`] };
    }
    phone = pc.normalised!;
  }

  return { ok: true, data: { name: nameCheck.normalised!, email: ec.normalised!, phone }, signals: [] };
}

export type ObjectionClean = {
  reason: (typeof OBJECTION_REASONS)[number];
  note: string;
  context: string;
  email: string;
};

export function validateObjection(raw: unknown): ValidationResult<ObjectionClean> {
  const parsed = objectionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Please pick an option.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }
  // Email optional — only validate if given; never block the objection on it.
  let email = "";
  if (parsed.data.email) {
    const ec = validateEmail(parsed.data.email);
    if (ec.ok) email = ec.normalised!;
  }
  return {
    ok: true,
    data: {
      reason: parsed.data.reason,
      note: (parsed.data.note ?? "").trim(),
      context: (parsed.data.context ?? "").trim(),
      email,
    },
    signals: [],
  };
}

export type GraduateStoryClean = {
  name: string;
  email: string;
  phone: string;
  previousJob: string;
  region: string;
  specialism: string;
  avatar?: 'starter' | 'switcher' | 'returner';
  story: string;
};

export function validateGraduateStory(raw: unknown): ValidationResult<GraduateStoryClean> {
  const parsed = graduateStorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Please add your name, email and story, and tick consent.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }
  const ec = validateEmail(parsed.data.email);
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  const story = parsed.data.story.trim();
  if (story.length < 20) {
    return { ok: false, silent: false, status: 422, error: "Please tell us a little more about your story.", signals: ["story:too-short"] };
  }
  // Phone optional.
  let phone = "";
  if (parsed.data.phone) {
    const pc = validateUKPhone(parsed.data.phone);
    if (!pc.ok) {
      return { ok: false, silent: false, status: 422, error: "Please enter a valid UK phone number, or leave it blank.", signals: [`phone:${pc.reason}`] };
    }
    phone = pc.normalised!;
  }

  return {
    ok: true,
    data: {
      name: nameCheck.normalised!,
      email: ec.normalised!,
      phone,
      previousJob: (parsed.data.previousJob ?? "").trim(),
      region: (parsed.data.region ?? "").trim(),
      specialism: (parsed.data.specialism ?? "").trim(),
      avatar: parsed.data.avatar,
      story,
    },
    signals: [],
  };
}

export type GymPartnershipClean = {
  gymName: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  gymSize: string;
  referredBy: string;
};

export function validateGymPartnership(raw: unknown): ValidationResult<GymPartnershipClean> {
  const parsed = gymPartnershipSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, silent: false, status: 400, error: "Missing required fields.", signals: ["schema-fail"] };
  }
  const secCheck = sec(raw);
  if (!secCheck.ok) {
    return { ok: false, silent: true, status: 400, error: "ok", signals: [`sec:${secCheck.reason}`] };
  }

  const nameCheck = validateName(parsed.data.name);
  if (!nameCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter your full name.", signals: [`name:${nameCheck.reason}`] };
  }
  const gymCheck = validateName(parsed.data.gymName, { min: 2, max: 200 });
  if (!gymCheck.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid gym name.", signals: [`gym:${gymCheck.reason}`] };
  }
  // Gym partnership: allow business-domain role addresses (info@gym.com is realistic)
  const ec = validateEmail(parsed.data.email, { allowRole: true });
  if (!ec.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid email address.", signals: [`email:${ec.reason}`] };
  }
  const pc = validateAnyPhone(parsed.data.phone);
  if (!pc.ok) {
    return { ok: false, silent: false, status: 422, error: "Please enter a valid phone number.", signals: [`phone:${pc.reason}`] };
  }
  return {
    ok: true,
    data: {
      gymName:    gymCheck.normalised!,
      name:       nameCheck.normalised!,
      email:      ec.normalised!,
      phone:      pc.normalised!,
      location:   parsed.data.location.trim(),
      gymSize:    parsed.data.gymSize ?? "",
      referredBy: (parsed.data.referredBy ?? "").trim(),
    },
    signals: [],
  };
}

/**
 * Enrolments validator. Deliberately permissive — the form has its own rich
 * client-side validation and lost enrolments cost money. We ONLY drop on
 * honeypot trip; we do not silent-drop on time-trap (the form is multi-step
 * and a fast power-user is plausible).
 */
export function validateEnrolmentSec(raw: unknown): SecCheck {
  if (!raw || typeof raw !== "object") return { ok: true }; // be permissive
  const s = (raw as Record<string, unknown>)[SEC_KEY];
  if (!s || typeof s !== "object") return { ok: true };
  const hp = (s as { hp?: unknown }).hp;
  if (typeof hp === "string" && hp.length > 0) {
    return { ok: false, reason: "honeypot" };
  }
  return { ok: true };
}
