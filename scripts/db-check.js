const { pool, query } = require("../app/lib/db");

async function main() {
  const tables = await query(
    `select table_name from information_schema.tables
     where table_schema = 'public' order by table_name`
  );
  console.log("Connected. Tables:", tables.rows.map((r) => r.table_name).join(", "));

  const { rows: [vendor] } = await query(
    `insert into vendors (name) values ($1) returning id, name, created_at`,
    ["Kenya Power/KPLC"]
  );
  console.log("Inserted vendor:", vendor);

  const { rows: [expense] } = await query(
    `insert into expenses (vendor_id, date, amount, currency, category, status, source_file)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, date, amount, currency, category, status, created_at`,
    [vendor.id, "2026-08-01", 42.50, "USD", "Utilities", "OK", "sample-receipt.pdf"]
  );
  console.log("Inserted linked expense:", expense);

  const { rows: joined } = await query(
    `select v.name as vendor, e.date, e.amount, e.currency, e.category, e.status
     from expenses e
     join vendors v on v.id = e.vendor_id
     where e.id = $1`,
    [expense.id]
  );
  console.log("Read back with join:", joined[0]);

  await pool.end();
}

main().catch((err) => {
  console.error("db:check failed:", err.message);
  process.exit(1);
});
