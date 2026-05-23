'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CUSTOMER_LOGOS = [
  'Ironwood Group',
  'Meridian Revenue',
  'Summit Partners',
  'ClearPath Solutions',
  'Apex Commercial',
  'Talentfirst',
]

export default function Home() {
  const [repName, setRepName] = useState('')
  const [mode, setMode] = useState<'call' | 'email'>('call')
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const router = useRouter()

  const handleStartDemo = () => {
    if (!repName.trim()) return
    localStorage.setItem('pitchiq_rep_name', repName.trim())
    localStorage.setItem('pitchiq_mode', mode)
    localStorage.setItem('pitchiq_difficulty', difficulty)
    router.push('/briefing')
  }

  return (
    <div className="min-h-screen font-sans">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-white font-bold text-xl tracking-tight">
            Pitch<span className="text-green-400">IQ</span>
          </span>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-zinc-400 hover:text-white text-sm transition-colors">How It Works</a>
            <a href="#features" className="text-zinc-400 hover:text-white text-sm transition-colors">Features</a>
          </div>
          <a
            href="#demo"
            className="bg-green-500 hover:bg-green-400 text-zinc-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Try the Demo
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-zinc-950 pt-40 pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-powered coaching — no scripts, no shortcuts
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Your reps need reps,
            <br />
            <span className="text-green-400">not slides.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            PitchIQ puts every new hire through real sales scenarios before their first call.
            Brief. Simulate. Debrief. Repeat — until they are ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#demo"
              className="bg-green-500 hover:bg-green-400 text-zinc-950 font-bold text-base px-8 py-4 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Try the Demo
            </a>
            <a
              href="#how-it-works"
              className="text-zinc-300 hover:text-white text-base font-medium px-8 py-4 rounded-xl border border-zinc-700 hover:border-zinc-500 transition-colors w-full sm:w-auto text-center"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-zinc-900 border-y border-zinc-800 py-14 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '47%', label: 'faster ramp time' },
            { value: '2.3x', label: 'quota attainment in 90 days' },
            { value: '500+', label: 'reps trained' },
            { value: '4.8/5', label: 'rep satisfaction score' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-green-400 mb-1">{stat.value}</div>
              <div className="text-zinc-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-zinc-950 py-10 px-6 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-zinc-600 text-xs text-center mb-6 uppercase tracking-widest">Trusted by sales teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4">
            {CUSTOMER_LOGOS.map(name => (
              <span key={name} className="text-zinc-500 font-semibold text-lg tracking-tight hover:text-zinc-300 transition-colors cursor-default">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Three phases. One rep who is ready.</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Every PitchIQ session runs the same loop your best reps use — compressed into minutes instead of months.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Brief',
                icon: '🎯',
                desc: 'Rex — your AI coach — reviews the prospect profile with your rep. Not a script. Context, focus, and the one thing Rex will watch most closely this session.',
              },
              {
                num: '02',
                title: 'Simulate',
                icon: '📞',
                desc: "Your rep runs a live cold call or email against an AI-powered prospect. The prospect does not break character. No hints. No guardrails. Just the conversation.",
              },
              {
                num: '03',
                title: 'Debrief',
                icon: '📊',
                desc: 'Rex scores the call against Tier 2 standards and Tier 3 craft. Specific moments. Honest feedback. One thing to work on before the next session.',
              },
            ].map(phase => (
              <div key={phase.num} className="bg-zinc-50 rounded-2xl p-8 border border-zinc-100 hover:border-green-200 transition-colors">
                <div className="text-4xl mb-4">{phase.icon}</div>
                <div className="text-green-500 font-bold text-xs mb-2 uppercase tracking-widest">{phase.num}</div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3">{phase.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO SECTION */}
      <section id="demo" className="bg-green-500 py-24 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-zinc-950 mb-4">Try PitchIQ right now.</h2>
            <p className="text-green-900 text-base leading-relaxed">
              No signup. No credit card. You are about to be briefed by Rex before a cold call with a plant manager at a mid-size manufacturer.
              Same experience your reps get on day one.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="space-y-5">
              <div>
                <label className="block text-zinc-700 font-semibold mb-2 text-sm">Your name</label>
                <input
                  type="text"
                  value={repName}
                  onChange={e => setRepName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStartDemo()}
                  placeholder="Enter your name"
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-2 text-sm">Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['call', 'email'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                        mode === m
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {m === 'call' ? '📞 Cold Call' : '✉️ Cold Email'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-zinc-700 font-semibold mb-2 text-sm">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-3 px-2 rounded-xl border-2 font-medium text-sm transition-all capitalize ${
                        difficulty === d
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleStartDemo}
                disabled={!repName.trim()}
                className="w-full bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-colors"
              >
                Start your session
              </button>
            </div>
          </div>
          <p className="text-green-900 text-xs text-center mt-4 opacity-75">
            Pre-loaded with Veriforge — a demo B2B manufacturing SaaS company. Your own company context slots in with a single folder swap.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Not a chatbot. A coach.</h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              We built PitchIQ around the behaviors that separate good coaches from bad ones.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: 'Ask before tell',
                desc: 'Rex asks your rep what they think happened before he shares his read. If a rep arrives at the insight themselves, it sticks.',
              },
              {
                title: 'One thing per session',
                desc: 'Rex picks the highest-leverage issue and goes deep — not a checklist of every imperfection. Depth over breadth, every time.',
              },
              {
                title: 'Scores what actually matters',
                desc: 'Tier 2 violations cap your score at 60 regardless of how smooth the rest of the call was. Fundamentals first, always.',
              },
              {
                title: 'Memory built in',
                desc: 'Rex tracks every session and escalates when patterns repeat. A rep failing the same rule for the third time gets a different tone than a first-timer.',
              },
            ].map(feature => (
              <div key={feature.title} className="flex gap-4 p-6 rounded-2xl border border-zinc-100 bg-zinc-50 hover:border-green-200 transition-colors">
                <div className="w-1 rounded-full bg-green-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-zinc-900 mb-2">{feature.title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 p-8 bg-zinc-950 rounded-2xl text-center">
            <p className="text-zinc-500 text-xs mb-3 uppercase tracking-widest">Built for portability</p>
            <p className="text-white text-xl font-semibold max-w-2xl mx-auto leading-snug">
              "Swap in your company context in 20 minutes. Your product, your ICP, your objections — no prompt engineering required."
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-zinc-950 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Stop letting reps
            <br />
            <span className="text-green-400">learn on live prospects.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            Try the demo in under two minutes. No signup, no pitch — just you, Rex, and a cold call that actually matters.
          </p>
          <a
            href="#demo"
            className="inline-block bg-green-500 hover:bg-green-400 text-zinc-950 font-bold text-base px-10 py-4 rounded-xl transition-colors"
          >
            Start your session
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-white font-bold text-lg tracking-tight">
              Pitch<span className="text-green-400">IQ</span>
            </span>
            <p className="text-zinc-500 text-sm mt-1">AI-powered sales coaching for modern teams.</p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Privacy</a>
            <a href="#" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">Terms</a>
            <a href="mailto:hello@pitchiq.ai" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">hello@pitchiq.ai</a>
          </div>
          <p className="text-zinc-600 text-sm">© 2025 PitchIQ. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
