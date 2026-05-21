# The Coach Folder

This folder is the brain of the sales coaching application. Everything the AI coach does — how it behaves, what it evaluates, how it scores — is defined in these markdown files. No code changes are required to customise the coaching experience for a different company, product, or sales methodology.

The folder is designed to be portable. Drop it into a Claude project with no application and the files alone produce a functional text-based coach.

---

## Folder Structure

```
/coach
  identity.md          Who the coach is — name, personality, tone, behavioral rules
  rules.md             How the coach evaluates reps — Tier 1 and Tier 2 standards
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

## How to Deploy to Vercel

1. Fork or clone the repository.
2. Create a Vercel project linked to the repo.
3. Add one environment variable in the Vercel dashboard: `ANTHROPIC_API_KEY` — your Anthropic API key.
4. Deploy from the main branch.

The application reads the `/coach` folder at request time using Node.js `fs`. No build step is required for the coach files — edit them in any text editor and deploy. Changes take effect on the next deploy. In local development, changes take effect immediately on the next API call.

---

## Known Limitations

**Voice quality:** The prospect's voice in cold call mode uses the browser's built-in SpeechSynthesis API. It sounds robotic. This is acceptable for training purposes. The production upgrade path is ElevenLabs or a similar API — no code changes to the coach folder are required for that upgrade.

**Voice recognition:** SpeechRecognition is only available in Chrome on desktop. Other browsers fall back to text input automatically.

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
