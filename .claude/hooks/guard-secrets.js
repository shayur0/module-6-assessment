#!/usr/bin/env node
// Safety promise: "Keep secrets out of the code and the log. If something's missing, show a
// clear message on the page — don't guess or hide it in the code."
// Blocks writes/edits that would put an API key, token, or password-looking string into a file.

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

const ti = payload?.tool_input || {};
const content = [ti.content, ti.new_string, ti.new_str].filter(Boolean).join("\n");
if (!content) process.exit(0);

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,                          // OpenAI/Anthropic-style keys
  /AKIA[0-9A-Z]{16}/,                             // AWS access key id
  /AIza[0-9A-Za-z_-]{35}/,                        // Google API key
  /xox[baprs]-[0-9A-Za-z-]{10,}/,                 // Slack token
  /-----BEGIN (RSA |EC |OPENSSH |)?PRIVATE KEY-----/,
  /\b(api[_-]?key|secret|password|passwd|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i,
];

for (const pattern of SECRET_PATTERNS) {
  if (pattern.test(content)) {
    console.error(
      "Blocked: this write looks like it contains a secret/API key/password. " +
      "Ledger never puts secrets in code or logs (see CLAUDE.md > Safety promises). " +
      "If a credential is genuinely needed, stop and tell Shayur on the web page instead of writing it here."
    );
    process.exit(2);
  }
}

process.exit(0);
