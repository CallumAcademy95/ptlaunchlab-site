/**
 * Point both Career Change ad sets at the custom conversion that actually
 * fires, and archive the one that never did.
 *
 *   node scripts/career-change-fix-conversion.mjs [--token EAA...]
 *
 * Background (2026-09-06): the original "Career Planner Lead" conversion
 * (1820186202748369) was created with rule keys `event.event_name` and
 * `event.content_name`. Meta accepted them and never matched an event, so the
 * ad sets optimised on a conversion with zero history while the generic Lead
 * was being attributed fine. Rules are immutable (POST returns success and
 * changes nothing), so a replacement was created with the account's proven
 * shape -- `{"event":{"eq":"Lead"}}` plus `{"url":{"i_contains":...}}`.
 *
 * Repointing promoted_object restarts the learning phase; both sets were at
 * zero conversions anyway.
 */
import { readFileSync } from 'node:fs';

const OLD = '1820186202748369';
const NEW = '1385682013072444';
const ADSETS = ['52568821959318', '52568821984118'];
const V = 'v21.0';

const fromEnv = (k) => {
  try {
    const l = readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split(/\r?\n/).find((x) => x.startsWith(k + '='));
    return l ? l.slice(k.length + 1).replace(/^["']|["']$/g, '').trim() : '';
  } catch { return ''; }
};
const tokArg = process.argv.indexOf('--token');
const TOKEN = (tokArg > -1 && process.argv[tokArg + 1]) || process.env.META_SYSTEM_USER_TOKEN || fromEnv('META_SYSTEM_USER_TOKEN');
if (!TOKEN) { console.error('no META_SYSTEM_USER_TOKEN'); process.exit(1); }

const graph = async (path, params = {}, method = 'GET') => {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const u = `https://graph.facebook.com/${V}/${path}`;
  const res = method === 'GET' ? await fetch(`${u}?${body}`) : await fetch(u, { method, body });
  const j = await res.json();
  if (j.error) throw new Error(`${path}: ${j.error.error_user_title || ''} ${j.error.error_user_msg || j.error.message}`);
  return j;
};

const cc = await graph(NEW, { fields: 'name,rule' });
console.log(`\nTarget: ${cc.name}  ${cc.rule}\n`);

for (const id of ADSETS) {
  await graph(id, { promoted_object: JSON.stringify({ custom_conversion_id: NEW }) }, 'POST');
  const s = await graph(id, { fields: 'name,promoted_object,effective_status,learning_stage_info' });
  const ok = s.promoted_object?.custom_conversion_id === NEW;
  console.log(`  ${ok ? 'ok ' : 'NO '} ${s.name.slice(0, 40).padEnd(40)} ${s.effective_status}  learning=${s.learning_stage_info?.status}`);
  if (!ok) { console.error('promoted_object did not take — stopping.'); process.exit(1); }
}

await graph(OLD, {}, 'DELETE'); // archives, does not destroy
const old = await graph(OLD, { fields: 'name,is_archived' });
console.log(`\n  archived: ${old.name} (${old.is_archived})\n`);
console.log('Done. Both ad sets now optimise on the conversion that fires.\n');
