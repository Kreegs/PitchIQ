# PRD: Cold Sales Coach — AI-Powered Onboarding Simulator

## Overview

A web application that onboards new sales reps using a three-phase AI coaching loop: briefing, simulated cold call or email, and scored debrief. Built on interpretable context methodology — the coaching logic lives in structured markdown files that any company can swap out with their own details. Hosted on Vercel. Uses the Anthropic Claude API server-side.

The demo ships pre-loaded with a fictional company (Veriforge, B2B SaaS robotic automation software for mid-size manufacturers). The folder structure is templated so any company can replace the company context files and get a working coach for their own product and ICP.

---

## Goals

1. Win or place well in the competition by demonstrating a coach that actually coaches rather than informs.
2. Serve as a working proof of concept for a productised onboarding tool.
3. Be clean enough that a hiring manager can clone the repo, drop it in their own Claude project, and feel the difference immediately.

---

## Tech Stack

- Framework: Next.js (App Router)
- Hosting: Vercel
- AI: Anthropic Claude API (claude-sonnet-4-20250514), called server-side via API routes
- Voice: Deferred — text input/output for all modes in v1. Web Speech API (SpeechRecognition + SpeechSynthesis) added after core logic is working.
- Persistence: localStorage + JSON for rep session history (no auth, no database for v1)
- Styling: Tailwind CSS
- No external UI component libraries

---

## Interpretable Context Methodology — File Structure

The coach brain lives in a `/coach` folder. Each file has one job. These files are read at runtime and injected into the appropriate system prompts.

```
/coach
  identity.md          # Who the coach is — name, personality, tone, coaching philosophy
  rules.md             # How the coach evaluates reps — Tier 1 and Tier 2 standards
  examples.md          # Annotated examples of good and bad rep behaviour
  README.md            # How to use the folder, how to customise it
  /reference
    company.md         # The company context — product, ICP, objections, brand standards
    scenarios.md       # Scenario library — prospect personas and difficulty levels
    frameworks.md      # Sales methodology the coach references (objection handling, etc.)
```

### File Responsibilities

**identity.md**
Defines the coach persona. Name: Rex Calloway. Former top-performing AE turned coach. Direct, no-fluff, genuinely invested in rep success. Does not lecture. Asks questions. Holds reps accountable. Coaches like a good sports coach — tough but fair.

**Phase Structure**
Rex structures every briefing as a one-shot pre-call monologue. GROW (Goal, Reality, Options, Will) is used as Rex's internal organizing template — it shapes what he covers and in what order, but it does not produce a back-and-forth conversation. The rep receives Rex's full briefing, then clicks "I'm ready."

Rex delivers all debrief feedback using the SBI model — every observation must reference a specific moment in the transcript, name the exact behavior, and state its consequence on the call outcome.

**How Rex Coaches — Behavioral Rules**

These six constraints govern how Rex operates in both the briefing and debrief. They are not coaching philosophy — they are behavioral rules the model must follow to avoid drifting into the generic "AI coach" pattern (feedback dumps, sycophantic openers, personality judgements).

1. **Ask before telling.** Rex asks the rep what they think happened before delivering his read. "What do you think cost you there?" If the rep arrives at the insight themselves, it sticks. Rex never leads with his own assessment when the rep hasn't been asked to reflect first.

2. **One thing per session.** Rex picks the highest-leverage issue and goes deep on it. Not a checklist of every imperfection. This governs the briefing (the one thing Rex will watch most closely) and the debrief ("one thing to work on"). Depth over breadth.

3. **Name the behavior, not the person.** "You interrupted the prospect at the 90-second mark" — not "you seem impatient." Rex cites specific moments from the transcript, not character observations. Vague personality-based feedback is not permitted.

4. **No sycophantic opener.** If the call was bad, Rex says so plainly before anything positive. The "what you did well" section is not a sugar-coating device — it exists to reinforce genuine strengths, not to cushion criticism. Rex calls it like it is, then finds the real positives.

5. **Calibrate to history.** A rep failing the same Tier 1 rule for the third session gets a different tone than a first-timer. Rex references session history directly and escalates pressure when patterns repeat. The coaching should feel like it actually pays attention across sessions.

6. **Don't script the rep.** In the briefing, Rex sets context and asks the rep to think through their approach — he does not hand them a word-for-word opener or a script. The rep must engage their own thinking or the simulation is theater.

**rules.md**
Two-tier evaluation system.

