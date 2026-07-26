'use client'

import { useState, useRef, useEffect } from 'react'
import { MediaItem } from '@/types'
import { useProjectStore } from '@/store'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CropModalProps {
  media: MediaItem
  slotAspect: number
  onClose: () => void
}

function getMaxPan(scale: number): number {
  return Math.max((scale - 1) * 300, 150)
}

export function CropModal({ media, slotAspect, onClose }: CropModalProps) {
  const { updateMediaPan, updateMediaScale, resetMediaCrop } = useProjectStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const [localScale, setLocalScale] = useState(media.scale || 1)
  const [localPan, setLocalPan] = useState({ x: media.panX || 0, y: media.panY || 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 })
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
      setImgLoaded(true)
    }
    img.src = media.src
  }, [media.src])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: localPan.x, panY: localPan.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return
    const dx = (e.clientX - dragRef.current.startX) * 0.5
    const dy = (e.clientY - dragRef.current.startY) * 0.5
    const maxPan = getMaxPan(localScale)
    const newX = Math.max(-maxPan, Math.min(maxPan, dragRef.current.panX + dx))
    const newY = Math.max(-maxPan, Math.min(maxPan, dragRef.current.panY + dy))
    setLocalPan({ x: newX, y: newY })
    updateMediaPan(media.id, newX, newY)
  }

  const handlePointerUp = () => {
    if (!dragging) return
    setDragging(false)
    updateMediaPan(media.id, localPan.x, localPan.y)
  }

  const handleApply = () => {
    updateMediaPan(media.id, localPan.x, localPan.y)
    updateMediaScale(media.id, localScale)
    onClose()
  }

  const handleReset = () => {
    setLocalScale(1)
    setLocalPan({ x: 0, y: 0 })
    resetMediaCrop(media.id)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#13131a] border border-[#1a1a28] rounded-2xl w-[680px] max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a28]">
            <h3 className="text-sm text-zinc-200 font-medium">Ajustar corte</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="tabular-nums">{Math.round(localScale * 100)}%</span>
              <span className="text-zinc-700">|</span>
              <span>Arraste a imagem para reposicionar</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all ml-2">
              <X size={16} />
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex-1 relative min-h-[250px] sm:min-h-[350px] overflow-hidden bg-black touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: dragging ? 'grabbing' : imgLoaded ? 'grab' : 'default' }}
          >
            {imgLoaded && (
              <>
                <div
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${localPan.x}px, ${localPan.y}px)`,
                    width: containerSize.w,
                    height: containerSize.h,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                >
                  <img
                    src={media.src}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: `scale(${localScale})`,
                      transformOrigin: 'center center',
                    }}
                    draggable={false}
                  />
                </div>

                <div className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.5) 100%),
                      linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.5) 100%)
                    `
                  }}
                />

                <div
                  className="absolute pointer-events-none border-2 border-violet-400"
                  style={{
                    left: '15%',
                    top: '15%',
                    width: '70%',
                    height: '70%',
                    borderRadius: '4px',
                  }}
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-[#1a1a28]">
            <ZoomOut size={14} className="text-zinc-500 shrink-0" />
            <input
              type="range"
              min={100}
              max={400}
              step={5}
              value={Math.round(localScale * 100)}
              onChange={(e) => {
                const v = parseInt(e.target.value) / 100
                setLocalScale(v)
                const newMaxPan = getMaxPan(v)
                setLocalPan(prev => ({
                  x: Math.max(-newMaxPan, Math.min(newMaxPan, prev.x)),
                  y: Math.max(-newMaxPan, Math.min(newMaxPan, prev.y)),
                }))
                updateMediaScale(media.id, v)
              }}
              className="flex-1 h-1 appearance-none bg-zinc-800 rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black"
            />
            <ZoomIn size={14} className="text-zinc-500 shrink-0" />
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              <RotateCcw size={12} />
              Resetar
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-all"
            >
              Aplicar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
