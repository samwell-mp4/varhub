'use client'

import { useState, useRef, useEffect } from 'react'
import { MediaItem } from '@/types'
import { useProjectStore } from '@/store'
import { Scissors, Play, Pause } from 'lucide-react'

interface VideoTrimmerProps {
  media: MediaItem
}

export function VideoTrimmer({ media }: VideoTrimmerProps) {
  const { setVideoTrim } = useProjectStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [start, setStart] = useState(media.trim?.start ?? 0)
  const [end, setEnd] = useState(media.trim?.end ?? media.duration ?? 10)
  const [currentTime, setCurrentTime] = useState(0)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  const duration = media.duration ?? 10
  const hasSavedTrim = media.trim !== undefined

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => {
      setCurrentTime(video.currentTime)
      if (video.currentTime >= end) {
        video.currentTime = start
      }
    }
    video.addEventListener('timeupdate', onTime)
    return () => video.removeEventListener('timeupdate', onTime)
  }, [start, end])

  useEffect(() => {
    setStart(media.trim?.start ?? 0)
    setEnd(media.trim?.end ?? duration)
  }, [media.trim?.start, media.trim?.end, duration])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
    } else {
      video.currentTime = start
      video.play()
    }
    setPlaying(!playing)
  }

  const handleStartChange = (val: number) => {
    const v = Math.min(val, end - 0.5)
    setStart(v)
  }

  const handleEndChange = (val: number) => {
    const v = Math.max(val, start + 0.5)
    setEnd(v)
  }

  const confirmTrim = () => {
    setVideoTrim(media.id, { start, end })
  }

  const clearTrim = () => {
    setStart(0)
    setEnd(duration)
    setVideoTrim(media.id, { start: 0, end: duration })
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const trimmed = start > 0 || end < duration

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Scissors size={14} className="text-violet-400" />
        <span className="text-xs text-zinc-500 font-medium">Cortar vídeo</span>
        {hasSavedTrim && (
          <span className="text-[10px] text-violet-400/60 ml-auto">Corte salvo</span>
        )}
      </div>

      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={media.src}
          className="w-full h-full object-contain"
          muted
          playsInline
        />
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
          >
            {playing ? <Pause size={12} className="text-white" /> : <Play size={12} className="text-white" />}
          </button>
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-white/60 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-600">
          <span>Início: {formatTime(start)}</span>
          <span>Fim: {formatTime(end)}</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div className="absolute left-0 right-0 h-1 bg-zinc-800 rounded-full" />
          <div
            className="absolute h-1 bg-violet-500 rounded-full"
            style={{
              left: `${(start / duration) * 100}%`,
              width: `${((end - start) / duration) * 100}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={end}
            onChange={(e) => handleEndChange(parseFloat(e.target.value))}
            onMouseDown={() => setDragging('end')}
            onMouseUp={() => setDragging(null)}
            onTouchStart={() => setDragging('end')}
            onTouchEnd={() => setDragging(null)}
            className="absolute w-full h-8 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-500
              [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black
              [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-grab"
            style={{ zIndex: dragging === 'start' ? 1 : 3 }}
          />
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={start}
            onChange={(e) => handleStartChange(parseFloat(e.target.value))}
            onMouseDown={() => setDragging('start')}
            onMouseUp={() => setDragging(null)}
            onTouchStart={() => setDragging('start')}
            onTouchEnd={() => setDragging(null)}
            className="absolute w-full h-8 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black
              [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-500
              [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black
              [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-grab"
            style={{ zIndex: dragging === 'end' ? 1 : 3 }}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={confirmTrim}
            disabled={!trimmed}
            className="flex-1 text-[11px] py-1.5 rounded-lg font-medium transition-all
              bg-violet-500/20 text-violet-400 hover:bg-violet-500/30
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirmar Corte
          </button>
          {hasSavedTrim && (
            <button
              onClick={clearTrim}
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all
                bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700"
            >
              Remover Corte
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
