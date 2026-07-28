import { Project, ExportFormat } from '@/types'
import { TEMPLATES } from './autoLayout'

const WIDTH = 1080
const HEIGHT = 1920
const FPS = 30

const PAD = 32
const LOGO_SIZE = 44
const LOGO_GAP = 16
const CAT_FONT = 'bold 18px sans-serif'
const TITLE_SIZE = 36 // canvas px (36px on 1080 = 16px CSS on ~420px preview)
const SUB_SIZE = 24
const FONT_SCALE = 2.25 // maps CSS slider px → canvas px
function titleFont(size?: number, bold?: boolean) { return `${bold ?? true ? 'bold' : 'normal'} ${size ?? TITLE_SIZE}px sans-serif` }
function subFont(size?: number, bold?: boolean) { return `${bold ?? false ? 'bold' : 'normal'} ${size ?? SUB_SIZE}px sans-serif` }

function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number
): string[] {

  ctx.font = font
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const test = current ? `${current} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function getHeaderHeight(
  ctx: CanvasRenderingContext2D,
  project: Project
): number {
  const textMaxW = WIDTH - PAD - LOGO_SIZE - LOGO_GAP - PAD
  const rawT = project.titleSize ?? 16
  const rawS = project.subtitleSize ?? 13
  const tSize = rawT * FONT_SCALE
  const sSize = rawS * FONT_SCALE
  const tBold = project.titleBold ?? true
  const sBold = project.subtitleBold ?? false
  let y = PAD

  if (project.category) {
    ctx.font = CAT_FONT
    y += 22
  }

  ctx.font = titleFont(tSize, tBold)
  const titleLines = measureText(ctx, project.title || 'Título', titleFont(tSize, tBold), textMaxW)
  y += titleLines.length * (tSize + 8)

  if (project.subtitle) {
    ctx.font = subFont(sSize, sBold)
    const subLines = measureText(ctx, project.subtitle, subFont(sSize, sBold), textMaxW)
    y += subLines.length * (sSize + 8)
  }

  return y + PAD
}

function drawHeader(ctx: CanvasRenderingContext2D, project: Project, headerH: number, canvas: HTMLCanvasElement) {
  ctx.fillStyle = project.bgColor || '#000000'
  ctx.fillRect(0, 0, WIDTH, headerH)
  const grad = ctx.createLinearGradient(0, 0, 0, headerH)
  grad.addColorStop(0, 'rgba(0,0,0,0.4)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.15)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, WIDTH, headerH)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, WIDTH, headerH)

  const logoX = PAD
  const logoY = PAD
  ctx.save()
  ctx.beginPath()
  ctx.arc(logoX + LOGO_SIZE / 2, logoY + LOGO_SIZE / 2, LOGO_SIZE / 2, 0, Math.PI * 2)
  ctx.clip()
  if (project.logo) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = project.logo
    ctx.drawImage(img, logoX, logoY, LOGO_SIZE, LOGO_SIZE)
  } else {
    const g = ctx.createLinearGradient(logoX, logoY, logoX + LOGO_SIZE, logoY + LOGO_SIZE)
    g.addColorStop(0, '#8B5CF6')
    g.addColorStop(1, '#7C3AED')
    ctx.fillStyle = g
    ctx.fillRect(logoX, logoY, LOGO_SIZE, LOGO_SIZE)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('S', logoX + LOGO_SIZE / 2, logoY + LOGO_SIZE / 2 + 7)
    ctx.textAlign = 'left'
  }
  ctx.restore()

  const textX = logoX + LOGO_SIZE + LOGO_GAP
  const textMaxW = WIDTH - PAD - LOGO_SIZE - LOGO_GAP - PAD
  let ty = PAD + 4

  if (project.category) {
    ctx.fillStyle = '#a78bfa'
    ctx.font = CAT_FONT
    ctx.fillText(project.category.toUpperCase(), textX, ty + 16)
    ty += 26
  }

  const rawT = project.titleSize ?? 16
  const rawS = project.subtitleSize ?? 13
  const tSize = rawT * FONT_SCALE
  const sSize = rawS * FONT_SCALE
  const tBold = project.titleBold ?? true
  const sBold = project.subtitleBold ?? false
  ctx.fillStyle = project.titleColor || '#ffffff'
  ctx.font = titleFont(tSize, tBold)
  const titleLines = measureText(ctx, project.title || 'Título', titleFont(tSize, tBold), textMaxW)
  for (const line of titleLines) {
    ctx.fillText(line, textX, ty + tSize * 0.9)
    ty += tSize + 8
  }

  if (project.subtitle) {
    ctx.fillStyle = project.subtitleColor || '#a1a1aa'
    ctx.font = subFont(sSize, sBold)
    const subLines = measureText(ctx, project.subtitle, subFont(sSize, sBold), textMaxW)
    for (const line of subLines) {
      ctx.fillText(line, textX, ty + sSize * 0.85)
      ty += sSize + 8
    }
  }
}

async function downloadBlob(blob: Blob, filename: string) {
  if (navigator.share) {
    try {
      await navigator.share({ files: [new File([blob], filename, { type: blob.type })] })
      return
    } catch {}
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function renderFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  project: Project,
  videoElements: Map<string, HTMLVideoElement>,
) {
  ctx.fillStyle = project.bgColor || '#000000'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const headerH = getHeaderHeight(ctx, project)

  const template = TEMPLATES.find((t) => t.id === project.templateId) ?? TEMPLATES[4]
  const mediaH = HEIGHT - headerH

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i]
    const mediaItem = project.media[i] ?? null

    const sx = (slot.x / 100) * WIDTH
    const sy = headerH + (slot.y / 100) * mediaH
    const sw = (slot.width / 100) * WIDTH
    const sh = (slot.height / 100) * mediaH

    ctx.save()
    ctx.beginPath()
    ctx.rect(sx, sy, sw, sh)
    ctx.clip()

    if (!mediaItem) {
      ctx.fillStyle = '#111111'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.restore()
      continue
    }

    const panX = mediaItem.panX || 0
    const panY = mediaItem.panY || 0
    const scale = mediaItem.scale || 1

    if (mediaItem.type === 'image') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = mediaItem.src
      const imgAspect = img.naturalWidth / img.naturalHeight || 1
      const slotAspect = sw / sh
      let dw: number, dh: number, dx: number, dy: number
      if (imgAspect > slotAspect) {
        dh = sh
        dw = dh * imgAspect
        dx = sx - (dw - sw) / 2
        dy = sy
      } else {
        dw = sw
        dh = dw / imgAspect
        dx = sx
        dy = sy - (dh - sh) / 2
      }
      const cx = dx + dw / 2
      const cy = dy + dh / 2
      dw *= scale
      dh *= scale
      dx = cx - dw / 2 + panX
      dy = cy - dh / 2 + panY
      ctx.drawImage(img, dx, dy, dw, dh)
    } else if (mediaItem.type === 'video') {
      const video = videoElements.get(mediaItem.id)
      if (video) {
        const vAspect = video.videoWidth / video.videoHeight || 1
        const slotAspect = sw / sh
        let dw: number, dh: number, dx: number, dy: number
        if (vAspect > slotAspect) {
          dh = sh
          dw = dh * vAspect
          dx = sx - (dw - sw) / 2
          dy = sy
        } else {
          dw = sw
          dh = dw / vAspect
          dx = sx
          dy = sy - (dh - sh) / 2
        }
        const cx = dx + dw / 2
        const cy = dy + dh / 2
        dw *= scale
        dh *= scale
        dx = cx - dw / 2 + panX
        dy = cy - dh / 2 + panY
        ctx.drawImage(video, dx, dy, dw, dh)
      }
    }

    ctx.restore()
  }

  drawHeader(ctx, project, headerH, canvas)
}

export async function exportProject(
  project: Project,
  format: ExportFormat,
  onProgress?: (msg: string) => void,
  imageDuration?: number
): Promise<void> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')!

  onProgress?.('Preparando mídias...')

  const videoElements = new Map<string, HTMLVideoElement>()
  const hiddenContainer = document.createElement('div')
  hiddenContainer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none'
  document.body.appendChild(hiddenContainer)

  for (const media of project.media) {
    if (media.type === 'video') {
      const video = document.createElement('video')
      video.src = media.src
      video.crossOrigin = 'anonymous'
      video.playsInline = true
      video.preload = 'auto'
      video.muted = false
      hiddenContainer.appendChild(video)
      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve()
        video.onerror = () => resolve()
        setTimeout(() => resolve(), 3000)
      })
      if (media.trim) {
        video.currentTime = media.trim.start
      }
      await video.play().catch(() => {})
      videoElements.set(media.id, video)
    }
  }

  if (format === 'png') {
    onProgress?.('Renderizando...')
    for (const [id, video] of videoElements) {
      video.pause()
      const media = project.media.find((m) => m.id === id)
      video.currentTime = media?.trim?.start ?? 0
    }
    await renderFrame(ctx, canvas, project, videoElements)
    onProgress?.('Codificando PNG...')
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png')
    )
    await downloadBlob(blob, `${project.title || 'arte'}.png`)
    cleanupVideos(videoElements, hiddenContainer)
    return
  }

  if (format === 'jpg') {
    onProgress?.('Renderizando...')
    for (const [id, video] of videoElements) {
      video.pause()
      const media = project.media.find((m) => m.id === id)
      video.currentTime = media?.trim?.start ?? 0
    }
    await renderFrame(ctx, canvas, project, videoElements)
    onProgress?.('Codificando JPG...')
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
    )
    await downloadBlob(blob, `${project.title || 'arte'}.jpg`)
    cleanupVideos(videoElements, hiddenContainer)
    return
  }

  if (format === 'mp4') {
    onProgress?.('Preparando vídeo...')
    await renderFrame(ctx, canvas, project, videoElements)

    const hasVideo = project.media.some((m) => m.type === 'video')
    let duration = hasVideo ? 3 : (imageDuration ?? 3)
    if (hasVideo) {
      const videoMedia = project.media.find((m) => m.type === 'video')!
      if (videoMedia.trim) {
        duration = videoMedia.trim.end - videoMedia.trim.start
      } else if (videoMedia.duration) {
        duration = videoMedia.duration
      }
    }

    const canvasStream = canvas.captureStream(FPS)

    let audioCtx: AudioContext | null = null
    const audioSources: MediaElementAudioSourceNode[] = []
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const dest = audioCtx.createMediaStreamDestination()
      for (const [, video] of videoElements) {
        try {
          const source = audioCtx.createMediaElementSource(video)
          source.connect(dest)
          audioSources.push(source)
        } catch {}
      }
      const audioTracks = dest.stream.getAudioTracks()
      for (const t of audioTracks) canvasStream.addTrack(t)
    } catch {}

    function findMimeType(): string {
      const types = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=avc1.64001E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
      for (const t of types) {
        try {
          if (MediaRecorder.isTypeSupported(t)) return t
        } catch {}
      }
      return 'video/webm'
    }

    const mimeType = findMimeType()
    let mediaRecorder: MediaRecorder
    try {
      mediaRecorder = new MediaRecorder(canvasStream, { mimeType })
    } catch {
      mediaRecorder = new MediaRecorder(canvasStream)
    }
    const chunks: Blob[] = []
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    const recordingDone = new Promise<void>((resolve) => {
      mediaRecorder.onstop = () => resolve()
    })

    for (const [id, video] of videoElements) {
      const media = project.media.find((m) => m.id === id)
      video.currentTime = media?.trim?.start ?? 0
    }
    await new Promise((r) => setTimeout(r, 50))

    mediaRecorder.start()
    const startTime = performance.now()
    const frameDuration = 1000 / FPS
    let frame = 0

    while (true) {
      const elapsed = (performance.now() - startTime) / 1000
      if (elapsed >= duration) break

      if (frame % Math.round(FPS / 2) === 0) {
        const pct = Math.min(100, Math.round((elapsed / duration) * 100))
        onProgress?.(`Exportando... ${pct}%`)
      }

      for (const [id, video] of videoElements) {
        const media = project.media.find((m) => m.id === id)
        if (media?.trim) {
          if (video.currentTime >= media.trim.end) {
            video.currentTime = media.trim.start
          }
        } else if (media?.duration) {
          if (video.currentTime >= media.duration) {
            video.currentTime = 0
          }
        }
      }

      await renderFrame(ctx, canvas, project, videoElements)

      const nextFrame = startTime + (frame + 1) * frameDuration
      const delay = Math.max(0, nextFrame - performance.now())
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay))
      } else {
        await new Promise((r) => setTimeout(r, 0))
      }
      frame++
    }

    mediaRecorder.stop()
    onProgress?.('Finalizando...')
    await recordingDone

    cleanupVideos(videoElements, hiddenContainer)

    if (audioCtx) {
      for (const s of audioSources) {
        try { s.disconnect() } catch {}
      }
      audioCtx.close().catch(() => {})
    }

    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
    const blob = new Blob(chunks, { type: mimeType })
    await downloadBlob(blob, `${project.title || 'arte'}.${ext}`)
  }
}

function cleanupVideos(map: Map<string, HTMLVideoElement>, container?: HTMLDivElement) {
  for (const video of map.values()) {
    video.pause()
    video.src = ''
    video.load()
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container)
  }
}
