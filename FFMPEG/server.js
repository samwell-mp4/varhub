import express from 'express'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { mkdir, writeFile, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { renderVideo } from './render.js'

const app = express()
const PORT = process.env.PORT || 3001
const SECRET = process.env.RENDER_SECRET || 'changeme'

app.use(express.json({ limit: '500mb' }))
app.use((_req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'x-secret, content-type')
  if (_req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg' })
})

app.post('/render', (req, res, next) => {
  const ct = req.headers['content-type'] || ''
  if (ct.includes('multipart')) {
    upload.any()(req, res, next)
  } else {
    next()
  }
}, async (req, res) => {
  if (req.headers['x-secret'] !== SECRET) {
    return res.status(401).json({ error: 'invalid secret' })
  }

  const jobId = randomUUID()
  const workDir = join(tmpdir(), `render-${jobId}`)
  await mkdir(workDir, { recursive: true })

  try {
    let project
    if (req.body.project) {
      project = typeof req.body.project === 'string' ? JSON.parse(req.body.project) : req.body.project
    } else {
      return res.status(400).json({ error: 'project data required' })
    }

    for (const file of req.files || []) {
      await writeFile(join(workDir, file.originalname), file.buffer)
    }

    const result = await renderVideo(project, workDir)

    res.set({
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="export.mp4"`,
      'Content-Length': result.size,
    })
    res.sendFile(result.path)
  } catch (err) {
    console.error(`[${jobId}]`, err)
    res.status(500).json({ error: err.message || 'render failed' })
  } finally {
    rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
})

app.listen(PORT, () => {
  console.log(`FFmpeg renderer listening on port ${PORT}`)
})
