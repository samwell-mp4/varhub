'use client'

import { useState } from 'react'
import { Template } from '@/types'
import { motion } from 'framer-motion'
import { Check, Monitor } from 'lucide-react'

interface MobileTemplatePickerProps {
  templates: Template[]
  onSelect: (id: number) => void
  onClose: () => void
}

function MiniPreview({ slots }: { slots: { x: number; y: number; width: number; height: number }[] }) {
  return (
    <div className="w-full aspect-[4/5] rounded-xl bg-zinc-800/80 relative overflow-hidden ring-1 ring-white/5">
      {slots.map((slot, i) => (
        <div
          key={i}
          className="absolute bg-zinc-700/60 rounded-[3px]"
          style={{
            left: `${slot.x}%`,
            top: `${slot.y}%`,
            width: `${slot.width}%`,
            height: `${slot.height}%`,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
      ))}
    </div>
  )
}

export function MobileTemplatePicker({ templates, onSelect, onClose }: MobileTemplatePickerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a28] shrink-0">
        <h1 className="text-base text-zinc-100 font-semibold">Novo Projeto</h1>
        <button
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          Cancelar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={14} className="text-zinc-500" />
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            Escolha um modelo
          </p>
        </div>
        <p className="text-[11px] text-zinc-600 mb-4">
          Você pode trocar o modelo depois sem perder suas mídias.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {templates.map((template) => (
            <motion.button
              key={template.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedId(template.id)}
              className={`relative rounded-2xl p-2 border transition-all text-left ${
                selectedId === template.id
                  ? 'border-violet-500/40 bg-violet-500/10 ring-1 ring-violet-500/20'
                  : 'border-[#1a1a28] bg-zinc-900/30 hover:border-zinc-700'
              }`}
            >
              <MiniPreview slots={template.slots} />
              <div className="mt-2 px-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-300 font-medium truncate">
                    {template.name}
                  </span>
                  {selectedId === template.id && (
                    <Check size={10} className="text-violet-400 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-600">
                  {template.minMedia}-{template.maxMedia} mídias
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-[#1a1a28] shrink-0">
        <button
          onClick={() => selectedId && onSelect(selectedId)}
          disabled={!selectedId}
          className="w-full py-3 text-sm font-medium rounded-xl transition-all
            bg-violet-600 text-white hover:bg-violet-500
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {selectedId ? 'Criar Projeto' : 'Selecione um modelo'}
        </button>
      </div>
    </div>
  )
}
