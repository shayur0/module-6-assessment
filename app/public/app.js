const STATUS_LABEL = {
  waiting: "waiting",
  working: "working on it",
  done: "done",
  stuck: "stuck",
  needs_ok: "needs my OK",
};

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function timeAgo(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function jobCard(job) {
  const status = job.status in STATUS_LABEL ? job.status : "waiting";
  const notesHtml = (job.notes || []).map((n) => `
    <div class="note"><b>${n.author === "user" ? "You" : "Ledger"}:</b> ${escapeHtml(n.text)}</div>
  `).join("");

  const reportHtml = job.report
    ? `<div class="job-report">${escapeHtml(job.report)}</div>`
    : "";

  const needsOkHtml = status === "needs_ok" && job.needsOk
    ? `<div class="job-report">${escapeHtml(job.needsOk.question || "Ledger needs your OK before continuing.")}</div>
       <div class="job-actions">
         <button class="yes-btn" data-id="${job.id}">Yes, go ahead</button>
         <button class="no-btn danger" data-id="${job.id}">No, don't</button>
       </div>`
    : "";

  return `
    <div class="job-card" data-id="${job.id}">
      <div class="job-top">
        <span class="job-title">${escapeHtml(job.title)}</span>
        <span>
          <span class="badge priority-${job.priority}">${job.priority}</span>
          <span class="badge status-${status}">${STATUS_LABEL[status]}</span>
        </span>
      </div>
      ${job.description ? `<div class="job-desc">${escapeHtml(job.description)}</div>` : ""}
      ${reportHtml}
      ${needsOkHtml}
      <div class="job-meta">added ${timeAgo(job.createdAt)} · updated ${timeAgo(job.updatedAt)}</div>
      <div class="notes">${notesHtml}</div>
      <form class="note-form" data-id="${job.id}">
        <input type="text" placeholder="Add a note (job, question, or correction)" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;
}

function captureNoteDrafts() {
  const drafts = new Map();
  let focusedJobId = null;
  document.querySelectorAll(".note-form input").forEach((input) => {
    if (input.value) drafts.set(input.closest(".note-form").dataset.id, input.value);
    if (document.activeElement === input) focusedJobId = input.closest(".note-form").dataset.id;
  });
  return { drafts, focusedJobId };
}

function restoreNoteDrafts({ drafts, focusedJobId }) {
  document.querySelectorAll(".note-form").forEach((form) => {
    const draft = drafts.get(form.dataset.id);
    if (!draft) return;
    const input = form.querySelector("input");
    input.value = draft;
    if (form.dataset.id === focusedJobId) {
      input.focus();
      input.setSelectionRange(draft.length, draft.length);
    }
  });
}

async function loadJobs() {
  // Skip this refresh entirely if the user is mid-typing a note — don't yank their focus/text.
  const { focusedJobId } = captureNoteDrafts();
  if (focusedJobId) return;

  const res = await fetch("/api/jobs");
  const { jobs } = await res.json();

  const draftState = captureNoteDrafts();

  const needsOk = jobs.filter((j) => j.status === "needs_ok");
  const rest = jobs.filter((j) => j.status !== "needs_ok");

  const needsOkSection = document.getElementById("needs-ok-section");
  const needsOkList = document.getElementById("needs-ok-list");
  if (needsOk.length) {
    needsOkSection.classList.remove("hidden");
    needsOkList.innerHTML = needsOk.map(jobCard).join("");
  } else {
    needsOkSection.classList.add("hidden");
    needsOkList.innerHTML = "";
  }

  const jobList = document.getElementById("job-list");
  jobList.innerHTML = rest.length
    ? rest.map(jobCard).join("")
    : `<div class="empty">No jobs yet — add one above.</div>`;

  bindJobEvents();
  restoreNoteDrafts(draftState);
}

async function loadLog() {
  const res = await fetch("/api/log");
  const { entries } = await res.json();
  const logList = document.getElementById("log-list");
  logList.innerHTML = entries.length
    ? entries.map((e) => `
        <div class="log-line"><span class="log-time">${escapeHtml(timeAgo(e.at))}</span>${escapeHtml(e.text)}</div>
      `).join("")
    : `<div class="empty">Nothing logged yet.</div>`;
}

function bindJobEvents() {
  document.querySelectorAll(".yes-btn").forEach((btn) => {
    btn.addEventListener("click", () => decide(btn.dataset.id, "yes"));
  });
  document.querySelectorAll(".no-btn").forEach((btn) => {
    btn.addEventListener("click", () => decide(btn.dataset.id, "no"));
  });
  document.querySelectorAll(".note-form").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const text = input.value.trim();
      if (!text) return;
      await fetch(`/api/jobs/${form.dataset.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      input.value = "";
      loadJobs();
    });
  });
}

async function decide(id, decision) {
  await fetch(`/api/jobs/${id}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  });
  loadJobs();
}

document.getElementById("job-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("job-title").value.trim();
  const description = document.getElementById("job-description").value.trim();
  const priority = document.getElementById("job-priority").value;
  if (!title) return;

  await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, priority }),
  });

  document.getElementById("job-title").value = "";
  document.getElementById("job-description").value = "";
  loadJobs();
});

document.getElementById("ask-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("ask-input");
  const output = document.getElementById("ask-output");
  const message = input.value.trim();
  if (!message) return;

  output.classList.remove("hidden");
  output.textContent = "Thinking…";

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  const data = await res.json().catch(() => ({}));
  output.textContent = res.ok ? data.reply : `Error: ${data.error || "something went wrong."}`;
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.href = "/login";
});

loadJobs();
loadLog();
setInterval(loadJobs, 4000);
setInterval(loadLog, 8000);
