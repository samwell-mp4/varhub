import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com') || u.includes('douyin.com')) return 'tiktok'
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('youtube')) return 'youtube'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'facebook'
  return 'unknown'
}

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function extractInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?&]+)/)
  return m ? m[1] : null
}

async function youtubeDownload(videoId: string) {
  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.snopyta.org',
    'https://yewtu.be',
  ]
  for (const instance of instances) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const formats = data.adaptiveFormats || []
      const video = formats
        .filter((f: any) => f.type?.startsWith('video/mp4') && f.bitrate)
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      const audio = formats
        .filter((f: any) => f.type?.startsWith('audio/mp4'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      if (video?.url) {
        return {
          videoUrl: video.url,
          audioUrl: audio?.url || null,
          title: data.title || '',
        }
      }
    } catch {}
  }
  return null
}

async function instagramDownload(shortcode: string) {
  const urls = [
    `https://imginn.com/p/${shortcode}/`,
    `https://imginn.org/p/${shortcode}/`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      })
      const html = await res.text()
      const videoMatch = html.match(/<video[^>]*src="([^"]+)"/)
      if (videoMatch) {
        return {
          videoUrl: videoMatch[1].startsWith('http') ? videoMatch[1] : `https:${videoMatch[1]}`,
          audioUrl: null,
          title: '',
        }
      }
      const imgMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      if (imgMatch) {
        return {
          videoUrl: imgMatch[1],
          audioUrl: null,
          title: '',
        }
      }
    } catch {}
  }
  return null
}

async function facebookDownload(url: string) {
  const attempts = [
    async () => {
      const res = await fetch(`https://api.vevioz.com/api/button/facebook/${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(15000),
        redirect: 'manual',
      })
      if (res.status === 301 || res.status === 302) {
        const location = res.headers.get('location')
        if (location) return { videoUrl: location, audioUrl: null, title: '' }
      }
      return null
    },
    async () => {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      })
      const html = await res.text()
      const m = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
      if (m) return { videoUrl: m[1], audioUrl: null, title: '' }
      const m2 = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      if (m2) return { videoUrl: m2[1], audioUrl: null, title: '' }
      return null
    },
  ]
  for (const attempt of attempts) {
    const result = await attempt()
    if (result) return result
  }
  return null
}

async function tiktokDownload(url: string) {
  const body = new URLSearchParams({ url, hd: '1' })
  const res = await fetch('https://www.tikwm.com/api/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  })
  const data = await res.json()
  if (data.code !== 0) return null
  return {
    videoUrl: data.data.hdplay || data.data.play || null,
    audioUrl: data.data.music || null,
    title: data.data.title || '',
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    const platform = detectPlatform(url)
    let result: { videoUrl: string; audioUrl: string | null; title: string } | null = null

    switch (platform) {
      case 'tiktok':
        result = await tiktokDownload(url)
        break
      case 'youtube': {
        const id = extractYoutubeId(url)
        if (!id) return NextResponse.json({ error: 'ID do vídeo não encontrado' }, { status: 400 })
        result = await youtubeDownload(id)
        break
      }
      case 'instagram': {
        const sc = extractInstagramShortcode(url)
        if (!sc) return NextResponse.json({ error: 'Link inválido do Instagram' }, { status: 400 })
        result = await instagramDownload(sc)
        break
      }
      case 'facebook':
        result = await facebookDownload(url)
        break
      default:
        return NextResponse.json({ error: 'Plataforma não suportada' }, { status: 400 })
    }

    if (!result?.videoUrl) {
      return NextResponse.json({ error: 'Não foi possível obter o vídeo' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erro ao processar o vídeo' }, { status: 500 })
  }
}
