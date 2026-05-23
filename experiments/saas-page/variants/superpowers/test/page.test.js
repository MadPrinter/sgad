import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("covers planned dashboard behavior", () => {
  for (const text of ["Active Agents", "Blocked Tasks", "Gate Failures", "Confidence", "Agent Activity", "Governance Gates", "Rollout Evidence"]) {
    assert.ok(html.includes(text));
  }
});

test("has execution-quality UI safeguards", () => {
  assert.ok(html.includes("@media"));
  assert.ok(html.includes("aria-label"));
  assert.ok(html.includes(":focus-visible"));
  assert.ok(html.includes("grid-template-columns"));
});
