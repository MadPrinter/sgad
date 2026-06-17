import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(process.cwd());
const cli = join(root, "bin/sgad.js");
const scenariosPath = join(root, "tools/agent-replay-scenarios.json");
const sopFixtureRoot = join(root, "test/fixtures/sop-3-governance");
const frameworkLessons = readFileSync(join(root, "sgad/experience/lessons.yaml"), "utf8");
const frameworkIndex = readFileSync(join(root, "sgad/experience/INDEX.md"), "utf8");

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return null;
  return process.argv[index + 1];
}

const minPassRate = optionValue("--min-pass-rate") == null ? 1 : Number(optionValue("--min-pass-rate"));
const jsonOutput = process.argv.includes("--json");

function readFixture(name) {
  return readFileSync(join(sopFixtureRoot, name), "utf8");
}

function writeProject(dir, file, body) {
  const target = join(dir, file);
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, body, "utf8");
}

function baseGovernance() {
  return `version: 0.3.0
risk_class: R2
evidence:
  allow_pending: false
  pending_max: 0
  require_evidence_paths: true
`;
}

function baseRiskRegister() {
  return `# Risk Register

| Risk | Class | Mitigation | Owner | Status |
|---|---|---|---|---|
| Evidence drift | R2 | Enforce check closure | AI | mitigated |
`;
}

function scaffoldProject(extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sgad-replay-"));
  writeProject(dir, "sgad/governance.yaml", extra.governance ?? baseGovernance());
  writeProject(dir, "sgad/risk-register.md", extra.riskRegister ?? baseRiskRegister());
  mkdirSync(join(dir, "openspec/changes/example"), { recursive: true });
  for (const [file, body] of Object.entries(extra.files ?? {})) writeProject(dir, file, body);
  return dir;
}

function runCli(cwd, args) {
  const result = spawnSync(process.execPath, [cli, ...args, "--json"], {
    cwd,
    encoding: "utf8"
  });
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    json = null;
  }
  return { ...result, json };
}

function runCheckPendingFail() {
  const dir = scaffoldProject({
    files: {
      "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence | Status |
|---|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | test/a.test.js | R2 | pending | pending |
`
    }
  });
  const result = runCli(dir, ["check"]);
  return {
    passed: result.status !== 0 && result.json?.passed === false
      && result.json.issues.some((issue) => issue.code === "EVIDENCE_PENDING"),
    detail: result.json
  };
}

function runCheckClosurePass() {
  const dir = scaffoldProject({
    files: {
      "test/closure.test.js": "import test from 'node:test';\n",
      "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence | Status |
|---|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | test/closure.test.js | R2 | test/closure.test.js | verified |
`
    }
  });
  const result = runCli(dir, ["check"]);
  return { passed: result.status === 0 && result.json?.passed === true, detail: result.json };
}

function runRecallFramework(scenario) {
  const dir = scaffoldProject({
    files: {
      "sgad/experience/lessons.yaml": frameworkLessons,
      "sgad/experience/INDEX.md": frameworkIndex,
      "test/example.test.js": "import test from 'node:test';\n"
    }
  });
  const args = ["experience", "recall", "--query", scenario.query];
  if (scenario.files?.length) args.push("--files", scenario.files.join(","));
  if (scenario.tags?.length) args.push("--tags", scenario.tags.join(","));
  const result = runCli(dir, args);
  const lessonIds = (result.json?.lessons ?? []).map((lesson) => lesson.id);
  const matched = Boolean(result.json?.matched);
  let passed = matched === scenario.expect.matched;
  if (scenario.expect.lessonIds) {
    passed = passed && scenario.expect.lessonIds.every((id) => lessonIds.includes(id));
    if (scenario.expect.matched === false) passed = passed && lessonIds.length === 0;
  }
  return { passed, detail: { matched, lessonIds, raw: result.json } };
}

function runSopFixture(scenario) {
  const governance = scenario.fixture === "strict"
    ? readFixture("governance-strict.yaml")
    : readFixture("governance-relaxed.yaml");
  const dir = scaffoldProject({
    governance,
    riskRegister: readFixture("risk-register.md"),
    files: {
      "sgad/evidence-matrix.md": readFixture("evidence-matrix-mixed.md"),
      "test/fixtures/sop-3-governance/sample-evidence.txt": readFixture("sample-evidence.txt")
    }
  });
  const result = runCli(dir, ["check"]);
  const expectPass = scenario.expect.passed;
  const issueCodes = result.json?.issues?.map((issue) => issue.code) ?? [];
  const passed = expectPass
    ? result.status === 0 && result.json?.passed === true
    : result.status !== 0
      && result.json?.passed === false
      && scenario.expect.issueCodes.every((code) => issueCodes.includes(code));
  return { passed, detail: result.json };
}

function runAuditIndexStale() {
  const dir = scaffoldProject({
    files: {
      "test/example.test.js": "import test from 'node:test';\n",
      "sgad/experience/lessons.yaml": `lessons:
  - id: LESSON-099
    title: Missing from index
    scope:
      files: [bin/sgad.js]
    triggers:
      keywords: [evidence]
    advice: Validate closure.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-17
`,
      "sgad/experience/INDEX.md": "# Experience Index\n\n| ID | Status |\n|---|---|\n| LESSON-001 | active |\n"
    }
  });
  const result = runCli(dir, ["experience", "audit"]);
  const issueCodes = result.json?.issues?.map((issue) => issue.code) ?? [];
  return {
    passed: result.status !== 0
      && result.json?.passed === false
      && issueCodes.includes("EXPERIENCE_INDEX_STALE"),
    detail: result.json
  };
}

function runScenario(scenario) {
  switch (scenario.id) {
    case "CHECK-PENDING-FAIL":
      return runCheckPendingFail();
    case "CHECK-CLOSURE-PASS":
      return runCheckClosurePass();
    case "RECALL-EVIDENCE-HIT":
    case "RECALL-TAG-NOISE":
    case "RECALL-PREFLIGHT-HIT":
      return runRecallFramework(scenario);
    case "SOP-STRICT-FAIL":
    case "SOP-RELAXED-PASS":
      return runSopFixture(scenario);
    case "AUDIT-INDEX-SYNC":
      return runAuditIndexStale();
    default:
      return { passed: false, detail: { error: `Unknown scenario ${scenario.id}` } };
  }
}

const scenarios = JSON.parse(readFileSync(scenariosPath, "utf8")).scenarios;
const results = scenarios.map((scenario) => {
  const outcome = runScenario(scenario);
  return {
    id: scenario.id,
    category: scenario.category,
    intent: scenario.intent,
    passed: outcome.passed,
    detail: outcome.detail
  };
});

const passedCount = results.filter((item) => item.passed).length;
const passRate = results.length ? passedCount / results.length : 0;
const report = {
  version: 1,
  total: results.length,
  passed: passedCount,
  failed: results.length - passedCount,
  pass_rate: passRate,
  scenarios: results
};

if (jsonOutput) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Agent replay: ${passedCount}/${results.length} passed (${Math.round(passRate * 100)}%)`);
  for (const item of results) {
    console.log(`${item.passed ? "ok" : "FAIL"} ${item.id} — ${item.intent}`);
  }
}

if (passRate < minPassRate) {
  console.error(`Agent replay FAILED: pass rate ${passRate} below minimum ${minPassRate}`);
  process.exit(1);
}

if (!jsonOutput && passRate >= minPassRate) {
  console.error(`Agent replay passed: ${passedCount}/${results.length}`);
}
