import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Persona, TranscriptTurn } from '@/lib/scenarios'

function readCoach(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf-8')
}

function formatTranscript(transcript: TranscriptTurn[], prospectName: string): string {
  return transcript
    .map(t => `${t.role === 'rep' ? 'Rep' : prospectName}: ${t.content}`)
    .join('\n')
}

export async function POST(req: NextRequest) {
  const client = new Anthropic()
  const {
    action,
    transcript,
    persona,
    mode,
    repName,
    repReflection,
  }: {
    action: 'open' | 'respond'
    transcript: TranscriptTurn[]
    persona: Persona
    mode: string
    repName: string
    repReflection?: string
  } = await req.json()

  const identity = readCoach('coach/identity.md')
  const transcriptText = formatTranscript(transcript, persona.name)

  if (action === 'open') {
    const systemPrompt = `${identity}

You are Rex Calloway. The simulation has just ended. You are opening the debrief.

Rep name: ${repName}
Mode: ${mode === 'call' ? 'Cold call' : 'Cold email'}
Prospect: ${persona.name}, ${persona.jobTitle} at ${persona.company}
Prospect disposition: ${persona.disposition}

TRANSCRIPT
${transcriptText}

Open the debrief with a single reflective question directed at ${repName}. Do not give any assessment yet. Do not hint at what you think went well or badly. Ask them what they think happened — what worked and what they think cost them. One question. No preamble. No em dashes. Address ${repName} by name.`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Open the debrief.' }],
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

  // action === 'respond'
  const rules = readCoach('coach/rules.md')
  const company = readCoach('coach/reference/company.md')
  const examples = readCoach('coach/examples.md')

  const systemPrompt = `${identity}

---

${rules}

---

${company}

---

ANNOTATED EXAMPLES (use these to calibrate your evaluation)
${examples}

---

You are Rex Calloway delivering the full structured debrief to ${repName}.

SESSION DETAILS
Rep name: ${repName}
Mode: ${mode === 'call' ? 'Cold call' : 'Cold email'}
Prospect: ${persona.name}, ${persona.jobTitle} at ${persona.company}
Prospect disposition: ${persona.disposition}
Prospect objections raised: ${persona.objections.join('; ')}
Rep goal: ${persona.repGoal}

FULL TRANSCRIPT
${transcriptText}

REP'S SELF-ASSESSMENT
${repReflection}

Deliver the full debrief now. Use the section delimiters exactly as shown. Write in paragraphs within each section — no bullet lists. No em dashes. Be specific. Cite the transcript.

---REFLECTION---
[One paragraph responding to ${repName}'s self-assessment. Say whether they read the call accurately, where they were too hard or too easy on themselves.]

---TIER1---
[Evaluate each of the six Tier 1 rules. For each: state Pass or Fail, cite the exact moment from the transcript. Write as flowing prose, one rule at a time. If there are no violations, say so plainly.]

---WELL---
[Two or more specific things the rep did well, tied to exact moments in the transcript. No false positives — if nothing was genuinely good, say so and explain why that is still useful information.]

---COST---
[The one or two things that had the most negative impact on the outcome. Cite specific moments. Explain the mechanism — not just what happened but why it cost them.]

---ONE-THING---
[Single highest-leverage improvement for the next session. One thing only. Rex picks the most important. Not a list.]

---SCORE---
[First line: total score out of 100. Then each sub-score on its own line: label, points earned, points available. Apply the Tier 1 cap if any Tier 1 rule was violated.]`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Deliver the debrief.' }],
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
