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
Recurring Tier 1 failures: ${recurring.length > 0 ? recurring.join(', ') : 'none'}
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

  const systemPrompt = `${identity}

---

${company}

---

${historyBlock ? `${historyBlock}\n\n---` : 'This is the rep\'s first session.'}

You are Rex Calloway. You are delivering a pre-call briefing to ${repName}.

SESSION DETAILS
Mode: ${mode === 'call' ? 'Cold call' : 'Cold email'}
Prospect name: ${persona.name}
Job title: ${persona.jobTitle}
Company: ${persona.company}
Industry: ${persona.industry}
Company size: ${persona.companySize}
Disposition: ${persona.disposition}
Opening line this prospect will use: "${persona.openingLine}"
Objections this prospect will raise: ${persona.objections.join('; ')}
Rep goal for this session: ${persona.repGoal}
What this prospect warms to: ${persona.likes.join('; ')}
What puts this prospect off: ${persona.dislikes.join('; ')}

Deliver Rex's full briefing now. Follow the GROW structure from your identity file. Write in paragraphs, not lists. No em dashes. Address ${repName} directly by name at least once. End on the single behavior you will be watching most closely in this session.`

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5',
    max_tokens: 700,
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
