import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const cli = resolve("bin/sgad.js");

function makeProject(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sgad-check-"));
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

test("R2 evidence pending without waiver fails", () => {
  const dir = makeProject({
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence |
|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | pending | R2 | pending |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 1);
  assert.equal(result.json.passed, false);
  assert.ok(result.json.issues.some((issue) => issue.code === "EVIDENCE_PENDING"));
  assert.ok(result.json.issues.some((issue) => issue.code === "EVIDENCE_PENDING_LIMIT"));
});

test("R2 evidence path that exists passes", () => {
  const dir = makeProject({
    "test/example.test.js": "import test from 'node:test';\n",
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence |
|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | test/example.test.js | R2 | test/example.test.js |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.passed, true);
  assert.deepEqual(result.json.issues, []);
});

test("R2 pending evidence with valid waiver passes with warning", () => {
  const dir = makeProject({
    "sgad/waivers.yaml": `waivers:
  - requirement: REQ-001
    reason: "UAT schedule is outside this change window"
    expires: 2999-01-01
    approved_by: human
    evidence_partial: test/example.test.js
`,
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence |
|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | pending | R2 | pending |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 0);
  assert.equal(result.json.passed, true);
  assert.ok(result.json.warnings.some((warning) => warning.code === "EVIDENCE_WAIVED"));
});

test("R2 evidence path that does not exist fails", () => {
  const dir = makeProject({
    "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence |
|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | tests/missing.test.js | R2 | tests/missing.test.js |
`
  });

  const result = runCheck(dir);
  assert.equal(result.status, 1);
  assert.equal(result.json.passed, false);
  assert.ok(result.json.issues.some((issue) => issue.code === "EVIDENCE_PATH_MISSING"));
});
