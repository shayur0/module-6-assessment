---
name: flag-ambiguous-receipt
description: Recipe for handling a receipt/invoice that's blurry, missing an amount, or has a conflicting/ambiguous reading. Never guesses a number — records exactly what could and couldn't be read, adds a NEEDS REVIEW row to expenses.xlsx, and creates one specific "needs my OK" job so Shayur can resolve it with one click or a short note. Use this whenever scan-receipts (or any job) hits something unreadable or ambiguous.
---

# Flag an Ambiguous Receipt

## The rule this exists to protect

**Never invent or guess a dollar/shilling amount, date, or vendor name.** If you can't read it
with confidence, that's not a job for judgment — it's a job for asking Shayur.

## Steps

1. Write down exactly what you *could* read, and exactly what's in conflict or missing. If two
   readings disagree (e.g. a net-amount line says 4,460 and an MPESA line says 4,450), record
   both — don't average them or pick the "more likely" one.
2. Add a row to `data/expenses.xlsx` (via `appendRows`) with:
   - `Amount` as the literal ambiguous text (e.g. `"4,450 or 4,460"`, `"~6,000 (unclear)"`) —
     never a single invented number.
   - `Status` = `NEEDS REVIEW`.
   - `Notes` explaining precisely what's unclear and where it came from (which line/field
     conflicts with which).
3. Create a job in `tasks.json` with `status: "needs_ok"` and a `needsOk.question` that Shayur
   can answer in one short reply (a number, a date, or yes/no) — not a vague "please check this."
4. **Bundle repeats of the same question.** If one ambiguity affects several transactions (e.g.
   a vendor-name conflict that shows up on 8 separate payments), create **one** job covering all
   of them with a single question — don't ask the same thing 8 times.
5. Leave the row and the job as-is until Shayur answers. When he clicks Yes/No or leaves a note
   on the job, the next round's "Look" step picks it up: update the `Amount`/`Date`/`Vendor` and
   `Status` in `data/expenses.xlsx` to match his answer, save the correction to
   `data/learnings.json` if it's the kind of thing that will recur (e.g. a vendor's true name or
   category), and mark the job done.
