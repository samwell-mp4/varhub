import { NextRequest, NextResponse } from 'next/server'
import { storeVideo } from '../dl/[id]/route'

const RENDERER_URL = process.env.RENDERER_URL || 'http://localhost:3001'
const RENDER_SECRET = process.env.RENDER_SECRET || 'changeme'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { project } = await req.json()
    if (!project) return NextResponse.json({ error: 'project required' }, { status: 400 })

    const body = new FormData()

    const mediaMap: Record<string, string> = {}

    for (let i = 0; i < (project.media || []).length; i++) {
      const m = project.media[i]
      if (!m.src?.startsWith('data:')) continue

      const [header, b64] = m.src.split(',')
      const ext = header.includes('png') ? 'png' : header.includes('mp4') ? 'mp4' : 'jpg'
      const buf = Buffer.from(b64, 'base64')
      const filename = `media_${i}.${ext}`
      body.set(filename, new Blob([buf], { type: m.type === 'video' ? 'video/mp4' : `image/${ext}` }), filename)
      mediaMap[m.id] = filename
    }

    const projectCopy = JSON.parse(JSON.stringify(project))
    for (const m of projectCopy.media || []) {
      if (mediaMap[m.id]) {
        m.src = mediaMap[m.id]
      }
    }
    body.set('project', JSON.stringify(projectCopy))

    const res = await fetch(`${RENDERER_URL}/render`, {
      method: 'POST',
      headers: { 'x-secret': RENDER_SECRET },
      body,
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
