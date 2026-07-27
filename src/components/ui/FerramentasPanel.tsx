'use client'

import { useState } from 'react'
import { Download, Link, Loader2, Music, Film, Check } from 'lucide-react'
import { useUIStore } from '@/store'

export function FerramentasPanel() {
  const isMobile = useUIStore((s) => s.isMobile)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ videoUrl: string; audioUrl: string | null; title: string } | null>(null)

  const handleDownload = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/tiktok', {
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
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
          Ferramentas
        </p>

        <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a28] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-pink-400" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.9 2.89 2.89 0 01-2.88-2.89 2.89 2.89 0 012.88-2.89c.46 0 .9.12 1.28.32v-3.5a6.35 6.35 0 00-1.28-.13A6.35 6.35 0 003 16.19a6.35 6.35 0 006.35 6.36 6.35 6.35 0 006.36-6.36v-7.2a8.24 8.24 0 004.77 1.5v-3.4a4.87 4.87 0 01-2.89-.96z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm text-zinc-300 font-medium">Download TikTok</p>
              <p className="text-[10px] text-zinc-600">Baixe vídeos sem marca d'água</p>
            </div>
          </div>

          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setResult(null); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              placeholder="https://www.tiktok.com/@user/video/123..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-[#0d0d14] border border-[#1a1a28] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
          </div>

          <button
            onClick={handleDownload}
            disabled={loading || !url.trim()}
            className={`w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${
              loading || !url.trim()
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-pink-600 hover:bg-pink-500 text-white'
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
                  onClick={() => triggerDownload(result.videoUrl, `tiktok_video.mp4`)}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
                >
                  <Film size={14} /> Vídeo
                </button>
                {result.audioUrl && (
                  <button
                    onClick={() => triggerDownload(result.audioUrl as string, `tiktok_audio.mp3`)}
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

        <div className="flex flex-col items-center justify-center py-6 text-center">
          <p className="text-[10px] text-zinc-700 leading-relaxed max-w-xs">
            Cole o link de qualquer vídeo público do TikTok e baixe sem marca d'água.
            Formatos suportados: vm.tiktok.com, tiktok.com/@user/video/...
          </p>
        </div>
      </div>
    </div>
  )
}