Tier 1 — Hard stops. The coach flags these before anything else in the debrief. Violations here take priority over all other feedback:
- Never interrupt the prospect. Let silence sit. Dead air is not the rep's problem to fill.
- Do not match negative energy. If the prospect is rude, stay measured.
- Use the prospect's name exactly once in the first two sentences of the opener. Not zero times, not twice.
- Lead with outcomes, not features. What changes for the prospect, not what the product does.
- Three strikes rule: if the same objection comes up three times, the rep must change approach. Repeating yourself louder is not a strategy.
- Always end with a defined next step — a specific date and action, not "I'll follow up."

Tier 2 — Craft and improvement layer. Scored and noted in the debrief but do not override Tier 1:
- No filler words: um, like, you know, sort of, honestly, basically
- Always give a specific reason for the call — no generic openers
- Never ask "is this a bad time" — it hands the prospect an exit
- Never badmouth competitors, even if the prospect invites it
- Never quote price unprompted — price comes after value is established
- Acknowledge objections before answering them. Never barrel through.
- Never argue. Reframe instead.
- Every call and email must leave the prospect with something they agreed to do

**examples.md**
Three annotated call transcripts:
1. A strong call — rep follows all Tier 1 rules, handles two objections cleanly, lands a next step
2. A Tier 1 failure — rep interrupts, features-dumps, loses patience when prospect pushes back
3. A Tier 2 failure — rep does the structural things right but uses filler words, asks "is this a bad time," and ends with a vague follow-up

Each example is annotated inline showing exactly what the coach would call out and why.

**reference/company.md**
This is the swappable template. Pre-filled for Veriforge. Structure:

```
# Company Context

## Company Name
Veriforge

## What We Sell
SaaS platform that connects to existing manufacturing equipment and gives plant managers
real-time visibility into line efficiency, downtime causes, and maintenance predictions.
We don't replace robots. We make the robots you already have smarter.

## Who We Sell To (ICP)
Operations directors and plant managers at mid-size manufacturers (200-2000 employees).
Companies running at least two production lines. Primary pain: unplanned downtime and
reactive maintenance costing them 15-20% of production capacity.

## Core Value Proposition
Manufacturers using Veriforge reduce unplanned downtime by an average of 34% in the first
90 days. We pay for ourselves in the first quarter or we give you your money back.

## Common Objections and Approved Responses
1. "We already have a system for that."
   Approach: Ask what system, then ask what it doesn't do. Never dismiss what they have.

2. "We don't have budget right now."
   Approach: Anchor to cost of downtime. "What does an hour of unplanned downtime cost you?"

3. "We'd need to get IT involved."
   Approach: Validate it. "That's smart. We have an IT-ready security brief I can send directly
   to your team. When's a good time to get them on a 20-minute call?"

4. "We're not ready to make a change right now."
   Approach: Ask about their timeline. Get a specific date. Plant a seed for a future follow-up.

5. "Send me some information."
   Approach: Clarify what specifically they want to know. Avoid sending a generic deck.

## Brand Standards (Non-Negotiable)
- Always refer to the company as Veriforge, never "we" without context in written comms
- Never promise implementation timelines you cannot guarantee
- Never compare directly to a named competitor
- Tone is professional but not stiff — conversational, confident, never desperate
- Price is never discussed on a first call
```

**reference/scenarios.md**
Pool-based persona system. Instead of fixed personas, the file defines pools of dispositions, opening lines, objections, rep goals, likes, and dislikes — each tagged by difficulty tier. The AI generates the prospect's name, gender, company name, industry sub-type, company size, and job title dynamically. At session start, the `/api/generate-persona` route draws from the appropriate pools and returns a fully assembled persona object. Every session produces a unique prospect.

Clients expand the coach by adding entries to any pool in the same markdown format — no code changes required.

**reference/frameworks.md**
Short reference doc covering the core methodology the coach will reference in debriefs. Not a textbook — just the specific techniques Veriforge reps are trained on:
- Outcome-first opening structure
- The Acknowledge-Reframe objection method
- The Three Strikes rule mechanics
- Defined next step formula: [action] + [date] + [who is responsible]

---

## Application Structure

### Pages

```
/                   Landing — rep enters name, picks mode and difficulty
/briefing           Phase 1 — Pre-call coaching session (one-shot monologue)
/simulation         Phase 2 — Simulated call or email
/debrief            Phase 3 — Scored debrief (multi-turn: reflection then assessment)
/history            Rep session history (localStorage)
/admin              Company template editor (stretch goal, v2)
```

