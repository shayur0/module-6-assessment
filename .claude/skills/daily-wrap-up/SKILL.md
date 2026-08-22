---
name: daily-wrap-up
description: Reads today's notes from notes/ and writes a short dated summary (Done / Doing / Next) to logs/. Use at the end of the day (6pm weekday schedule), right after a note is saved in notes/, or whenever Shayur asks for a wrap-up.
---

# Daily Wrap-Up

## When to use this

- Every weekday at 6:00pm (scheduled — see the loop that runs this).
- Right after a file is saved in `notes/` (event-triggered — see the hook that runs this).
- Anytime Shayur asks for a wrap-up of today.

## Steps

1. Figure out today's date.
2. Read every file in `notes/` that was modified today. If nothing was modified today, read the
   most recently modified note file instead — don't just skip silently.
3. Pull out what's actually written there — never invent activity that isn't in the notes. Sort
   it into three short lists:
   - **Done** — finished today
   - **Doing** — in progress / partially done
   - **Next** — planned but not started yet
4. Write (or overwrite) `logs/<YYYY-MM-DD>.md` with those three lists, dated.
5. If `notes/` has nothing for today, write a short honest line saying so rather than padding
   out a summary that isn't real.

## Example

Given `notes/2026-07-15.md` containing:

```
- Fixed the note-input bug on Ledger's web page
- Resolved the Spring Valley Fuel receipt ambiguity (confirmed 6,000 KES)
- Still need to: resolve the other 5 needs-OK jobs
- Next: decide on the live 5-minute loop
```

Write `logs/2026-07-15.md`:

```markdown
# Daily Wrap-Up — 2026-07-15

**Done**
- Fixed the note-input bug on Ledger's web page
- Resolved the Spring Valley Fuel receipt ambiguity (confirmed 6,000 KES)

**Doing**
- Resolving the remaining 5 needs-OK jobs

**Next**
- Decide on the live 5-minute loop
```
