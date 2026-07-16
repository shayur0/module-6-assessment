// Sample/demo expense rows for the public repo — every vendor, amount, and account number
// here is fictional. Used two ways:
//   1. scripts/seed-demo-data.js — writes this into data/expenses.xlsx on demand, locally.
//   2. server.js — auto-writes this into data/expenses.xlsx at startup, but ONLY if that file
//      doesn't already exist (e.g. on a fresh deploy, where the real file is gitignored and
//      never pushed). Your real local data is never touched or overwritten by this.

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

const EXPENSE_ROWS = [HEADERS, ...okRows, ...needsReviewRows];

module.exports = { EXPENSE_ROWS };
