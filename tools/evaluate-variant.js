import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const variant = process.argv[2];
if (!variant) {
  console.error("Usage: node tools/evaluate-variant.js <variant-dir>");
  process.exit(2);
}

function file(path) {
  return join(variant, path);
}

function has(path) {
  return existsSync(file(path));
}

function contains(path, patterns) {
  if (!has(path)) return false;
  const text = readFileSync(file(path), "utf8");
  return patterns.every((pattern) => text.includes(pattern));
}

function allSourceText() {
  const roots = ["src", "public", "test"];
  const chunks = [];
  function walk(dir) {
    const full = file(dir);
    if (!existsSync(full)) return;
    for (const item of readdirSync(full)) {
      const rel = `${dir}/${item}`;
      const abs = file(rel);
      if (statSync(abs).isDirectory()) walk(rel);
      else if (/\.(js|html|md|yaml|json)$/.test(item)) chunks.push(readFileSync(abs, "utf8"));
    }
  }
  for (const root of roots) walk(root);
  return chunks.join("\n");
}

function run(args) {
  return spawnSync(args[0], args.slice(1), { cwd: variant, encoding: "utf8" });
}

const checks = [];
function check(name, pass, points) {
  checks.push({ name, pass: Boolean(pass), points, earned: pass ? points : 0 });
}

const test = run(["node", "--test"]);
const source = allSourceText();
check("tests pass", test.status === 0, 25);
check("server exports createServer", source.includes("createServer"), 3);
check("incident API implemented", source.includes("/api/incidents") && source.includes("PATCH") && source.includes("POST"), 8);
check("tenant isolation implemented", source.includes("x-tenant-id") && source.includes("tenantId"), 8);
check("RBAC implemented", source.includes("x-role") && source.includes("viewer") && source.includes("FORBIDDEN"), 8);
check("audit log implemented", source.includes("audit") && source.includes("/api/audit-log"), 8);
check("SLA reminder job implemented", source.includes("sla-reminders") && source.includes("notifier") && source.includes("reminder"), 8);
check("frontend implemented", contains("public/index.html", ["Incident", "form", "Audit"]), 5);
check("migration or data model documented", has("docs/migration.md") || has("sgad/rollout.md") || has("openspec/changes/incident-response-center/design.md"), 5);
check("OpenSpec docs", has("openspec/changes/incident-response-center/proposal.md") && has("openspec/changes/incident-response-center/spec.md") && has("openspec/changes/incident-response-center/tasks.md"), 5);
check("Superpowers docs", has("workflow/tdd-plan.md") && has("workflow/review-checklist.md") && has("workflow/verification.md"), 5);
check("SGAD governance docs", has("sgad/evidence-matrix.md") && has("sgad/risk-register.md") && has("sgad/policies/quality-gates.yaml"), 12);

const total = checks.reduce((sum, item) => sum + item.points, 0);
const earned = checks.reduce((sum, item) => sum + item.earned, 0);

console.log(JSON.stringify({
  variant,
  score: earned,
  total,
  percent: Math.round((earned / total) * 100),
  tests: {
    status: test.status,
    stdout: test.stdout,
    stderr: test.stderr,
  },
  checks,
}, null, 2));
