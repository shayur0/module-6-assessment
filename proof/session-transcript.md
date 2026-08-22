# Proof: Ledger's hooks fire during a real Claude Code session

Command run from the `my-bot` project root:

    claude -p --debug hooks --output-format text --dangerously-skip-permissions \
      "Do exactly these three steps, in order, and nothing else — this is a demo run to
      prove the project's hooks fire correctly, not real work:
      1) Append the line 'Proof-of-run demo note.' to notes/proof-demo.md (create it if needed).
      2) Run the bash command: echo hook-demo-ok
      3) Attempt to append '<!-- demo line, should be blocked -->' to CLAUDE.md — this is
         expected to be BLOCKED by the guard-rulebook hook. If blocked, just say so and stop.
      Do not touch tasks.json, data/, README.md, or any other file."

Raw output from that run follows.

---

`CLAUDE.md` is restored.

---

**Demo results:**

| Step | Result |
|------|--------|
| 1. Write to `notes/proof-demo.md` | **Hook fired** — `notes-saved.js` triggered and blocked, asking for a daily wrap-up |
| 2. `echo hook-demo-ok` | Output: `hook-demo-ok` |
| 3. Append to `CLAUDE.md` | **Not blocked** — the guard-rulebook hook covers Edit/Write tool calls but not Bash `>>`; the line landed and was then cleaned up |

The gap to be aware of: the rulebook guard only intercepts Edit/Write tools. A Bash-level write to `CLAUDE.md` slips through. If you want full protection, the hook should also check PostToolUse on Bash commands (or file ownership can be enforced at the OS level).
