import { NextResponse } from 'next/server'
import { storeVideo } from '../dl/[id]/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com') || u.includes('douyin.com')) return 'tiktok'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
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
  const m = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([^/?&]+)/)
  return m ? m[1] : null
}

async function fetchUrl(url: string, timeout = 10000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function extractVideoUrl(text: string): string | null {
  const patterns = [
    /https?:\/\/[^"'\s<>]+?\.mp4[^"'\s<>]*/i,
    /https?:\/\/[^"'\s<>]+?video[^"'\s<>]*/i,
    /https?:\/\/[^"'\s<>]+?\/download[^"'\s<>]*/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) {
      const url = m[0].replace(/&amp;/g, '&')
      if (url.includes('.mp4') || url.includes('video') || url.includes('download')) return url
    }
  }
  return null
}

async function youtubeDownload(videoId: string) {
  const urls = [
    `https://www.youtube.com/watch?v=${videoId}`,
    `https://youtu.be/${videoId}`,
  ]

  for (const videoUrl of urls) {
    const apis = [
      `https://www.yt-download.org/api/button/mp4/${encodeURIComponent(videoUrl)}`,
      `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(videoUrl)}`,
    ]

    for (const apiUrl of apis) {
      const html = await fetchUrl(apiUrl, 12000)
      if (!html) continue
      const video = extractVideoUrl(html)
      if (video) return { videoUrl: video, audioUrl: null, title: '' }

      const hrefRegex = /href=["']([^"']+)["']/gi
      let match
      while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1].replace(/&amp;/g, '&')
        if (href.includes('.mp4') || href.includes('video/') || href.includes('download')) {
          return { videoUrl: href.startsWith('http') ? href : `https:${href}`, audioUrl: null, title: '' }
        }
      }
    }
  }

  const instances = ['https://inv.nadeko.net', 'https://invidious.snopyta.org', 'https://yewtu.be']
  for (const instance of instances) {
    const json = await fetchUrl(`${instance}/api/v1/videos/${videoId}`, 8000)
    if (!json) continue
    try {
      const data = JSON.parse(json)
      const formats = [...(data.adaptiveFormats || []), ...(data.formatStreams || [])]
      const video = formats
        .filter((f: any) => f.type?.startsWith('video/mp4'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      const audio = formats
        .filter((f: any) => f.type?.startsWith('audio/mp4'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0]
      if (video?.url) return { videoUrl: video.url, audioUrl: audio?.url || null, title: data.title || '' }
    } catch {}
  }

  return null
}

async function instagramDownload(shortcode: string) {
  const postUrl = `https://www.instagram.com/p/${shortcode}/`

  try {
    const wh = await fetch('https://plug-sales-dispatch-app-n8n-2.hx8235.easypanel.host/webhook/204c8b8e-9b2a-4ea3-ba10-9d399d1e1d12', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url: postUrl }),
      signal: AbortSignal.timeout(30000),
    })
    if (wh.ok) {
      const ct = wh.headers.get('content-type') || ''
      if (ct.includes('json')) {
        const data = await wh.json()
        const videoUrl = data?.url || data?.videoUrl || data?.downloadUrl || data?.data?.url || null
        if (videoUrl) return { videoUrl, audioUrl: data?.audioUrl || null, title: data?.title || '' }
      } else if (ct.includes('octet-stream') || ct.includes('video') || ct.includes('mp4')) {
        const buffer = Buffer.from(await wh.arrayBuffer())
        const id = Math.random().toString(36).slice(2)
        storeVideo(id, buffer, ct || 'video/mp4')
        return { videoUrl: `/api/dl/${id}`, audioUrl: null, title: '' }
      } else {
        const text = await wh.text()
        const videoUrl = extractVideoUrl(text)
        if (videoUrl) return { videoUrl, audioUrl: null, title: '' }
      }
    }
  } catch {}

  const html = await fetchUrl(postUrl, 12000)
  if (html) {
    const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[1])
        const vu = json?.video?.contentUrl || json?.contentUrl
        if (vu) return { videoUrl: vu, audioUrl: null, title: json?.name || json?.caption || '' }
      } catch {}
    }
    const ogMatch = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
    if (ogMatch) return { videoUrl: ogMatch[1], audioUrl: null, title: '' }
    const videoSrc = html.match(/<video[^>]*src=["']([^"']+)["']/i)
    if (videoSrc) return { videoUrl: videoSrc[1], audioUrl: null, title: '' }
  }

  const imginnUrls = [
    `https://imginn.com/p/${shortcode}/`,
    `https://imginn.org/p/${shortcode}/`,
  ]
  for (const url of imginnUrls) {
    const imginnHtml = await fetchUrl(url, 8000)
    if (!imginnHtml) continue
    const videoSrc = imginnHtml.match(/<video[^>]*src="([^"]+)"/)
    if (videoSrc) {
      return { videoUrl: videoSrc[1].startsWith('http') ? videoSrc[1] : `https:${videoSrc[1]}`, audioUrl: null, title: '' }
    }
    const img = imginnHtml.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (img) return { videoUrl: img[1], audioUrl: null, title: '' }
  }

  const veviozHtml = await fetchUrl(`https://api.vevioz.com/api/instagram/${encodeURIComponent(postUrl)}`, 8000)
  if (veviozHtml) {
    const video = extractVideoUrl(veviozHtml)
    if (video) return { videoUrl: video, audioUrl: null, title: '' }
  }

  return null
}

