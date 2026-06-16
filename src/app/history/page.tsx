'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SESSION_HISTORY_KEY, type Session } from '@/lib/scenarios'

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_HISTORY_KEY)
    if (raw) setSessions(JSON.parse(raw).reverse())
  }, [])

  const scoreColor = (score: number) =>
    score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-zinc-700 text-sm transition-colors">
          ← Home
        </button>
        <span className="text-zinc-900 font-bold text-lg tracking-tight">
          Sales Coach
        </span>
        <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Session History</div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Your sessions</h1>
        <p className="text-zinc-500 text-sm mb-8">{sessions.length} session{sessions.length !== 1 ? 's' : ''} completed</p>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="text-zinc-400 mb-4 text-4xl">📋</div>
            <div className="text-zinc-600 font-medium mb-2">No sessions yet</div>
            <p className="text-zinc-400 text-sm mb-6">Complete a session to see your history here.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-green-500 hover:bg-green-400 text-zinc-950 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Start your first session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div key={session.id} className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center gap-4">
                <div className={`text-3xl font-bold ${scoreColor(session.score)} shrink-0 w-14 text-center`}>
                  {session.score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-zinc-900 text-sm truncate">
                    {session.persona.name} · {session.persona.company}
                  </div>
                  <div className="text-zinc-400 text-xs mt-0.5">
                    {session.persona.jobTitle} · {new Date(session.date).toLocaleDateString()}
                  </div>
                  <div className="text-zinc-500 text-xs mt-1 truncate">{session.summary}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium capitalize">
                    {session.mode === 'call' ? '📞' : '✉️'} {session.mode}
                  </span>
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md font-medium capitalize">
                    {session.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
