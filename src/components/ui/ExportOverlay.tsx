'use client'

import { useUIStore } from '@/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export function ExportOverlay() {
  const { isExporting, exportProgress } = useUIStore()

  return (
    <AnimatePresence>
      {isExporting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-[#13131a] border border-[#1a1a28] rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl"
          >
            <Loader2 size={28} className="text-violet-400 animate-spin" />
            <p className="text-sm text-zinc-300 font-medium">
              {exportProgress || 'Exportando...'}
            </p>
            <p className="text-xs text-zinc-600">
              Isso pode levar alguns segundos
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
