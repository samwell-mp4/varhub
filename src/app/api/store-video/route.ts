import { NextRequest, NextResponse } from 'next/server'
import { storeVideo, listVideos } from '../dl/[id]/route'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('video') as File | null
    const title = form.get('title') as string || 'Untitled'
    if (!file) return NextResponse.json({ error: 'video required' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const id = Math.random().toString(36).slice(2)
    storeVideo(id, buf, file.type || 'video/mp4')

    return NextResponse.json({ id, title, url: `/api/dl/${id}` })
  } catch {
    return NextResponse.json({ error: 'store failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(listVideos())
}
