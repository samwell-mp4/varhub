'use client'

import { useState } from 'react'
import { useUIStore } from '@/store'
import { Music, Link, Loader2, Download, FileAudio } from 'lucide-react'

const WEBHOOK_URL = 'https://plug-sales-dispatch-app-n8n-2.hx8235.easypanel.host/webhook/extrator-audio'

export function AudioExtractorPanel() {
  const isMobile = useUIStore((s) => s.isMobile)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ audio: string } | null>(null)

  const handleExtract = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok || !data.audio) {
        setError(data.error || 'Falha ao extrair áudio')
        return
      }
      setResult(data)
    } catch {
      setError('Erro de conexão ao servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-[#0d0d14] flex flex-col shrink-0 overflow-y-auto ${isMobile ? 'w-full flex-1' : 'w-80 border-l border-[#1a1a28]'}`}>
      <div className="p-4 space-y-4">
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider flex items-center gap-2">
          <Music size={14} /> Extrator de Áudio
        </p>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Cole o link de um vídeo para extrair o áudio em MP3.
        </p>

        <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a28] p-4 space-y-3">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setResult(null); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
              placeholder="Link do vídeo..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-[#0d0d14] border border-[#1a1a28] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <Link size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
          </div>

          <button
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            className={`w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${
              loading || !url.trim()
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Extraindo...</>
            ) : (
              <><FileAudio size={16} /> Extrair Áudio</>
            )}
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {result && (
            <div className="space-y-2 pt-2 border-t border-[#1a1a28]">
              <p className="text-xs text-emerald-500/80">Áudio extraído com sucesso!</p>
              <button
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = result.audio
                  a.download = 'audio.mp3'
                  a.rel = 'noopener noreferrer'
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
                className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <Download size={14} /> Baixar MP3
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a28] p-4">
          <p className="text-[10px] text-zinc-600 font-medium uppercase mb-2">Como funciona</p>
          <ul className="space-y-1.5">
            <li className="text-[11px] text-zinc-500 flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">1.</span>
              Cole o link de qualquer vídeo
            </li>
            <li className="text-[11px] text-zinc-500 flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">2.</span>
              Nosso servidor extrai o áudio com FFmpeg
            </li>
            <li className="text-[11px] text-zinc-500 flex items-start gap-2">
              <span className="text-violet-500 mt-0.5">3.</span>
              Baixe o resultado em MP3
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
