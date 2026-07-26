'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { MediaItem } from '@/types'
import { TEMPLATES } from '@/lib/autoLayout'
import { useProjectStore } from '@/store'

const PAN_SPEED = 0.35

interface AutoTemplateProps {
  media: MediaItem[]
  templateId: number
  title: string
  subtitle: string
  category: string
  logo?: string
  titleSize?: number
  subtitleSize?: number
  titleBold?: boolean
  subtitleBold?: boolean
  bgColor?: string
  titleColor?: string
  subtitleColor?: string
}

function TrimmedVideo({ media }: { media: MediaItem }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || !media.trim) return

    const onLoaded = () => {
      video.currentTime = media.trim!.start
    }
    const onTime = () => {
      if (media.trim && video.currentTime >= media.trim.end) {
        video.currentTime = media.trim.start
      }
    }
    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('timeupdate', onTime)
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('timeupdate', onTime)
    }
  }, [media.trim?.start, media.trim?.end])

  return (
    <video
      ref={ref}
      src={media.src}
      autoPlay
      loop={!media.trim}
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  )
}

function clamp(val: number, max: number): number {
  return Math.max(-max, Math.min(max, val))
}

function getMaxPan(scale: number): number {
  return Math.max((scale - 1) * 300, 150)
}

export function AutoTemplate({ media, templateId, title, subtitle, category, logo, titleSize, subtitleSize, titleBold, subtitleBold, bgColor, titleColor, subtitleColor }: AutoTemplateProps) {
  const { selectedMediaId, setSelectedMedia, updateMediaPan } = useProjectStore()
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const effectiveId = useMemo(
    () => (media.length === 0 ? 5 : templateId),
    [media.length, templateId]
  )

  const template = TEMPLATES.find((t) => t.id === effectiveId) ?? TEMPLATES[4]

  const filledSlots = template.slots.map((slot, index) => ({
    ...slot,
    media: media[index] ?? null,
  }))

  const handlePointerDown = useCallback((e: React.PointerEvent, mediaId: string) => {
    setSelectedMedia(mediaId)
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    setDragOffset({ x: 0, y: 0 })
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [setSelectedMedia])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !selectedMediaId) return
    const dx = (e.clientX - dragStart.current.x) * PAN_SPEED
    const dy = (e.clientY - dragStart.current.y) * PAN_SPEED
    const mediaItem = useProjectStore.getState().project.media.find(m => m.id === selectedMediaId)
    const scale = mediaItem?.scale || 1
    const maxPan = getMaxPan(scale)
    const basePanX = mediaItem?.panX || 0
    const basePanY = mediaItem?.panY || 0
    const clampedX = clamp(basePanX + dx, maxPan) - basePanX
    const clampedY = clamp(basePanY + dy, maxPan) - basePanY
    setDragOffset({ x: clampedX, y: clampedY })
  }, [selectedMediaId])

  const handlePointerUp = useCallback(() => {
    if (!dragging.current || !selectedMediaId) return
    dragging.current = false
    if (dragOffset.x !== 0 || dragOffset.y !== 0) {
      const mediaItem = useProjectStore.getState().project.media.find(m => m.id === selectedMediaId)
      if (mediaItem) {
        const scale = mediaItem.scale || 1
        const maxPan = getMaxPan(scale)
        const newX = clamp((mediaItem.panX || 0) + dragOffset.x, maxPan)
        const newY = clamp((mediaItem.panY || 0) + dragOffset.y, maxPan)
        updateMediaPan(selectedMediaId, newX, newY)
      }
    }
    setDragOffset({ x: 0, y: 0 })
  }, [selectedMediaId, dragOffset, updateMediaPan])

  const getMediaStyle = (slotMedia: MediaItem | null) => {
    if (!slotMedia) return {}
    const basePanX = slotMedia.panX || 0
    const basePanY = slotMedia.panY || 0
    const totalX = basePanX + (selectedMediaId === slotMedia.id ? dragOffset.x : 0)
    const totalY = basePanY + (selectedMediaId === slotMedia.id ? dragOffset.y : 0)
    const s = slotMedia.scale || 1
    return {
      objectFit: 'cover' as const,
      width: '100%',
      height: '100%',
      transform: `translate(${totalX}px, ${totalY}px) scale(${s})`,
      transformOrigin: 'center center' as const,
      pointerEvents: 'none' as const,
      userSelect: 'none' as const,
    }
  }

  if (media.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bgColor || '#000' }}>
        <div className="text-center px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm">Nenhuma mídia adicionada</p>
          <p className="text-zinc-700 text-xs mt-1">Arraste imagens ou vídeos para começar</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full h-full flex flex-col select-none touch-none"
      style={{ backgroundColor: bgColor || '#000' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="px-4 pt-3 pb-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {logo ? (
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/20">
                <img src={logo} alt="logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-2 ring-white/10">
                <span className="text-white text-base font-bold">S</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {category && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                {category}
              </span>
            )}
            <h2 className="leading-tight" style={{ fontSize: titleSize ?? 16, fontWeight: (titleBold ?? true) ? 700 : 400, color: titleColor || '#ffffff' }}>
              {title || 'Título'}
            </h2>
            {subtitle && (
              <p className="leading-relaxed mt-0.5" style={{ fontSize: subtitleSize ?? 13, fontWeight: (subtitleBold ?? false) ? 700 : 400, color: subtitleColor || '#a1a1aa' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        {filledSlots.map((slot) => (
          <div
            key={slot.id}
            className={`absolute overflow-hidden cursor-grab active:cursor-grabbing ${
              selectedMediaId === slot.media?.id ? 'ring-1 ring-violet-500/40' : ''
            }`}
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
            }}
            onPointerDown={(e) => slot.media && handlePointerDown(e, slot.media.id)}
          >
            {slot.media ? (
              slot.media.type === 'video' ? (
                <div className="w-full h-full" style={getMediaStyle(slot.media)}>
                  <TrimmedVideo media={slot.media} />
                </div>
              ) : (
                <img
                  src={slot.media.src}
                  alt=""
                  style={getMediaStyle(slot.media)}
                  draggable={false}
                />
              )
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <span className="text-zinc-700 text-xs">{slot.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
