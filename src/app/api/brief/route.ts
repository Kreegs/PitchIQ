import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Persona, Session } from '@/lib/scenarios'

function readCoach(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

function distillHistory(history: Session[]): string {
  if (!history || history.length === 0) return ''

  const recent = history.slice(-5)
  const scores = recent.map(s => s.score).join(', ')

  const failCounts: Record<string, number> = {}
  recent.forEach(s => {
    if (s.tier1Results) {
      Object.entries(s.tier1Results).forEach(([rule, passed]) => {
        if (!passed) failCounts[rule] = (failCounts[rule] || 0) + 1
      })
    }
  })
  const recurring = Object.entries(failCounts)
    .filter(([, n]) => n >= 2)
    .map(([rule]) => rule)

  const last = history[history.length - 1]

  return `
PREVIOUS SESSION HISTORY
Sessions completed: ${history.length}
Recent scores (last ${recent.length}): ${scores}
Recurring Tier 2 failures: ${recurring.length > 0 ? recurring.join(', ') : 'none'}
Last session summary: ${last?.summary ?? 'none'}
`.trim()
}

export async function POST(req: NextRequest) {
  const client = new Anthropic()
  const {
    persona,
    mode,
    repName,
    repHistory,
  }: { persona: Persona; mode: string; repName: string; repHistory: Session[] } = await req.json()

  const identity = readCoach('coach/identity.md')
  const company = readCoach('coach/reference/company.md')
  const historyBlock = distillHistory(repHistory)

  function buildLikesDislikes(persona: Persona): string {
    if (persona.difficulty === 'beginner') {
      return `What this prospect warms to: ${persona.likes.join('; ')}
What puts this prospect off: ${persona.dislikes.join('; ')}`
    }
    if (persona.difficulty === 'intermediate') {
      return `What this prospect warms to (1 of 2 — the other you won't know going in): ${persona.likes[0]}
What puts this prospect off (1 of 2 — the other you won't know going in): ${persona.dislikes[0]}
Tell ${repName} there is one more like and one more dislike you are not giving them — they have to read the prospect and figure it out during the call.`
    }
    // advanced
    return `What this prospect warms to (1 of 2 — the other you won't know going in): ${persona.likes[0]}
What puts this prospect off: not disclosed — there are 2 dislikes and you are giving ${repName} none of them.
Tell ${repName} you are giving them one like only. There is one more like and two dislikes they will have to identify and work around on their own.`
  }

  const isEmail = mode === 'email'

  const emailFocus = `
EMAIL-SPECIFIC COACHING FOCUS
This is a one-shot cold email — ${repName} gets one email and the prospect sends one reply. There is no back-and-forth. Rex's briefing must prepare ${repName} to write a single email that earns a meeting.

Coach on these four things specifically:
1. Subject line: must be 6 to 10 words, specific to this prospect's role and industry, and hint at an outcome or pain point — not "Quick question" or "Checking in". Generic subject lines get deleted unopened.
2. Email structure: one outcome sentence (what changes for the prospect), one proof point or specific reason for reaching out, one clear ask — no walls of text, no feature lists.
3. Personalization signal: one detail that proves this email is not a blast — tie it to the prospect's industry, company size, or role. Generic is invisible.
4. The ask: a specific meeting request with a proposed day and time. "Let me know if you're interested" is not an ask. "Are you free for 20 minutes Thursday the 15th?" is an ask.

Remind ${repName}: they get one shot. If the subject line doesn't earn the open, the email doesn't exist. If the opener doesn't earn the read, the ask doesn't matter. Every sentence must pull its weight.`

  const systemPrompt = `${identity}

---

${company}

---

${historyBlock ? `${historyBlock}\n\n---` : 'This is the rep\'s first session.'}

You are Rex Calloway. You are delivering a pre-${isEmail ? 'email' : 'call'} briefing to ${repName}.

SESSION DETAILS
Mode: ${isEmail ? 'Cold email (one-shot — one email, one reply, then debrief)' : 'Cold call'}
Prospect name: ${persona.name}
Job title: ${persona.jobTitle}
Company: ${persona.company}
Industry: ${persona.industry}
Company size: ${persona.companySize}
Disposition: ${persona.disposition}
${!isEmail ? `Opening line this prospect will use: "${persona.openingLine}"` : ''}
Objections this prospect would raise: ${persona.objections.join('; ')}
Rep goal for this session: ${persona.repGoal}
${buildLikesDislikes(persona)}
${isEmail ? emailFocus : ''}

Deliver Rex's briefing now. Follow the GROW structure from your identity file. Write in paragraphs, not lists. No em dashes. Address ${repName} directly by name at least once. End on the single behavior you will be watching most closely in this session. Be tight — every sentence must earn its place. Cut anything that does not directly prepare ${repName} for this specific ${isEmail ? 'email' : 'call'}.`

  const stream = client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Brief me.' }],
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
