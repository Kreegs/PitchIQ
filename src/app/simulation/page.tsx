'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ACTIVE_SESSION_KEY,
  type ActiveSession,
  type TranscriptTurn,
} from '@/lib/scenarios'

export default function SimulationPage() {
  const router = useRouter()
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [callEnded, setCallEnded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isEmailStart, setIsEmailStart] = useState(false)
  const [subjectLine, setSubjectLine] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const didInit = useRef(false)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const pendingSpeakRef = useRef('')
  const voiceEnabledRef = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const raw = localStorage.getItem(ACTIVE_SESSION_KEY)
    if (!raw) {
      router.push('/')
      return
    }

    const active: ActiveSession = JSON.parse(raw)
    setSession(active)

    if (active.mode === 'call') {
      setTranscript([{ role: 'prospect', content: active.persona.openingLine }])
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      setIsEmailStart(true)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (SpeechRecognitionImpl && window.speechSynthesis) {
      setVoiceSupported(true)
      synthRef.current = window.speechSynthesis
      if (speechSynthesis.onvoiceschanged !== undefined)
        speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices()
      const rec = new SpeechRecognitionImpl()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'
      recognitionRef.current = rec
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const detectCallEnd = (message: string): boolean => {
    const endPhrases = [
      'goodbye', 'bye.', 'got to go', 'gotta go', 'have to run',
      'not interested', 'stop calling', 'remove me',
      "i'm done", 'end this call', 'hang up',
    ]
    const lower = message.toLowerCase()
    return endPhrases.some(p => lower.includes(p))
  }

  const sendMessage = useCallback(async (messageOverride?: string) => {
    if (!session) return
    const rawText = (messageOverride ?? input).trim()
    if (!rawText || isLoading) return

    const isEmail = session.mode === 'email'
    const text = isEmail && isEmailStart && subjectLine.trim()
      ? `Subject: ${subjectLine.trim()}\n\n${rawText}`
      : rawText

    const repTurn: TranscriptTurn = { role: 'rep', content: text }
    const updatedTranscript = [...transcript, repTurn]

    setTranscript(updatedTranscript)
    setInput('')
    setIsEmailStart(false)
    setIsLoading(true)

    try {
      const res = await fetch('/api/prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: updatedTranscript,
          persona: session.persona,
          latestRepMessage: text,
          mode: session.mode,
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let prospectText = ''

      setTranscript(prev => [...prev, { role: 'prospect', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        prospectText += chunk
        setTranscript(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'prospect', content: prospectText }
          return updated
        })
      }

      if (voiceEnabledRef.current && synthRef.current && prospectText.trim()) {
        const utt = new SpeechSynthesisUtterance(prospectText)
        const voices = synthRef.current.getVoices()
        const gender = session.persona.gender
        const match = voices.find(v =>
          gender === 'female'
            ? /zira|samantha|victoria|karen|female/i.test(v.name)
            : /david|mark|daniel|alex|male/i.test(v.name)
        )
        if (match) utt.voice = match
        utt.rate = 1.0
        utt.pitch = gender === 'female' ? 1.1 : 0.9
        synthRef.current.speak(utt)
      }

      if (session.mode === 'email' || detectCallEnd(prospectText)) {
        synthRef.current?.cancel()
        setCallEnded(true)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    } catch (err) {
      console.error('Prospect response failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session, input, isLoading, transcript])

  const startListening = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec || isListening || isLoading || callEnded) return
    synthRef.current?.cancel()
    setIsListening(true)
    setInput('')
    rec.onresult = (e: any) => {
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(' ').trim()
      setInput(t)
      pendingSpeakRef.current = t
    }
    rec.onerror = () => setIsListening(false)
    rec.onend = () => {
      setIsListening(false)
      if (pendingSpeakRef.current.trim()) {
        sendMessage(pendingSpeakRef.current.trim())
        pendingSpeakRef.current = ''
      }
    }
    rec.start()
  }, [isListening, isLoading, callEnded, sendMessage])

  const toggleVoice = useCallback(() => {
    setVoiceEnabled(prev => {
      const next = !prev
      voiceEnabledRef.current = next
      if (!next) {
        recognitionRef.current?.abort()
        synthRef.current?.cancel()
        setIsListening(false)
      }
      return next
    })
  }, [])

  const endSession = () => {
    if (!session) return
    const updated: ActiveSession = { ...session, transcript }
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(updated))
    if (timerRef.current) clearInterval(timerRef.current)
    router.push('/debrief')
  }

  if (!session) return null

  const { persona, mode } = session
  const isCall = mode === 'call'

  if (isCall) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        {/* Call header */}
        <div className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-semibold">
              {persona.name.charAt(0)}
            </div>
            <div>
              <div className="text-white font-semibold text-sm">{persona.name}</div>
              <div className="text-zinc-400 text-xs">{persona.jobTitle} · {persona.company}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {voiceSupported && (
              <button
                onClick={toggleVoice}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  voiceEnabled ? 'bg-green-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {voiceEnabled ? 'Voice ON' : 'Voice OFF'}
              </button>
            )}
            {callEnded ? (
              <span className="text-red-400 text-sm font-medium">Call ended</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-mono">{formatTime(elapsed)}</span>
              </div>
            )}
            <button
              onClick={endSession}
              className="bg-red-600 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {callEnded ? 'Go to Debrief →' : 'End Call'}
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {transcript.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === 'rep' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[72%]">
                <div className={`text-xs mb-1 font-medium text-zinc-500 ${turn.role === 'rep' ? 'text-right' : ''}`}>
                  {turn.role === 'rep' ? 'You' : persona.name}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    turn.role === 'rep'
                      ? 'bg-green-500 text-zinc-950 rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                  }`}
                >
                  {turn.content || (
                    <span className="text-zinc-500 italic animate-pulse">...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!callEnded ? (
          <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading || isListening}
                placeholder={isListening ? 'Listening...' : voiceEnabled ? 'Or type your response...' : 'Type your response...'}
                className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              />
              {voiceEnabled && voiceSupported && (
                <button
                  onClick={startListening}
                  disabled={isLoading || isListening || callEnded}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                    <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5H10.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || isListening || !input.trim()}
                className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-bold px-5 py-3 rounded-xl transition-colors text-sm shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex justify-center">
            <button
              onClick={endSession}
              className="bg-green-500 hover:bg-green-400 text-zinc-950 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Go to Debrief →
            </button>
          </div>
        )}
      </div>
    )
  }

  // Email mode
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-zinc-900 text-sm">Cold Email</div>
          <div className="text-zinc-400 text-xs">
            {persona.name} · {persona.jobTitle} · {persona.company}
          </div>
        </div>
        <button
          onClick={endSession}
          className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {callEnded ? 'Go to Debrief →' : 'End Conversation'}
        </button>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        <div className="flex-1 space-y-4 mb-6">
          {transcript.map((turn, i) => {
            const hasSubject = turn.role === 'rep' && turn.content.startsWith('Subject:')
            const subjectMatch = hasSubject ? turn.content.match(/^Subject: (.+)\n\n([\s\S]*)$/) : null
            const subject = subjectMatch?.[1] ?? ''
            const body = subjectMatch?.[2] ?? turn.content
            return (
              <div
                key={i}
                className={`rounded-2xl p-5 text-sm leading-relaxed ${
                  turn.role === 'rep'
                    ? 'bg-white border border-zinc-200'
                    : 'bg-green-50 border border-green-100'
                }`}
              >
                <div className={`text-xs font-semibold mb-2 ${turn.role === 'rep' ? 'text-zinc-400' : 'text-green-700'}`}>
                  {turn.role === 'rep' ? 'You' : `${persona.name} replied`}
                </div>
                {hasSubject && subject && (
                  <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 mb-2">
                    <span className="text-xs font-semibold text-zinc-400">Subject</span>
                    <span className="text-zinc-700 text-xs font-medium">{subject}</span>
                  </div>
                )}
                <div className={turn.role === 'rep' ? 'text-zinc-700 whitespace-pre-wrap' : 'text-zinc-800'}>
                  {body || <span className="text-zinc-400 italic animate-pulse">...</span>}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {!callEnded ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wider">
              Compose your cold email
            </div>
            {isEmailStart && (
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-3">
                <span className="text-xs font-semibold text-zinc-400 w-14 shrink-0">Subject</span>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={e => setSubjectLine(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter subject line..."
                  className="flex-1 text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none disabled:opacity-50"
                />
              </div>
            )}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              rows={8}
              placeholder={`Write your cold email to ${persona.name}...`}
              className="w-full text-zinc-900 text-sm leading-relaxed placeholder-zinc-400 resize-none focus:outline-none disabled:opacity-50"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim() || (isEmailStart && !subjectLine.trim())}
                className="bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={endSession}
              className="bg-green-500 hover:bg-green-400 text-zinc-950 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Go to Debrief →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
