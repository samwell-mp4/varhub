'use client'

import { FolderOpen } from 'lucide-react'
import { useUIStore } from '@/store'

export function ProjectsPanel() {
  const isMobile = useUIStore((s) => s.isMobile)
  return (
    <div className={`bg-[#0d0d14] flex flex-col shrink-0 overflow-y-auto ${isMobile ? 'w-full flex-1' : 'w-72 border-l border-[#1a1a28]'}`}>
      <div className="p-4 space-y-4">
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
          Projetos
        </p>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-3">
            <FolderOpen size={20} className="text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500">Nenhum projeto salvo</p>
          <p className="text-xs text-zinc-700 mt-1">
            Seus projetos aparecerão aqui
          </p>
        </div>
      </div>
    </div>
  )
}
