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

const PLAYBOOK_DIR = path.join(process.cwd(), "partner-playbook");

export const PLAYBOOK_TYPES = [
  { key: "social", label: "Social posts" },
  { key: "email", label: "Member emails" },
  { key: "script", label: "In-gym scripts" },
  { key: "campaign", label: "Campaign plays" },
] as const;

export type PlaybookType = (typeof PLAYBOOK_TYPES)[number]["key"];

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
 * Every playbook entry, ordered.
 *
 * Returns an empty list when the directory doesn't exist yet — the page renders
 * its own "coming soon" state rather than this throwing during a build.
 */
export async function getPlaybook(): Promise<PlaybookEntry[]> {
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
        return {
          slug: file.replace(/\.md$/, ""),
          title: meta.title || file.replace(/\.md$/, ""),
          type,
          channel: meta.channel || null,
          whenToUse: meta.when_to_use || null,
          order: Number(meta.order ?? 100),
          html: await marked.parse(body),
          snippets: extractSnippets(body),
        };
      } catch (err) {
        console.error(`[playbook] could not read ${file}:`, err);
        return null;
      }
    })
  );

  return entries
    .filter((e): e is PlaybookEntry => e !== null)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}