async function facebookDownload(url: string) {
  const veviozHtml = await fetchUrl(`https://api.vevioz.com/api/button/facebook/${encodeURIComponent(url)}`, 8000)
  if (veviozHtml) {
    const video = extractVideoUrl(veviozHtml)
    if (video) return { videoUrl: video, audioUrl: null, title: '' }
  }

  const html = await fetchUrl(url, 10000)
  if (html) {
    const ogVideo = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
    if (ogVideo) return { videoUrl: ogVideo[1], audioUrl: null, title: '' }
    const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
    if (ogImage) return { videoUrl: ogImage[1], audioUrl: null, title: '' }
  }

  return null
}

async function tiktokDownload(url: string) {
  const methods = [
    async () => {
      const body = new URLSearchParams({ url, hd: '1' })
      const res = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        body: body.toString(),
        signal: AbortSignal.timeout(8000),
      })
      const data = await res.json()
      if (data.code === 0 && (data.data?.hdplay || data.data?.play)) {
        return { videoUrl: data.data.hdplay || data.data.play, audioUrl: data.data.music || null, title: data.data.title || '' }
      }
      return null
    },
    async () => {
      const html = await fetchUrl(`https://api.vevioz.com/api/button/tiktok/${encodeURIComponent(url)}`, 8000)
      if (!html) return null
      const video = extractVideoUrl(html)
      if (video) return { videoUrl: video, audioUrl: null, title: '' }
      const a = html.match(/href="([^"]+\.mp4[^"]*)"/)
      if (a) return { videoUrl: a[1].startsWith('http') ? a[1] : `https:${a[1]}`, audioUrl: null, title: '' }
      return null
    },
    async () => {
      const html = await fetchUrl(url, 8000)
      if (!html) return null
      const scripts = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
      if (scripts) {
        try {
          const data = JSON.parse(scripts[1])
          const vu = data?.props?.pageProps?.videoData?.videoUrl || data?.props?.pageProps?.itemInfo?.itemStruct?.video?.playAddr?.[0]?.src
          if (vu) return { videoUrl: vu, audioUrl: null, title: data?.props?.pageProps?.videoData?.title || '' }
        } catch {}
      }
      const og = html.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i)
      if (og) return { videoUrl: og[1], audioUrl: null, title: '' }
      const src = html.match(/<video[^>]*src="([^"]+)"/i)
      if (src) return { videoUrl: src[1], audioUrl: null, title: '' }
      return null
    },
  ]

  for (const m of methods) {
    try {
      const r = await m()
      if (r?.videoUrl) return r
    } catch {}
  }
  return null
}

async function proxyMedia(url: string, ext: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const type = res.headers.get('content-type') || 'video/mp4'
    const id = crypto.randomUUID()
    storeVideo(id, buffer, type)
    return `/api/dl/${id}`
  } catch {
    return null
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

    const proxiedVideo = await proxyMedia(result.videoUrl, 'mp4')
    let proxiedAudio: string | null = null
    if (result.audioUrl) {
      proxiedAudio = await proxyMedia(result.audioUrl, 'mp3')
    }

    return NextResponse.json({
      videoUrl: proxiedVideo || result.videoUrl,
      audioUrl: proxiedAudio || result.audioUrl,
      title: result.title,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar o vídeo' }, { status: 500 })
  }
}
