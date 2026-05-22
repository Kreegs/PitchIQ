import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Persona, TranscriptTurn } from '@/lib/scenarios'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const {
    transcript,
    persona,
    latestRepMessage,
    mode,
  }: {
    transcript: TranscriptTurn[]
    persona: Persona
    latestRepMessage: string
    mode: string
  } = await req.json()

  const company = readFileSync(join(process.cwd(), 'coach/reference/company.md'), 'utf-8')

  const isCall = mode === 'call'

  const systemPrompt = `You are playing the role of ${persona.name}, ${persona.jobTitle} at ${persona.company}.

PERSONA
Disposition: ${persona.disposition}
Industry: ${persona.industry}
Company size: ${persona.companySize}
Your opening line for this conversation: "${persona.openingLine}"
Objections you will raise at natural points: ${persona.objections.join('; ')}
Things that warm you to the rep: ${persona.likes.join('; ')}
Things that put you off: ${persona.dislikes.join('; ')}
What the rep must achieve to succeed: ${persona.repGoal}

PRODUCT KNOWLEDGE (so you can react accurately to what the rep says)
${company}

RULES
1. Stay in character as ${persona.name} at all times. Never break character. Never give feedback or mention coaching.
2. Your disposition governs your tone and engagement level throughout.
3. Raise your objections naturally as the conversation develops — not all at once.
4. React authentically to what the rep actually says. If they do something effective, respond accordingly. If they make a mistake, respond as a real prospect would.
5. ${isCall ? 'This is a phone call. Keep responses short — 1 to 4 sentences. Phone conversations move fast.' : 'This is a cold email exchange. Keep replies professional and proportionate to what the rep sent.'}
6. Do not end the conversation unless: (a) the rep earns a specific next step with a date and action, (b) you have genuinely run out of patience, or (c) the rep signals they are done.
7. If the rep proposes a next step without a specific date or clear commitment, do not confirm it — be non-committal and make them work for specifics.
8. Never use coaching language. Never mention Rex, PitchIQ, or any training framework.

CONVERSATION SO FAR
${transcript.map(t => `${t.role === 'rep' ? 'Rep' : persona.name}: ${t.content}`).join('\n')}

Respond now as ${persona.name}.`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 250,
    system: systemPrompt,
    messages: [{ role: 'user', content: latestRepMessage }],
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
