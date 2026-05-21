'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ACTIVE_SESSION_KEY,
  SESSION_HISTORY_KEY,
  type ActiveSession,
  type Session,
  type Tier1Results,
  type ScoreBreakdown,
} from '@/lib/scenarios'

type Sections = {
  reflection: string
  tier1: string
  well: string
  cost: string
  oneThing: string
  score: string
}

const SECTION_MARKERS: Array<{ marker: string; key: keyof Sections; next: string | null }> = [
  { marker: '---REFLECTION---', key: 'reflection', next: '---TIER1---' },
  { marker: '---TIER1---', key: 'tier1', next: '---WELL---' },
  { marker: '---WELL---', key: 'well', next: '---COST---' },
  { marker: '---COST---', key: 'cost', next: '---ONE-THING---' },
  { marker: '---ONE-THING---', key: 'oneThing', next: '---SCORE---' },
  { marker: '---SCORE---', key: 'score', next: null },
]

function parseSections(text: string): Sections {
  const result: Sections = { reflection: '', tier1: '', well: '', cost: '', oneThing: '', score: '' }

  for (const { marker, key, next } of SECTION_MARKERS) {
    const startIdx = text.indexOf(marker)
    if (startIdx === -1) continue
    const contentStart = startIdx + marker.length
    const endIdx = next ? text.indexOf(next, contentStart) : text.length
    result[key] = text.slice(contentStart, endIdx === -1 ? text.length : endIdx).trim()
  }

  return result
}

function parseScore(scoreText: string): { total: number; breakdown: Partial<ScoreBreakdown> } {
  const lines = scoreText.split('\n').map(l => l.trim()).filter(Boolean)
  const totalMatch = lines[0]?.match(/(\d+)/)
  const total = totalMatch ? parseInt(totalMatch[1]) : 0

  const breakdown: Partial<ScoreBreakdown> = {}
  lines.slice(1).forEach(line => {
    const numMatch = line.match(/(\d+)/)
    if (!numMatch) return
    const val = parseInt(numMatch[1])
    const lower = line.toLowerCase()
    if (lower.includes('tier')) breakdown.tier1Compliance = val
    else if (lower.includes('open')) breakdown.openingQuality = val
    else if (lower.includes('object')) breakdown.objectionHandling = val
    else if (lower.includes('close') || lower.includes('next')) breakdown.close = val
  })

  return { total, breakdown }
}

