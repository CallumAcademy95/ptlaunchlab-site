// scripts/create-planner-v2-fields.mjs — idempotent: creates any missing text field.
// Run: node --env-file=.env.local --use-system-ca scripts/create-planner-v2-fields.mjs
const NAMES = ["plan_version", "plan_band", "plan_timeframe", "plan_goal", "plan_blocker", "plan_blocker_note",
  "plan_payment", "plan_hours", "plan_training", "plan_why", "plan_town", "plan_consent_at"];
const H = { Authorization: `Bearer ${process.env.MAILERLITE_TOKEN}`, "Content-Type": "application/json", Accept: "application/json" };
const have = new Set();
let url = "https://connect.mailerlite.com/api/fields?limit=100";
while (url) { const j = await (await fetch(url, { headers: H })).json(); for (const f of j.data) have.add(f.key); url = j.links?.next ?? null; }
for (const name of NAMES) {
  if (have.has(name)) { console.log("exists", name); continue; }
  const r = await fetch("https://connect.mailerlite.com/api/fields", { method: "POST", headers: H, body: JSON.stringify({ name, type: "text" }) });
  console.log(r.ok ? "created" : `FAILED ${r.status}`, name);
}
