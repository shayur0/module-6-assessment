// "Learn": save Shayur's corrections so the same mistake doesn't happen twice.

const fs = require("fs");
const crypto = require("crypto");

function addCorrection({ learningsFile, logFile, vendorPattern, note, sourceJobId = null, now = new Date() }) {
  const nowIso = now.toISOString();
  const learningsData = JSON.parse(fs.readFileSync(learningsFile, "utf8"));

  const correction = { id: crypto.randomUUID(), vendorPattern, note, sourceJobId, at: nowIso };
  learningsData.corrections.push(correction);
  fs.writeFileSync(learningsFile, JSON.stringify(learningsData, null, 2) + "\n");

  const logData = JSON.parse(fs.readFileSync(logFile, "utf8"));
  logData.entries.push({
    at: nowIso,
    job: sourceJobId || "Learning",
    action: `Saved a correction: ${note}`,
    result: "passed",
    text: `Learned: ${note}`,
  });
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2) + "\n");

  return correction;
}

// Returns the most recent matching correction for a vendor name, or null.
function findCorrection(learnings, vendorName) {
  const v = (vendorName || "").toLowerCase();
  const matches = learnings.corrections.filter((c) => v.includes(c.vendorPattern.toLowerCase()));
  return matches.length ? matches[matches.length - 1] : null;
}

module.exports = { addCorrection, findCorrection };
