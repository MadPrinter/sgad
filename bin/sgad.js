#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

const files = {
  "sgad/governance.yaml": `version: 0.3.0
risk_class: R1
optional_tracks:
  design: false
autonomy:
  max_files_without_review: 8
  max_minutes_without_checkpoint: 30
gates:
  require_spec: true
  require_tests: true
  require_evidence_matrix: true
  require_risk_review_for: [R2, R3]
evidence:
  allow_pending: true
  require_evidence_paths: false
approvals:
  R3: human
`,
  "sgad/evidence-matrix.md": `# Evidence Matrix

| Requirement | Design | Task | Test | Risk | Evidence |
|---|---|---|---|---|---|
| REQ-001 | design.md | tasks.md | pending | R1 | pending |
`,
  "sgad/risk-register.md": `# Risk Register

| Risk | Class | Mitigation | Owner | Status |
|---|---|---|---|---|
| Unclassified change | R1 | Complete governance review before implementation | AI + human | open |
`,
  "openspec/changes/example-change/proposal.md": `# Proposal: example-change

## Why

Describe the user or business problem.

## What Changes

- Add the smallest valuable behavior.
- Keep scope explicit.

## Impact

- Risk class: R1
- Affected areas: TBD
`,
  "openspec/changes/example-change/design.md": `# Design: example-change

## Architecture

Describe the selected approach and rejected alternatives.

## Data / API / Security

Record any API, persistence, RBAC, privacy, or side-effect implications.
`,
  "openspec/changes/example-change/tasks.md": `# Tasks: example-change

- [ ] Classify risk
- [ ] Write or update tests
- [ ] Implement behavior
- [ ] Update evidence matrix
- [ ] Run verification
`,
  ".codex/skills/sgad/SKILL.md": `---
name: sgad
description: Use SGAD when implementing AI-assisted software changes that need specs, tests, risk controls, evidence, or review gates.
---

# SGAD

Use this workflow before changing production code:

1. Classify the change as R0, R1, R2, or R3.
2. For R1 and above, create or update \`openspec/changes/<change-id>/\`.
3. Write tests before or alongside implementation.
4. Fill \`sgad/evidence-matrix.md\` with concrete evidence or add a time-boxed \`sgad/waivers.yaml\`.
5. For R2/R3, update \`sgad/risk-register.md\` and require explicit review before rollout.
6. Run \`sgad check\` before final response and fix reported issues before claiming done.

Never treat chat history as the source of truth. Persist decisions in the repo.
`
};

const designFiles = {
  "design/DESIGN.md": `# DESIGN.md

This file is the durable design context for AI-generated UI work.

## Product Feel

- Describe the product category, audience, and desired interface personality.
- Prefer concrete UI rules over vague adjectives.

## Tokens

| Token | Value | Usage |
|---|---|---|
| color.background | #ffffff | page background |
| color.text | #111827 | primary text |
| color.accent | #2563eb | primary action |
| radius.control | 8px | buttons and inputs |
| space.grid | 8px | spacing rhythm |

## Components

Document reusable rules for:

- navigation
- buttons
- forms
- tables
- cards
- modals
- empty states
- destructive actions

## Responsive Rules

- Define desktop, tablet, and mobile behavior.
- Text must not overlap, truncate critical content, or resize layout unpredictably.
- Core actions must remain reachable on mobile.

## Accessibility

- Keyboard navigation must work for interactive controls.
- Color alone must not communicate state.
- Focus states must be visible.

## Evidence Required

For UI-impacting changes, attach or link:

- screenshot or visual inspection notes
- responsive viewport checks
- accessibility notes
- component reuse notes
`,
  "design/components.md": `# Components

| Component | Source / Pattern | Allowed Variants | Notes |
|---|---|---|---|
| Button | DESIGN.md | primary, secondary, destructive, icon | Keep labels short and actions clear. |
| Form field | DESIGN.md | text, select, checkbox, radio | Pair validation with visible errors. |
| Table | DESIGN.md | dense, standard | Preserve scanability and sorting affordances. |
`,
  "design/screenshots/.gitkeep": ``,
  "sgad/design-review.md": `# Design Review

| Change | UI Risk | DESIGN.md Followed | Responsive Checked | Accessibility Checked | Evidence |
|---|---|---|---|---|---|
| example-change | R1-UI | pending | pending | pending | pending |
`
};

