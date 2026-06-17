import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const replay = resolve("tools/agent-replay.js");

test("agent replay scenarios all pass", () => {
  const result = spawnSync(process.execPath, [replay, "--json", "--min-pass-rate", "1"], {
    cwd: resolve("."),
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const json = JSON.parse(result.stdout);
  assert.equal(json.failed, 0);
  assert.equal(json.pass_rate, 1);
  assert.ok(json.scenarios.length >= 8);
});

test("agent replay fails when pass rate threshold is unreachable", () => {
  const result = spawnSync(process.execPath, [replay, "--min-pass-rate", "1.01"], {
    cwd: resolve("."),
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Agent replay FAILED/);
});