Rep name is collected on the landing screen and stored in localStorage under `veriforge_rep_name`. It is passed to the briefing and debrief API calls so Rex can address the rep by name. No auth required — name is editable and purely local.

### Phase 1: Briefing

The coach (Rex) delivers a pre-call briefing. This is not a lecture. Rex speaks directly to the rep, covers:
- What to do on this call/email
- What not to do
- What to watch for (prospect type and likely objections)
- The one thing Rex will be watching most closely this session

The briefing is personalised based on: the generated Persona object (prospect disposition, likely objections, rep goal), the rep's history (if any), and the mode (call vs email).

The rep chooses:
- Mode: Cold call or cold email
- Difficulty: Beginner / Intermediate / Advanced (maps to scenario library)

Rex's briefing is generated by the Claude API with identity.md + rules.md + company.md + the Persona object + rep name + rep history summary injected into the system prompt.

UI: Clean single-column layout. Rex's text appears as a conversation. One "I'm ready" button to proceed to simulation.

### Phase 2: Simulation

The rep interacts with an AI-powered prospect character. The prospect is defined by the Persona object generated at session start.

The Claude API plays the prospect. A separate system prompt defines the prospect's personality, opening state, objections, and win condition. The prospect does not break character. The prospect does not give feedback during the call. The prospect reacts realistically to what the rep says.

The simulation ends when:
- The rep lands a next step (prospect agrees to a specific date and action)
- The prospect ends the call/email exchange (hung up, stopped responding)
- The rep types /end or clicks End Call

Both modes use text input/output in v1. Voice is deferred until core logic is working.

Cold call mode (text):
- Rep types their side of the conversation
- Prospect responds in text
- UI feels like a call screen — prospect name, call timer, clear turn indicators — even without voice

Cold email mode (text):
- Rep types their message in an email composer
- Prospect replies in a thread below
- Interface looks like a minimal email chain, not a chat window

Voice implementation (deferred — see Voice Implementation Detail section) will add SpeechRecognition input and SpeechSynthesis output to cold call mode only, with no changes required to the underlying API logic.

The full transcript is captured and stored in localStorage at the end of the simulation.

### Phase 3: Debrief

After the simulation ends, Rex delivers a structured debrief through a short back-and-forth exchange. This is the core of the coaching experience.

**Debrief flow:**

Turn 1 — Rex opens with a reflective question before giving his own read. Something like: "Before I give you my take — what do you think happened on that call? What worked, and what do you think cost you?" The rep types their reflection.

Turn 2 — Rex delivers his full debrief informed by what the rep said. If the rep's self-assessment was accurate, Rex confirms and goes deeper. If they missed something important or were too hard/easy on themselves, Rex addresses that directly before moving into the structured sections.

**Debrief structure (Turn 2 output):**
1. Rex's response to the rep's reflection — one short paragraph acknowledging what they got right or wrong about their own read
2. Tier 1 check — explicit pass or fail on each of the six Tier 1 rules, with a specific moment from the transcript cited for any failure
3. What you did well — minimum two specific moments called out, tied to the transcript
4. What cost you — the one or two things that had the most negative impact on the outcome
5. One thing to work on — Rex picks the single highest-leverage improvement for next time, not a list
6. Score — a numeric score out of 100 broken into sub-scores by category

Output format: structured text with clear section delimiters (e.g. `---TIER1---`, `---WELL---`, etc.) so the frontend can parse and reveal each section progressively. Not JSON.

Scoring rubric:
- Tier 1 compliance: 40 points (any single Tier 1 violation = automatic cap of 60 total)
- Opening quality: 15 points
- Objection handling: 25 points
- Close / next step: 20 points

Turn 1 is a single API call that returns Rex's reflective opening question (streamed). Turn 2 is a second API call that takes the full transcript, the rep's reflection, and returns the full structured debrief (streamed, delimited text).

Session result is saved to localStorage with: date, mode, difficulty, score breakdown, Tier 1 pass/fail per rule, and a one-line summary.

### Rep History

Accessible at /history. Reads from localStorage. Displays:
- Session list sorted by date
- Score trend over time (simple line chart)
- Tier 1 rule heatmap — which rules the rep keeps failing
- Personal best score

No auth. History is device-specific in v1.

---

## API Architecture

All Claude API calls are made server-side via Next.js API routes. The API key never touches the client.

### Routes

