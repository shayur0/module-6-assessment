#!/usr/bin/env node
// Event trigger: whenever Claude writes/edits a file under notes/, nudge Claude to run the
// daily-wrap-up skill right after. (Claude Code hooks fire on Claude's own tool calls, not on
// manual saves made in another app — see README for that distinction.)

const path = require("path");
const fs = require("fs");

let input = "";
try {
  input = fs.readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path || "";
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const notesDir = path.resolve(projectDir, "notes");
const resolved = path.resolve(filePath);

if (resolved.startsWith(notesDir + path.sep)) {
  console.error(
    `A note was just saved: ${path.relative(projectDir, resolved)}. ` +
    `Run the daily-wrap-up skill now (.claude/skills/daily-wrap-up/SKILL.md) to update today's ` +
    `entry in logs/.`
  );
  process.exit(2);
}

process.exit(0);
