import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Difficulty } from '@/lib/scenarios'

const client = new Anthropic()

const objectionCountByDifficulty: Record<Difficulty, string> = {
  beginner: '1 or 2',
  intermediate: '2',
  advanced: '2 or 3',
}

export async function POST(req: NextRequest) {
  try {
    const { difficulty }: { difficulty: Difficulty } = await req.json()

    const scenarioPools = readFileSync(
      join(process.cwd(), 'coach', 'reference', 'scenarios.md'),
      'utf-8'
    )

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a prospect persona for a cold call sales training simulation at ${difficulty} difficulty.

Rules:
- Generate a realistic first and last name. Use diverse names — not always Anglo-Saxon.
- Set gender as "male" or "female" (used only for voice selection).
- Generate a plausible mid-size manufacturing company name (not a real company).
- Generate a specific industry sub-type (e.g. injection molding, metal fabrication, food processing, industrial packaging).
- Generate a company size between 200 and 2000 employees.
- Select 1 disposition from the ${difficulty} tier in the pools below.
- Select 1 opening line from the ${difficulty} tier in the pools below.
- Select ${objectionCountByDifficulty[difficulty]} objections. For beginner, draw only from Universal. For intermediate, draw from Universal and Intermediate and Advanced. For advanced, draw from all three tiers.
- Select the rep goal for the ${difficulty} tier.
- Select exactly 2 likes from the Likes pool.
- Select exactly 2 dislikes from the Dislikes pool.
- Job title guidance: beginner = Production Supervisor / Facilities Manager / Operations Coordinator; intermediate = Operations Director / Plant Manager / Director of Manufacturing; advanced = VP of Operations / VP of Manufacturing / COO.

Return ONLY a valid JSON object with no markdown, no explanation, no code fences. Exact structure:
{
  "name": "string",
  "gender": "male" or "female",
  "jobTitle": "string",
  "company": "string",
  "industry": "string",
  "companySize": "string",
  "difficulty": "${difficulty}",
  "disposition": "string",
  "openingLine": "string",
  "objections": ["string"],
  "repGoal": "string",
  "likes": ["string", "string"],
  "dislikes": ["string", "string"]
}

Scenario pools:
${scenarioPools}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 })
    }

    try {
      const persona = JSON.parse(content.text)
      return NextResponse.json(persona)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse persona response', raw: content.text },
        { status: 500 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('generate-persona failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
