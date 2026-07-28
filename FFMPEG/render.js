import { spawn } from 'child_process'
import { writeFile, stat } from 'fs/promises'
import { join } from 'path'

const W = 1080
const H = 1350
const FPS = 30
const PAD = 32
const LOGO_SIZE = 44

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
        `ffmpeg ${code}\nARGS:${JSON.stringify(args)}\nSTDERR:${stderr.slice(-5000)}`
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

export async function renderVideo(project, workDir) {
  const bgColor = project.bgColor || '#000000'
  const mediaItems = project.media || []
  const totalDuration = Math.max(...mediaItems.map(getDuration), 1)
  const headerH = calcHeaderHeight(project)
  const mediaArea = H - headerH

  const filterParts = []
  const inputArgs = []
  const inputLabels = []

  const fontFile = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

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
    const slot = getSlot(project, i)
    const sx = Math.round((slot.x / 100) * W)
    const sy = Math.round(headerH + (slot.y / 100) * mediaArea)
    const sw = Math.round((slot.width / 100) * W)
    const sh = Math.round((slot.height / 100) * mediaArea)

    const panX = Math.round(media.panX || 0)
    const panY = Math.round(media.panY || 0)
    const scale = media.scale || 1

    const targetW = Math.round(sw * scale)
    const targetH = Math.round(sh * scale)
    const cropX = Math.round(Math.max(0, (targetW - sw) / 2 + panX))
    const cropY = Math.round(Math.max(0, (targetH - sh) / 2 + panY))
    const cropW = Math.min(sw, targetW)
    const cropH = Math.min(sh, targetH)

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
      const aLabel = `a${i}`
      audioLabels.push(`[${i}:a]`)
      audioCount++
    }
  }

  if (audioCount > 0) {
    const aInputs = audioLabels.join('')
    filterParts.push(`${aInputs}amix=inputs=${audioCount}:duration=longest[audio]`)
  }

  // --- header text (title + subtitle) ---
  let textY = PAD + 4
  const textX = PAD + LOGO_SIZE + 16
  const textMaxW = W - PAD - LOGO_SIZE - 16 - PAD

    if (project.logo && project.logo.startsWith('data:')) {
      const b64 = project.logo.replace(/^data:image\/\w+;base64,/, '')
      await writeFile(join(workDir, 'logo.png'), Buffer.from(b64, 'base64'))
      inputArgs.push('-i', join(workDir, 'logo.png'))
      const logoIdx = mediaItems.length
      filterParts.push(
        `[${logoIdx}:v]scale=${LOGO_SIZE}:${LOGO_SIZE}[logo_scaled]`,
        `[${lastLabel}][logo_scaled]overlay=${PAD}:${PAD}[with_logo]`
      )
      lastLabel = 'with_logo'
    }

  if (project.category) {
    filterParts.push(
      `[${lastLabel}]drawtext=text=${escapeText(project.category.toUpperCase())}:` +
      `x=${textX}:y=${textY}:fontsize=18:fontcolor=#a78bfa:fontfile=${fontFile}[cat]`
    )
    lastLabel = 'cat'
    textY += 26
  }

  if (project.title) {
    const fontSize = (project.titleSize || 16) * 2.25
    const bold = project.titleBold !== false ? ':fontfile=' + fontFile : ''
    filterParts.push(
      `[${lastLabel}]drawtext=text=${escapeText(project.title)}:` +
      `x=${textX}:y=${textY}:fontsize=${Math.round(fontSize)}:fontcolor=${project.titleColor || '#ffffff'}${bold}[title]`
    )
    lastLabel = 'title'
    textY += fontSize + 8
  }

  if (project.subtitle) {
    const subSize = (project.subtitleSize || 13) * 2.25
    filterParts.push(
      `[${lastLabel}]drawtext=text=${escapeText(project.subtitle)}:` +
      `x=${textX}:y=${textY}:fontsize=${Math.round(subSize)}:fontcolor=${project.subtitleColor || '#a1a1aa'}[sub]`
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

function escapeText(t) {
  return (t || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function calcHeaderHeight(p) {
  const fs = p.titleSize || 16
  const tSize = fs * 2.25
  let h = PAD
  if (p.category) h += 22
  h += tSize + 8
  if (p.subtitle) h += (p.subtitleSize || 13) * 2.25 + 8
  return h + PAD
}

function getSlot(project, idx) {
  const TEMPLATES = [
    { id: 0, slots: [{ x: 0, y: 0, width: 100, height: 100 }] },
    { id: 1, slots: [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 50, y: 0, width: 50, height: 50 },
      { x: 0, y: 50, width: 50, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ]},
    { id: 2, slots: [
      { x: 0, y: 0, width: 60, height: 100 },
      { x: 60, y: 0, width: 40, height: 50 },
      { x: 60, y: 50, width: 40, height: 50 },
    ]},
    { id: 3, slots: [
      { x: 0, y: 0, width: 100, height: 60 },
      { x: 0, y: 60, width: 50, height: 40 },
      { x: 50, y: 60, width: 50, height: 40 },
    ]},
    { id: 4, slots: [
      { x: 0, y: 0, width: 100, height: 70 },
      { x: 0, y: 70, width: 100, height: 30 },
    ]},
    { id: 5, slots: [{ x: 0, y: 0, width: 100, height: 100 }] },
  ]
  const t = TEMPLATES.find(t => t.id === project.templateId) || TEMPLATES[5]
  return t.slots[idx] || { x: 0, y: 0, width: 100, height: 100 }
}
