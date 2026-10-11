// Which side effects /api/quiz-submission still runs.
//
// The quiz contact step now saves through /api/lead first (intent "quiz"),
// and /api/lead already sends the quiz Zapier hook, the email-server nurture,
// the setter (quiz is in SETTER_INTENTS) and the CAPI Lead with the shared
// event id. When the client says so, this route must not send them again:
//   leadSaved: true    → skip Zapier, email-server and notifySetter
//   skipCapiLead: true → skip the CAPI Lead (also implied by leadSaved)
// Leads Central therefore still gets exactly one setter call per quiz lead.
// A caller that sends neither flag (an old cached client) gets today's behaviour.
// No imports so node --test can load it.

export type QuizSubmissionPlan = { zapier: boolean; emailServer: boolean; setter: boolean; capi: boolean };

export function quizSubmissionPlan(raw: unknown): QuizSubmissionPlan {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const leadSaved = r.leadSaved === true;
  const skipCapi = leadSaved || r.skipCapiLead === true;
  return { zapier: !leadSaved, emailServer: !leadSaved, setter: !leadSaved, capi: !skipCapi };
}
