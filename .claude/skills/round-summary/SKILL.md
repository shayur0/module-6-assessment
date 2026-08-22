---
name: round-summary
description: End-of-round recipe — after task-doer/verifier finish the jobs picked this round, write the plain-English report on each job and the log lines, and for receipt-scanning jobs specifically say how many receipts/invoices were added, how many were duplicates, and how many need Shayur's OK. Use at the "Report" step of every round of work (see CLAUDE.md).
---

# Round Summary

## Per job, when it finishes (pass or fail)

Write a short, plain, accountant-style note on the job itself (the `report` field in
`tasks.json`) — what was done, in numbers where possible. No fluff, no hedging beyond what's
actually uncertain. Examples:

- "Checked the 2026 Receipts folder. 2 new receipts added (Java House 1,200 KES Meals; Uber
  850 KES Travel). 1 already recorded, skipped as a duplicate."
- "Couldn't read the total on this fuel receipt — marked needs my OK."
- "Declined by you — no action taken."

Add one line to `data/log.json` for that action: `at`, `job`, `action` (what was actually done,
for someone debugging later), `result` (`passed` / `stuck` / `needs_ok`), and `text` (the
one-line plain summary shown on the page).

## For a receipt-scanning round specifically

Once all jobs picked this round are done, report:

- How many new receipts/invoices were added to `data/expenses.xlsx`.
- How many were already recorded and skipped as duplicates.
- How many needed Shayur's OK (and, briefly, why — e.g. "unclear amount" vs "vendor conflict").

If more than one job ran this round, end with one combined line, e.g.: "Round done: 2 new
receipts added, 1 duplicate skipped, 1 needs your OK."

## Don't pad the log

If a round genuinely did nothing (no jobs waiting, nothing to check), it's fine to skip writing
a log line for that round — a log full of "nothing happened" entries is noise, not signal.