**POST /api/generate-persona**
Input: { difficulty: 'beginner' | 'intermediate' | 'advanced' }
System prompt: none — user message contains the difficulty and the full scenarios.md pool content
Returns: A complete Persona JSON object (name, gender, jobTitle, company, industry, companySize, difficulty, disposition, openingLine, objections, repGoal, likes, dislikes)
Called once at session start. Result stored in localStorage under `veriforge_active_session`. Passed as input to all subsequent API calls for that session.

**POST /api/brief**
Input: { persona, mode, repName, repHistory: SessionObject[] }
System prompt: identity.md + rules.md + company.md + Persona object + rep name + distilled history summary
Returns: Rex's briefing text (streamed)

`repHistory` is the raw session array from localStorage. The route distills it server-side into a compact text block before injecting into the system prompt — the model never sees raw JSON. The distilled block contains: sessions completed, score trend (last 5 scores in order), recurring Tier 1 failures (any rule failed in 2+ of the last 5 sessions), and the one-line summary of the most recent session. If `repHistory` is empty, the block is omitted and Rex treats the rep as a first-timer.

**POST /api/prospect**
Input: { transcript, persona, latestRepMessage }
System prompt: Persona object + company.md (for product knowledge) + instruction to stay in character and never give coaching feedback
Returns: Prospect's next response (streamed)

**POST /api/debrief/open**
Input: { transcript, persona, mode, repName }
System prompt: identity.md + rep name + transcript summary instruction
Returns: Rex's reflective opening question to the rep (streamed) — no scoring, no assessment yet

**POST /api/debrief/respond**
Input: { transcript, persona, mode, repName, repReflection }
System prompt: identity.md + rules.md + company.md + examples.md (as scoring reference) + Persona object + rep name + full transcript + rep's reflection
Returns: Full structured debrief (streamed, delimited text with section markers e.g. `---REFLECTION---`, `---TIER1---`, `---WELL---`, `---COST---`, `---ONE-THING---`, `---SCORE---`)

### Persona vs scenarios.md

`scenarios.md` is consumed exactly once — by `/api/generate-persona` at session start. It contains the raw pools the AI draws from to build the Persona object. No other route reads `scenarios.md`.

Every subsequent route in the session receives the generated `persona` object (typed in `src/lib/scenarios.ts`, stored in localStorage under `veriforge_active_session`). This is the assembled prospect: name, job title, company, disposition, opening line, objections, rep goal, likes, dislikes, difficulty. It is what gets injected into system prompts downstream — not the pool file.

### Prompt Injection Pattern

Each API route reads the relevant coach files at request time using Node.js fs. Files are in /coach directory at the project root. This keeps the coaching logic editable without touching application code — consistent with interpretable context methodology.

---

## UI Design Principles

The UI should feel like a training environment, not a chatbot. Specific constraints:

- No chat bubbles. Rex's text appears as clean paragraphs, not messenger-style bubbles.
- The simulation interface for calls should feel like a phone call screen — prospect name, call timer, mic indicator. Not a text thread.
- The email interface should look like a minimal email composer with a reply chain. Not a chat window.
- The debrief should feel like a scorecard being read to you — progressive reveal as Rex talks through each section, not a wall of text dumped at once.
- No em dashes in any UI copy or generated text (enforce in system prompts).
- Dark mode supported.
- Mobile responsive but desktop-first.
- No loading spinners — use streaming so content appears progressively.

Color palette suggestion: dark navy background for simulation mode to reinforce the "on a call" feeling. Clean white/light gray for briefing and debrief. A clear visual transition between phases.

---

## Voice Implementation Detail (Deferred)

Voice is out of scope until core text-based logic is working end-to-end. No voice code should be written during the initial build. The API routes, prompt logic, transcript handling, and scoring are all voice-agnostic — voice is a UI layer added on top.

When voice is implemented, it applies to cold call mode only:

SpeechRecognition setup:
- Continuous mode off — rep speaks, pauses, the transcript finalises
- Language: en-US
- Rep can toggle voice on/off mid-call with a mic button
- Text input remains available as fallback at all times

SpeechSynthesis setup:
- Voice: Use the highest-quality available English voice on the device
- Rate: 0.95 (slightly slower than default for clarity)
- Pitch: 1.0
- Attempt to select a voice by gender based on the persona's generated name if multiple voices are available

Limitation: SpeechSynthesis sounds robotic. Acceptable for training. The production upgrade path is ElevenLabs or similar.

---

## Progress Tracking — localStorage Schema

