import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Persona, TranscriptTurn } from '@/lib/scenarios'

function checkBannedWords(message: string): string | null {
  try {
    const raw = readFileSync(join(process.cwd(), 'coach/banned-words.txt'), 'utf-8')
    const words = raw
      .split('\n')
      .map(w => w.trim().toLowerCase())
      .filter(w => w && !w.startsWith('#'))
    for (const word of words) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      if (new RegExp(`\\b${escaped}\\w*\\b`, 'i').test(message)) return word
    }
  } catch {
    // If file is missing, skip the check
  }
  return null
}

export async function POST(req: NextRequest) {
  const client = new Anthropic()
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

  if (mode === 'call') {
    const matched = checkBannedWords(latestRepMessage)
    if (matched) {
      return Response.json({
        tier0: true,
        rule: 'profanity',
        word: matched,
        prospectReply: "I'm going to stop you right there. That is completely inappropriate. This call is over.",
      })
    }
  }

  const company = readFileSync(join(process.cwd(), 'coach/reference/company.md'), 'utf-8')

  const isCall = mode === 'call'

  const emailRules = `This is a cold email exchange. You are reading and replying to ONE cold email — this is the only reply you will send.
- Write as a real busy executive would: brief, direct, professional.
- Open with a greeting (Hi [Rep's name],) and close with a sign-off (Thanks, ${persona.name}).
- Your reply must signal ONE of three outcomes naturally — do NOT state the outcome explicitly:
  WIN: agree to a specific meeting — propose a concrete day and time
  DRAW: engage with genuine interest or a sharp question — want more info but give no commitment
  LOSS: decline, go cold, or ask to be removed — based on how poor or irrelevant the email was
- Let the quality of the email drive which outcome you signal. A sharp, personalized, outcome-led email with a specific ask earns WIN or DRAW. A generic, feature-heavy, vague, or commitment-free email earns DRAW or LOSS.
- Keep the reply to 3 to 5 sentences. This is email, not a phone call.
- Never break character. Never mention coaching, Rex, or PitchIQ.`

  const callRules = `This is a phone call. Keep responses short — 1 to 4 sentences. Phone conversations move fast.
- Stay in character at all times. Never break character. Never give feedback or mention coaching.
- Raise your objections naturally as the conversation develops — not all at once.
- Do not end the conversation unless: (a) the rep earns a specific next step with a date and action, (b) you have genuinely run out of patience, or (c) the rep signals they are done.
- If the rep proposes a next step without a specific date or clear commitment, do not confirm it — be non-committal and make them work for specifics.
- THREE STRIKES: Review the transcript. If you have raised the same objection two or more times and the rep has responded each time with essentially the same counter — repeating the same point with different words rather than asking a new diagnostic question, reframing, or conceding and pivoting — then on this response become noticeably more firm and frustrated. Do not restate the objection gently. Make it clear through your tone that you have heard this before and your patience is running out. If the rep fails to change approach after a third instance, you may end the call.`

  const systemPrompt = `You are playing the role of ${persona.name}, ${persona.jobTitle} at ${persona.company}.

PERSONA
Disposition: ${persona.disposition}
Industry: ${persona.industry}
Company size: ${persona.companySize}
${isCall ? `Your opening line for this conversation: "${persona.openingLine}"` : ''}
Objections you would raise: ${persona.objections.join('; ')}
Things that warm you to the rep: ${persona.likes.join('; ')}
Things that put you off: ${persona.dislikes.join('; ')}
What the rep must achieve to succeed: ${persona.repGoal}

PRODUCT KNOWLEDGE (so you can react accurately to what the rep says)
${company}

RULES
1. Stay in character as ${persona.name} at all times. Never break character. Never give feedback or mention coaching.
2. Your disposition governs your tone and engagement level throughout.
3. React authentically to what the rep actually says. If they do something effective, respond accordingly. If they make a mistake, respond as a real prospect would.
4. ${isCall ? callRules : emailRules}
5. Never use coaching language. Never mention Rex, PitchIQ, or any training framework.

${isCall ? `CONVERSATION SO FAR\n${transcript.map(t => `${t.role === 'rep' ? 'Rep' : persona.name}: ${t.content}`).join('\n')}` : `THE EMAIL\n${latestRepMessage}`}

Respond now as ${persona.name}.`

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: isCall ? 250 : 300,
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