const experienceFiles = {
  "sgad/experience/lessons.yaml": `lessons: []
`,
  "sgad/experience/review-queue.md": `# Experience Review Queue

Use this file for candidate lessons that need evidence, scope, or human review before activation.
`,
  "sgad/experience/episodes/active/.gitkeep": ``,
  "sgad/experience/episodes/archived/.gitkeep": ``,
  "sgad/experience/runs/.gitkeep": ``
};

function mkdirp(file) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
}

function writeFile(file, body, force = false) {
  const target = path.join(root, file);
  if (fs.existsSync(target) && !force) return false;
  mkdirp(file);
  fs.writeFileSync(target, body, "utf8");
  return true;
}

function init() {
  const force = process.argv.includes("--force");
  const withDesign = process.argv.includes("--with-design");
  const withExperience = process.argv.includes("--with-experience");
  const written = [];
  const skipped = [];
  const selectedFiles = {
    ...files,
    ...(withDesign ? designFiles : {}),
    ...(withExperience ? experienceFiles : {})
  };
  for (const [file, body] of Object.entries(selectedFiles)) {
    if (writeFile(file, body, force)) written.push(file);
    else skipped.push(file);
  }
  console.log("SGAD project initialized.");
  if (written.length) console.log(`created: ${written.join(", ")}`);
  if (skipped.length) console.log(`skipped existing: ${skipped.join(", ")}`);
}

function check() {
  const jsonOutput = process.argv.includes("--json");
  const issues = [];
  const warnings = [];
  const required = [
    "sgad/governance.yaml",
    "sgad/evidence-matrix.md",
    "sgad/risk-register.md",
    "openspec/changes"
  ];
  const missing = required.filter((item) => !fs.existsSync(path.join(root, item)));
  for (const item of missing) {
    issues.push({
      code: "MISSING_REQUIRED_FILE",
      file: item,
      message: `${item} is required`,
      fix: `Create ${item} or run sgad init`
    });
  }

  const hasDesignTrack =
    fs.existsSync(path.join(root, "design/DESIGN.md")) ||
    fs.existsSync(path.join(root, "sgad/design-review.md"));
  if (hasDesignTrack) {
    const designRequired = ["design/DESIGN.md", "sgad/design-review.md"];
    const designMissing = designRequired.filter((item) => !fs.existsSync(path.join(root, item)));
    for (const item of designMissing) {
      issues.push({
        code: "MISSING_DESIGN_TRACK_FILE",
        file: item,
        message: `${item} is required when design track files are present`,
        fix: `Create ${item} or remove the partial design track`
      });
    }
  }

  const governancePath = path.join(root, "sgad/governance.yaml");
  const evidencePath = path.join(root, "sgad/evidence-matrix.md");
  if (fs.existsSync(governancePath) && fs.existsSync(evidencePath)) {
    const governance = parseGovernance(fs.readFileSync(governancePath, "utf8"));
    const waivers = loadWaivers();
    validateEvidenceMatrix({
      governance,
      evidencePath,
      waivers,
      issues,
      warnings
    });
  }

  const passed = issues.length === 0;
  if (jsonOutput) {
    console.log(JSON.stringify({ passed, issues, warnings }, null, 2));
  } else if (passed) {
    console.log("SGAD check passed.");
    for (const warning of warnings) console.warn(`warning ${warning.code}: ${warning.message}`);
  } else {
    console.error(`SGAD check FAILED (${issues.length} issue${issues.length === 1 ? "" : "s"}):`);
    for (const issue of issues) {
      const target = issue.req ? `${issue.file} ${issue.req}` : issue.file;
      console.error(`- ${target}: ${issue.message}`);
    }
    console.error("Fix:");
    for (const issue of issues) console.error(`- ${issue.fix}`);
    for (const warning of warnings) console.warn(`warning ${warning.code}: ${warning.message}`);
  }
  if (!passed) process.exit(1);
}

