'use client'

import { useEffect } from 'react'
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

export default function Home() {
  const activeTab = useUIStore((s) => s.activeTab)
  const undo = useProjectStore((s) => s.undo)
  const undoStackSize = useProjectStore((s) => s.undoStack.length)

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

  const renderContent = () => {
    if (activeTab === 'upload') return <EditorPanel />
    if (activeTab === 'templates') return <TemplatesPanel />
    if (activeTab === 'projetos') return <ProjectsPanel />
    if (activeTab === 'notificacoes') return <NotificationsPanel />
    if (activeTab === 'configuracoes') return <SettingsPanel />
    return null
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 flex min-h-0">
          <Preview />
          {renderContent()}
        </main>
      </div>
      <ExportOverlay />
    </div>
  )
}
