// Turn a stored lead message body into something a person can read.
//
// DISPLAY ONLY. lead_messages.body is written by the inbox poller and read by
// Leads Central and the setter; nothing here changes what is stored. The admin
// lead page runs every body through this before showing it, and keeps the raw
// original one click away ("Show original"), so nothing is ever lost.
//
// Many inbound emails were captured as their HTML part, so the conversation
// read as `<div dir="ltr">…<br>…<div class="gmail_quote">` followed by every
// earlier message in the thread. This strips the markup and the quoted history
// and returns plain text — rendered with whitespace-pre-wrap, never as HTML.
//
// Pure and dependency-free so it runs under `node --test` as well as in the page.

export interface DisplayMessage {
  /** Plain text to show. Never HTML. */
  text: string;
  /** True when quoted earlier messages were cut off the end. */
  hadQuote: boolean;
}

// Only real HTML tags count. Plain-text mail is full of angle brackets that are
// not markup — "Name <a@b.com>", "website<https://x.co/>" — and treating those
// as tags would delete addresses and links from the message.
const HTML_SIGNAL =
  /<(?:!--|!doctype\b|\/?(?:html|head|body|meta|style|script|title|div|p|span|br|hr|a|b|i|u|em|strong|font|blockquote|table|tbody|thead|tr|td|th|ul|ol|li|img|h[1-6]|center|pre|o:p)(?:\s[^<>]*)?\/?>)/i;

export function looksLikeHtml(body: string): boolean {
  return HTML_SIGNAL.test(body);
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  pound: "£",
  euro: "€",
  copy: "©",
  reg: "®",
  trade: "™",
  bull: "•",
  middot: "·",
  zwnj: "",
  zwj: "",
  shy: "",
};

/** Decode HTML entities in one pass, so "&amp;lt;" becomes "&lt;", not "<". */
export function decodeEntities(s: string): string {
  return s.replace(/&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const hex = ref[1] === "x" || ref[1] === "X";
      const code = parseInt(ref.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        return whole;
      }
      // A non-breaking space reads as a space; keeping U+00A0 only breaks the
      // trailing-space trim and makes copied text odd.
      return code === 0xa0 ? " " : String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[ref.toLowerCase()];
    return named === undefined ? whole : named;
  });
}

// Where quoted history starts in an HTML body. Gmail wraps it in
// gmail_quote (newer Gmail: gmail_quote_container), Apple Mail and most
// others in <blockquote>, Outlook on the web in divRplyFwdMsg/appendonsend,
// Yahoo in yahoo_quoted.
const HTML_QUOTE_START =
  /<div\b[^>]*\bclass\s*=\s*["']?[^"'>]*\bgmail_quote|<blockquote\b|<div\b[^>]*\bid\s*=\s*["']?(?:divRplyFwdMsg|appendonsend)\b|<hr\b[^>]*\bid\s*=\s*["']?stopSpelling|<div\b[^>]*\bclass\s*=\s*["']?[^"'>]*\byahoo_quoted/i;

function sameUrl(text: string, href: string): boolean {
  const norm = (u: string) =>
    u
      .trim()
      .replace(/^mailto:/i, "")
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  return norm(text) === norm(href);
}

/** Stands in for a block boundary while tags are being turned into text. */
const BLOCK = "\u0001";

function htmlToText(html: string): string {
  let s = html.replace(/\u0001/g, "");
  // Things whose CONTENT must go, not just their tags.
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<(head|style|script|title|xml)\b[\s\S]*?<\/\1\s*>/gi, "");
  // An unclosed <style>/<script> would otherwise leak CSS/JS into the text.
  s = s.replace(/<(style|script)\b[\s\S]*$/i, "");
  s = s.replace(/<!doctype[^>]*>|<meta\b[^>]*>|<link\b[^>]*>/gi, "");

  // In HTML a source newline is just whitespace; the tags say where lines break.
  s = s.replace(/[ \t\n\f\v]+/g, " ");

  // Links: keep the words, and the address only when the words aren't it.
  s = s.replace(/<a(\s[^>]*)?>([\s\S]*?)<\/a\s*>/gi, (_m, attrs: string | undefined, inner: string) => {
    const text = decodeEntities(inner.replace(/<[^>]*>/g, "")).trim();
    const hrefMatch = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs ?? "");
    const href = hrefMatch ? decodeEntities(hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? "").trim() : "";
    if (!href || !/^(https?:|mailto:)/i.test(href)) return text;
    if (!text) return href.replace(/^mailto:/i, "");
    return sameUrl(text, href) ? text : `${text} (${href.replace(/^mailto:/i, "")})`;
  });

  // <br> is a hard line break. A block boundary (opening or closing <div>,
  // <p>, <li>…) is a SOFT one, as in a browser: it starts a new line unless
  // we are already at the start of one. That is what makes Gmail's
  // "<div>Hi</div><div><br></div><div>Thanks</div>" one blank line, not three,
  // and "you?<div>I'll…" two lines, not "you?I'll".
  s = s.replace(/<br\b[^>]*>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, `${BLOCK}• `);
  s = s.replace(/<\/?(?:p|div|li|tr|h[1-6]|ul|ol|table|blockquote|pre|center|hr)\b[^>]*>/gi, BLOCK);
  s = s.replace(/<\/t[dh]\s*>/gi, " ");
  // Everything else that is a tag. Only tag-shaped things: "<" followed by a
  // letter, "/" or "!" — a stray "a < b" in the text survives.
  s = s.replace(/<\/?[a-z][a-z0-9:-]*(?:\s[^<>]*)?\/?>|<![^<>]*>/gi, "");
  // Whitespace between tags is not content.
  s = s.replace(/ *([\n\u0001]) */g, "$1");
  s = s.replace(/\u0001+/g, (_m, at: number, all: string) => (at === 0 || all[at - 1] === "\n" ? "" : "\n"));
  s = decodeEntities(s);
  return s;
}

