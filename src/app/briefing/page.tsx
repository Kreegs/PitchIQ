'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ACTIVE_SESSION_KEY,
  SESSION_HISTORY_KEY,
  type Persona,
  type ActiveSession,
  type Session,
} from '@/lib/scenarios'

export default function BriefingPage() {
  const router = useRouter()
  const [briefing, setBriefing] = useState('')
  const [loading, setLoading] = useState(true)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [mode, setMode] = useState<string>('call')
  const [repName, setRepName] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const storedName = localStorage.getItem('pitchiq_rep_name') ?? 'Rep'
    const storedMode = (localStorage.getItem('pitchiq_mode') ?? 'call') as 'call' | 'email'
    const storedDifficulty = (localStorage.getItem('pitchiq_difficulty') ?? 'beginner') as
      | 'beginner'
      | 'intermediate'
      | 'advanced'
    const history: Session[] = JSON.parse(localStorage.getItem(SESSION_HISTORY_KEY) ?? '[]')

    setRepName(storedName)
    setMode(storedMode)

    async function init() {
      try {
        // Step 1: generate persona
        const personaRes = await fetch('/api/generate-persona', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty: storedDifficulty }),
        })
        if (!personaRes.ok) {
          const errData = await personaRes.json().catch(() => ({}))
          throw new Error(`generate-persona failed (${personaRes.status}): ${errData.error ?? 'unknown'}`)
        }
        const generatedPersona: Persona = await personaRes.json()
        setPersona(generatedPersona)

        // Store active session
        const session: ActiveSession = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          mode: storedMode,
          difficulty: storedDifficulty,
          repName: storedName,
          persona: generatedPersona,
          transcript: [],
        }
        localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session))

        // Step 2: stream briefing
        const briefRes = await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            persona: generatedPersona,
            mode: storedMode,
            repName: storedName,
            repHistory: history,
          }),
        })

        const reader = briefRes.body!.getReader()
        const decoder = new TextDecoder()
        setLoading(false)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setBriefing(prev => prev + decoder.decode(value, { stream: true }))
        }

        setReady(true)
      } catch (err) {
        console.error('Briefing init failed:', err)
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    }

    init()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="text-zinc-400 hover:text-zinc-700 text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>
        <span className="text-zinc-900 font-bold text-lg tracking-tight">
          Sales Coach
        </span>
        <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
          Phase 1 of 3 — Brief
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8 items-start">

        {/* Company cheat sheet sidebar */}
        <div className="lg:w-72 shrink-0 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">You're representing</div>
            <div className="text-zinc-900 font-bold text-lg mb-1">Veriforge</div>
            <div className="text-zinc-500 text-xs mb-4 leading-relaxed">
              A SaaS platform that connects to existing manufacturing equipment and gives plant managers real-time visibility into line efficiency, downtime causes, and maintenance predictions. It makes the machinery already on the floor smarter — without replacing anything.
            </div>
            <div className="text-xs font-semibold text-zinc-700 mb-1">Who you're calling</div>
            <div className="text-zinc-500 text-xs mb-4 leading-relaxed">
              Operations directors and plant managers at mid-size manufacturers. Their pain: unplanned downtime and reactive maintenance eating 15–20% of production capacity.
            </div>
            <div className="text-xs font-semibold text-zinc-700 mb-1">Your hook</div>
            <div className="text-zinc-500 text-xs mb-5 leading-relaxed">
              Veriforge customers reduce unplanned downtime by an average of 34% in the first 90 days — or their money back.
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-amber-800 text-xs font-semibold mb-1">Note</div>
              <div className="text-amber-700 text-xs leading-relaxed">
                Product knowledge is not being tested. If you need to invent a specific feature detail to handle an objection, that's fine. What matters is how you run the call.
              </div>
            </div>
          </div>
        </div>

        {/* Main briefing content */}
        <div className="flex-1 min-w-0">
        {/* Prospect card */}
        {persona && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-8 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 font-semibold text-sm shrink-0">
              {persona.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-900">{persona.name}</div>
              <div className="text-zinc-500 text-sm">
                {persona.jobTitle}, {persona.company}
              </div>
              <div className="text-zinc-400 text-xs mt-0.5">{persona.industry} · {persona.companySize}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium capitalize">
                {mode === 'call' ? '📞 Call' : '✉️ Email'}
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium capitalize">
                {persona.difficulty}
              </span>
            </div>
          </div>
        )}

        {/* Briefing content */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
              R
            </div>
            <div>
              <div className="font-semibold text-zinc-900 text-sm">Rex Calloway</div>
              <div className="text-zinc-400 text-xs">Your coach</div>
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-4/6" />
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {briefing && (
            <div className="text-zinc-700 leading-relaxed text-[15px] whitespace-pre-wrap">
              {briefing}
            </div>
          )}
        </div>

        {/* Ready button */}
        {ready && (
          <div className="border-t border-zinc-200 pt-8">
            <p className="text-zinc-500 text-sm mb-4">
              When you are ready, {mode === 'call' ? 'the call will connect.' : 'you will compose your email.'}
            </p>
            <button
              onClick={() => router.push('/simulation')}
              className="bg-zinc-900 hover:bg-zinc-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              {mode === 'call' ? "I'm ready — start the call" : "I'm ready — write the email"}
            </button>
          </div>
        )}
        </div>{/* end main briefing content */}
      </div>
    </div>
  )
}
