# Ledger — project skill file

## What it does

Ledger is a personal bookkeeping bot. It watches a Google Drive receipts folder, extracts
date/vendor/amount/currency/category from each receipt or invoice, and appends rows to an
expense spreadsheet — flagging anything it can't read confidently instead of guessing. Shayur
runs it from Claude Code: a small local web page (`http://localhost:8787`) is the control panel
for adding jobs, watching them move waiting → working on it → done, answering "needs my OK"
questions, and leaving correction notes.

## Technologies

- **Runtime**: Node.js, no framework — `app/server.js` is a small built-in HTTP server.
- **Storage**: `data/expenses.xlsx` (via `app/lib/xlsx.js`), `tasks.json` (job queue),
  `data/log.json` (activity log), `data/learnings.json` (saved corrections).
- **AI**: Anthropic API for the "Ask Ledger" panel (`callLedgerAI` in `app/server.js`), scored
  against `quality-rubric.md`.
- **Data source**: Google Drive, via the `mcp__claude_ai_Google_Drive__*` MCP tools.
- **Claude Code project structure**: `.claude/agents/` (task-doer, verifier),
  `.claude/skills/` (scan-receipts, flag-ambiguous-receipt, round-summary, daily-wrap-up),
  `.claude/hooks/` + `.claude/settings.json` (safety hooks, see below).

## Coding rules (full rulebook in `CLAUDE.md`)

- One job per round for `task-doer`; never batch multiple jobs in one run.
- **Never guess a number.** If a receipt is blurry or conflicting, it becomes a "needs my OK" job
  instead of an invented figure — enforced by both `task-doer` and the `verifier` agent.
- Every finished job is scored by `verifier` (Completeness/Accuracy/Usability, 1–5) before it can
  be marked "done"; anything scoring below 3 on any axis, or any guessed amount, fails.
- Use `app/lib/xlsx.js`'s `readXlsx`/`appendRows` for spreadsheet work — never hand-roll parsing.
- `CLAUDE.md` and `.claude/settings.json` are read-only to the bot during normal runs — it never
  rewrites its own rules.
- Real financial data (`data/expenses.xlsx`, `data/log.json`, `data/learnings.json`,
  `tasks.json`, `notes/`, `logs/`) stays out of git — see `.gitignore`. Only code, rules, and
  recipes are committed.

## Hooks (`.claude/settings.json` + `.claude/hooks/`)

- `guard-rulebook.js` (PreToolUse, Edit/Write **and** Bash) — blocks edits to
  `CLAUDE.md`/settings/hooks during normal runs, including a Bash redirect/`sed -i`/etc. onto
  those files, not just the Edit/Write tools.
- `guard-secrets.js` (PreToolUse, Edit/Write) — blocks writing API keys/tokens into files.
- `guard-destructive-bash.js` (PreToolUse, Bash) — blocks destructive shell commands.
- `notes-saved.js` (PostToolUse, Edit/Write) — after a note is saved in `notes/`, nudges the
  `daily-wrap-up` skill to refresh today's log.

## Common tasks Claude helps with

- "Do a round of work" — pick the top waiting job, run it through task-doer → verifier, report.
- "Scan my receipts folder" — run the `scan-receipts` skill against the Drive folder.
- "Start/stop the attended loop" — the 5-minute while-open polling loop (off by default).
- "Wrap up the day" — run `daily-wrap-up` over today's `notes/` into `logs/<date>.md`.
- Answering "needs my OK" jobs via a click or a short note on the web page.

## Gotchas

- Files in the Drive receipts folder are often **consolidated** — one PDF/screenshot can hold
  many separate receipts spanning months. Treat each receipt inside a file as its own row, not
  the file as a whole.
- A vendor-name or date conflict (e.g. two figures on one receipt disagree) must be recorded as
  both readings, not averaged or guessed.
- Corrections taught once (via a note on a job) are saved to `data/learnings.json` and must be
  checked before categorizing that vendor again — don't ask the same question twice.
- The attended loop only runs while Shayur has Claude Code open on this project; there is no
  unattended/scheduled mode currently enabled.
