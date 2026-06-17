import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function has(path) {
  return existsSync(join(root, path));
}

function contains(path, patterns) {
  if (!has(path)) return false;
  const text = readFileSync(join(root, path), "utf8");
  return patterns.every((pattern) => text.includes(pattern));
}

function countActiveLessons() {
  const yamlPath = join(root, "sgad/experience/lessons.yaml");
  if (!has("sgad/experience/lessons.yaml")) return 0;
  const text = readFileSync(yamlPath, "utf8");
  return (text.match(/status:\s*active/gi) ?? []).length;
}

function activeLessonIds() {
  const yamlPath = join(root, "sgad/experience/lessons.yaml");
  if (!has("sgad/experience/lessons.yaml")) return [];
  const yaml = readFileSync(yamlPath, "utf8");
  const ids = [...yaml.matchAll(/-\s+id:\s+(\S+)/g)].map((match) => match[1]);
  return ids.filter((id) => new RegExp(`-\\s+id:\\s+${id}[\\s\\S]*?status:\\s*active`, "i").test(yaml));
}

function indexCoversActiveLessons() {
  if (!has("sgad/experience/INDEX.md") || !has("sgad/experience/lessons.yaml")) return false;
  const index = readFileSync(join(root, "sgad/experience/INDEX.md"), "utf8");
  const activeIds = activeLessonIds();
  return activeIds.length >= 3 && activeIds.every((id) => index.includes(id));
}

function run(args, cwd = root) {
  return spawnSync(args[0], args.slice(1), { cwd, encoding: "utf8" });
}

const checks = [];
function check(name, pass, points) {
  checks.push({ name, pass: Boolean(pass), points, earned: pass ? points : 0 });
}

const unitTestFiles = [
  "test/sgad-check.test.js",
  "test/sgad-experience.test.js",
  "test/sgad-ci.test.js",
  "test/agent-replay.test.js"
];
const sgadCheck = run(["node", "bin/sgad.js", "check", "--json"]);
const experienceAudit = run(["node", "bin/sgad.js", "experience", "audit", "--json"]);
const packageJson = has("package.json") ? JSON.parse(readFileSync(join(root, "package.json"), "utf8")) : {};
const checkScript = String(packageJson.scripts?.check ?? "");

check("agent replay harness present", has("tools/agent-replay.js") && has("tools/agent-replay-scenarios.json"), 5);
check("check script runs agent replay", checkScript.includes("agent-replay.js"), 4);
check("framework unit test files present", unitTestFiles.every((file) => has(file)), 8);
check("SOP-3 governance fixture present", has("test/fixtures/sop-3-governance/governance-strict.yaml")
  && has("test/fixtures/sop-3-governance/evidence-matrix-mixed.md"), 5);
check("sgad check passes on framework repo", sgadCheck.status === 0, 12);
check("experience audit passes", experienceAudit.status === 0, 12);
check("governance anti-patterns doc", has("sgad/policies/governance-anti-patterns.md"), 8);
check("experience INDEX covers active lessons", indexCoversActiveLessons(), 10);
check("at least three active lessons", countActiveLessons() >= 3, 10);
check("rollout preflight template", has("sgad/templates/rollout-preflight.md"), 8);
check("ci-experience openspec change", has("openspec/changes/enhance-ci-experience-from-sop/proposal.md")
  && has("openspec/changes/enhance-ci-experience-from-sop/test-plan.md"), 7);
check("check script runs tests", checkScript.includes("npm test"), 5);
check("check script runs experience audit", checkScript.includes("experience audit"), 5);
check("check script runs framework benchmark gate", checkScript.includes("--min-framework-score"), 6);

const total = checks.reduce((sum, item) => sum + item.points, 0);
const earned = checks.reduce((sum, item) => sum + item.earned, 0);

console.log(JSON.stringify({
  variant: "framework",
  score: earned,
  total,
  percent: Math.round((earned / total) * 100),
  checks,
}, null, 2));
