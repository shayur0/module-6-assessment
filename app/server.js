// Ledger's small back-end. No dependencies to install — uses only Node's built-ins.
// Serves the web page and a tiny JSON API on top of ../tasks.json and ../data/*.json.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { readXlsx, writeXlsx } = require("./lib/xlsx");
const { EXPENSE_ROWS } = require("./lib/demo-data");

const ROOT = path.join(__dirname, "..");

try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  // No .env file — fine on a host where env vars are set in the platform's dashboard instead.
}

const TASKS_FILE = path.join(ROOT, "tasks.json");
const EXPENSES_FILE = path.join(ROOT, "data", "expenses.xlsx");

// data/expenses.xlsx holds real financial data and is gitignored on purpose — it never gets
// pushed. On a fresh deploy (or anywhere else that file is missing) seed a fictional demo
// spreadsheet instead, so Ask Ledger has something real to reason over. Never touches an
// expenses.xlsx that already exists (e.g. your real local data).
if (!fs.existsSync(EXPENSES_FILE)) {
  fs.mkdirSync(path.dirname(EXPENSES_FILE), { recursive: true });
  writeXlsx(EXPENSES_FILE, "Expenses", EXPENSE_ROWS);
  console.log("data/expenses.xlsx was missing — seeded a fictional demo spreadsheet instead.");
}
const LOG_FILE = path.join(ROOT, "data", "log.json");
const LEARNINGS_FILE = path.join(ROOT, "data", "learnings.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = process.env.PORT || 8787;

const SESSION_COOKIE = "ledger_session";
const sessions = new Set();
const PUBLIC_PATHS = new Set(["/login", "/style.css", "/favicon.ico"]);

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function sortJobs(jobs) {
  const order = { High: 0, Medium: 1, Low: 2 };
  return [...jobs].sort((a, b) => {
    const p = (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    if (p !== 0) return p;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = "";
    req.on("data", (c) => (chunks += c));
    req.on("end", () => {
      if (!chunks) return resolve({});
      try {
        resolve(JSON.parse(chunks));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function isAuthed(req) {
  const token = getCookie(req, SESSION_COOKIE);
  return Boolean(token && sessions.has(token));
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function serveStatic(req, res) {
  let reqPath = req.url === "/" ? "/index.html" : req.url;
  reqPath = reqPath.split("?")[0];
  const filePath = path.join(PUBLIC_DIR, reqPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  serveFile(res, filePath);
}

// Category totals from data/expenses.xlsx, grouped by currency (skips NEEDS REVIEW rows —
// same rule the bot itself follows: never fold an unclear number into a total).
function summarizeExpenses() {
  let rows;
  try {
    rows = readXlsx(EXPENSES_FILE);
  } catch {
    return null;
  }
  if (rows.length < 2) return null;

  const header = rows[0];
  const col = (name) => header.indexOf(name);
  const catI = col("Category");
  const amtI = col("Amount");
  const curI = col("Currency");
  const typeI = col("Type");
  const statusI = col("Status");

  const totals = new Map();
  for (const row of rows.slice(1)) {
    if (row[statusI] === "NEEDS REVIEW") continue;
    const key = `${row[typeI]} · ${row[catI]} (${row[curI]})`;
    totals.set(key, (totals.get(key) || 0) + (Number(row[amtI]) || 0));
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, total]) => `${key}: ${total.toFixed(2)}`)
    .join("\n");
}

async function callLedgerAI(message) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY is not set on the server."), { status: 500 });
  }

  const expenseSummary = summarizeExpenses();
  const userContent = expenseSummary
    ? `Current expense/income totals by type, category, and currency (from data/expenses.xlsx):\n${expenseSummary}\n\nQuestion: ${message}`
    : message;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are Ledger, a personal bookkeeping assistant. Style: short and clear, like a " +
        "careful accountant — no fluff. You may be given current totals from the user's real " +
        "expense spreadsheet as context — use them to answer. Never invent a dollar amount, " +
        "date, or vendor you aren't given; ask a short clarifying question instead of guessing.",
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw Object.assign(new Error(`Anthropic API error (${response.status}): ${text}`), { status: 502 });
  }

  const data = await response.json();
  return (data.content || []).map((block) => block.text || "").join("\n").trim();
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  try {
    // --- Auth gate -------------------------------------------------------
    if (url === "/login" && req.method === "GET") {
      return serveFile(res, path.join(PUBLIC_DIR, "login.html"));
    }

    if (url === "/api/login" && req.method === "POST") {
      const body = await readBody(req);
      const username = (body.username || "").trim();
      const password = body.password || "";
      const expectedUser = process.env.APP_USERNAME;
      const expectedPass = process.env.APP_PASSWORD;

      if (!expectedUser || !expectedPass) {
        return sendJson(res, 500, { error: "APP_USERNAME / APP_PASSWORD are not set on the server." });
      }

      if (username !== expectedUser || password !== expectedPass) {
        return sendJson(res, 401, { error: "Invalid username or password." });
      }

      const token = crypto.randomBytes(24).toString("hex");
      sessions.add(token);
      res.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );
      return sendJson(res, 200, { ok: true });
    }

    if (url === "/api/logout" && req.method === "POST") {
      const token = getCookie(req, SESSION_COOKIE);
      if (token) sessions.delete(token);
      res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
      return sendJson(res, 200, { ok: true });
    }

    if (!PUBLIC_PATHS.has(url) && !isAuthed(req)) {
      if (url.startsWith("/api/")) return sendJson(res, 401, { error: "Not logged in." });
      res.writeHead(302, { Location: "/login" });
      return res.end();
    }

    // --- Ask Ledger (calls the AI API server-side) ------------------------
    if (url === "/api/ask" && req.method === "POST") {
      const body = await readBody(req);
      const message = (body.message || "").trim();
      if (!message) return sendJson(res, 400, { error: "Message is required." });
      try {
        const reply = await callLedgerAI(message);
        return sendJson(res, 200, { reply });
      } catch (err) {
        return sendJson(res, err.status || 500, { error: err.message });
      }
    }

    // --- Job board API -----------------------------------------------------
    if (url === "/api/jobs" && req.method === "GET") {
      const { jobs } = readJson(TASKS_FILE, { jobs: [] });
      return sendJson(res, 200, { jobs: sortJobs(jobs) });
    }

    if (url === "/api/jobs" && req.method === "POST") {
      const body = await readBody(req);
      const title = (body.title || "").trim();
      const description = (body.description || "").trim();
      const priority = ["High", "Medium", "Low"].includes(body.priority) ? body.priority : "Medium";
      if (!title) return sendJson(res, 400, { error: "Title is required." });

      const data = readJson(TASKS_FILE, { jobs: [] });
      const now = new Date().toISOString();
      const job = {
        id: crypto.randomUUID(),
        title,
        description,
        priority,
        status: "waiting",
        createdAt: now,
        updatedAt: now,
        report: "",
        notes: [],
        verifier: null,
        needsOk: null,
      };
      data.jobs.push(job);
      writeJson(TASKS_FILE, data);
      return sendJson(res, 201, { job });
    }

    const decisionMatch = url.match(/^\/api\/jobs\/([^/]+)\/decision$/);
    if (decisionMatch && req.method === "POST") {
      const body = await readBody(req);
      const decision = body.decision === "yes" ? "yes" : body.decision === "no" ? "no" : null;
      if (!decision) return sendJson(res, 400, { error: "decision must be 'yes' or 'no'." });

      const data = readJson(TASKS_FILE, { jobs: [] });
      const job = data.jobs.find((j) => j.id === decisionMatch[1]);
      if (!job) return sendJson(res, 404, { error: "Job not found." });

      job.updatedAt = new Date().toISOString();
      job.notes.push({
        text: decision === "yes" ? "You clicked Yes — go ahead." : "You clicked No — don't do it.",
        author: "user",
        at: job.updatedAt,
      });
      if (decision === "yes") {
        job.status = "waiting";
      } else {
        job.status = "stuck";
        job.report = "Declined by you — no action taken.";
      }
      job.needsOk = null;
      writeJson(TASKS_FILE, data);
      return sendJson(res, 200, { job });
    }

    const noteMatch = url.match(/^\/api\/jobs\/([^/]+)\/notes$/);
    if (noteMatch && req.method === "POST") {
      const body = await readBody(req);
      const text = (body.text || "").trim();
      if (!text) return sendJson(res, 400, { error: "Note text is required." });

      const data = readJson(TASKS_FILE, { jobs: [] });
      const job = data.jobs.find((j) => j.id === noteMatch[1]);
      if (!job) return sendJson(res, 404, { error: "Job not found." });

      job.updatedAt = new Date().toISOString();
      job.notes.push({ text, author: "user", at: job.updatedAt });
      writeJson(TASKS_FILE, data);
      return sendJson(res, 200, { job });
    }

    if (url === "/api/log" && req.method === "GET") {
      const { entries } = readJson(LOG_FILE, { entries: [] });
      return sendJson(res, 200, { entries: [...entries].reverse() });
    }

    if (url === "/api/learnings" && req.method === "GET") {
      const { corrections } = readJson(LEARNINGS_FILE, { corrections: [] });
      return sendJson(res, 200, { corrections: [...corrections].reverse() });
    }

    if (req.method === "GET") return serveStatic(req, res);

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    sendJson(res, 500, { error: String(err && err.message ? err.message : err) });
  }
});

server.listen(PORT, () => {
  console.log(`Ledger's web page is running at http://localhost:${PORT}`);
});
