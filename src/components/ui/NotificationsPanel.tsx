'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { InstagramPost, ACCOUNTS } from '@/types'
import { useUIStore } from '@/store'
import { Bell, BellDot, RefreshCw, ExternalLink, Clock, Heart, MessageCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const POLL_INTERVAL = 120000

function getKnownIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem('notificacoes_ids') || '[]')
  } catch {
    return []
  }
}

function saveKnownIds(ids: string[]) {
  localStorage.setItem('notificacoes_ids', JSON.stringify(ids))
}

export function NotificationsPanel() {
  const [accountData, setAccountData] = useState<Record<string, { posts: InstagramPost[]; error?: string }>>({})
  const [activeTab, setActiveTab] = useState('all')
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const knownIds = useRef<Set<string>>(new Set(getKnownIds()))
  const hasData = useRef(false)
  const tabsRef = useRef<HTMLDivElement>(null)

  const updateScrollButtons = useCallback(() => {
    const el = tabsRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  const scrollTabs = (dir: 'left' | 'right') => {
    const el = tabsRef.current
    if (!el) return
    const amount = dir === 'left' ? -200 : 200
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  function parseTimeAgo(t: string): number {
    const m = t.match(/(\d+)\s*(min|h|d|sem|w)/i)
    if (!m) return 0
    const n = parseInt(m[1])
    const unit = m[2].toLowerCase()
    if (unit === 'min') return n * 60
    if (unit === 'h') return n * 3600
    if (unit === 'd') return n * 86400
    if (unit === 'sem' || unit === 'w') return n * 604800
    return 0
  }

  function sortByTime(a: InstagramPost, b: InstagramPost): number {
    return parseTimeAgo(a.time) - parseTimeAgo(b.time)
  }

  const allPosts = Object.values(accountData).flatMap((d) => d.posts).sort(sortByTime)
  const currentPosts = activeTab === 'all'
    ? allPosts
    : [...(accountData[activeTab]?.posts ?? [])].sort(sortByTime)

  const currentError = activeTab !== 'all' ? accountData[activeTab]?.error : undefined
  const hasAnyError = Object.values(accountData).some((d) => d.error)

  const checkPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/check-instagram?_=' + Date.now(), {
        signal: AbortSignal.timeout(30000),
      })
      if (!res.ok) throw new Error('Falha ao buscar')
      const data = await res.json()
      if (!data.all) throw new Error('Sem dados')

      const incoming: Record<string, { posts: InstagramPost[]; error?: string }> = data.all

      const incomingIds = new Set<string>()
      const fresh: string[] = []

      for (const acc of Object.values(incoming)) {
        for (const p of acc.posts) {
          incomingIds.add(p.id)
          if (!knownIds.current.has(p.id)) {
            fresh.push(p.id)
          }
        }
      }

      if (fresh.length > 0) {
        setNewIds((prev) => {
          const next = new Set(prev)
          for (const id of fresh) next.add(id)
          return next
        })
      }

      knownIds.current = incomingIds
      saveKnownIds([...incomingIds])
      setAccountData(incoming)
      hasData.current = true
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
    } catch {
      if (!hasData.current) {
        setAccountData({ error_fetch: { posts: [], error: 'Não foi possível conectar ao Instagram' } })
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkPosts()
    const interval = setInterval(checkPosts, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [checkPosts])

  useEffect(() => {
    updateScrollButtons()
  }, [accountData, updateScrollButtons])

  const dismissNew = () => setNewIds(new Set())
  const isMobile = useUIStore((s) => s.isMobile)

  return (
    <div className={`bg-[#0d0d14] flex flex-col shrink-0 overflow-hidden ${isMobile ? 'w-full flex-1' : 'w-80 border-l border-[#1a1a28]'}`}>
      <div className="p-4 border-b border-[#1a1a28] shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {newIds.size > 0 ? (
              <BellDot size={16} className="text-violet-400" />
            ) : (
              <Bell size={16} className="text-zinc-500" />
            )}
            <span className="text-sm text-zinc-300 font-medium">Notificações</span>
            {newIds.size > 0 && (
              <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full font-bold">
                {newIds.size} novo{newIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {newIds.size > 0 && (
              <button
                onClick={dismissNew}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded transition-all"
              >
                Limpar
              </button>
            )}
            <button
              onClick={checkPosts}
              disabled={loading}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all disabled:opacity-50"
              title="Atualizar agora"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        {lastUpdate && (
          <div className="text-[10px] text-zinc-700">
            Última atualização: {lastUpdate}
          </div>
        )}
      </div>

      <div className="relative flex items-center border-b border-[#1a1a28] shrink-0">
        {canScrollLeft && (
          <button
            onClick={() => scrollTabs('left')}
            className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-[#0d0d14] via-[#0d0d14]/90 to-transparent text-zinc-400 hover:text-zinc-200"
          >
            <ChevronLeft size={14} />
          </button>
        )}
        <div
          ref={tabsRef}
          onScroll={updateScrollButtons}
          className="flex gap-1 px-3 py-2 overflow-x-auto shrink-0 flex-nowrap scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}
        >
          <button
            onClick={() => setActiveTab('all')}
            className={`text-[11px] px-2.5 py-1 rounded-full transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
            }`}
          >
            Todos
          </button>
          {ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              onClick={() => setActiveTab(acc.username)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-all shrink-0 whitespace-nowrap ${
                activeTab === acc.username
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/5'
              }`}
            >
              {acc.label}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scrollTabs('right')}
            className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-[#0d0d14] via-[#0d0d14]/90 to-transparent text-zinc-400 hover:text-zinc-200"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && currentPosts.length === 0 && !currentError && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Loader2 size={20} className="text-zinc-600 animate-spin" />
            <span className="text-[11px] text-zinc-600">Buscando postagens...</span>
          </div>
        )}

        {currentError && currentPosts.length === 0 && (
          <div className="p-4 text-center">
            <AlertCircle size={20} className="text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-600 mb-2">{currentError}</p>
            <button
              onClick={checkPosts}
              disabled={loading}
              className="text-xs text-violet-400 hover:text-violet-300 disabled:text-zinc-600"
            >
              {loading ? 'Buscando...' : 'Tentar novamente'}
            </button>
          </div>
        )}

        {hasAnyError && activeTab === 'all' && Object.keys(accountData).length > 0 && (
          <div className="px-3 py-2">
            <p className="text-[10px] text-zinc-600">
              Algumas páginas não puderam ser carregadas
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {currentPosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`p-3 border-b border-[#1a1a28] hover:bg-white/[0.02] transition-all ${
                newIds.has(post.id) ? 'bg-violet-500/5 border-l-2 border-l-violet-500' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
                    {post.caption || '(sem descrição)'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Heart size={10} />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <MessageCircle size={10} />
                      {post.comments}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Clock size={10} />
                      {post.time}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://www.instagram.com/p/${post.shortcode}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all"
                  title="Abrir no Instagram"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && currentPosts.length > 0 && (
          <div className="p-3 text-center">
            <span className="text-[10px] text-zinc-700">
              {currentPosts.length} postagen{currentPosts.length > 1 ? 's' : 'em'}
            </span>
          </div>
        )}

        {!loading && currentPosts.length === 0 && !currentError && (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <Bell size={24} className="text-zinc-700 mb-2" />
            <p className="text-xs text-zinc-600">Nenhuma postagem encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
