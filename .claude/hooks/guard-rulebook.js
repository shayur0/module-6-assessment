#!/usr/bin/env node
// Safety promise: "Don't rewrite your own rules. CLAUDE.md and settings are read-only to you."
// Blocks any Edit/Write/NotebookEdit aimed at the rulebook, settings, or the hooks that enforce
// this file, so the bot can never quietly loosen its own guardrails. Also runs on Bash (see
// settings.json) to catch a shell command writing to the same files, e.g. `echo x >> CLAUDE.md`
// or `sed -i` — a gap found during a proof-of-hooks demo where an Edit-only check let a Bash
// redirect slip through.

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

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const protectedPaths = [
  path.resolve(projectDir, "CLAUDE.md"),
  path.resolve(projectDir, ".claude", "settings.json"),
  path.resolve(projectDir, ".claude", "settings.local.json"),
];
const protectedDirs = [
  path.resolve(projectDir, ".claude", "hooks"),
];

function blockFile(resolved) {
  const isProtectedFile = protectedPaths.includes(resolved);
  const isProtectedDir = protectedDirs.some((dir) => resolved.startsWith(dir + path.sep));
  if (!isProtectedFile && !isProtectedDir) return;
  console.error(
    `Blocked: ${path.relative(projectDir, resolved)} is Ledger's rulebook/settings/safety-hooks ` +
    `and is read-only during normal runs (see CLAUDE.md > Rules I must never break). ` +
    `If a rule genuinely needs to change, ask Shayur directly instead of editing this file.`
  );
  process.exit(2);
}

const filePath = payload?.tool_input?.file_path || payload?.tool_input?.notebook_path || "";
if (filePath) {
  blockFile(path.resolve(filePath));
  process.exit(0);
}

// Bash tool call: no file_path, just a shell command. Catch writes to the protected files/dirs
// by name — a write-shaped command (redirect, in-place edit, copy/move onto the target, etc.)
// that mentions one of them anywhere is blocked, even though this can't parse the shell fully.
const command = payload?.tool_input?.command || "";
if (!command) process.exit(0);

const protectedNames = ["CLAUDE.md", "settings.json", "settings.local.json", ".claude/hooks", ".claude\\hooks"];
const mentionsProtected = protectedNames.some((name) => command.includes(name));
const looksLikeWrite = /(>>?|\btee\b|\bsed\s+-i|\bperl\s+-i|\bcp\b|\bmv\b|\bdd\s+of=|\binstall\b|\btouch\b|\brm\b)/.test(command);

if (mentionsProtected && looksLikeWrite) {
  console.error(
    `Blocked: this Bash command appears to write to Ledger's rulebook/settings/safety-hooks, ` +
    `which are read-only during normal runs (see CLAUDE.md > Rules I must never break). ` +
    `If a rule genuinely needs to change, ask Shayur directly instead of editing this file.`
  );
  process.exit(2);
}

process.exit(0);
