import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const variant = process.argv[2];
if (!variant) {
  console.error("Usage: node tools/evaluate-saas-variant.js <variant-dir>");
  process.exit(2);
}

function file(path) {
  return join(variant, path);
}

function has(path) {
  return existsSync(file(path));
}

function read(path) {
  return has(path) ? readFileSync(file(path), "utf8") : "";
}

function allSourceText() {
  const roots = ["public", "test", "openspec", "workflow", "sgad", "design"];
  const chunks = [];
  function walk(dir) {
    const full = file(dir);
    if (!existsSync(full)) return;
    for (const item of readdirSync(full)) {
      const rel = `${dir}/${item}`;
      const abs = file(rel);
      if (statSync(abs).isDirectory()) walk(rel);
      else if (/\.(js|html|md|yaml|json|css)$/.test(item)) chunks.push(readFileSync(abs, "utf8"));
    }
  }
  for (const root of roots) walk(root);
  return chunks.join("\n");
}

function run(args) {
  return spawnSync(args[0], args.slice(1), { cwd: variant, encoding: "utf8" });
}

const html = read("public/index.html");
const source = allSourceText();
const test = run(["node", "--test"]);
const checks = [];
function check(name, pass, points) {
  checks.push({ name, pass: Boolean(pass), points, earned: pass ? points : 0 });
}

check("tests pass", test.status === 0, 20);
check("SaaS app shell", /<aside|class="sidebar"|class='sidebar'/.test(html) && /<main/.test(html), 8);
check("operational KPIs", ["Active Agents", "Blocked Tasks", "Gate Failures", "Confidence"].every((x) => html.includes(x)), 10);
check("agent activity table", html.includes("<table") && html.includes("Agent") && html.includes("Status"), 8);
check("governance gates represented", html.includes("Governance Gates") && html.includes("Evidence") && html.includes("Rollout"), 10);
check("responsive CSS", html.includes("@media") && html.includes("minmax") && html.includes("clamp("), 10);
check("accessibility basics", html.includes("aria-label") && html.includes(":focus-visible") && html.includes("<button"), 8);
check("visual system tokens", html.includes(":root") && html.includes("--") && html.includes("border-radius"), 8);
check("polished SaaS UI density", html.includes("grid-template-columns") && html.includes("box-shadow") && html.includes("linear-gradient"), 8);
check("OpenSpec docs", has("openspec/changes/agentops-saas-page/proposal.md") && has("openspec/changes/agentops-saas-page/spec.md") && has("openspec/changes/agentops-saas-page/tasks.md"), 5);
check("Superpowers docs", has("workflow/tdd-plan.md") && has("workflow/review-checklist.md") && has("workflow/verification.md"), 5);
check("SGAD design governance", has("design/DESIGN.md") && has("sgad/design-review.md") && has("sgad/evidence-matrix.md") && source.includes("R2-UI"), 10);

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
