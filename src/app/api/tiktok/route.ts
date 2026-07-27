import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    const body = new URLSearchParams({ url, hd: '1' })

    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(20000),
    })

    const data = await res.json()

    if (data.code !== 0) {
      return NextResponse.json({ error: data.msg || 'Não foi possível processar o vídeo' }, { status: 400 })
    }

    const videoUrl = data.data.hdplay || data.data.play || null
    const audioUrl = data.data.music || null
    const title = data.data.title || ''

    return NextResponse.json({ videoUrl, audioUrl, title })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar o vídeo' }, { status: 500 })
  }
}
