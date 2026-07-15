---
name: scan-receipts
description: Scan the "Receipts" Google Drive folder for new receipts/invoices not yet recorded in data/expenses.xlsx, extract their fields, and add rows for anything new — skipping anything already recorded and flagging anything unclear. This is Ledger's recipe for the regular job "Scan my Receipts folder."
---

# Scan Receipts

## Where things are

- Source folder: Google Drive folder **"Receipts"**, id `YOUR_DRIVE_FOLDER_ID`.
- Destination: `data/expenses.xlsx`, columns in order: `Date, Vendor/Client, Amount, Currency,
  Category, Type, Status, Source File, Notes`.
- Read/write it with `app/lib/xlsx.js` (`readXlsx`, `appendRows`) — don't hand-roll spreadsheet
  parsing.
- Check `data/learnings.json` first for any vendor→category corrections Shayur has already
  taught Ledger, and apply them without asking again.

## Important: files here are consolidated

A single file in this folder is often **many receipts/invoices bundled together** (e.g. one PDF
covering six months of fuel receipts, or one screenshot with eight separate MPESA payment
confirmations). Always treat each **individual receipt/invoice/line item inside a file** as its
own candidate row — never treat "one file" as "one receipt."

## Steps

1. List the folder's files: `mcp__claude_ai_Google_Drive__search_files` with query
   `parentId = 'YOUR_DRIVE_FOLDER_ID'`.
2. Read each file's full content (`mcp__claude_ai_Google_Drive__read_file_content` if the search
   snippet looks truncated) and pull out every individual receipt/invoice inside it: date,
   vendor/client, amount, currency, and whether it's an expense or income.
3. Read the current rows of `data/expenses.xlsx` with `readXlsx`.
4. For each candidate line item, check for a duplicate by matching **Source File + Date +
   Amount + Vendor** against existing rows. If it already matches a row, skip it — do not add a
   second row for it.
5. Pick a plain-English category (Travel, Meals, Software, Office Supplies, Rent,
   Internet/Utilities, Insurance, Household/Hardware, Furniture, etc.) — checking
   `data/learnings.json` first for any vendor-specific override.
6. If the date, amount, and vendor are all clearly legible: append a row with `Status` = `OK`
   via `appendRows`.
7. If anything is blurry, missing, or conflicting (two different readings for the same figure,
   an invalid/ambiguous date, an unclear vendor name): **do not pick a number and move on.**
   Follow the `flag-ambiguous-receipt` skill instead — it adds a `NEEDS REVIEW` row and creates
   the right job on the web page.
8. When the scan is done, hand off to the `round-summary` skill to report what happened.

## Never

- Never guess a date, amount, vendor, or category you can't clearly read — that's what
  `flag-ambiguous-receipt` is for.
- Never add a duplicate row for something already recorded.
- Never treat a multi-receipt file as a single transaction.
