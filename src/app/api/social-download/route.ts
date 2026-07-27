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
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  const methods = [
    async () => {
      const res = await fetch(`https://www.yt-download.org/api/button/mp4/${encodeURIComponent(videoUrl)}`, {
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      })
      if (!res.ok) return null
      const text = await res.text()
      const m = text.match(/href=["']([^"']+\.mp4[^"']*)["']/i)
      if (m) return m[1]
      return res.url.includes('video') || res.url.includes('.mp4') ? res.url : null
    },
    async () => {
      const instances = [
        'https://inv.nadeko.net',
        'https://invidious.snopyta.org',
        'https://yewtu.be',
      ]
      for (const instance of instances) {
        try {
          const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000),
          })
          if (!res.ok) continue
          const data = await res.json()
          const formats = [...(data.adaptiveFormats || []), ...(data.formatStreams || [])]
          const video = formats
            .filter((f: any) => f.type?.startsWith('video/mp4') && f.bitrate)
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
          const audio = formats
            .filter((f: any) => f.type?.startsWith('audio/mp4'))
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
          if (video?.url) return { videoUrl: video.url, audioUrl: audio?.url || null, title: data.title || '' }
        } catch {}
      }
      return null
    },
  ]

  for (const method of methods) {
    try {
      const result = await method()
      if (result) {
        if (typeof result === 'string') return { videoUrl: result, audioUrl: null, title: '' }
        return result
      }
    } catch {}
  }
  return null
}

async function instagramDownload(shortcode: string) {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`

  const methods = [
    async () => {
      const res = await fetch(postUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Sec-Fetch-Mode': 'navigate',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) return null
      const html = await res.text()
      const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
      if (jsonMatch) {
        try {
          const json = JSON.parse(jsonMatch[1])
          const videoUrl = json?.video?.contentUrl || json.contentUrl
          if (videoUrl) return { videoUrl, audioUrl: null, title: json?.name || json?.caption || '' }
        } catch {}
      }
      const ogMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
      if (ogMatch) return { videoUrl: ogMatch[1], audioUrl: null, title: '' }
      const ogImg = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      if (ogImg) return { videoUrl: ogImg[1], audioUrl: null, title: '' }
      return null
    },
    async () => {
      const urls = [
        `https://imginn.com/p/${shortcode}/`,
        `https://imginn.org/p/${shortcode}/`,
      ]
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
            signal: AbortSignal.timeout(10000),
          })
          if (!res.ok) continue
          const html = await res.text()
          const videoMatch = html.match(/<video[^>]*src="([^"]+)"/)
          if (videoMatch) {
            const videoUrl = videoMatch[1].startsWith('http') ? videoMatch[1] : `https:${videoMatch[1]}`
            return { videoUrl, audioUrl: null, title: '' }
          }
        } catch {}
      }
      return null
    },
    async () => {
      const res = await fetch(`https://api.vevioz.com/api/instagram/${encodeURIComponent(postUrl)}`, {
        signal: AbortSignal.timeout(10000),
        redirect: 'manual',
      })
      if (res.status === 301 || res.status === 302) {
        const location = res.headers.get('location')
        if (location) return { videoUrl: location, audioUrl: null, title: '' }
      }
      if (res.ok) {
        const text = await res.text()
        const m = text.match(/href=["']([^"']+)["']/i)
        if (m) return { videoUrl: m[1], audioUrl: null, title: '' }
      }
      return null
    },
  ]

  for (const method of methods) {
    try {
      const result = await method()
      if (result) return result
    } catch {}
  }
  return null
}

async function facebookDownload(url: string) {
  const methods = [
    async () => {
      const res = await fetch(`https://api.vevioz.com/api/button/facebook/${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(10000),
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
      if (!res.ok) return null
      const html = await res.text()
      const m = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
      if (m) return { videoUrl: m[1], audioUrl: null, title: '' }
      const m2 = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
      if (m2) return { videoUrl: m2[1], audioUrl: null, title: '' }
      return null
    },
  ]

  for (const method of methods) {
    try {
      const result = await method()
      if (result) return result
    } catch {}
  }
  return null
}

async function tiktokDownload(url: string) {
  const body = new URLSearchParams({ url, hd: '1' })
  try {
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json',
      },
      body: body.toString(),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    if (data.code === 0) {
      return {
        videoUrl: data.data.hdplay || data.data.play || null,
        audioUrl: data.data.music || null,
        title: data.data.title || '',
      }
    }
  } catch {}
  return null
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
