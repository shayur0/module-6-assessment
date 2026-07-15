#!/usr/bin/env node
// Safety promise: "Don't rewrite your own rules. CLAUDE.md and settings are read-only to you."
// Blocks any Edit/Write/NotebookEdit aimed at the rulebook, settings, or the hooks that enforce
// this file, so the bot can never quietly loosen its own guardrails.

const path = require("path");

let input = "";
try {
  input = require("fs").readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path || payload?.tool_input?.notebook_path || "";
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const resolved = path.resolve(filePath);

const protectedPaths = [
  path.resolve(projectDir, "CLAUDE.md"),
  path.resolve(projectDir, ".claude", "settings.json"),
  path.resolve(projectDir, ".claude", "settings.local.json"),
];
const protectedDirs = [
  path.resolve(projectDir, ".claude", "hooks"),
];

const isProtectedFile = protectedPaths.includes(resolved);
const isProtectedDir = protectedDirs.some((dir) => resolved.startsWith(dir + path.sep));

if (isProtectedFile || isProtectedDir) {
  console.error(
    `Blocked: ${path.relative(projectDir, resolved)} is Ledger's rulebook/settings/safety-hooks ` +
    `and is read-only during normal runs (see CLAUDE.md > Rules I must never break). ` +
    `If a rule genuinely needs to change, ask Shayur directly instead of editing this file.`
  );
  process.exit(2);
}

process.exit(0);
