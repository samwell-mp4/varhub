'use client'

import { useProjectStore } from '@/store'
import { useRef } from 'react'
import { DropZone } from './DropZone'
import { MediaList } from '../preview/MediaList'
import { Image, X } from 'lucide-react'

export function EditorPanel() {
  const { project, setTitle, setSubtitle, setTitleSize, setSubtitleSize, setTitleBold, setSubtitleBold, setBgColor, setTitleColor, setSubtitleColor, setCategory, setLogo } = useProjectStore()
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-80 bg-[#0d0d14] border-l border-[#1a1a28] flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 space-y-5">
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
            Post
          </p>

          <div className="bg-white rounded-xl p-4 space-y-3 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="relative group shrink-0">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center overflow-hidden ring-2 ring-white/20 hover:ring-violet-400/50 transition-all"
                >
                  {project.logo ? (
                    <img src={project.logo} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <Image size={16} className="text-white" />
                  )}
                </button>
                {project.logo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setLogo(undefined)
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={8} className="text-zinc-400" />
                  </button>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <textarea
                  value={project.title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="O que está acontecendo?"
                  rows={2}
                  className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 font-medium focus:outline-none resize-none overflow-hidden min-h-[2.5rem]"
                />
                <textarea
                  value={project.subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Adicione um subtítulo"
                  rows={3}
                  className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-400 focus:outline-none resize-none overflow-hidden min-h-[3.5rem]"
                />
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                  <select
                    value={project.category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-[11px] bg-zinc-100 text-zinc-700 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500/30 border-0"
                  >
                    <option value="Notícia">Notícia</option>
                    <option value="Fofoca">Fofoca</option>
                    <option value="Promoção">Promoção</option>
                    <option value="Dica">Dica</option>
                    <option value="Curiosidade">Curiosidade</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Título</span>
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={project.titleSize ?? 16}
                  onChange={(e) => setTitleSize(Number(e.target.value))}
                  className="flex-1 h-1 accent-violet-500"
                />
                <span className="text-[11px] text-zinc-500 w-6 text-right">{project.titleSize ?? 16}</span>
                <button
                  onClick={() => setTitleBold(!(project.titleBold ?? true))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                    (project.titleBold ?? true) ? 'text-violet-400 bg-violet-500/15' : 'text-zinc-500 bg-white/5'
                  }`}
                >
                  B
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Subtítulo</span>
                <input
                  type="range"
                  min={10}
                  max={32}
                  value={project.subtitleSize ?? 13}
                  onChange={(e) => setSubtitleSize(Number(e.target.value))}
                  className="flex-1 h-1 accent-violet-500"
                />
                <span className="text-[11px] text-zinc-500 w-6 text-right">{project.subtitleSize ?? 13}</span>
                <button
                  onClick={() => setSubtitleBold(!(project.subtitleBold ?? false))}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${
                    (project.subtitleBold ?? false) ? 'text-violet-400 bg-violet-500/15' : 'text-zinc-500 bg-white/5'
                  }`}
                >
                  B
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-zinc-800/40">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Fundo</span>
                <input
                  type="color"
                  value={project.bgColor || '#000000'}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[10px] text-zinc-600 font-mono">{project.bgColor || '#000000'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Título</span>
                <input
                  type="color"
                  value={project.titleColor || '#ffffff'}
                  onChange={(e) => setTitleColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[10px] text-zinc-600 font-mono">{project.titleColor || '#ffffff'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 w-20">Subtítulo</span>
                <input
                  type="color"
                  value={project.subtitleColor || '#a1a1aa'}
                  onChange={(e) => setSubtitleColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-[10px] text-zinc-600 font-mono">{project.subtitleColor || '#a1a1aa'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider">
            Upload
          </p>
          <DropZone />
        </div>

        <MediaList />
      </div>
    </div>
  )
}
