import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("renders required SaaS dashboard regions", () => {
  for (const text of ["Active Agents", "Blocked Tasks", "Gate Failures", "Confidence", "Agent Activity", "Governance Gates", "Rollout Evidence"]) {
    assert.match(html, new RegExp(text));
  }
});

test("includes responsive and accessible UI basics", () => {
  assert.match(html, /@media/);
  assert.match(html, /aria-label/);
  assert.match(html, /:focus-visible/);
});
