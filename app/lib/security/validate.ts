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
