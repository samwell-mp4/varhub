'use client'

import { useProjectStore } from '@/store'
import { TEMPLATES } from '@/lib/autoLayout'
import { Check, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'

function MiniPreview({ slots }: { slots: { x: number; y: number; width: number; height: number }[] }) {
  return (
    <div className="w-11 h-11 rounded-lg bg-zinc-800/80 relative overflow-hidden shrink-0 ring-1 ring-white/5">
      {slots.map((slot, i) => (
        <div
          key={i}
          className="absolute bg-zinc-700/60 rounded-[2px]"
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

export function TemplatesPanel() {
  const { project, setTemplateId } = useProjectStore()

  return (
    <div className="w-72 bg-[#0d0d14] border-l border-[#1a1a28] flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-zinc-500" />
          <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
            Templates
          </p>
        </div>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          O layout ideal é selecionado automaticamente. Clique para escolher manualmente.
        </p>

        <div className="space-y-1.5">
          {TEMPLATES.map((template) => (
            <motion.button
              key={template.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTemplateId(template.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                project.templateId === template.id
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-[#1a1a28] bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <MiniPreview slots={template.slots} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-300 font-medium">
                    {template.name}
                  </span>
                  {project.templateId === template.id && (
                    <Check size={12} className="text-violet-400 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-zinc-600">
                  {template.minMedia}-{template.maxMedia} mídias
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