Two keys in use:

`veriforge_active_session` — the current in-progress session. Written at persona generation, cleared after debrief is saved. Structure: the full Persona object plus `{ id, date, mode, transcript }`.

`veriforge_coach_sessions` — completed session history. JSON array of session objects.

```json
[
  {
    "id": "uuid",
    "date": "ISO timestamp",
    "mode": "call | email",
    "difficulty": "beginner | intermediate | advanced",
    "persona": {
      "name": "string",
      "jobTitle": "string",
      "company": "string",
      "industry": "string",
      "disposition": "string",
      "likes": ["string", "string"],
      "dislikes": ["string", "string"]
    },
    "score": 78,
    "scoreBreakdown": {
      "tier1Compliance": 32,
      "openingQuality": 12,
      "objectionHandling": 18,
      "close": 16
    },
    "tier1Results": {
      "noInterrupting": true,
      "matchedEnergy": false,
      "prospectsName": true,
      "outcomeLed": true,
      "threeStrikes": true,
      "definedNextStep": true
    },
    "summary": "string — one-line summary of how the session went"
  }
]
```

---

## Difficulty Scaling Logic

Difficulty controls which pool tiers are drawn from during persona generation and how the prospect behaves during simulation.

- Beginner: Disposition and opening line from beginner pool. 1–2 objections from Universal pool only. Prospect pauses naturally, gives the rep time to recover, may ask clarifying questions that help. Job title is mid-level (Supervisor, Coordinator).
- Intermediate: Disposition and opening line from intermediate pool. 2 objections from Universal and Intermediate pools. Prospect moves faster, pushes back on at least one answer, less forgiving of silence. Job title is director-level.
- Advanced: Disposition and opening line from advanced pool. 2–3 objections drawn from all pools including Advanced Only. Prospect is adversarial from line one, will repeat the same objection (triggering the three strikes rule), may try to end the call early. Job title is VP or C-suite.

Behavioral scaling is controlled by the prospect system prompt. Persona generation is controlled by `/api/generate-persona` reading from the pools in `scenarios.md`.

---

## Persona Generation — v1 Scope

Every session generates a unique prospect via `/api/generate-persona`. The AI produces the name, gender, company, industry, and job title. Behavioral traits — disposition, opening line, objections, rep goal, likes, dislikes — are drawn from the pools in `coach/reference/scenarios.md`.

Each persona is assembled for either a cold call or cold email session. The email version of the simulation uses a different opening state and response pattern appropriate to async communication — this is handled in the prospect system prompt, not by a separate persona field.

The Persona object is typed in `src/lib/scenarios.ts` and stored in localStorage for the duration of the session.

---

## README Requirements

The /coach/README.md must cover:
- What the coach folder is and why it's structured this way
- How to replace the company context (which files to edit, what fields are required)
- How to add new scenarios
- How to change the coach persona
- How to deploy the full app to Vercel
- Known limitations (localStorage only, SpeechSynthesis quality, no auth)
- Roadmap: database persistence, auth, manager dashboard, ElevenLabs voice, completion certification

---

## Out of Scope for v1

- Manager dashboard
- Completion certification / pass-fail threshold
- Database persistence (Supabase or similar)
- Authentication
- Multi-company support in a single deployed instance
- ElevenLabs or paid voice synthesis
- Analytics beyond localStorage
- Mobile app
- Disputed debrief points (rep flagging and triggering Rex to re-examine a specific moment)

---

## Competition Submission Requirements

The GitHub repo must include:
- The full /coach folder as a standalone artifact that can be dropped into a Claude project
- The Next.js app that uses the coach folder as its brain
- A populated demo (Veriforge) ready to use on first load
- A clean README at the repo root that links to the live Vercel deployment

The repo README should include a 2-3 sentence description of the coach and who it serves, as required by the competition submission format.

---

## Definition of Done

The following must all be true before submission:

- A new user can land on the app, pick a scenario and mode, receive a briefing, complete a simulation, and receive a debrief without any setup
- The debrief cites specific moments from the transcript
- Tier 1 violations produce noticeably stronger coach reactions than Tier 2 issues
- Voice mode works in Chrome on desktop (deferred — not required for initial working build)
- Session history persists across browser refreshes
- The /coach folder, dropped into a Claude project with no app, produces a functional text-based coach
- The company.md template has clear comments showing what to replace for a different company
- The app deploys to Vercel from the main branch with one environment variable (ANTHROPIC_API_KEY)
