import { NextRequest, NextResponse } from 'next/server'

const VOICE_IDS = {
  male:   'Xb7hH8MSUJpSbSDYk0k2',
  female: '21m00Tcm4TlvDq8ikWAM',
}Xb7hH8MSUJpSbSDYk0k2

export async function POST(req: NextRequest) {
  const { text, gender } = await req.json()
  const voiceId = VOICE_IDS[gender as keyof typeof VOICE_IDS] ?? VOICE_IDS.male

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'TTS failed' }, { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}
