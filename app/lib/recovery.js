// "Stay healthy": if a round got interrupted mid-job (crash, closed window, etc.), a job can be
// left stuck in "working" forever. Call this at the start of every round's "Look" step to find
// and recover those before picking new work.

const fs = require("fs");

function recoverStaleJobs({ tasksFile, logFile, staleMinutes = 30, now = new Date() }) {
  const tasksData = JSON.parse(fs.readFileSync(tasksFile, "utf8"));
  const nowIso = now.toISOString();
  const staleMs = staleMinutes * 60 * 1000;

  const recovered = [];
  for (const job of tasksData.jobs) {
    if (job.status !== "working") continue;
    const age = now - new Date(job.updatedAt);
    if (age < staleMs) continue;

    job.status = "waiting";
    job.updatedAt = nowIso;
    job.notes.push({
      text: "Recovered — a previous round was interrupted while working on this job. Picking it back up.",
      author: "bot",
      at: nowIso,
    });
    recovered.push(job);
  }

  if (recovered.length) {
    fs.writeFileSync(tasksFile, JSON.stringify(tasksData, null, 2) + "\n");

    const logData = JSON.parse(fs.readFileSync(logFile, "utf8"));
    for (const job of recovered) {
      logData.entries.push({
        at: nowIso,
        job: job.title,
        action: "Found this job stuck in 'working on it' from an interrupted round; reset it to 'waiting' so it gets picked up again.",
        result: "stuck",
        text: `Recovered a stuck job: "${job.title}" — picking it back up next round.`,
      });
    }
    fs.writeFileSync(logFile, JSON.stringify(logData, null, 2) + "\n");
  }

  return recovered;
}

module.exports = { recoverStaleJobs };