const ON_WROTE_START = /^\s*(?:>\s*)?On\b/;
const ON_WROTE_END = /\bwrote:\s*$/i;
const ORIGINAL_MESSAGE = /^\s*-{2,}\s*Original Message\s*-{2,}\s*$/i;
const OUTLOOK_FROM = /^\s*\*?From:\*?\s+\S/i;
const OUTLOOK_SENT = /^\s*\*?(?:Sent|Date):\*?\s+\S/i;

/** Index of the first line of quoted history in plain text, or -1. */
function textQuoteStart(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // "On Tue, 7 Oct 2026 at 09:12, Sam <sam@x.com> wrote:" — Gmail often
    // wraps it over two or three lines. A digit is required so a sentence
    // that merely starts with "On" and ends "wrote:" isn't mistaken for it.
    if (ON_WROTE_START.test(line)) {
      let joined = line;
      for (let k = 0; k < 3 && i + k < lines.length; k++) {
        if (k > 0) joined += " " + lines[i + k];
        if (ON_WROTE_END.test(lines[i + k])) {
          if (/\d/.test(joined) && joined.length <= 400) return i;
          break;
        }
      }
    }
    if (ORIGINAL_MESSAGE.test(line)) return i;
    if (OUTLOOK_FROM.test(line)) {
      for (let k = 1; k <= 4 && i + k < lines.length; k++) {
        if (OUTLOOK_SENT.test(lines[i + k])) {
          // Outlook puts a rule of underscores above the header block.
          return i > 0 && /^\s*_{5,}\s*$/.test(lines[i - 1]) ? i - 1 : i;
        }
      }
    }
  }
  // A run of ">" lines at the very end.
  let end = lines.length - 1;
  while (end >= 0 && lines[end].trim() === "") end--;
  if (end >= 0 && /^\s*>/.test(lines[end])) {
    let start = end;
    while (start > 0 && (/^\s*>/.test(lines[start - 1]) || lines[start - 1].trim() === "")) start--;
    return start;
  }
  return -1;
}

function tidy(s: string): string {
  return s
    // Outlook's plain-text part: inline images as "[cid:…]" and links as
    // "Visit our website<https://…>". The image placeholder says nothing; the
    // link reads better with a space and brackets.
    .replace(/\[cid:[^\]\n]*\]/gi, "")
    .replace(/<((?:https?:\/\/|mailto:)[^<>\s]+)>/gi, (_m, url: string, at: number, all: string) =>
      `${at > 0 && /\S/.test(all[at - 1]) ? " " : ""}(${url.replace(/^mailto:/i, "")})`,
    )
    .replace(/[ \t\u00A0]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
}

function stripTextQuote(text: string): { text: string; cut: boolean } {
  const lines = text.split("\n");
  const at = textQuoteStart(lines);
  if (at < 0) return { text, cut: false };
  return { text: lines.slice(0, at).join("\n"), cut: true };
}

export function messageToDisplayText(body: string | null | undefined): DisplayMessage {
  const raw = String(body ?? "").replace(/\r\n?/g, "\n");
  const html = looksLikeHtml(raw);

  // The whole message, cleaned but with nothing removed — the fallback.
  const full = tidy(html ? htmlToText(raw) : raw);

  let reply = raw;
  let cut = false;
  if (html) {
    const m = HTML_QUOTE_START.exec(raw);
    if (m) {
      reply = raw.slice(0, m.index);
      cut = true;
    }
    reply = htmlToText(reply);
  }
  const textCut = stripTextQuote(reply);
  reply = tidy(textCut.text);
  cut = cut || textCut.cut;

  // Never show nothing: a message that is only a quote (a bare forward, an
  // empty reply) falls back to everything.
  if (!cut || reply === "") return { text: full, hadQuote: false };
  return { text: reply, hadQuote: reply !== full };
}

/** The stored body with only newline style normalised, for "Show original". */
export function originalForDisplay(body: string | null | undefined): string {
  return String(body ?? "").replace(/\r\n?/g, "\n");
}
