'use client'

import { useState } from 'react'
import { Download, Link, Loader2, Music, Film, Check, Play, Camera, MessageCircle, Wrench } from 'lucide-react'
import { useUIStore } from '@/store'

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', icon: Music },
  { id: 'youtube', label: 'YouTube', icon: Play },
  { id: 'instagram', label: 'Instagram', icon: Camera },
  { id: 'facebook', label: 'Facebook', icon: MessageCircle },
]

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com') || u.includes('douyin.com')) return 'tiktok'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'facebook'
  return 'unknown'
}

export function FerramentasPanel() {
  const isMobile = useUIStore((s) => s.isMobile)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ videoUrl: string; audioUrl: string | null; title: string } | null>(null)
  const detected = url.trim() ? detectPlatform(url) : null

  const handleDownload = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/social-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.videoUrl) {
        setError(data.error || 'Falha ao processar o link')
        return
      }
      setResult(data)
    } catch {
      setError('Erro de conexão ao servidor')
    } finally {
      setLoading(false)
    }
  }

  const triggerDownload = (downloadUrl: string, filename: string) => {
    if (navigator.share) {
      navigator.share({ url: downloadUrl }).catch(() => {})
      return
    }
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className={`bg-[#0d0d14] flex flex-col shrink-0 overflow-y-auto ${isMobile ? 'w-full flex-1' : 'w-80 border-l border-[#1a1a28]'}`}>
      <div className="p-4 space-y-4">
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider flex items-center gap-2">
          <Wrench size={14} /> Ferramentas
        </p>

        <div className="flex gap-2">
          {PLATFORMS.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              onClick={() => setUrl('')}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg cursor-pointer transition-all ${
                detected === id
                  ? 'bg-white/10 text-zinc-200'
                  : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
              }`}
            >
              <Icon size={16} />
              <span className="text-[9px] font-medium">{label}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a28] p-4 space-y-3">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setResult(null); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              placeholder="Cole o link do vídeo aqui..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-[#0d0d14] border border-[#1a1a28] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
          </div>

          {detected && detected !== 'unknown' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-500/80 font-medium uppercase">
                {detected}
              </span>
            </div>
          )}

          {detected === 'unknown' && url.trim() && (
            <p className="text-[10px] text-zinc-600">
              Plataforma não reconhecida. Suportamos: TikTok, YouTube, Instagram e Facebook.
            </p>
          )}

          <button
            onClick={handleDownload}
            disabled={loading || !url.trim()}
            className={`w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${
              loading || !url.trim()
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Processando...</>
            ) : (
              <><Download size={16} /> Baixar</>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {result && (
            <div className="space-y-2 pt-2 border-t border-[#1a1a28]">
              {result.title && (
                <p className="text-xs text-zinc-500 truncate">{result.title}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => triggerDownload(result.videoUrl, `video.mp4`)}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
                >
                  <Film size={14} /> Vídeo
                </button>
                {result.audioUrl && (
                  <button
                    onClick={() => triggerDownload(result.audioUrl as string, `audio.mp3`)}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Music size={14} /> Áudio
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center gap-1">
                <Check size={12} className="text-emerald-500" />
                <span className="text-[10px] text-zinc-600">Pronto! Clique para baixar</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-[10px] text-zinc-700 leading-relaxed max-w-xs">
            Cole o link de qualquer vídeo público do TikTok, YouTube, Instagram ou Facebook.
          </p>
        </div>
      </div>
    </div>
  )
}
