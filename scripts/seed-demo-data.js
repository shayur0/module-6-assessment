// Sample/demo seed data for the public repo — structurally identical to how a real Drive
// folder scan would populate things, but every vendor, amount, and account number here is
// fictional. Not part of the regular bot loop; run once to produce a demo state.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeXlsx } = require("../app/lib/xlsx");
const { EXPENSE_ROWS } = require("../app/lib/demo-data");

const ROOT = path.join(__dirname, "..");
const EXPENSES_FILE = path.join(ROOT, "data", "expenses.xlsx");
const TASKS_FILE = path.join(ROOT, "tasks.json");
const LOG_FILE = path.join(ROOT, "data", "log.json");

writeXlsx(EXPENSES_FILE, "Expenses", EXPENSE_ROWS);
console.log(`Wrote ${EXPENSE_ROWS.length - 1} rows to ${EXPENSES_FILE}`);

const now = new Date().toISOString();
function job({ title, description, question }) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    priority: "Medium",
    status: "needs_ok",
    createdAt: now,
    updatedAt: now,
    report: "",
    notes: [],
    verifier: null,
    needsOk: { question },
  };
}

const jobs = [
  job({
    title: "Confirm fuel receipt amount (~Aug 20, 2025, Acme Fuel Station)",
    description: "Diesel @175/L. A tendered amount near 6,400 is legible but the total, VAT and change-due figures are too garbled by OCR to trust. Source: Sample Receipts Jun-Dec 2025.pdf.",
    question: "What was the actual total for this fuel purchase? I won't guess a number I can't clearly read.",
  }),
  job({
    title: "Confirm date on fuel receipt (Acme Fuel Station, 4,300 KES)",
    description: "Amount is clear (4,300 cash tendered, 0 change), but the date conflicts: receipt header reads 08/12/2025, footer timestamp reads 03/12/2025. Source: Sample Receipts Jun-Dec 2025.pdf.",
    question: "Was this on 8 Dec 2025 or 3 Dec 2025?",
  }),
  job({
    title: "Confirm Cafe Meridian receipt (~Aug 17, 2025) - amount and date",
    description: "Date printed as '17d/25' - day of month unclear. Net amount line reads 3,280, MPESA payment line reads 3,240 - the two don't match. Source: Sample Receipts Jun-Dec 2025.pdf.",
    question: "Which amount is right, 3,240 or 3,280 - and what's the exact date?",
  }),
  job({
    title: "Confirm Cafe Meridian receipt (~Sep 12) - amount and year",
    description: "Item total reads 720, but the MPESA payment line reads 540 - mismatch. Year printed as '26', almost certainly should be '25'. Source: Sample Receipts Jun-Dec 2025.pdf.",
    question: "Which amount is right, 540 or 720 - and can you confirm the year is 2025?",
  }),
  job({
    title: "Confirm Urban Loft Boutique deposit - amount and date",
    description: "Handwritten receipt for a shelving unit. Date as written is '29 16/08/2029', not a valid date. Deposit written both as 18,000 and 19,000 against a total of 40,000. Source: Sample Receipts Jun-Dec 2025.pdf.",
    question: "Was the deposit 18,000 or 19,000 (of 40,000 total), and what's the real date?",
  }),
  job({
    title: "Confirm vendor for 8 recurring MPESA payments: SecureLife Insurance or CityPower?",
    description: "File is named for the utility company, but every MPESA SMS in the screenshot names 'SecureLife Insurance' as the payee. Affects 8 transactions: 12 May 2025 (6,900), 20 Jun 2025 (6,050), 29 Jul 2025 (8,700), 16 Sep 2025 (7,750), 16 Oct 2025 (12,600), 15 Dec 2025 (4,150), 23 Jan 2026 (11,200), and one with no visible date (7,500). Source: Sample Utility Payment Confirmations Apr-Dec 2025.png.",
    question: "Are these 8 payments actually to SecureLife Insurance, or is that just how the utility company shows up in your MPESA messages? One answer resolves all 8 rows.",
  }),
];

const scanJob = {
  id: crypto.randomUUID(),
  title: "Scan Receipts folder for new receipts/invoices",
  description: "Check the Google Drive Receipts folder for anything not yet recorded in data/expenses.xlsx, and add rows for anything new.",
  priority: "Medium",
  status: "done",
  createdAt: now,
  updatedAt: now,
  report: "Checked the Receipts Drive folder (4 files). All 31 receipt/invoice line items in it are already recorded in expenses.xlsx (18 confirmed, 13 needs-review) - nothing new to add, no duplicates created. The 6 needs-OK jobs already in the queue cover every unclear item found.",
  notes: [],
  verifier: { completeness: 5, accuracy: 5, usability: 5, overall: 5, verdict: "PASS", notes: "Independently re-queried Drive and re-read expenses.xlsx/tasks.json; all counts, amounts, vendors, dates matched." },
  needsOk: null,
};

const tasksData = { jobs: [...jobs, scanJob] };
fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2) + "\n");
console.log(`Wrote ${jobs.length} needs-OK jobs + 1 done job to tasks.json`);

const logData = {
  entries: [
    {
      at: now,
      job: "Seed expenses.xlsx",
      action: "Seeded data/expenses.xlsx with 18 confirmed rows and 13 needs-review rows from a sample Drive folder scan. Created 6 needs-OK jobs so open questions can be answered on the web page.",
      result: "needs_ok",
      text: "Seeded expenses.xlsx from sample data: 18 confirmed, 13 need review (6 jobs created).",
    },
    {
      at: now,
      job: scanJob.title,
      action: "task-doer scanned the sample Receipts Drive folder and compared it against expenses.xlsx; verifier independently re-checked the Drive folder, the spreadsheet, and tasks.json.",
      result: "passed",
      text: "Scanned Receipts folder: 0 new receipts (all 31 already recorded), 0 duplicates created. Verifier score 5/5/5 - PASS.",
    },
  ],
};
fs.writeFileSync(LOG_FILE, JSON.stringify(logData, null, 2) + "\n");
console.log("Wrote sample log entries.");
