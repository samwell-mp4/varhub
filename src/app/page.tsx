'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Preview } from '@/components/preview/Preview'
import { EditorPanel } from '@/components/ui/EditorPanel'
import { TemplatesPanel } from '@/components/ui/TemplatesPanel'
import { ProjectsPanel } from '@/components/ui/ProjectsPanel'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { NotificationsPanel } from '@/components/ui/NotificationsPanel'
import { FerramentasPanel } from '@/components/ui/FerramentasPanel'
import { useUIStore, useProjectStore } from '@/store'
import { ExportOverlay } from '@/components/ui/ExportOverlay'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileStepBar } from '@/components/layout/MobileStepBar'
import { MobileTemplatePicker } from '@/components/ui/MobileTemplatePicker'
import { TEMPLATES } from '@/lib/autoLayout'
import { exportProject } from '@/lib/export'
import { serverExport } from '@/lib/serverExport'
import { listVideos, getVideo, deleteVideo } from '@/lib/videoStore'
import { Download, Loader2, History, Trash2 } from 'lucide-react'
import { ExportFormat } from '@/types'

export default function Home() {
  const activeTab = useUIStore((s) => s.activeTab)
  const isMobile = useUIStore((s) => s.isMobile)
  const showMobilePanel = useUIStore((s) => s.showMobilePanel)
  const showMobileTemplatePicker = useUIStore((s) => s.showMobileTemplatePicker)
  const setShowMobileTemplatePicker = useUIStore((s) => s.setShowMobileTemplatePicker)
  const setIsMobile = useUIStore((s) => s.setIsMobile)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setShowMobilePanel = useUIStore((s) => s.setShowMobilePanel)
  const isExporting = useUIStore((s) => s.isExporting)
  const setExporting = useUIStore((s) => s.setExporting)
  const project = useProjectStore((s) => s.project)
  const setTemplateId = useProjectStore((s) => s.setTemplateId)
  const undo = useProjectStore((s) => s.undo)
  const [showFormatPicker, setShowFormatPicker] = useState(false)
  const [showDuration, setShowDuration] = useState(false)
  const [duration, setDuration] = useState(5)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<{ id: string; title: string; date: string }[]>([])

  useEffect(() => {
    listVideos().then(setHistory).catch(() => {})
  }, [])

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [setIsMobile])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo])

  const handleSelectTemplate = (id: number) => {
    setTemplateId(id)
    setShowMobileTemplatePicker(false)
    setActiveTab('upload')
    setShowMobilePanel(true)
  }

  const handleMobileExport = async (format: ExportFormat) => {
    setShowFormatPicker(false)
    if (isExporting) return

    const hasOnlyImages = project.media.length > 0 && project.media.every(m => m.type === 'image')
    if (format === 'mp4' && hasOnlyImages) {
      setShowDuration(true)
      return
    }

    if (format === 'mp4') {
      const proj = JSON.parse(JSON.stringify(project))
      const totalSec = (proj.media || []).reduce((sum: number, m: { type: string; duration?: number; trim?: { start: number; end: number } }) => {
        if (m.type === 'image') return sum + 3
        if (m.trim) return sum + (m.trim.end - m.trim.start)
        return sum + (m.duration || 3)
      }, 0)
      const estSec = Math.max(totalSec, 3) * 2 + 5
      // eslint-disable-next-line react-hooks/purity
      const start = Date.now()
      setExporting(true, 'Renderizando... 0%')
      const timer = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000
        const pct = Math.min(99, Math.round((elapsed / estSec) * 100))
        setExporting(true, `Renderizando... ${pct}%`)
      }, 1000)
      try {
        const blob = await serverExport(proj, (msg) => setExporting(true, msg))
        if (!blob) return
        clearInterval(timer)
        setExporting(false)
        // eslint-disable-next-line react-hooks/purity
        const id = Math.random().toString(36).slice(2)
        setHistory(h => [{ id, title: proj.title || 'Untitled', date: new Date().toISOString() }, ...h].slice(0, 20))
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
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } catch (e) {
        console.error(e)
      }
      clearInterval(timer)
      setExporting(false)
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

  const handleMobileExportWithDuration = async () => {
    setShowDuration(false)
    const proj = JSON.parse(JSON.stringify(project))
    for (const m of proj.media) {
      if (m.type === 'image') {
        m.duration = duration
        m.trim = undefined
      }
    }
    const totalSec = (proj.media || []).reduce((sum: number, m: { type: string; duration?: number; trim?: { start: number; end: number } }) => {
      if (m.type === 'image') return sum + duration
      if (m.trim) return sum + (m.trim.end - m.trim.start)
      return sum + (m.duration || 3)
    }, 0)
    const estSec = Math.max(totalSec, 3) * 2 + 5
    const start = Date.now()
    setExporting(true, 'Renderizando... 0%')
    const timer = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const pct = Math.min(99, Math.round((elapsed / estSec) * 100))
      setExporting(true, `Renderizando... ${pct}%`)
    }, 1000)
    try {
      const blob = await serverExport(proj, (msg) => setExporting(true, msg))
      if (!blob) return
      clearInterval(timer)
      setExporting(false)
      const id = Math.random().toString(36).slice(2)
      setHistory(h => [{ id, title: proj.title || 'Untitled', date: new Date().toISOString() }, ...h].slice(0, 20))
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
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) {
      console.error(e)
    }
    clearInterval(timer)
    setExporting(false)
  }

  if (isMobile) {
    return (
      <>
        <div className="flex flex-col h-screen bg-[#0a0a0f]">
          {showMobileTemplatePicker && (
            <MobileTemplatePicker
              templates={TEMPLATES}
              onSelect={handleSelectTemplate}
              onClose={() => setShowMobileTemplatePicker(false)}
            />
          )}

          {!showMobileTemplatePicker && (
            <>
              <MobileStepBar />
              <header className="h-12 bg-[#0d0d14] border-b border-[#1a1a28] flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-[10px]">S</span>
                  </div>
                  <span className="text-sm text-zinc-300 font-medium truncate">
                    {project.title || 'Novo Projeto'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowMobilePanel(false)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      !showMobilePanel
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setShowMobilePanel(true)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      showMobilePanel
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Editar
                  </button>
                  <div className="w-px h-5 bg-[#1a1a28] mx-0.5" />
                  <div className="relative">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all"
                      title="Histórico"
                    >
                      <History size={14} />
                    </button>
                    {showHistory && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-[#13131a] border border-[#1a1a28] rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a28]">
                          <span className="text-[10px] text-zinc-600 font-medium uppercase">Histórico</span>
                          {history.length > 0 && (
                            <button
                              onClick={() => { import('@/lib/videoStore').then(m => m.clearVideos()); setHistory([]); setShowHistory(false) }}
                              className="text-[10px] text-red-400 hover:text-red-300"
                            >
                              Limpar
                            </button>
                          )}
                        </div>
                        {history.length === 0 ? (
                          <p className="text-xs text-zinc-600 text-center py-6">Nenhum vídeo exportado</p>
                        ) : (
                          history.map(entry => (
                            <div key={entry.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/5 border-b border-[#1a1a28]/50 last:border-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-300 truncate">{entry.title}</p>
                                <p className="text-[10px] text-zinc-600">{new Date(entry.date).toLocaleString('pt-BR')}</p>
                              </div>
                              <button
                                onClick={async () => {
                                  const blob = await getVideo(entry.id)
                                  if (!blob) return
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = 'video.mp4'
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                  setTimeout(() => URL.revokeObjectURL(url), 60000)
                                }}
                                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/10"
                                title="Baixar"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                onClick={async () => {
                                  await deleteVideo(entry.id)
                                  setHistory(h => h.filter(x => x.id !== entry.id))
                                }}
                                className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-white/10"
                                title="Remover"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFormatPicker(true)}
                    disabled={isExporting}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      isExporting
                        ? 'text-zinc-600 bg-zinc-800 cursor-not-allowed'
                        : 'text-white bg-violet-600 hover:bg-violet-500'
                    }`}
                  >
                    {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {isExporting ? '...' : 'Exportar'}
                  </button>
                </div>
              </header>

              <main className="flex-1 flex flex-col min-h-0">
                {showMobilePanel ? (
                  <div className="flex-1 overflow-y-auto">
                    {activeTab === 'upload' && <EditorPanel />}
                    {activeTab === 'templates' && <TemplatesPanel />}
                    {activeTab === 'projetos' && <ProjectsPanel />}
                    {activeTab === 'notificacoes' && <NotificationsPanel />}
                    {activeTab === 'ferramentas' && <FerramentasPanel />}
                    {activeTab === 'configuracoes' && <SettingsPanel />}
                    {activeTab === 'upload' && project.media.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-xs text-zinc-600">Adicione fotos ou vídeos para começar</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-2">
                    <Preview />
                  </div>
                )}
              </main>

            <MobileNav />
          </>
        )}

        {showFormatPicker && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFormatPicker(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-[#13131a] border-t border-[#1a1a28] rounded-t-2xl p-4 animate-slide-up"
            >
              <div className="w-8 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
              <h3 className="text-sm text-zinc-200 font-medium mb-3">Exportar como</h3>
              {(['png', 'jpg', 'mp4'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => handleMobileExport(format)}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-xl transition-all"
                >
                  {format.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setShowFormatPicker(false)}
                className="w-full mt-2 px-4 py-3 text-sm text-zinc-600 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {showDuration && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDuration(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#13131a] border border-[#1a1a28] rounded-2xl p-5 w-72 shadow-2xl"
            >
              <h3 className="text-sm text-zinc-200 font-medium mb-2">Duração do vídeo</h3>
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
                  onClick={handleMobileExportWithDuration}
                  className="flex-1 px-3 py-2 text-xs text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ExportOverlay />
      </>
    )
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 flex min-h-0">
          <Preview />
          {activeTab === 'upload' && <EditorPanel />}
          {activeTab === 'templates' && <TemplatesPanel />}
          {activeTab === 'projetos' && <ProjectsPanel />}
          {activeTab === 'notificacoes' && <NotificationsPanel />}
          {activeTab === 'ferramentas' && <FerramentasPanel />}
          {activeTab === 'configuracoes' && <SettingsPanel />}
        </main>
      </div>
      <ExportOverlay />
    </div>
  )
}
