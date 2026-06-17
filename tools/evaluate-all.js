import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const variants = ["openspec", "superpowers", "sgad"];
const results = [];

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return null;
  return process.argv[index + 1];
}

const minScore = optionValue("--min-score") == null ? null : Number(optionValue("--min-score"));
const minFrameworkScore = optionValue("--min-framework-score") == null
  ? null
  : Number(optionValue("--min-framework-score"));

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

const frameworkResult = spawnSync("node", ["tools/evaluate-framework.js"], {
  encoding: "utf8",
  cwd: process.cwd(),
});
let frameworkParsed;
try {
  frameworkParsed = JSON.parse(frameworkResult.stdout);
} catch {
  frameworkParsed = { variant: "framework", error: frameworkResult.stderr || frameworkResult.stdout };
}
results.push(frameworkParsed);

writeFileSync("RESULTS.json", JSON.stringify(results, null, 2), "utf8");
console.log(JSON.stringify(results.map((item) => ({
  variant: item.variant,
  score: item.score,
  total: item.total,
  percent: item.percent,
})), null, 2));

if (minScore != null && !Number.isNaN(minScore)) {
  const sgad = results.find((item) => item.variant === "variants/sgad");
  const score = sgad?.score ?? 0;
  if (score < minScore) {
    console.error(`Variant benchmark gate FAILED: variants/sgad score ${score} is below minimum ${minScore}`);
    process.exit(1);
  }
  console.error(`Variant benchmark gate passed: variants/sgad score ${score} >= ${minScore}`);
}

if (minFrameworkScore != null && !Number.isNaN(minFrameworkScore)) {
  const framework = results.find((item) => item.variant === "framework");
  const score = framework?.score ?? 0;
  if (score < minFrameworkScore) {
    console.error(`Framework gate FAILED: framework score ${score} is below minimum ${minFrameworkScore}`);
    process.exit(1);
  }
  console.error(`Framework gate passed: framework score ${score} >= ${minFrameworkScore}`);
}
