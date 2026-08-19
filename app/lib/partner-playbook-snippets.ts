// Pulling fenced code blocks out of playbook markdown — the copy-to-clipboard
// panels a partner actually pastes into Meta Ads Manager, a front-desk script,
// or an email.
//
// Kept apart from partner-playbook.ts on purpose, same split and same reason
// as partner-playbook-tokens.ts: that file imports supabase-admin via an
// extensionless specifier, which the plain `node --test` loader cannot
// resolve. tests/adCopy.test.mts needs the exact regex the portal renders
// with, not a hand-copied lookalike that can silently drift from it.

export function extractSnippets(body: string): string[] {
  return [...body.matchAll(/```[a-z]*\r?\n([\s\S]*?)```/g)].map((m) => m[1].trimEnd());
}
