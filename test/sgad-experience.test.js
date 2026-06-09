import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const cli = resolve("bin/sgad.js");

function makeProject(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sgad-experience-"));
  for (const [file, body] of Object.entries(files)) write(dir, file, body);
  return dir;
}

function write(root, file, body) {
  const target = join(root, file);
  mkdirSync(join(target, ".."), { recursive: true });
  writeFileSync(target, body, "utf8");
}

function runExperience(cwd, args) {
  const result = spawnSync(process.execPath, [cli, "experience", ...args, "--json"], {
    cwd,
    encoding: "utf8"
  });
  return {
    ...result,
    json: JSON.parse(result.stdout)
  };
}

function runCli(cwd, args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8"
  });
}

test("init with experience scaffolds project experience files", () => {
  const dir = makeProject();
  const result = runCli(dir, ["init", "--with-experience"]);
  assert.equal(result.status, 0);

  const audit = runExperience(dir, ["audit"]);
  assert.equal(audit.status, 0);
  assert.equal(audit.json.passed, true);
});

test("template adds candidate to review queue without activating recall", () => {
  const dir = makeProject();
  const result = runExperience(dir, [
    "template",
    "--title",
    "Retry flaky CLI checks",
    "--change",
    "agent-experience-layer",
    "--files",
    "bin/sgad.js",
    "--task-type",
    "cli-check"
  ]);
  assert.equal(result.status, 0);
  assert.equal(result.json.created, true);
  assert.equal(result.json.status, "candidate");

  const queuePath = join(dir, "sgad/experience/review-queue.md");
  assert.equal(existsSync(queuePath), true);
  const queue = readFileSync(queuePath, "utf8");
  assert.match(queue, /Retry flaky CLI checks/);
  assert.match(queue, /status: candidate/);

  const recall = runExperience(dir, ["recall", "--query", "flaky cli checks", "--files", "bin/sgad.js"]);
  assert.equal(recall.status, 0);
  assert.equal(recall.json.matched, false);
});

test("recall returns bounded active scoped lessons", () => {
  const dir = makeProject({
    "test/example.test.js": "import test from 'node:test';\n",
    "sgad/experience/lessons.yaml": `lessons:
  - id: LESSON-001
    title: Evidence gates validate closure
    scope:
      files: [bin/sgad.js]
      task_types: [cli-check]
    triggers:
      keywords: [evidence, waiver]
    advice: Validate evidence closure.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-09
  - id: LESSON-002
    title: Ignored candidate
    scope:
      files: [bin/sgad.js]
    triggers:
      keywords: [evidence]
    advice: Candidate lessons are not recalled.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: candidate
    last_validated: 2026-06-09
`
  });

  const result = runExperience(dir, ["recall", "--query", "evidence waiver", "--files", "bin/sgad.js", "--limit", "3"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.matched, true);
  assert.equal(result.json.lessons.length, 1);
  assert.equal(result.json.lessons[0].id, "LESSON-001");
});

test("recall stays empty when no active scoped lesson matches", () => {
  const dir = makeProject({
    "test/example.test.js": "import test from 'node:test';\n",
    "sgad/experience/lessons.yaml": `lessons:
  - id: LESSON-001
    title: Evidence gates validate closure
    scope:
      files: [bin/sgad.js]
    triggers:
      keywords: [evidence]
    advice: Validate evidence closure.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-09
`
  });

  const result = runExperience(dir, ["recall", "--query", "frontend layout", "--files", "src/app.css"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.matched, false);
  assert.deepEqual(result.json.lessons, []);
});

test("audit fails active lessons without scope or evidence", () => {
  const dir = makeProject({
    "sgad/experience/lessons.yaml": `lessons:
  - id: LESSON-001
    title: Bad active lesson
    triggers:
      keywords: [evidence]
    advice: Missing required active recall controls.
    confidence: high
    status: active
    last_validated: 2026-06-09
`
  });

  const result = runExperience(dir, ["audit"]);
  assert.equal(result.status, 1);
  assert.equal(result.json.passed, false);
  assert.ok(result.json.issues.some((issue) => issue.code === "EXPERIENCE_SCOPE_MISSING"));
  assert.ok(result.json.issues.some((issue) => issue.code === "EXPERIENCE_EVIDENCE_MISSING"));
});

test("audit fails lessons missing required fields", () => {
  const dir = makeProject({
    "sgad/experience/lessons.yaml": `lessons:
  - id: LESSON-001
    title: Missing required fields
    scope:
      files: [bin/sgad.js]
    advice: Missing trigger, confidence, and validation metadata.
    evidence:
      tests: [test/example.test.js]
    status: active
`
  });

  const result = runExperience(dir, ["audit"]);
  assert.equal(result.status, 1);
  assert.equal(result.json.passed, false);
  assert.ok(result.json.issues.some((issue) => issue.code === "EXPERIENCE_REQUIRED_FIELD_MISSING"));
  assert.ok(result.json.issues.some((issue) => issue.code === "EXPERIENCE_CONFIDENCE_INVALID"));
  assert.ok(result.json.issues.some((issue) => issue.code === "EXPERIENCE_TRIGGER_MISSING"));
});

test("audit passes active lessons with scope and evidence", () => {
  const dir = makeProject({
    "test/example.test.js": "import test from 'node:test';\n",
    "sgad/experience/lessons.yaml": `lessons:
  - id: LESSON-001
    title: Good active lesson
    scope:
      files: [bin/sgad.js]
    triggers:
      keywords: [evidence]
    advice: Validate evidence closure.
    evidence:
      tests: [test/example.test.js]
    confidence: high
    status: active
    last_validated: 2026-06-09
`
  });

  const result = runExperience(dir, ["audit"]);
  assert.equal(result.status, 0);
  assert.equal(result.json.passed, true);
  assert.deepEqual(result.json.issues, []);
});
