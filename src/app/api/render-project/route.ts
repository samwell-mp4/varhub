import { NextRequest, NextResponse } from 'next/server'
import { storeVideo } from '../dl/[id]/route'

const RENDERER_URL = process.env.RENDERER_URL || 'https://var-hub-ffmpeg.hx8235.easypanel.host'
const RENDER_SECRET = process.env.RENDER_SECRET || 'changeme'

export const maxDuration = 300

async function toDataUrl(src: string, origin: string): Promise<string> {
  if (src.startsWith('data:')) return src
  if (src.startsWith('blob:')) throw new Error('cannot resolve blob URL on server')
  const url = src.startsWith('http') ? src : `${origin}${src}`
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || 'image/jpeg'
  return `data:${ct};base64,${buf.toString('base64')}`
}

export async function POST(req: NextRequest) {
  try {
    const { project } = await req.json()
    if (!project) return NextResponse.json({ error: 'project required' }, { status: 400 })

    if (project.logo) {
      project.logo = await toDataUrl(project.logo, req.nextUrl.origin)
    }

    for (const m of project.media || []) {
      if (m.src && !m.src.startsWith('data:')) {
        m.src = await toDataUrl(m.src, req.nextUrl.origin)
      }
    }

    const res = await fetch(`${RENDERER_URL}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret': RENDER_SECRET,
      },
      body: JSON.stringify({ project }),
      signal: AbortSignal.timeout(240000),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `renderer: ${text}` }, { status: 502 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const ct = res.headers.get('content-type') || 'video/mp4'
    const id = Math.random().toString(36).slice(2)
    storeVideo(id, buffer, ct)

    return NextResponse.json({ videoUrl: `/api/dl/${id}` })
  } catch {
    return NextResponse.json({ error: 'render failed' }, { status: 500 })
  }
}
