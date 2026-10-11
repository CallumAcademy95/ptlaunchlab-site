// Quiz result key -> label sent to Zapier / email-server. Shared by
// /api/quiz-submission and /api/lead. No imports so node --test can load it.
export const QUIZ_RESULT_LABELS: Record<string, string> = {
  onFloor:          'On-Floor PT Path',
  online:           'Online Coach Path',
  hybrid:           'Hybrid Coach Path',
  alreadyQualified: 'Already Qualified — Needs Direction',
};
