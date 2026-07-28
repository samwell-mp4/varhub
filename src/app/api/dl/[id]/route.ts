import { NextRequest } from 'next/server'

const store = new Map<string, { data: Buffer; type: string }>()

export function storeVideo(id: string, data: Buffer, type: string) {
  store.set(id, { data, type })
  setTimeout(() => store.delete(id), 300000)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entry = store.get(id)
  if (!entry) return new Response('not found', { status: 404 })
  return new Response(entry.data as unknown as BodyInit, {
    headers: {
      'Content-Type': entry.type,
      'Content-Disposition': 'attachment; filename="video.mp4"',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
