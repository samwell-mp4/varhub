'use client'

import { useState } from 'react'
import { useProjectStore, useUIStore } from '@/store'
import { Download, PanelLeftClose, PanelLeft, Save, FolderOpen, Loader2, Clock } from 'lucide-react'
import { exportProject } from '@/lib/export'
import { saveProjectToFile, loadProjectFromFile } from '@/lib/projectFile'
import { motion, AnimatePresence } from 'framer-motion'

export function Header() {
  const { project, reset } = useProjectStore()
  const { isSidebarOpen, toggleSidebar, isExporting, setExporting } = useUIStore()
  const [showDuration, setShowDuration] = useState(false)
  const [duration, setDuration] = useState(5)
  const [pendingFormat, setPendingFormat] = useState<'png' | 'jpg' | 'mp4' | null>(null)

  const isIOS = typeof navigator !== 'undefined' && !!navigator.share

  const serverExport = async (imageDuration?: number) => {
    setExporting(true, 'Renderizando no servidor...')
    try {
      const proj: Record<string, any> = JSON.parse(JSON.stringify(project))
      if (imageDuration && proj.media.every((m: any) => m.type === 'image')) {
        for (const m of proj.media) {
          if (m.type === 'image') {
            m.duration = imageDuration
            m.trim = undefined
          }
        }
      }

      const toDataUrl = async (src: string): Promise<string | undefined> => {
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

      if (proj.logo && !proj.logo.startsWith('data:')) {
        proj.logo = await toDataUrl(proj.logo).catch(() => undefined)
      }
      for (const m of proj.media || []) {
        if (m.src && !m.src.startsWith('data:')) {
          m.src = await toDataUrl(m.src).catch(() => m.src)
        }
      }

      const rendererUrl = process.env.NEXT_PUBLIC_RENDERER_URL || 'https://var-hub-ffmpeg.hx8235.easypanel.host'
      const renderSecret = process.env.NEXT_PUBLIC_RENDER_SECRET || 'changeme'
      const res = await fetch(`${rendererUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-secret': renderSecret },
        body: JSON.stringify({ project: proj }),
      })
      if (!res.ok) throw new Error(`renderer: ${res.status}`)
      const blob = await res.blob()
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] }).catch(() => {})
          return
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'video.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
    setExporting(false)
  }

  const handleExport = async (format: 'png' | 'jpg' | 'mp4') => {
    if (isExporting) return

    if (format === 'mp4' && isIOS) {
      const hasOnlyImages = project.media.length > 0 && project.media.every(m => m.type === 'image')
      if (hasOnlyImages) {
        setPendingFormat(format)
        setShowDuration(true)
        return
      }
      await serverExport()
      return
    }

    const hasOnlyImages = project.media.length > 0 && project.media.every(m => m.type === 'image')
    if (format === 'mp4' && hasOnlyImages) {
      setPendingFormat(format)
      setShowDuration(true)
      return
    }

    setExporting(true, `Exportando ${format.toUpperCase()}...`)
    try {
      await exportProject(project, format, (msg) => setExporting(true, msg))
    } catch (e) {
      console.error(e)
    }
    setExporting(false)
  }

  const handleExportWithDuration = async () => {
    setShowDuration(false)
    const format = pendingFormat!
    setPendingFormat(null)
    if (format === 'mp4' && isIOS) {
      await serverExport(duration)
      return
    }
    setExporting(true, `Exportando ${format.toUpperCase()}...`)
    try {
      await exportProject(project, format, (msg) => setExporting(true, msg), duration)
    } catch (e) {
      console.error(e)
    }
    setExporting(false)
  }

  const handleSave = () => {
    saveProjectToFile(project)
  }

  const handleLoad = async () => {
    const loaded = await loadProjectFromFile()
    if (loaded) {
      reset()
      useProjectStore.setState({ project: loaded })
    }
  }

  return (
    <header className="h-14 bg-[#0d0d14] border-b border-[#1a1a28] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <div className="h-5 w-px bg-[#1a1a28]" />
        <span className="text-sm text-zinc-400 font-medium truncate max-w-[300px]">
          {project.title || 'Novo Projeto'}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleLoad}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          title="Abrir projeto"
        >
          <FolderOpen size={14} />
          Abrir
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
          title="Salvar projeto"
        >
          <Save size={14} />
          Salvar
        </button>
        <div className="w-px h-5 bg-[#1a1a28]" />
        <div className="relative group">
          <button
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
              isExporting
                ? 'text-zinc-600 bg-zinc-800 cursor-not-allowed'
                : 'text-white bg-violet-600 hover:bg-violet-500'
            }`}
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </button>
          {!isExporting && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#13131a] border border-[#1a1a28] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => handleExport('png')}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-t-lg transition-all"
              >
                PNG
              </button>
              <button
                onClick={() => handleExport('jpg')}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all"
              >
                JPG
              </button>
              <button
                onClick={() => handleExport('mp4')}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-b-lg transition-all"
              >
                MP4
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showDuration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDuration(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#13131a] border border-[#1a1a28] rounded-2xl p-5 w-72 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-violet-400" />
                <h3 className="text-sm text-zinc-200 font-medium">Duração do vídeo</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Seu projeto contém apenas imagens. Quantos segundos de vídeo?
              </p>
              <input
                type="number"
                min={1}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500/50 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDuration(false)}
                  className="flex-1 px-3 py-2 text-xs text-zinc-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExportWithDuration}
                  className="flex-1 px-3 py-2 text-xs text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all"
                >
                  Exportar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
