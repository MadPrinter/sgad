import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const cli = resolve("bin/sgad.js");
const evaluateAll = resolve("tools/evaluate-all.js");
const fixtureRoot = resolve("test/fixtures/sop-3-governance");

function readFixture(name) {
  return readFileSync(join(fixtureRoot, name), "utf8");
}

function makeProject(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sgad-ci-"));
  write(dir, "sgad/governance.yaml", `version: 0.3.0
risk_class: R2
evidence:
  allow_pending: false
  pending_max: 0
  require_evidence_paths: true
`);
  write(dir, "sgad/risk-register.md", `# Risk Register

| Risk | Class | Mitigation | Owner | Status |
|---|---|---|---|---|
| Evidence drift | R2 | Enforce check closure | AI | mitigated |
`);
  mkdirSync(join(dir, "openspec/changes/example"), { recursive: true });
  for (const [file, body] of Object.entries(files)) write(dir, file, body);
  return dir;
}

function write(root, file, body) {
  const target = join(root, file);
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, body, "utf8");
}

function runCheck(cwd) {
  const result = spawnSync(process.execPath, [cli, "check", "--json"], {
    cwd,
    encoding: "utf8"
  });
  return {
    ...result,
    json: JSON.parse(result.stdout)
  };
}

test("typed evidence fixture path passes when target exists", () => {
  const dir = makeProject({
    "tests/fixtures/sample.txt": "ok\n",
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence | Status |
|---|---|---|---|---|---|---|
| REQ-FIX-001 | design.md | tasks.md | test/sgad-ci.test.js | R2 | fixture:tests/fixtures/sample.txt | verified |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.passed, true);
});

test("typed evidence fixture path fails when target is missing", () => {
  const dir = makeProject({
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence | Status |
|---|---|---|---|---|---|---|
| REQ-FIX-001 | design.md | tasks.md | test/sgad-ci.test.js | R2 | fixture:tests/fixtures/missing.txt | verified |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 1);
  assert.equal(result.json.passed, false);
  assert.ok(result.json.issues.some((issue) => issue.code === "EVIDENCE_PATH_MISSING"));
});

test("experience index lists lessons and supports tag-filtered recall", () => {
  const dir = mkdtempSync(join(tmpdir(), "sgad-ci-index-"));
  write(dir, "test/example.test.js", "import test from 'node:test';\n");
  write(dir, "sgad/experience/lessons.yaml", `lessons:
  - id: LESSON-010
    title: Rollout lesson
    scope:
      files: [sgad/templates/rollout-preflight.md]
      task_types: [rollout]
    triggers:
      keywords: [preflight]
    tags: [rollout, batch]
    advice: Run preflight once.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-17
  - id: LESSON-011
    title: Other lesson
    scope:
      files: [bin/sgad.js]
    triggers:
      keywords: [evidence]
    tags: [governance-gate]
    advice: Validate closure.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-17
`);

  const index = spawnSync(process.execPath, [cli, "experience", "index", "--json"], {
    cwd: dir,
    encoding: "utf8"
  });
  assert.equal(index.status, 0);
  const indexJson = JSON.parse(index.stdout);
  assert.equal(indexJson.count, 2);

  const recall = spawnSync(process.execPath, [cli, "experience", "recall", "--query", "preflight", "--tags", "rollout", "--files", "sgad/templates/rollout-preflight.md", "--json"], {
    cwd: dir,
    encoding: "utf8"
  });
  assert.equal(recall.status, 0);
  const recallJson = JSON.parse(recall.stdout);
  assert.equal(recallJson.matched, true);
  assert.equal(recallJson.lessons.length, 1);
  assert.equal(recallJson.lessons[0].id, "LESSON-010");
});

test("typed evidence benchmark and smoke paths resolve like fixture", () => {
  const dir = makeProject({
    "benchmarks/baseline.json": "{}\n",
    "tests/smoke/sample.txt": "ok\n",
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence | Status |
|---|---|---|---|---|---|---|
| REQ-BENCH-001 | design.md | tasks.md | test/sgad-ci.test.js | R2 | benchmark:benchmarks/baseline.json | verified |
| REQ-SMOKE-001 | design.md | tasks.md | test/sgad-ci.test.js | R2 | smoke:tests/smoke/sample.txt | verified |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.passed, true);
});

test("SOP-3 strict governance fails on unwaived pending evidence", () => {
  const dir = makeProject({
    "sgad/governance.yaml": readFixture("governance-strict.yaml"),
    "sgad/evidence-matrix.md": readFixture("evidence-matrix-mixed.md"),
    "sgad/risk-register.md": readFixture("risk-register.md"),
    "test/fixtures/sop-3-governance/sample-evidence.txt": readFixture("sample-evidence.txt")
  });

  const result = runCheck(dir);
  assert.equal(result.status, 1);
  assert.ok(result.json.issues.some((issue) => issue.code === "EVIDENCE_PENDING"));
});

test("SOP-3 relaxed governance allows pending rows within budget", () => {
  const dir = makeProject({
    "sgad/governance.yaml": readFixture("governance-relaxed.yaml"),
    "sgad/evidence-matrix.md": readFixture("evidence-matrix-mixed.md"),
    "sgad/risk-register.md": readFixture("risk-register.md"),
    "test/fixtures/sop-3-governance/sample-evidence.txt": readFixture("sample-evidence.txt")
  });

  const result = runCheck(dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.passed, true);
});

test("recall rejects tag-only noise below min-score", () => {
  const dir = mkdtempSync(join(tmpdir(), "sgad-ci-recall-"));
  write(dir, "test/example.test.js", "import test from 'node:test';\n");
  write(dir, "sgad/experience/lessons.yaml", `lessons:
  - id: LESSON-010
    title: Rollout lesson
    scope:
      files: [sgad/templates/rollout-preflight.md]
      task_types: [rollout]
    triggers:
      keywords: [preflight]
    tags: [rollout, batch]
    advice: Run preflight once.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-17
`);

  const recall = spawnSync(process.execPath, [cli, "experience", "recall", "--query", "unrelated frontend css", "--tags", "rollout", "--json"], {
    cwd: dir,
    encoding: "utf8"
  });
  assert.equal(recall.status, 0);
  const recallJson = JSON.parse(recall.stdout);
  assert.equal(recallJson.matched, false);
  assert.deepEqual(recallJson.lessons, []);
});

test("experience audit fails when INDEX is stale", () => {
  const dir = mkdtempSync(join(tmpdir(), "sgad-ci-index-stale-"));
  write(dir, "test/example.test.js", "import test from 'node:test';\n");
  write(dir, "sgad/experience/lessons.yaml", `lessons:
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
`);
  write(dir, "sgad/experience/INDEX.md", "# Experience Index\n\n| ID | Status |\n|---|---|\n| LESSON-001 | active |\n");

  const audit = spawnSync(process.execPath, [cli, "experience", "audit", "--json"], {
    cwd: dir,
    encoding: "utf8"
  });
  assert.equal(audit.status, 1);
  const auditJson = JSON.parse(audit.stdout);
  assert.ok(auditJson.issues.some((issue) => issue.code === "EXPERIENCE_INDEX_STALE"));
});

test("evaluate-all enforces minimum framework score", () => {
  const pass = spawnSync(process.execPath, [evaluateAll, "--min-framework-score", "98"], {
    cwd: resolve("."),
    encoding: "utf8"
  });
  assert.equal(pass.status, 0);

  const fail = spawnSync(process.execPath, [evaluateAll, "--min-framework-score", "106"], {
    cwd: resolve("."),
    encoding: "utf8"
  });
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /Framework gate FAILED/);
});

test("evaluate-all enforces minimum sgad benchmark score", () => {
  const pass = spawnSync(process.execPath, [evaluateAll, "--min-score", "95"], {
    cwd: resolve("."),
    encoding: "utf8"
  });
  assert.equal(pass.status, 0);

  const fail = spawnSync(process.execPath, [evaluateAll, "--min-score", "100"], {
    cwd: resolve("."),
    encoding: "utf8"
  });
  assert.equal(fail.status, 1);
  assert.match(fail.stderr, /Variant benchmark gate FAILED/);
});
