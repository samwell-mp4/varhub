'use client'

import { Settings } from 'lucide-react'

export function SettingsPanel() {
  return (
    <div className="w-72 bg-[#0d0d14] border-l border-[#1a1a28] flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
          Configurações
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Tamanho do post</span>
            <span className="text-sm text-zinc-600">1080 × 1350</span>
          </div>
          <div className="h-px bg-[#1a1a28]" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Formato padrão</span>
            <span className="text-sm text-zinc-600">PNG</span>
          </div>
          <div className="h-px bg-[#1a1a28]" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Qualidade</span>
            <span className="text-sm text-zinc-600">Alta</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center mb-3">
            <Settings size={20} className="text-zinc-600" />
          </div>
          <p className="text-xs text-zinc-600">Mais configurações em breve</p>
        </div>
      </div>
    </div>
  )
}
