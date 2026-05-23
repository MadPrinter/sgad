import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const variants = ["openspec", "superpowers", "sgad"];
const results = [];

for (const name of variants) {
  const dir = `variants/${name}`;
  const result = spawnSync("node", ["tools/evaluate-variant.js", dir], {
    encoding: "utf8",
    cwd: process.cwd(),
  });
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = { variant: dir, error: result.stderr || result.stdout };
  }
  results.push(parsed);
}

writeFileSync("RESULTS.json", JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results.map((item) => ({
  variant: item.variant,
  score: item.score,
  total: item.total,
  percent: item.percent,
})), null, 2));
