import { Project } from '@/types'
import { saveVideo } from '@/lib/videoStore'

async function toDataUrl(src: string): Promise<string | undefined> {
  if (src.startsWith('data:')) return src
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  } catch { return undefined }
}

export async function serverExport(
  project: Project,
  onProgress?: (msg: string) => void
): Promise<Blob | null> {
  const proj: Record<string, unknown> = JSON.parse(JSON.stringify(project))

  if (proj.logo && !proj.logo.startsWith('data:')) {
    proj.logo = await toDataUrl(proj.logo).catch(() => undefined)
  }
  for (const m of proj.media || []) {
    if (m.src && !m.src.startsWith('data:')) {
      m.src = await toDataUrl(m.src).catch(() => m.src)
    }
  }

  onProgress?.('Enviando para o servidor...')

  const rendererUrl = process.env.NEXT_PUBLIC_RENDERER_URL || 'https://var-hub-ffmpeg.hx8235.easypanel.host'
  const renderSecret = process.env.NEXT_PUBLIC_RENDER_SECRET || 'changeme'
  const res = await fetch(`${rendererUrl}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-secret': renderSecret },
    body: JSON.stringify({ project: proj }),
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`renderer ${res.status}: ${txt.slice(0, 20000)}`)
  }

  onProgress?.('Finalizando...')
  const blob = await res.blob()

  const id = Math.random().toString(36).slice(2)
  saveVideo(id, blob, proj.title || 'Untitled').catch(() => {})
  return blob
}
