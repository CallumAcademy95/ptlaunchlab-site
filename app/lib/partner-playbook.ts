// The partner playbook: markdown files in the repo, deliberately not a database.
//
// Same call as the learning-hub chapter library, and for the same reason — this
// is content that gets rewritten constantly, and a database turns every copy
// tweak into a data migration. You update the playbook by committing markdown.
//
// Files live in /partner-playbook/*.md with YAML-ish frontmatter:
//
//   ---
//   title: Front desk script
//   type: script            # script | social | email | campaign
//   channel: In gym         # free text, shown as a chip
//   when_to_use: A member asks what the course involves
//   order: 10
//   ---
//   Markdown body. Fenced code blocks become copy-to-clipboard panels.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";
import { getSupabaseAdmin } from "./supabase-admin";
import { PLAYBOOK_TYPES, type PlaybookType } from "./partner-playbook-types";
import { applyPlaybookTokens, type PlaybookTokens } from "./partner-playbook-tokens";

const PLAYBOOK_DIR = path.join(process.cwd(), "partner-playbook");

export { PLAYBOOK_TYPES };
export type { PlaybookType };

export interface PlaybookEntry {
  slug: string;
  title: string;
  type: PlaybookType;
  channel: string | null;
  whenToUse: string | null;
  order: number;
  /** Rendered HTML. Authored by us, committed to the repo — not user input. */
  html: string;
  /** Fenced code blocks, pulled out so the UI can offer copy-to-clipboard. */
  snippets: string[];
  /** Set when the entry came from the admin upload and has a file attached. */
  downloadId?: string;
}

/** Minimal frontmatter reader — the playbook is ours, so it needn't handle YAML in general. */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) meta[kv[1].trim()] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: match[2] };
}

function extractSnippets(body: string): string[] {
  return [...body.matchAll(/```[a-z]*\r?\n([\s\S]*?)```/g)].map((m) => m[1].trimEnd());
}

/**
 * The curated core: markdown committed to the repo.
 *
 * Returns an empty list when the directory doesn't exist yet, so the page shows
 * its own empty state rather than this throwing during a build.
 */
async function getRepoEntries(tokens: PlaybookTokens | null): Promise<PlaybookEntry[]> {
  let files: string[];
  try {
    files = (await readdir(PLAYBOOK_DIR)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }

  const entries = await Promise.all(
    files.map(async (file): Promise<PlaybookEntry | null> => {
      try {
        const raw = await readFile(path.join(PLAYBOOK_DIR, file), "utf8");
        const { meta, body } = parseFrontmatter(raw);
        const type = (meta.type ?? "script") as PlaybookType;
        if (!PLAYBOOK_TYPES.some((t) => t.key === type)) {
          console.error(`[playbook] ${file} has unknown type "${meta.type}" — skipped`);
          return null;
        }
        // Personalise before rendering AND before snippets are pulled out, so the
        // copy-to-clipboard panels hand the partner their own gym name and code
        // rather than a {{token}} they would have to find and replace.
        const personalised = tokens ? applyPlaybookTokens(body, tokens) : body;
        return {
          slug: file.replace(/\.md$/, ""),
          title: meta.title || file.replace(/\.md$/, ""),
          type,
          channel: meta.channel || null,
          whenToUse: meta.when_to_use || null,
          order: Number(meta.order ?? 100),
          html: await marked.parse(personalised),
          snippets: extractSnippets(personalised),
        };
      } catch (err) {
        console.error(`[playbook] could not read ${file}:`, err);
        return null;
      }
    })
  );

  return entries.filter((e): e is PlaybookEntry => e !== null);
}

/** Ad-hoc entries added through /admin/partners, no deploy required. */
async function getUploadedEntries(tokens: PlaybookTokens | null): Promise<PlaybookEntry[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("pp_playbook_entries")
    .select("id, slug, title, type, channel, when_to_use, sort_order, body_markdown, storage_path, external_url");

  if (error) {
    // A missing table (migration not applied) must not take the page down —
    // the repo entries are the important half.
    console.error("[playbook] uploaded entries unavailable:", error.message);
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (row): Promise<PlaybookEntry> => {
      const rawBody = (row.body_markdown as string | null) ?? "";
      const body = tokens ? applyPlaybookTokens(rawBody, tokens) : rawBody;
      return {
        slug: row.slug as string,
        title: row.title as string,
        type: row.type as PlaybookType,
        channel: (row.channel as string | null) ?? null,
        whenToUse: (row.when_to_use as string | null) ?? null,
        order: Number(row.sort_order ?? 100),
        html: body ? await marked.parse(body) : "",
        snippets: extractSnippets(body),
        downloadId: row.storage_path || row.external_url ? (row.id as string) : undefined,
      };
    })
  );
}

/**
 * Every playbook entry, ordered.
 *
 * Repo entries win on a slug clash — a reviewed, committed entry should never be
 * silently replaced by an upload. Returns whatever it can: a missing directory
 * or an unapplied migration degrades to the other source rather than throwing.
 *
 * `tokens` personalises {{gymName}}-style placeholders for the signed-in
 * partner. Pass `null` for a partner with no matching brand entry — the raw
 * markdown is shown as-is, which is deliberate (see partner-playbook-tokens.ts).
 */
export async function getPlaybook(tokens: PlaybookTokens | null = null): Promise<PlaybookEntry[]> {
  const [repo, uploaded] = await Promise.all([getRepoEntries(tokens), getUploadedEntries(tokens)]);

  const bySlug = new Map<string, PlaybookEntry>();
  for (const entry of uploaded) bySlug.set(entry.slug, entry);
  for (const entry of repo) bySlug.set(entry.slug, entry);

  return [...bySlug.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
