// Publishes Google Business Profile posts via the Make webhook.
//
//   node --use-system-ca scripts/gbp-post.mjs scripts/gbp-posts.json --dry-run
//   node --use-system-ca scripts/gbp-post.mjs scripts/gbp-posts.json
//
// --use-system-ca is required on Callum's machine (SSL inspection breaks node fetch).
//
// Reads GBP_MAKE_WEBHOOK_URL from the environment or .env.gbp.local.
// Every cta_url and image_url is checked for HTTP 200 before anything is sent,
// because Google will happily publish a post whose button points at a 404.

import { readFileSync, existsSync } from 'node:fs'

const WEBHOOK = loadWebhook()
const [, , postsPath, ...flags] = process.argv
const dryRun = flags.includes('--dry-run')

const CTA_TYPES = ['BOOK', 'ORDER', 'SHOP', 'LEARN_MORE', 'SIGN_UP', 'CALL']
const SUMMARY_MAX = 1500

function loadWebhook() {
  if (process.env.GBP_MAKE_WEBHOOK_URL) return process.env.GBP_MAKE_WEBHOOK_URL
  const envFile = new URL('../.env.gbp.local', import.meta.url)
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('GBP_MAKE_WEBHOOK_URL='))
    if (line) return line.slice('GBP_MAKE_WEBHOOK_URL='.length).trim()
  }
  console.error('Missing GBP_MAKE_WEBHOOK_URL (env or .env.gbp.local)')
  process.exit(1)
}

async function check(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    return { ok: res.ok, status: res.status, type: res.headers.get('content-type') ?? '' }
  } catch (err) {
    return { ok: false, status: 0, type: '', error: err.message }
  }
}

async function validate(post, i) {
  const problems = []
  for (const field of ['title', 'summary', 'image_url', 'cta_type', 'cta_url']) {
    if (!post[field]) problems.push(`missing ${field}`)
  }
  if (post.summary && post.summary.length > SUMMARY_MAX) {
    problems.push(`summary ${post.summary.length} chars, max ${SUMMARY_MAX}`)
  }
  if (post.cta_type && !CTA_TYPES.includes(post.cta_type)) {
    problems.push(`cta_type "${post.cta_type}" not one of ${CTA_TYPES.join(', ')}`)
  }

  if (post.cta_url) {
    const r = await check(post.cta_url)
    if (!r.ok) problems.push(`cta_url HTTP ${r.status}${r.error ? ` (${r.error})` : ''}`)
  }
  if (post.image_url) {
    const r = await check(post.image_url)
    if (!r.ok) problems.push(`image_url HTTP ${r.status}${r.error ? ` (${r.error})` : ''}`)
    else if (!r.type.startsWith('image/')) problems.push(`image_url is ${r.type}, not an image`)
  }

  return { index: i, title: post.title, problems }
}

async function main() {
  if (!postsPath) {
    console.error('Usage: node --use-system-ca scripts/gbp-post.mjs <posts.json> [--dry-run]')
    process.exit(1)
  }

  const posts = JSON.parse(readFileSync(postsPath, 'utf8'))
  const results = await Promise.all(posts.map(validate))
  const bad = results.filter((r) => r.problems.length)

  for (const r of results) {
    const status = r.problems.length ? `FAIL — ${r.problems.join('; ')}` : 'ok'
    console.log(`[${r.index + 1}] ${r.title} — ${status}`)
  }

  if (bad.length) {
    console.error(`\n${bad.length} post(s) failed validation. Nothing sent.`)
    process.exit(1)
  }

  if (dryRun) {
    console.log(`\nDry run — ${posts.length} post(s) valid, nothing sent.`)
    return
  }

  for (const [i, post] of posts.entries()) {
    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    })
    console.log(`[${i + 1}] ${post.title} — sent, HTTP ${res.status} ${await res.text()}`)
    // Make runs the scenario per request; space them so runs don't overlap.
    if (i < posts.length - 1) await new Promise((r) => setTimeout(r, 3000))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
