# Ledger

Your personal bookkeeping bot. Short and clear, like a careful accountant — no fluff.

Everything runs through Claude Code. There's no separate server to install or manage — Claude
Code *is* the bot's brain and engine.

## How to use it day to day

1. Open Claude Code with this `my-bot` folder as the project.
2. The web page is your control panel: **http://localhost:8787**. If it's not already running,
   just ask Claude ("start Ledger's web page") and it'll start it in the background for you.
3. On the page you can:
   - **Add a job** — a title, a plain description, and a priority (High/Medium/Low).
   - **See your jobs** — waiting → working on it → done (or stuck, or needs your OK).
   - **Read what was done** on any finished job.
   - **Click Yes or No** on anything marked "needs my OK."
   - **Leave a note** on any job — a follow-up instruction, a question, or a correction
     ("that's Travel, not Meals"). Ledger reads notes and figures out what kind they are.
4. Ask Claude to "do a round of work" (or start the attended loop) and it'll pick the most
   important waiting job, do it, have a second helper check it, and report back — the same way
   every time.

## What Ledger does automatically

- **Scans your "2026 Receipts" Google Drive folder** for receipts/invoices, pulls out date,
  vendor, amount, currency, and category, and adds a row to `data/expenses.xlsx`. It never adds
  the same receipt twice.
- **Never guesses an unclear amount, date, or vendor.** If something's blurry or conflicting,
  it adds a "NEEDS REVIEW" row and creates a "needs my OK" job with a specific question instead
  of picking a number.
- **Checks its own work.** A second helper (the verifier) scores every job before it's marked
  done — nothing ships without a second pair of eyes.
- **Remembers your corrections.** Tell it once that a vendor belongs in a different category,
  and it applies that from then on.

## Right now

`data/expenses.xlsx` has been seeded with everything already found in the Drive folder: **18
confirmed rows** and **13 rows that need your review**. Those 13 turned into **6 jobs** on the
web page — open it and answer them when you have a minute; each answer updates the spreadsheet
and (where relevant) teaches Ledger the correction for next time.

## Where everything lives

```
my-bot/
├─ CLAUDE.md              Ledger's rulebook — read automatically every round
├─ README.md              this file
├─ tasks.json             the job list (the page and the bot both read/write this)
├─ data/
│  ├─ expenses.xlsx       your expense tracker spreadsheet
│  ├─ log.json            plain-English activity log (shown on the page)
│  └─ learnings.json      corrections you've taught Ledger
├─ app/
│  ├─ server.js           the small back-end (no install needed — built into Node)
│  ├─ public/             the web page (HTML/CSS/JS)
│  └─ lib/                shared helpers: xlsx.js, recovery.js, learnings.js
├─ notes/                 your daily notes (one file per day)
├─ logs/                  Daily Wrap-Up summaries (Done/Doing/Next), one dated file per day
└─ .claude/
   ├─ settings.json       turns on the safety hooks below
   ├─ hooks/              automatic safety checks + the notes-saved event hook
   ├─ agents/             task-doer (does one job) and verifier (checks it)
   └─ skills/             recipes: scan-receipts, flag-ambiguous-receipt, round-summary,
                           daily-wrap-up
```

## Daily Wrap-Up

Drop notes for the day in `notes/<date>.md`. Ledger turns them into a short Done/Doing/Next
summary in `logs/<date>.md`, two ways:

- **On a clock** — every weekday at 6pm (a scheduled job; session-only, re-create it if it's been
  more than 7 days or you've restarted Claude Code).
- **On an event** — right after Claude saves a file in `notes/`, a hook nudges it to update
  today's log immediately. This only fires on saves Claude itself makes (e.g. you ask it to jot
  something down) — not on manual edits you make in another app.

## Safety, always on

- Ledger never asks you for a secret key, and never asks you to run a command or a server.
- It never deletes files, runs risky commands, or sends anything off this computer without your
  click first — enforced automatically by hooks in `.claude/hooks/`, not just a promise.
- It never writes an API key, password, or token into any file.
- It can't edit its own rulebook (`CLAUDE.md`) or settings — those are read-only to it.
- If something fails, it says so plainly and marks the job "stuck" — it never pretends
  something worked.

## Modes

- **While you're here**: every 5 minutes (or whenever you ask), Ledger looks at `tasks.json` and
  does a round of work. This is off by default until you ask Claude to start it.
- **While you're away**: currently **off**. If you want scheduled runs later, just ask.

## Turning off

Just close Claude Code, or ask it to stop the web page. Nothing keeps running in the background
on its own unless you've explicitly started the attended loop or a schedule.