function help() {
  console.log(`SGAD: Spec-Governed Agentic Development

Usage:
  sgad init [--force]                 Scaffold SGAD governance files
  sgad init --with-design [--force]   Scaffold SGAD plus optional Design Track
  sgad init --with-experience [--force] Scaffold SGAD plus optional Experience Layer
  sgad check [--json]                 Verify SGAD governance artifacts and evidence closure
  sgad experience recall --json       Recall bounded project experience summaries
  sgad experience audit --json        Validate project experience artifacts
  sgad experience template --json     Add a candidate lesson template to the review queue
  sgad help                           Show this message

Typical flow:
  sgad init
  create openspec/changes/<change-id>/
  implement with tests
  sgad check

For UI work:
  sgad init --with-design
  update design/DESIGN.md
  record UI evidence in sgad/design-review.md

For agent learning:
  sgad init --with-experience
  add scoped, evidence-backed lessons under sgad/experience/
  run sgad experience audit --json
`);
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseGovernance(text) {
  const result = {};
  const stack = [{ indent: -1, value: result }];
  for (const rawLine of text.split(/\r?\n/)) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (!withoutComment.trim()) continue;
    const match = withoutComment.match(/^(\s*)([^:]+):(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const key = match[2].trim();
    const valueText = match[3].trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;
    if (!valueText) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = parseScalar(valueText);
    }
  }
  return result;
}

function parseMarkdownTable(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));
  if (rows.length < 2) return [];
  const headers = splitTableRow(rows[0]);
  return rows.slice(2).map((line) => {
    const cells = splitTableRow(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

function splitTableRow(line) {
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function loadWaivers() {
  const yamlPath = path.join(root, "sgad/waivers.yaml");
  const jsonPath = path.join(root, "sgad/waivers.json");
  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8")).waivers ?? [];
  }
  if (!fs.existsSync(yamlPath)) return [];
  return parseWaiversYaml(fs.readFileSync(yamlPath, "utf8"));
}

function parseWaiversYaml(text) {
  const waivers = [];
  let current = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line === "waivers:") continue;
    const itemMatch = line.match(/^-\s+([^:]+):(.*)$/);
    if (itemMatch) {
      current = {};
      waivers.push(current);
      current[itemMatch[1].trim()] = parseScalar(itemMatch[2].trim());
      continue;
    }
    const fieldMatch = line.match(/^([^:]+):(.*)$/);
    if (current && fieldMatch) current[fieldMatch[1].trim()] = parseScalar(fieldMatch[2].trim());
  }
  return waivers;
}

function validateEvidenceMatrix({ governance, evidencePath, waivers, issues, warnings }) {
  const config = evidenceConfig(governance);
  if (config.disabled) return;
  const rows = parseMarkdownTable(fs.readFileSync(evidencePath, "utf8"));
  const relativeEvidencePath = path.relative(root, evidencePath).replaceAll("\\", "/");
  if (rows.length === 0) {
    issues.push({
      code: "EVIDENCE_MATRIX_EMPTY",
      file: relativeEvidencePath,
      message: "evidence matrix has no requirement rows",
      fix: "Add at least one requirement row with concrete evidence or a valid waiver"
    });
    return;
  }

  let unwaivedPendingCount = 0;
  for (const row of rows) {
    const req = row.Requirement || row.REQ || row.Id || "unknown";
    const evidence = row.Evidence ?? "";
    const status = row.Status ?? "";
    const pending = isPendingEvidence(evidence) || /^pending$/i.test(status);
    if (pending) {
      const waiver = findValidWaiver(waivers, req);
      if (!config.allowPending && !waiver) {
        unwaivedPendingCount += 1;
        issues.push({
          code: "EVIDENCE_PENDING",
          file: relativeEvidencePath,
          req,
          message: `Evidence is still "${evidence || "empty"}" with no valid waiver`,
          fix: `Set ${req} Evidence to a real path/test, or add sgad/waivers.yaml with reason and expiry`
        });
      } else if (waiver) {
        warnings.push({
          code: "EVIDENCE_WAIVED",
          file: "sgad/waivers.yaml",
          req,
          message: `${req} is pending under waiver until ${waiver.expires}`
        });
      }
      continue;
    }

    if (config.requireEvidencePaths) {
      const tokens = evidenceTokens(evidence);
      const hasExistingEvidence = tokens.some((token) => evidenceTokenExists(token));
      if (!hasExistingEvidence) {
        issues.push({
          code: "EVIDENCE_PATH_MISSING",
          file: relativeEvidencePath,
          req,
          message: `Evidence does not reference an existing repo path or recognized external artifact: ${evidence}`,
          fix: `Update ${req} Evidence to an existing file, directory, glob, test path, URL, or waiver status`
        });
      }
    }
  }

  if (unwaivedPendingCount > config.pendingMax) {
    issues.push({
      code: "EVIDENCE_PENDING_LIMIT",
      file: relativeEvidencePath,
      message: `${unwaivedPendingCount} unwaived pending evidence row(s) exceed pending_max=${config.pendingMax}`,
      fix: "Fill pending evidence rows or add time-boxed waivers"
    });
  }
}

function evidenceConfig(governance) {
  const riskClass = String(governance.risk_class ?? "R1").toUpperCase();
  const evidence = governance.evidence ?? {};
  const defaultRequired = riskClass === "R2" || riskClass === "R3";
  const disabled = evidence.enabled === false || evidence.required === false;
  return {
    disabled,
    allowPending: evidence.allow_pending ?? !defaultRequired,
    pendingMax: evidence.pending_max ?? (defaultRequired ? 0 : Number.POSITIVE_INFINITY),
    requireEvidencePaths: evidence.require_evidence_paths ?? defaultRequired
  };
}

function isPendingEvidence(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "" || normalized === "-" || normalized === "n/a"
    || normalized === "pending" || normalized === "tbd" || normalized === "todo";
}

function findValidWaiver(waivers, requirement) {
  const today = new Date().toISOString().slice(0, 10);
  return waivers.find((waiver) => (
    String(waiver.requirement) === String(requirement)
    && waiver.reason
    && waiver.expires
    && String(waiver.expires) >= today
  ));
}

function evidenceTokens(value) {
  return String(value)
    .split(/[,;\n]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function evidenceTokenExists(token) {
  if (/^https?:\/\//.test(token)) return true;
  if (/^(uat|issue|pr|external):/i.test(token)) return true;
  const cleaned = token
    .replace(/^test-map\s+/i, "")
    .replace(/^file:/i, "")
    .replace(/^`|`$/g, "")
    .split("::")[0]
    .trim();
  if (!cleaned || cleaned.startsWith("waived:")) return true;
  if (cleaned.includes("*")) return globExists(cleaned);
  return fs.existsSync(path.join(root, cleaned));
}

function globExists(pattern) {
  const normalized = pattern.replaceAll("\\", "/");
  return globWalk(root, normalized.split("/"));
}

function globWalk(base, parts) {
  if (parts.length === 0) return fs.existsSync(base);
  const [part, ...rest] = parts;
  if (part === "**") {
    if (globWalk(base, rest)) return true;
    if (!fs.existsSync(base) || !fs.statSync(base).isDirectory()) return false;
    return fs.readdirSync(base).some((entry) => globWalk(path.join(base, entry), parts));
  }
  if (part.includes("*")) {
    if (!fs.existsSync(base) || !fs.statSync(base).isDirectory()) return false;
    const re = new RegExp(`^${part.split("*").map(escapeRegExp).join(".*")}$`);
    return fs.readdirSync(base).some((entry) => re.test(entry) && globWalk(path.join(base, entry), rest));
  }
  return globWalk(path.join(base, part), rest);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function experience() {
  const subcommand = process.argv[3] ?? "help";
  if (subcommand === "recall") recallExperience();
  else if (subcommand === "audit") auditExperience();
  else if (subcommand === "template") templateExperience();
  else experienceHelp();
}

function experienceHelp() {
  console.log(`SGAD Experience

Usage:
  sgad experience recall --query "<task>" --files "path1,path2" [--limit 3] [--max-tokens 800] [--json]
  sgad experience audit [--json]
  sgad experience template --title "<lesson>" --change "<change-id>" [--json]

Experience is recalled only from active, scoped, evidence-backed lessons.
`);
}

function recallExperience() {
  const jsonOutput = process.argv.includes("--json");
  const query = optionValue("--query") ?? "";
  const files = splitList(optionValue("--files") ?? "");
  const limit = Number(optionValue("--limit") ?? 3);
  const maxTokens = Number(optionValue("--max-tokens") ?? 800);
  const lessons = loadLessons();
  const matches = lessons
    .filter((lesson) => lesson.status === "active")
    .filter((lesson) => hasLessonScope(lesson) && hasLessonEvidence(lesson))
    .map((lesson) => ({ lesson, score: lessonScore(lesson, query, files) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || confidenceRank(b.lesson.confidence) - confidenceRank(a.lesson.confidence))
    .slice(0, Math.max(0, limit));

  const selected = [];
  let tokens = 0;
  for (const match of matches) {
    const summary = lessonSummary(match.lesson);
    const nextTokens = estimateTokens(summary);
    if (selected.length > 0 && tokens + nextTokens > maxTokens) continue;
    selected.push({
      id: match.lesson.id,
      title: match.lesson.title,
      summary,
      confidence: match.lesson.confidence,
      score: match.score,
      evidence: normalizeArray(match.lesson.evidence?.tests ?? match.lesson.evidence?.episodes ?? [])
    });
    tokens += nextTokens;
  }

  const result = {
    matched: selected.length > 0,
    tokens_estimate: tokens,
    lessons: selected,
    episodes: []
  };
  if (jsonOutput) console.log(JSON.stringify(result, null, 2));
  else if (!result.matched) console.log("No matching SGAD experience.");
  else {
    console.log("Relevant SGAD experience:");
    for (const lesson of selected) console.log(`- ${lesson.id}: ${lesson.summary}`);
  }
}

function auditExperience() {
  const jsonOutput = process.argv.includes("--json");
  const issues = [];
  const warnings = [];
  const lessons = loadLessons();
  const validStatuses = new Set(["candidate", "active", "stale", "deprecated", "rejected", "review"]);

  for (const lesson of lessons) {
    const id = lesson.id ?? "unknown";
    for (const field of ["id", "title", "triggers", "advice", "confidence", "status", "last_validated"]) {
      if (lesson[field] == null || lesson[field] === "") {
        issues.push(experienceIssue("EXPERIENCE_REQUIRED_FIELD_MISSING", id, `lesson is missing required field: ${field}`));
      }
    }
    if (!validStatuses.has(String(lesson.status ?? ""))) {
      issues.push(experienceIssue("EXPERIENCE_STATUS_INVALID", id, `lesson has invalid status: ${lesson.status ?? "missing"}`));
    }
    if (!["low", "medium", "high"].includes(String(lesson.confidence ?? ""))) {
      issues.push(experienceIssue("EXPERIENCE_CONFIDENCE_INVALID", id, `lesson has invalid confidence: ${lesson.confidence ?? "missing"}`));
    }
    if (lesson.status === "active" && !hasLessonScope(lesson)) {
      issues.push(experienceIssue("EXPERIENCE_SCOPE_MISSING", id, "active lesson must include scope"));
    }
    if (lesson.status === "active" && !hasLessonEvidence(lesson)) {
      issues.push(experienceIssue("EXPERIENCE_EVIDENCE_MISSING", id, "active lesson must include evidence"));
    }
    if (lesson.status === "active" && !hasTrigger(lesson)) {
      issues.push(experienceIssue("EXPERIENCE_TRIGGER_MISSING", id, "active lesson must include at least one trigger"));
    }
    for (const evidence of lessonEvidenceTokens(lesson)) {
      if (!evidenceTokenExists(evidence)) {
        warnings.push({
          code: "EXPERIENCE_EVIDENCE_PATH_MISSING",
          lesson: id,
          message: `evidence does not resolve: ${evidence}`
        });
      }
    }
  }

  const passed = issues.length === 0;
  const result = { passed, issues, warnings };
  if (jsonOutput) console.log(JSON.stringify(result, null, 2));
  else if (passed) {
    console.log("SGAD experience audit passed.");
    for (const warning of warnings) console.warn(`warning ${warning.code}: ${warning.message}`);
  } else {
    console.error(`SGAD experience audit FAILED (${issues.length} issue${issues.length === 1 ? "" : "s"}):`);
    for (const issue of issues) console.error(`- ${issue.lesson}: ${issue.message}`);
  }
  if (!passed) process.exit(1);
}

function templateExperience() {
  const jsonOutput = process.argv.includes("--json");
  const title = optionValue("--title") ?? "Candidate lesson";
  const change = optionValue("--change") ?? "unassigned-change";
  const files = splitList(optionValue("--files") ?? "");
  const taskType = optionValue("--task-type") ?? "";
  const queuePath = path.join(root, "sgad/experience/review-queue.md");
  const id = optionValue("--id") ?? candidateLessonId(title);
  const block = candidateLessonBlock({ id, title, change, files, taskType });
  mkdirp("sgad/experience/review-queue.md");
  if (!fs.existsSync(queuePath)) {
    fs.writeFileSync(queuePath, "# Experience Review Queue\n\n", "utf8");
  }
  fs.appendFileSync(queuePath, `${block}\n`, "utf8");
  const result = {
    created: true,
    id,
    file: "sgad/experience/review-queue.md",
    status: "candidate",
    promoted: false
  };
  if (jsonOutput) console.log(JSON.stringify(result, null, 2));
  else console.log(`Added candidate lesson ${id} to sgad/experience/review-queue.md`);
}

function candidateLessonId(title) {
  const slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "candidate";
  return `LESSON-CANDIDATE-${slug}`;
}

function candidateLessonBlock({ id, title, change, files, taskType }) {
  const fileList = files.length ? files.join(", ") : "TBD";
  const taskTypeText = taskType || "TBD";
  return `\n## ${id}: ${title}

Status: candidate
Change: ${change}

\`\`\`yaml
- id: ${id}
  title: ${title}
  scope:
    files: [${fileList}]
    task_types: [${taskTypeText}]
  triggers:
    keywords: [TBD]
  advice: TBD
  summary: TBD
  evidence:
    episodes: [TBD]
    tests: [TBD]
  confidence: low
  status: candidate
  last_validated: TBD
\`\`\`

Activation checklist:

- [ ] Scope is specific.
- [ ] Trigger is specific enough to avoid broad recall.
- [ ] Evidence points to existing paths, tests, or artifacts.
- [ ] Advice is reusable and not just a one-off workaround.
- [ ] Candidate has been reviewed before promotion to active.
`;
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1 || index + 1 >= process.argv.length) return null;
  return process.argv[index + 1];
}

function splitList(value) {
  return String(value)
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadLessons() {
  const jsonPath = path.join(root, "sgad/experience/lessons.json");
  const yamlPath = path.join(root, "sgad/experience/lessons.yaml");
  if (fs.existsSync(jsonPath)) {
    const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return Array.isArray(parsed) ? parsed : parsed.lessons ?? [];
  }
  if (!fs.existsSync(yamlPath)) return [];
  return parseLessonsYaml(fs.readFileSync(yamlPath, "utf8"));
}

function parseLessonsYaml(text) {
  const lessons = [];
  let lesson = null;
  let section = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line === "lessons:") continue;
    const itemMatch = line.match(/^-\s+([^:]+):(.*)$/);
    if (itemMatch) {
      lesson = {};
      lessons.push(lesson);
      section = null;
      lesson[itemMatch[1].trim()] = parseScalar(itemMatch[2].trim());
      continue;
    }
    if (!lesson) continue;
    const fieldMatch = line.match(/^([^:]+):(.*)$/);
    if (!fieldMatch) continue;
    const indent = rawLine.match(/^\s*/)[0].length;
    const key = fieldMatch[1].trim();
    const value = fieldMatch[2].trim();
    if (indent <= 4) section = null;
    if (!value) {
      lesson[key] = lesson[key] ?? {};
      section = key;
    } else if (section) {
      lesson[section][key] = parseScalar(value);
    } else {
      lesson[key] = parseScalar(value);
    }
  }
  return lessons;
}

function hasLessonScope(lesson) {
  const scope = lesson.scope ?? {};
  return normalizeArray(scope.repos).length > 0
    || normalizeArray(scope.files).length > 0
    || normalizeArray(scope.task_types).length > 0
    || normalizeArray(scope.commands).length > 0;
}

function hasLessonEvidence(lesson) {
  return lessonEvidenceTokens(lesson).length > 0;
}

function hasTrigger(lesson) {
  const triggers = lesson.triggers ?? {};
  return normalizeArray(triggers.keywords).length > 0
    || normalizeArray(triggers.commands).length > 0
    || normalizeArray(triggers.errors).length > 0;
}

function lessonEvidenceTokens(lesson) {
  const evidence = lesson.evidence ?? {};
  return [
    ...normalizeArray(evidence.episodes),
    ...normalizeArray(evidence.tests),
    ...normalizeArray(evidence.files),
    ...normalizeArray(evidence.artifacts)
  ];
}

function lessonScore(lesson, query, files) {
  const haystack = [
    lesson.id,
    lesson.title,
    lesson.advice,
    lesson.summary,
    ...normalizeArray(lesson.scope?.repos),
    ...normalizeArray(lesson.scope?.files),
    ...normalizeArray(lesson.scope?.task_types),
    ...normalizeArray(lesson.triggers?.keywords),
    ...normalizeArray(lesson.triggers?.commands),
    ...normalizeArray(lesson.triggers?.errors)
  ].join(" ").toLowerCase();
  const queryTokens = splitWords(query);
  const fileTokens = files.map((file) => file.replaceAll("\\", "/").toLowerCase());
  let score = 0;
  for (const token of queryTokens) if (haystack.includes(token)) score += 1;
  for (const file of fileTokens) {
    if (normalizeArray(lesson.scope?.files).some((scopeFile) => fileMatchesScope(file, scopeFile))) score += 4;
    else if (haystack.includes(file)) score += 2;
  }
  return score;
}

function splitWords(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9_.:/-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);
}

function fileMatchesScope(file, scopeFile) {
  const normalizedScope = String(scopeFile).replaceAll("\\", "/").toLowerCase();
  return file === normalizedScope || file.endsWith(`/${normalizedScope}`) || normalizedScope.endsWith("*") && file.startsWith(normalizedScope.slice(0, -1));
}

function confidenceRank(confidence) {
  if (confidence === "high") return 3;
  if (confidence === "medium") return 2;
  if (confidence === "low") return 1;
  return 0;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value == null || value === "") return [];
  return [String(value)];
}

function lessonSummary(lesson) {
  return String(lesson.summary ?? lesson.advice ?? lesson.title ?? lesson.id ?? "").trim();
}

function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}

function experienceIssue(code, lesson, message) {
  return { code, lesson, message };
}

const command = process.argv[2] ?? "help";
if (command === "init") init();
else if (command === "check") check();
else if (command === "experience") experience();
else help();
