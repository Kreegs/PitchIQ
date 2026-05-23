import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Difficulty } from '@/lib/scenarios'

const objectionCountByDifficulty: Record<Difficulty, string> = {
  beginner: '1 or 2',
  intermediate: '2',
  advanced: '2 or 3',
}

const NAMES = {
  western: {
    male:   ['Mike','Dave','Steve','Brian','Kevin','Scott','Jeff','Craig','Todd','Gary','Kyle','Tom','Chris','Dan','Mark','Jim','Bob','Ryan','Sean','Patrick','Brendan','Tony','Marco','Vince','Kurt','Hans','Werner','Erik','Lars','Bjorn'],
    female: ['Kate','Lisa','Karen','Diane','Susan','Pam','Julie','Brenda','Carol','Donna','Amy','Sandra','Michelle','Melissa','Laura','Tracy','Jen','Beth','Gail','Colleen','Bridget','Carla','Rosa','Heidi','Ingrid'],
    last:   ['Anderson','Thompson','Williams','Johnson','Martin','Harris','Wilson','Taylor','Moore','Jackson','White','Clark','Lewis','Walker','Hall','Allen','Young','King','Wright','Baker','Nelson','Carter','Mitchell','Roberts','Campbell','Parker','Evans','Edwards','Collins','Stewart','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Cooper','Richardson','Cox','Howard','Ward','Peterson','Gray'],
  },
  hispanic: {
    male:   ['Carlos','Miguel','Jose','Luis','Jorge','Roberto','Ricardo','Eduardo','Fernando','Diego','Alejandro','Andres','Hector','Javier','Manuel','Pablo','Victor','Omar','Ruben'],
    female: ['Maria','Ana','Rosa','Carmen','Elena','Sofia','Daniela','Adriana','Lucia','Isabel','Valentina','Gabriela','Monica','Patricia','Veronica','Gloria','Martha','Claudia','Yolanda'],
    last:   ['Garcia','Rodriguez','Martinez','Lopez','Hernandez','Gonzalez','Sanchez','Torres','Flores','Rivera','Gomez','Diaz','Reyes','Cruz','Morales','Ortiz','Gutierrez','Chavez','Ramos','Mendoza','Castillo','Vargas','Jimenez','Moreno','Rojas','Herrera','Medina','Aguilar','Delgado','Castro','Vega','Ruiz','Salazar','Fuentes','Campos','Avila','Rios','Navarro'],
  },
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateName(): { name: string; gender: 'male' | 'female' } {
  const gender: 'male' | 'female' = Math.random() < 0.5 ? 'male' : 'female'
  const origin: 'western' | 'hispanic' = Math.random() < 0.6 ? 'western' : 'hispanic'
  const first = pick(NAMES[origin][gender])
  const last = pick(NAMES[origin].last)
  return { name: `${first} ${last}`, gender }
}

export async function POST(req: NextRequest) {
  try {
    const client = new Anthropic()
    const { difficulty }: { difficulty: Difficulty } = await req.json()
    const { name, gender } = generateName()

    const scenarioPools = readFileSync(
      join(process.cwd(), 'coach', 'reference', 'scenarios.md'),
      'utf-8'
    )

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a prospect persona for a cold call sales training simulation at ${difficulty} difficulty.

The prospect's name and gender have already been assigned — use them exactly as given:
- name: "${name}"
- gender: "${gender}"

Rules:

COMPANY NAME — Use one of these structural patterns, chosen at random:
- Founder surname + Manufacturing / Fabrication / Industries / Works (e.g. "Kowalski Fabrication", "Reyes Industries")
- Geographic reference + product type (e.g. "Great Lakes Stamping", "High Desert Tooling")
- Industrial material or process + short suffix (e.g. "Ironvale Casting", "Crestline Extrusion")
Do NOT use patterns like "[Adjective] Solutions", "Apex [Anything]", "[Adjective] Industries", or "Global [Anything]" — these are banned.

INDUSTRY — Pick one specific sub-type from this list at random. Do not repeat HVAC or food processing unless all others have been used:
injection molding, metal stamping, die casting, precision machining, sheet metal fabrication, automotive parts, aerospace components, food processing, industrial packaging, pharmaceutical manufacturing, medical device manufacturing, rubber products, plastics extrusion, electronics assembly, textile manufacturing, wood products, chemical manufacturing, industrial coatings, hydraulic components, conveyor systems, agricultural equipment, HVAC components, pump manufacturing, valve manufacturing, filtration systems, power transmission components, wire and cable, printed circuit boards, glass products, ceramic manufacturing, composite materials.

OTHER RULES:
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
  "name": "${name}",
  "gender": "${gender}",
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
      const text = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      const persona = JSON.parse(text)
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
