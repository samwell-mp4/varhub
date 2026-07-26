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
import { useUIStore, useProjectStore } from '@/store'
import { ExportOverlay } from '@/components/ui/ExportOverlay'
import { MobileNav } from '@/components/layout/MobileNav'
import { MobileStepBar } from '@/components/layout/MobileStepBar'
import { MobileTemplatePicker } from '@/components/ui/MobileTemplatePicker'
import { TEMPLATES } from '@/lib/autoLayout'
import { exportProject } from '@/lib/export'
import { Download, Loader2 } from 'lucide-react'
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
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null)

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

  const handleMobileExportWithDuration = async () => {
    setShowDuration(false)
    const format = pendingFormat!
    setPendingFormat(null)
    setExporting(true, `Exportando ${format.toUpperCase()}...`)
    try {
      await exportProject(project, format, (msg) => setExporting(true, msg), duration)
    } catch (e) {
      console.error(e)
    }
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
          {activeTab === 'configuracoes' && <SettingsPanel />}
        </main>
      </div>
      <ExportOverlay />
    </div>
  )
}