function ScoreBar({ label, earned, max }: { label: string; earned: number; max: number }) {
  const pct = Math.round((earned / max) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-600">{label}</span>
        <span className="text-zinc-900 font-semibold">{earned}/{max}</span>
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full">
        <div
          className={`h-1.5 rounded-full transition-all ${earned === max ? 'bg-green-500' : earned > max * 0.6 ? 'bg-yellow-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function DebriefPage() {
  const router = useRouter()
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [phase, setPhase] = useState<'question' | 'reflecting' | 'debrief' | 'done'>('question')
  const [rexQuestion, setRexQuestion] = useState('')
  const [reflection, setReflection] = useState('')
  const [fullText, setFullText] = useState('')
  const [sections, setSections] = useState<Sections>({ reflection: '', tier1: '', well: '', cost: '', oneThing: '', score: '' })
  const [savedScore, setSavedScore] = useState<number | null>(null)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const raw = localStorage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) { router.push('/'); return }
    const active: ActiveSession = JSON.parse(raw)
    setSession(active)
    streamQuestion(active)
  }, [router])

  async function streamQuestion(active: ActiveSession) {
    const res = await fetch('/api/debrief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'open',
        transcript: active.transcript,
        persona: active.persona,
        mode: active.mode,
        repName: active.repName,
      }),
    })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setRexQuestion(prev => prev + decoder.decode(value, { stream: true }))
    }
  }

  async function submitReflection() {
    if (!session || !reflection.trim()) return
    setPhase('debrief')

    const res = await fetch('/api/debrief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'respond',
        transcript: session.transcript,
        persona: session.persona,
        mode: session.mode,
        repName: session.repName,
        repReflection: reflection,
      }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value, { stream: true })
      setFullText(accumulated)
      setSections(parseSections(accumulated))
    }

    // Save session to history
    const { total, breakdown } = parseScore(parseSections(accumulated).score)
    setSavedScore(total)

    const history: Session[] = JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) ?? '[]')
    const completedSession: Session = {
      id: session.id,
      date: session.date,
      mode: session.mode,
      difficulty: session.difficulty,
      repName: session.repName,
      persona: {
        name: session.persona.name,
        jobTitle: session.persona.jobTitle,
        company: session.persona.company,
        industry: session.persona.industry,
        disposition: session.persona.disposition,
        likes: session.persona.likes,
        dislikes: session.persona.dislikes,
      },
      score: total,
      scoreBreakdown: {
        tier1Compliance: breakdown.tier1Compliance ?? 0,
        openingQuality: breakdown.openingQuality ?? 0,
        objectionHandling: breakdown.objectionHandling ?? 0,
        close: breakdown.close ?? 0,
      },
      tier1Results: {} as Tier1Results,
      summary: `Score ${total}/100 — ${session.mode} with ${session.persona.name} at ${session.persona.company}`,
    }
    history.push(completedSession)
    localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history))
    localStorage.removeItem(ACTIVE_SESSION_KEY)

    setPhase('done')
  }

  if (!session) return null

  const { persona } = session
  const s = sections

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-700 text-sm transition-colors">
          ← Home
        </button>
        <span className="text-zinc-900 font-bold text-lg tracking-tight">
          Pitch<span className="text-green-500">IQ</span>
        </span>
        <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          Phase 3 of 3 — Debrief
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Prospect recap */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-semibold text-xs shrink-0">
            {persona.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-zinc-900">{persona.name}</div>
            <div className="text-xs text-zinc-400">{persona.jobTitle} · {persona.company}</div>
          </div>
          {savedScore !== null && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${savedScore >= 70 ? 'text-green-500' : savedScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                {savedScore}
              </div>
              <div className="text-xs text-zinc-400">/ 100</div>
            </div>
          )}
        </div>

        {/* Rex question */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shrink-0">R</div>
            <div>
              <div className="font-semibold text-zinc-900 text-sm">Rex Calloway</div>
              <div className="text-zinc-400 text-xs">Your coach</div>
            </div>
          </div>
          <div className="text-zinc-700 leading-relaxed text-[15px]">
            {rexQuestion || <span className="text-zinc-400 animate-pulse">Rex is reviewing the call...</span>}
          </div>
        </div>

        {/* Reflection input */}
        {phase === 'question' && rexQuestion && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-8">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Your reflection
            </label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={4}
              placeholder="What do you think happened on that call?"
              className="w-full text-zinc-900 text-sm leading-relaxed placeholder-zinc-400 resize-none focus:outline-none"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => { setPhase('reflecting'); submitReflection() }}
                disabled={!reflection.trim()}
                className="bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {phase === 'reflecting' && (
          <div className="text-zinc-400 text-sm animate-pulse mb-8">Rex is reviewing your reflection...</div>
        )}

        {/* Debrief sections */}
        {s.reflection && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Rex's read on your read</div>
            <div className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">{s.reflection}</div>
          </div>
        )}

        {s.tier1 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Tier 1 Review</div>
            <div className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">{s.tier1}</div>
          </div>
        )}

        {s.well && (
          <div className="bg-green-50 rounded-2xl border border-green-100 p-6 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-green-700 mb-3">What you did well</div>
            <div className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">{s.well}</div>
          </div>
        )}

        {s.cost && (
          <div className="bg-red-50 rounded-2xl border border-red-100 p-6 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-red-700 mb-3">What cost you</div>
            <div className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">{s.cost}</div>
          </div>
        )}

        {s.oneThing && (
          <div className="bg-zinc-900 rounded-2xl p-6 mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">One thing to work on</div>
            <div className="text-white leading-relaxed text-sm whitespace-pre-wrap">{s.oneThing}</div>
          </div>
        )}

        {s.score && (() => {
          const { total, breakdown } = parseScore(s.score)
          return (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-8">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Score</div>
              <div className="flex items-end gap-2 mb-5">
                <span className={`text-5xl font-bold ${total >= 70 ? 'text-green-500' : total >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {total}
                </span>
                <span className="text-zinc-400 text-xl mb-1">/ 100</span>
                {total < 60 && <span className="text-xs text-red-500 font-medium ml-2 mb-1">Tier 1 cap applied</span>}
              </div>
              <div className="space-y-3">
                {breakdown.tier1Compliance !== undefined && (
                  <ScoreBar label="Tier 1 compliance" earned={breakdown.tier1Compliance} max={40} />
                )}
                {breakdown.openingQuality !== undefined && (
                  <ScoreBar label="Opening quality" earned={breakdown.openingQuality} max={15} />
                )}
                {breakdown.objectionHandling !== undefined && (
                  <ScoreBar label="Objection handling" earned={breakdown.objectionHandling} max={25} />
                )}
                {breakdown.close !== undefined && (
                  <ScoreBar label="Close / next step" earned={breakdown.close} max={20} />
                )}
              </div>
            </div>
          )
        })()}

        {phase === 'done' && (
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-green-500 hover:bg-green-400 text-zinc-950 font-bold py-4 rounded-xl transition-colors"
            >
              Run another session
            </button>
            <button
              onClick={() => router.push('/history')}
              className="px-6 py-4 rounded-xl border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 font-medium transition-colors text-sm"
            >
              View history
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
