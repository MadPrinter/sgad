import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("renders governed SaaS dashboard regions", () => {
  for (const text of ["Active Agents", "Blocked Tasks", "Gate Failures", "Confidence", "Agent Activity", "Governance Gates", "Rollout Evidence"]) {
    assert.ok(html.includes(text));
  }
});

test("implements design governance UI evidence hooks", () => {
  assert.ok(html.includes("R2-UI"));
  assert.ok(html.includes("DESIGN.md"));
  assert.ok(html.includes("screenshots attached"));
  assert.ok(html.includes("aria-label"));
  assert.ok(html.includes(":focus-visible"));
  assert.ok(html.includes("@media"));
});
