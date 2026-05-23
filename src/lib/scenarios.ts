export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type Mode = 'call' | 'email'

export interface Persona {
  name: string
  gender: 'male' | 'female'
  jobTitle: string
  company: string
  industry: string
  companySize: string
  difficulty: Difficulty
  disposition: string
  openingLine: string
  objections: string[]
  repGoal: string
  likes: string[]
  dislikes: string[]
}

export interface TranscriptTurn {
  role: 'rep' | 'prospect'
  content: string
}

export interface Tier1Results {
  noInterrupting: boolean
  matchedEnergy: boolean
  prospectsName: boolean
  outcomeLed: boolean
  threeStrikes: boolean
  definedNextStep: boolean
}

export interface ScoreBreakdown {
  tier1Compliance: number
  openingQuality: number
  objectionHandling: number
  close: number
}

export interface Session {
  id: string
  date: string
  mode: Mode
  difficulty: Difficulty
  repName: string
  persona: Pick<Persona, 'name' | 'jobTitle' | 'company' | 'industry' | 'disposition' | 'likes' | 'dislikes'>
  score: number
  scoreBreakdown: ScoreBreakdown
  tier1Results: Tier1Results
  summary: string
}

export interface ActiveSession {
  id: string
  date: string
  mode: Mode
  difficulty: Difficulty
  repName: string
  persona: Persona
  transcript: TranscriptTurn[]
  tier0Violation?: { rule: string; word: string }
}

export const ACTIVE_SESSION_KEY = 'veriforge_active_session'
export const SESSION_HISTORY_KEY = 'veriforge_coach_sessions'
