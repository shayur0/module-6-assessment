// Sample/demo seed data for the public repo — structurally identical to how a real Drive
// folder scan would populate things, but every vendor, amount, and account number here is
// fictional. Not part of the regular bot loop; run once to produce a demo state.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { writeXlsx } = require("../app/lib/xlsx");

const ROOT = path.join(__dirname, "..");
const EXPENSES_FILE = path.join(ROOT, "data", "expenses.xlsx");
const TASKS_FILE = path.join(ROOT, "tasks.json");
const LOG_FILE = path.join(ROOT, "data", "log.json");

const HEADERS = ["Date", "Vendor/Client", "Amount", "Currency", "Category", "Type", "Status", "Source File", "Notes"];

const okRows = [
  ["2025-06-06", "Acme Fuel Station", 5400, "KES", "Transport (Fuel)", "Expense", "OK", "Sample Receipts Jun-Dec 2025.pdf", "Diesel purchase; cash tendered 5400, change due 0"],
  ["2025-06-20", "Bistro Nine", 3850, "KES", "Meals", "Expense", "OK", "Sample Receipts Jun-Dec 2025.pdf", "Dine in - drinks/mains; Till 44210"],
  ["2025-09-21", "Riverside Books Ltd", 7920, "KES", "Office Supplies", "Expense", "OK", "Sample Receipts Jun-Dec 2025.pdf", "Downtown branch; stationery/books; paid via MPESA"],
  ["2025-10-15", "Northgate Hardware Ltd", 8600, "KES", "Household/Hardware", "Expense", "OK", "Sample Receipts Jun-Dec 2025.pdf", "2x heavy-duty padlocks; paid cash; Bill No. 22014"],
  ["2025-04-05", "Greenfield Apartments Ltd", 58500, "KES", "Rent", "Expense", "OK", "Sample Rent Receipts April-August 2025.pdf", "Invoice #101 for April 2025"],
  ["2025-05-07", "Greenfield Apartments Ltd", 58500, "KES", "Rent", "Expense", "OK", "Sample Rent Receipts April-August 2025.pdf", "Invoice #106 for May 2025"],
  ["2025-06-10", "Greenfield Apartments Ltd", 58500, "KES", "Rent", "Expense", "OK", "Sample Rent Receipts April-August 2025.pdf", "Invoice #112 for June 2025"],
  ["2025-07-10", "Greenfield Apartments Ltd", 195000, "KES", "Rent", "Expense", "OK", "Sample Rent Receipts April-August 2025.pdf", "Invoice #115 for July 2025 - rent jumped from ~58,500 to 195,000; figure is clearly printed but worth confirming the increase is expected"],
  ["2025-08-12", "Greenfield Apartments Ltd", 195000, "KES", "Rent", "Expense", "OK", "Sample Rent Receipts April-August 2025.pdf", "Invoice #121 for August 2025"],
  ["2025-04-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-05-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-06-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-07-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-08-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-09-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-10-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-11-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
  ["2025-12-07", "NetLink Internet Services Ltd", 7100, "KES", "Internet/Utilities", "Expense", "OK", "Sample Internet Invoices Apr-Dec 2025.pdf", "Monthly residential internet - paid in full"],
];

const needsReviewRows = [
  ["2025-08-20 (approx)", "Acme Fuel Station", "~6,400 (unclear)", "KES", "Transport (Fuel)", "Expense", "NEEDS REVIEW", "Sample Receipts Jun-Dec 2025.pdf", "Diesel @175/L; a tendered amount near 6,400 is legible but the total, VAT and change-due figures are too garbled by OCR to trust"],
  ["2025-12-08 or 2025-12-03", "Acme Fuel Station", 4300, "KES", "Transport (Fuel)", "Expense", "NEEDS REVIEW", "Sample Receipts Jun-Dec 2025.pdf", "Amount is clear (4,300 cash tendered, 0 change) but the date conflicts: receipt header reads 08/12/2025, footer timestamp reads 03/12/2025 - please confirm which"],
  ["2025-08-17 (day unclear)", "Cafe Meridian Ltd", "3,240 or 3,280", "KES", "Meals", "Expense", "NEEDS REVIEW", "Sample Receipts Jun-Dec 2025.pdf", "Date printed as '17d/25' - day of month unclear. Net amount line reads 3,280, MPESA payment line reads 3,240 - the two don't match"],
  ["2025-09-12 (year unclear)", "Cafe Meridian Ltd", "540 or 720", "KES", "Meals", "Expense", "NEEDS REVIEW", "Sample Receipts Jun-Dec 2025.pdf", "Item total reads 720, but the MPESA payment line reads 540 - mismatch. Year printed as '26', almost certainly should be '25'"],
  ["2029-08-16 (invalid date as written)", "Urban Loft Boutique", "18,000 or 19,000 (of 40,000 total)", "KES", "Furniture", "Expense", "NEEDS REVIEW", "Sample Receipts Jun-Dec 2025.pdf", "Handwritten receipt for a shelving unit. Date as written is '29 16/08/2029', not a valid date. Deposit written both as 18,000 and 19,000 against a total of 40,000 - please check the original"],
  ["2025-05-12", "SecureLife Insurance or CityPower?", 6900, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "File is named for the utility company, but every MPESA SMS in the screenshot names 'SecureLife Insurance' as payee - can't tell if this is electricity or insurance"],
  ["2025-06-20", "SecureLife Insurance or CityPower?", 6050, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as row above"],
  ["2025-07-29", "SecureLife Insurance or CityPower?", 8700, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as row above"],
  ["2025-09-16", "SecureLife Insurance or CityPower?", 7750, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as row above"],
  ["2025-10-16", "SecureLife Insurance or CityPower?", 12600, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as row above"],
  ["2025-12-15", "SecureLife Insurance or CityPower?", 4150, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as row above"],
  ["2026-01-23", "SecureLife Insurance or CityPower?", 11200, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as row above"],
  ["Unknown date", "SecureLife Insurance or CityPower?", 7500, "KES", "Insurance or Utilities", "Expense", "NEEDS REVIEW", "Sample Utility Payment Confirmations Apr-Dec 2025.png", "Same vendor-name conflict as rows above, and this last message in the screenshot has no visible date/time stamp"],
];

const allRows = [HEADERS, ...okRows, ...needsReviewRows];
writeXlsx(EXPENSES_FILE, "Expenses", allRows);
console.log(`Wrote ${okRows.length} OK rows + ${needsReviewRows.length} needs-review rows to ${EXPENSES_FILE}`);

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
