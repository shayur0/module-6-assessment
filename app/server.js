// Ledger's small back-end. No dependencies to install — uses only Node's built-ins.
// Serves the web page and a tiny JSON API on top of ../tasks.json and ../data/*.json.

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const TASKS_FILE = path.join(ROOT, "tasks.json");
const LOG_FILE = path.join(ROOT, "data", "log.json");
const LEARNINGS_FILE = path.join(ROOT, "data", "learnings.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = 8787;

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

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

function serveStatic(req, res) {
  let reqPath = req.url === "/" ? "/index.html" : req.url;
  reqPath = reqPath.split("?")[0];
  const filePath = path.join(PUBLIC_DIR, reqPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
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

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  try {
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
