# The Coach Folder

- [Simulation Modes](#simulation-modes)
- [Folder Structure](#folder-structure)
- [How to Replace the Company Context](#how-to-replace-the-company-context)
- [How to Add New Scenarios](#how-to-add-new-scenarios)
- [How to Change the Coach Persona](#how-to-change-the-coach-persona)
- [Local Deploy](#local-deploy)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)

---

This folder is the brain of the sales coaching application. Everything the AI coach does — how it behaves, what it evaluates, how it scores — is defined in these markdown files. No code changes are required to customise the coaching experience for a different company, product, or sales methodology.

The folder is designed to be portable. Drop it into a Claude project with no application and the files alone produce a functional text-based coach.

---

## Simulation Modes

Every session runs the same three-phase loop — Brief, Simulate, Debrief — but the simulation itself behaves differently depending on the mode selected at the start.

### Cold Call

The prospect opens the call with their scripted opening line. The rep responds and a back-and-forth conversation plays out in real time. The prospect stays in character throughout, raises objections naturally, and will not confirm a next step unless the rep earns one with a specific date and action. A timer runs for the duration of the call.

The rep can end the call at any point using the End Call button. The prospect may also end the call if they run out of patience or the rep achieves the session goal. Either way, the session moves to debrief.

**Voice mode (Chrome/Edge only):** A **Voice OFF** button appears in the call header. Click it to enable voice. Once on, a mic button appears next to the text input — click it and speak your response. The browser transcribes your speech and submits it automatically when you stop talking. The prospect's reply is spoken aloud using a voice matched to their gender. You can still type at any time while voice is enabled. Click **Voice ON** to turn it back off.

**What Rex evaluates:** Six Tier 1 rules (no interrupting, matched energy, name usage, outcome-led opener, three strikes, defined next step) and four Tier 2 craft categories. Scored out of 100. Any Tier 1 violation caps the total at 60.

### Cold Email

The rep writes one cold email — subject line and body. The prospect reads it and sends one reply. There is no back-and-forth; a cold email gets one chance to land.

The prospect's reply signals one of three outcomes:

- **WIN** — the prospect agrees to a specific meeting with a date and time
- **DRAW** — the prospect is engaged and wants more information but gives no commitment
- **LOSS** — the prospect declines, goes cold, or asks to be removed

The outcome is driven by the quality of the email. A sharp, personalized, outcome-led email with a specific ask earns a WIN or DRAW. A generic or vague email earns a DRAW or LOSS.

**What Rex evaluates:** Five email-specific Tier 1 rules (energy, name usage, outcome-led opener, defined next step, no pressure tactics) and Tier 2 craft rules covering subject line quality, scanability, single CTA, and personalization. Scored out of 100 across four categories: Tier 1 compliance (30), Subject line & opening (25), Personalization & relevance (25), CTA / next step (20). Any Tier 1 violation caps the total at 55. Rex explains what would have moved the outcome up a tier.

---

## Folder Structure

```
/coach
  identity.md          Who the coach is — name, personality, tone, behavioral rules
  rules.md             Cold call evaluation standards — Tier 1 and Tier 2 rules, scoring rubric
  email-rules.md       Cold email evaluation standards — email-specific Tier 1/2 rules, WIN/DRAW/LOSS, scoring rubric
  examples.md          Annotated call examples — strong call, Tier 1 failure, Tier 2 failure
  README.md            This file
  /reference
    company.md         The company context — product, ICP, objections, brand standards
    scenarios.md       Scenario library — prospect behavioral pools and difficulty tiers
    frameworks.md      Sales methodology the coach references during briefings and debriefs
```

Each file has one job. The application reads the relevant files at request time and injects them into the appropriate system prompts. `scenarios.md` is consumed once at session start to generate a prospect persona. All other files are read per API call as needed.

---

## How to Replace the Company Context

To deploy this coach for a different company, edit `reference/company.md`. That is the only file you need to change to get a functional coach for a different product and ICP.

Fields marked `REQUIRED` must be filled in — the coach will not work correctly without them. Fields marked `OPTIONAL` can be left or removed. Keep all section headings intact.

What to replace:
- Company name
- What you sell (plain language, outcome-focused — not a feature list)
- ICP (specific job titles, company size, primary pain point)
- Core value proposition (headline outcome and a proof point)
- Common objections and how to approach each one
- Brand standards (what reps must and must not say)

What not to change:
- The section headings (e.g. `## Company Name`, `## What We Sell`) — the application and the AI both parse on these

---

## How to Add New Scenarios

Scenarios are managed in `reference/scenarios.md` using a pool system. Every session draws from the pools at the correct difficulty level to generate a unique prospect. You do not need to write a new persona for every session — the AI assembles one from the pools each time.

To add a new disposition, opening line, objection, like, or dislike: copy any existing entry in that section, paste it on a new line under the correct difficulty heading, and rewrite it. Keep the leading dash and the same format as surrounding entries.

To make an objection available at all difficulty levels: add it under `## Objections > ### Universal`.

No code changes are required to add new pool entries. Adding more entries increases variety — sessions will feel less repetitive over time.

---

## How to Change the Coach Persona

Edit `identity.md`. The relevant sections are:

**Who Rex Is** — background, values, overall approach. Rewrite this to change who the coach is as a person.

**Rex's Voice** — how Rex speaks. Tone, sentence structure, what to avoid. Adjust this to change how formal, warm, blunt, or collaborative the coach sounds.

**How Rex Coaches — Six Rules** — the behavioral constraints that govern every session. These are the most important lines in the file. They determine whether the coach asks questions or lectures, whether it gives one piece of feedback or ten, and whether it calls bad performance bad.

If you rename the coach, update `identity.md` throughout. The coach's name is not referenced in any other file.

To change the coaching methodology: update the Phase 1 (Briefing) and Phase 3 (Debrief) sections in `identity.md` and the relevant framework descriptions in `reference/frameworks.md`.

---

## Local Deploy

No application code is required to run the coach. Any AI platform with a persistent instruction field and file knowledge supports it. The steps are similar across platforms — the key difference is how each platform handles uploaded files.

### Claude Project

Claude puts all uploaded files directly into context on every turn, so the coach behaves consistently.

1. Go to [claude.ai](https://claude.ai) and create a new Project.
2. Upload the following files as project knowledge:
   - `identity.md`
   - `rules.md`
   - `examples.md`
   - `reference/company.md`
   - `reference/scenarios.md`
   - `reference/frameworks.md`
3. In the Project Instructions field, add: `You are Rex. Follow identity.md exactly.`
4. Start a conversation and type `begin` to open a session.

To update the coach, re-upload the relevant file. No deploy step is required.

### Gemini Gem

Gemini also puts uploaded files directly into context, so the process and behaviour are the same as Claude.

1. Go to [gemini.google.com](https://gemini.google.com), open Gems in the sidebar, and create a new Gem.
2. Upload the same six files listed above.
3. In the Instructions field, add: `You are Rex. Follow the identity file exactly.`
4. Save and start a conversation with `begin`.

To update the coach, re-upload the relevant file.

### ChatGPT Custom GPT

ChatGPT uses retrieval (RAG) for knowledge files — it searches for relevant excerpts rather than reading every file on every turn. This can make coaching inconsistent. The workaround is to paste your most critical files directly into the Instructions field, which is always read in full.

1. Go to [chatgpt.com](https://chatgpt.com) and create a new GPT.
2. Open the Configure tab.
3. In the Instructions field, paste the full contents of `identity.md` and `rules.md`. Add the line `You are Rex.` at the top.
4. Upload the remaining files (`examples.md`, `reference/company.md`, `reference/scenarios.md`, `reference/frameworks.md`) to Knowledge, accepting that retrieval may occasionally miss content.
5. Save and start a conversation with `begin`.

If the Instructions field hits the character limit, keep `identity.md` and move `rules.md` to Knowledge — the coaching persona is more important than the scoring rubric to have in full context.

---

## Known Limitations

**Persistence:** Session history is stored in localStorage. It is device-specific — no account, no sync, no history recovery if browser data is cleared. This is intentional for v1.

**No authentication:** Any user on the device can see session history. Not suitable for multi-user or team deployment without adding auth.

---

## Roadmap

Out of scope for v1, planned for future versions:

- **Database persistence** — Supabase or similar, replacing localStorage with real accounts
- **Authentication** — Rep accounts with login and history across devices
- **Manager dashboard** — Session review, rep progress tracking, team-level Tier 1 heatmaps
- **ElevenLabs voice** — High-quality AI-generated prospect voice for cold call simulation
- **Completion certification** — Pass/fail threshold with a shareable completion certificate
- **Multi-company support** — Multiple company context sets within a single deployed instance
- **Analytics** — Usage and performance tracking beyond localStorage session counts
