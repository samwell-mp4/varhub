'use client'

import { FolderOpen } from 'lucide-react'

export function ProjectsPanel() {
  return (
    <div className="w-72 bg-[#0d0d14] border-l border-[#1a1a28] flex flex-col shrink-0 overflow-y-auto">
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
