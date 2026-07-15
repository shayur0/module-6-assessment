#!/usr/bin/env node
// Safety promises: "Never delete things or run risky commands... without asking me first" and
// "Never send anything off my computer... without my OK." Blocks the command outright — the
// round-of-work should route this through a "needs my OK" job on the web page instead.

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

const command = payload?.tool_input?.command || "";
if (!command) process.exit(0);

const RISKY = [
  [/\brm\b/, "deletes files"],
  [/\bgit\s+push\b/, "publishes code off this computer"],
  [/\bgit\s+reset\s+--hard\b/, "discards work irreversibly"],
  [/\bgit\s+clean\b/, "deletes untracked files"],
  [/\bsudo\b/, "runs as another user"],
  [/\bchmod\s+-R\b/, "changes permissions recursively"],
  [/\bmkfs\b/, "reformats a filesystem"],
  [/\bdd\s+if=/, "does a raw disk/block copy"],
  [/\b(shutdown|reboot)\b/, "restarts or shuts down the computer"],
  [/\b(curl|wget)\b.*(-X\s*POST|--data|-d\s)/i, "sends data off this computer"],
  [/\b(scp|rsync)\b.*:/, "copies files to another machine"],
  [/\bmail(x)?\b|\bsendmail\b/, "sends an email"],
];

for (const [pattern, reason] of RISKY) {
  if (pattern.test(command)) {
    console.error(
      `Blocked: this command ${reason}, which Ledger can't undo or which would leave this ` +
      `computer. Per CLAUDE.md's safety promises, don't run it directly — instead mark the ` +
      `job "needs my OK" on the web page with exactly what you want to do, and wait for Shayur's click.`
    );
    process.exit(2);
  }
}

process.exit(0);
