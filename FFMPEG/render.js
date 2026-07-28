import { spawn } from 'child_process'
import { writeFile, stat } from 'fs/promises'
import { join, extname } from 'path'

const W = 1080
const H = 1350
const FPS = 30
const PAD = 32
const LOGO_SIZE = 44
const textMaxW = W - PAD - LOGO_SIZE - 16 - PAD

function ffmpeg(args, cwd) {
  const cmd = process.env.FFMPEG_PATH || 'ffmpeg'
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(
        `ffmpeg ${code}\nARGS:${JSON.stringify(args)}\nSTDERR:${stderr.slice(-20000)}`
      ))
    })
    proc.on('error', reject)
  })
}

function getDuration(media) {
  if (media.type === 'image') return 3
  if (media.trim) return media.trim.end - media.trim.start
  return media.duration || 3
}

function wrapText(text, maxWidthPx, fontSize) {
  const charWidth = fontSize * 0.6
  const maxChars = Math.floor(maxWidthPx / charWidth)
  if (maxChars <= 0 || !text) return text || ''
  const words = text.split(/\s+/)
  const lines = []
  let cur = ''
  for (const word of words) {
    const test = cur ? cur + ' ' + word : word
    if (test.length > maxChars && cur) {
      lines.push(cur)
      cur = word
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines.join('\n')
}

export async function renderVideo(project, workDir) {
  const bgColor = project.bgColor || '#000000'
  const mediaItems = project.media || []
  const totalDuration = Math.max(...mediaItems.map(getDuration), 1)
  const headerH = calcHeaderHeight(project)
  const mediaArea = H - headerH

  const filterParts = []
  const inputArgs = []
  const inputLabels = []

  const fontBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
  const fontRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

  // --- background ---
  filterParts.push(`color=c=${bgColor}:s=${W}x${H}:r=${FPS}[bg]`)
  let lastLabel = 'bg'

  // --- header background (gradient approximation) ---
  if (headerH > 0) {
    filterParts.push(`color=c=black@0.4:s=${W}x${headerH}:r=${FPS}[hd]`)
    filterParts.push(`[bg][hd]overlay=0:0[bg_hd]`)
    lastLabel = 'bg_hd'
  }

  // --- process each media slot ---
  for (let i = 0; i < mediaItems.length; i++) {
    const media = mediaItems[i]
    const slotLabel = `s${i}`
    const cropLabel = `${slotLabel}_c`
    const outLabel = `${slotLabel}_o`

    // save media to disk (src is always data URL)
    if (media.type === 'video') {
      const b64 = media.src.replace(/^data:video\/\w+;base64,/, '')
      await writeFile(join(workDir, `media_${i}.mp4`), Buffer.from(b64, 'base64'))
      inputArgs.push('-i', join(workDir, `media_${i}.mp4`))
    } else {
      const b64 = media.src.replace(/^data:image\/\w+;base64,/, '')
      const ext = media.src.includes('png') ? 'png' : 'jpg'
      await writeFile(join(workDir, `media_${i}.${ext}`), Buffer.from(b64, 'base64'))
      inputArgs.push('-i', join(workDir, `media_${i}.${ext}`))
    }

    const dur = getDuration(media)
    const trim = media.type === 'video' && media.trim
      ? `trim=start=${media.trim.start}:end=${media.trim.end},setpts=PTS-STARTPTS,`
      : ''
    const loop = media.type === 'image'
      ? `loop=loop=-1:size=1,`
      : ''
    const fpsFilter = `fps=${FPS},`

    // scale + crop to slot (cover mode)
    const slot = getSlot(project.templateId || 5, i)
    const sx = Math.round((slot.x / 100) * W)
    const sy = Math.round(headerH + (slot.y / 100) * mediaArea)
    const sw = Math.round((slot.width / 100) * W)
    const sh = Math.round((slot.height / 100) * mediaArea)

    const panX = Math.round(media.panX || 0)
    const panY = Math.round(media.panY || 0)
    const scale = media.scale || 1

    const targetW = Math.round(sw * scale)
    const targetH = Math.round(sh * scale)

    // compute actual dimensions after force_original_aspect_ratio=2 (cover mode)
    const nw = media.naturalWidth
    const nh = media.naturalHeight
    let actualW = targetW
    let actualH = targetH
    if (nw && nh) {
      const sar = nw / nh
      const tar = targetW / targetH
      if (sar > tar) {
        actualW = Math.round(nw * (targetH / nh))
        actualH = targetH
      } else {
        actualW = targetW
        actualH = Math.round(nh * (targetW / nw))
      }
    }
    const cropX = Math.round(Math.max(0, Math.min(actualW - sw, (actualW - sw) / 2 + panX)))
    const cropY = Math.round(Math.max(0, Math.min(actualH - sh, (actualH - sh) / 2 + panY)))
    const cropW = Math.min(sw, actualW)
    const cropH = Math.min(sh, actualH)

    filterParts.push(
      `[${i}:v]${trim}${loop}${fpsFilter}scale=${targetW}:${targetH}:force_original_aspect_ratio=2,crop=${cropW}:${cropH}:${cropX}:${cropY},setpts=PTS-STARTPTS[${cropLabel}]`
    )

    if (media.type === 'video' && media.trim) {
      filterParts.push(
        `[${cropLabel}]loop=loop=-1:size=${Math.round(dur * FPS)}[${cropLabel}_l]`
      )
    }
    const loopedLabel = media.type === 'video' && media.trim ? `${cropLabel}_l` : cropLabel

    filterParts.push(`[${lastLabel}][${loopedLabel}]overlay=${sx}:${sy}:shortest=1[${outLabel}]`)
    lastLabel = outLabel
  }

  // --- audio mixing ---
  const audioLabels = []
  let audioCount = 0
  for (let i = 0; i < mediaItems.length; i++) {
    const media = mediaItems[i]
    if (media.type === 'video') {
      const filePath = join(workDir, `media_${i}.mp4`)
      try {
        const out = await new Promise((resolve, reject) => {
          const p = spawn('ffprobe', [
            '-v', 'error', '-select_streams', 'a:0',
            '-show_entries', 'stream=codec_type',
            '-of', 'csv=p=0', filePath,
          ], { stdio: ['ignore', 'pipe', 'pipe'] })
          let data = ''
          p.stdout.on('data', (d) => { data += d.toString() })
          p.on('close', (code) => code === 0 ? resolve(data.trim()) : reject())
          p.on('error', reject)
        })
        if (out === 'audio') {
          audioLabels.push(`[${i}:a]`)
          audioCount++
        }
      } catch { /* no audio stream, skip */ }
    }
  }

  if (audioCount > 0) {
    const aInputs = audioLabels.join('')
    filterParts.push(`${aInputs}amix=inputs=${audioCount}:duration=longest[audio]`)
  }

  // --- header text (title + subtitle) ---
  let textY = Math.round(PAD + 4)
  const textX = Math.round(PAD + LOGO_SIZE + 16)

    if (project.logo && project.logo.startsWith('data:')) {
      const mime = project.logo.match(/^data:image\/(\w+);/)
      const ext = mime && mime[1] === 'jpeg' ? 'jpg' : 'png'
      const b64 = project.logo.replace(/^data:image\/\w+;base64,/, '')
      await writeFile(join(workDir, `logo.${ext}`), Buffer.from(b64, 'base64'))
      inputArgs.push('-i', join(workDir, `logo.${ext}`))
      const logoIdx = mediaItems.length
      filterParts.push(
        `[${logoIdx}:v]scale=${LOGO_SIZE}:${LOGO_SIZE}[logo_scaled]`,
        `[${lastLabel}][logo_scaled]overlay=${PAD}:${PAD}[with_logo]`
      )
      lastLabel = 'with_logo'
    }

  if (project.category) {
    const catFile = join(workDir, 'text_cat.txt')
    await writeFile(catFile, project.category.toUpperCase())
    filterParts.push(
      `[${lastLabel}]drawtext=textfile=${catFile}:` +
      `x=${textX}:y=${textY}:fontsize=18:fontcolor=#a78bfa:fontfile=${fontRegular}[cat]`
    )
    lastLabel = 'cat'
    textY += 26
  }

  if (project.title) {
    const fontSize = Math.round((project.titleSize || 16) * 2.25)
    const bold = project.titleBold !== false ? ':fontfile=' + fontBold : ':fontfile=' + fontRegular
    const titleFile = join(workDir, 'text_title.txt')
    await writeFile(titleFile, wrapText(project.title, textMaxW, fontSize))
    filterParts.push(
      `[${lastLabel}]drawtext=textfile=${titleFile}:` +
      `x=${textX}:y=${textY}:fontsize=${fontSize}:fontcolor=${project.titleColor || '#ffffff'}${bold}[title]`
    )
    lastLabel = 'title'
    const lines = project.title ? wrapText(project.title, textMaxW, fontSize).split('\n').length : 1
    textY += fontSize * lines + 8
  }

  if (project.subtitle) {
    const subSize = Math.round((project.subtitleSize || 13) * 2.25)
    const subBold = project.subtitleBold ? ':fontfile=' + fontBold : ':fontfile=' + fontRegular
    const subFile = join(workDir, 'text_sub.txt')
    await writeFile(subFile, wrapText(project.subtitle, textMaxW, subSize))
    filterParts.push(
      `[${lastLabel}]drawtext=textfile=${subFile}:` +
      `x=${textX}:y=${textY}:fontsize=${subSize}:fontcolor=${project.subtitleColor || '#a1a1aa'}${subBold}[sub]`
    )
    lastLabel = 'sub'
  }

  // --- output ---
  const outputPath = join(workDir, 'output.mp4')
  const filterComplex = filterParts.join(';\n')

  const videoMap = `[${lastLabel}]`
  const audioMap = audioCount > 0 ? '-map [audio]' : '-an'

  const args = [
    '-y',
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', videoMap,
    ...(audioMap.split(' ')),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-t', String(totalDuration),
    outputPath,
  ]

  await ffmpeg(args, workDir)
  const st = await stat(outputPath)
  return { path: outputPath, size: st.size }
}

function calcHeaderHeight(p) {
  const logoBottom = PAD + LOGO_SIZE
  let textY = PAD + 4
  if (p.category) textY += 26
  if (p.title) {
    const fontSize = Math.round((p.titleSize || 16) * 2.25)
    const lines = wrapText(p.title, textMaxW, fontSize).split('\n').length
    textY += fontSize * lines + 8
  }
  if (p.subtitle) {
    const subSize = Math.round((p.subtitleSize || 13) * 2.25)
    const lines = wrapText(p.subtitle, textMaxW, subSize).split('\n').length
    textY += subSize * lines + 8
  }
  return Math.round(Math.max(logoBottom, textY) + 28)
}

function getSlot(templateId, idx) {
  const TEMPLATES = [
    {
      id: 1,
      slots: [
        { x: 0, y: 0, width: 50, height: 100, label: 'Imagem 1' },
        { x: 50, y: 0, width: 50, height: 100, label: 'Imagem 2' },
      ],
    },
    {
      id: 2,
      slots: [
        { x: 0, y: 0, width: 50, height: 100, label: 'Mídia 1' },
        { x: 50, y: 0, width: 50, height: 100, label: 'Mídia 2' },
      ],
    },
    {
      id: 3,
      slots: [
        { x: 0, y: 0, width: 100, height: 100, label: 'Mídia' },
      ],
    },
    {
      id: 4,
      slots: [
        { x: 0, y: 0, width: 33.33, height: 100, label: 'Imagem 1' },
        { x: 33.33, y: 0, width: 33.33, height: 100, label: 'Imagem 2' },
        { x: 66.66, y: 0, width: 33.33, height: 100, label: 'Imagem 3' },
      ],
    },
    {
      id: 5,
      slots: [
        { x: 0, y: 0, width: 100, height: 66, label: 'Imagem Grande' },
        { x: 0, y: 66, width: 50, height: 34, label: 'Imagem 2' },
        { x: 50, y: 66, width: 50, height: 34, label: 'Imagem 3' },
      ],
    },
    {
      id: 6,
      slots: [
        { x: 0, y: 0, width: 100, height: 66, label: 'Vídeo' },
        { x: 0, y: 66, width: 100, height: 34, label: 'Imagem' },
      ],
    },
    {
      id: 7,
      slots: [
        { x: 8, y: 0, width: 84, height: 100, label: 'Imagem' },
      ],
    },
    {
      id: 8,
      slots: [
        { x: 0, y: 0, width: 50, height: 50, label: '1' },
        { x: 50, y: 0, width: 50, height: 50, label: '2' },
        { x: 0, y: 50, width: 50, height: 50, label: '3' },
        { x: 50, y: 50, width: 50, height: 50, label: '4' },
      ],
    },
    {
      id: 9,
      slots: [
        { x: 0, y: 0, width: 100, height: 50, label: 'Mídia 1' },
        { x: 0, y: 50, width: 100, height: 50, label: 'Mídia 2' },
      ],
    },
    {
      id: 10,
      slots: [
        { x: 0, y: 0, width: 66, height: 100, label: 'Destaque' },
        { x: 66, y: 0, width: 34, height: 50, label: '2' },
        { x: 66, y: 50, width: 34, height: 50, label: '3' },
      ],
    },
    {
      id: 11,
      slots: [
        { x: 0, y: 0, width: 100, height: 33.33, label: 'Imagem 1' },
        { x: 0, y: 33.33, width: 100, height: 33.33, label: 'Imagem 2' },
        { x: 0, y: 66.66, width: 100, height: 33.33, label: 'Imagem 3' },
      ],
    },
    {
      id: 12,
      slots: [
        { x: 0, y: 15, width: 100, height: 70, label: 'Mídia' },
      ],
    },
  ]
  const t = TEMPLATES.find(t => t.id === templateId)
  if (!t) return { x: 0, y: 0, width: 100, height: 100 }
  return t.slots[idx] || { x: 0, y: 0, width: 100, height: 100 }
}
