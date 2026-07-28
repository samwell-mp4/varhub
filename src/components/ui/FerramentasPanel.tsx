'use client'

import { useState } from 'react'
import { Download, Link, Loader2, Music, Play, Camera, MessageCircle, Wrench, Sparkles, Copy, Check } from 'lucide-react'
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
  const [captionText, setCaptionText] = useState('')
  const [captionLoading, setCaptionLoading] = useState(false)
  const [captionError, setCaptionError] = useState('')
  const [captionResult, setCaptionResult] = useState<{ tiktok: { caption: string; hashtags: string[] }; youtube: { title: string } } | null>(null)
  const [copied, setCopied] = useState('')

  const triggerDownload = async (downloadUrl: string) => {
    try {
      const blob = await fetch(downloadUrl).then(r => r.blob())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'video.mp4'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

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
              <button
                onClick={() => triggerDownload(result.videoUrl)}
                className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all"
              >
                <Download size={14} /> Baixar vídeo
              </button>
              {result.audioUrl && (
                <button
                  onClick={() => {
                    const dl = result.audioUrl as string
                    if (navigator.share) {
                      navigator.share({ url: dl }).catch(() => {})
                    } else {
                      const a = document.createElement('a')
                      a.href = dl
                      a.download = 'audio.mp3'
                      a.target = '_blank'
                      a.rel = 'noopener noreferrer'
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }
                  }}
                  className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                >
                  <Music size={14} /> Baixar áudio
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="h-px bg-[#1a1a28]" />
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} /> Gerador de Legendas
        </p>

        <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a28] p-4 space-y-3">
          <textarea
            value={captionText}
            onChange={(e) => { setCaptionText(e.target.value); setCaptionResult(null); setCaptionError('') }}
            placeholder="Descreva o conteúdo do vídeo..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-[#0d0d14] border border-[#1a1a28] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
          />

          <button
            onClick={async () => {
              if (!captionText.trim()) return
              setCaptionLoading(true)
              setCaptionError('')
              setCaptionResult(null)
              try {
                const res = await fetch('/api/generate-caption', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: captionText.trim() }),
                })
                const data = await res.json()
                if (!res.ok) { setCaptionError(data.error || 'Erro'); return }
                setCaptionResult(data)
              } catch { setCaptionError('Erro de conexão') }
              finally { setCaptionLoading(false) }
            }}
            disabled={captionLoading || !captionText.trim()}
            className={`w-full h-9 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all ${
              captionLoading || !captionText.trim()
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {captionLoading ? <><Loader2 size={14} className="animate-spin" /> Gerando...</> : <><Sparkles size={14} /> Gerar Legenda</>}
          </button>

          {captionError && <p className="text-xs text-red-400 text-center">{captionError}</p>}

          {captionResult && (
            <div className="space-y-3 pt-2 border-t border-[#1a1a28]">
              <div>
                <p className="text-[10px] text-zinc-600 font-medium uppercase mb-1">TikTok</p>
                <p className="text-xs text-zinc-300 leading-relaxed">{captionResult.tiktok.caption}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {captionResult.tiktok.hashtags.map((h, i) => (
                    <span key={i} className="text-[10px] text-violet-400">#{h}</span>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    const txt = `${captionResult.tiktok.caption}\n\n${captionResult.tiktok.hashtags.map(h => `#${h}`).join(' ')}`
                    await navigator.clipboard.writeText(txt).catch(() => {})
                    setCopied('tt')
                    setTimeout(() => setCopied(''), 2000)
                  }}
                  className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  {copied === 'tt' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied === 'tt' ? 'Copiado!' : 'Copiar legenda'}
                </button>
              </div>

              <div className="h-px bg-[#1a1a28]/50" />

              <div>
                <p className="text-[10px] text-zinc-600 font-medium uppercase mb-1">YouTube</p>
                <p className="text-xs text-zinc-300">{captionResult.youtube.title}</p>
                <p className="text-[10px] text-zinc-700 mt-0.5">{captionResult.youtube.title.length}/100 caracteres</p>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(captionResult.youtube.title).catch(() => {})
                    setCopied('yt')
                    setTimeout(() => setCopied(''), 2000)
                  }}
                  className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  {copied === 'yt' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied === 'yt' ? 'Copiado!' : 'Copiar título'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
