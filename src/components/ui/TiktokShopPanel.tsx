'use client'

import { useState } from 'react'
import { useUIStore } from '@/store'
import { Search, ShoppingBag, Loader2, TrendingUp, DollarSign, Users, Star } from 'lucide-react'

interface Product {
  id: string
  title: string
  image: string
  price: number
  sales: number
  seller: string
  commission?: number
  rating?: number
  gmv?: number
}

export function TiktokShopPanel() {
  const isMobile = useUIStore((s) => s.isMobile)
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setProducts([])
    setSearched(true)
    try {
      const res = await fetch('/api/tiktok-shop/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao buscar produtos'); return }
      setProducts(data.products || [])
    } catch {
      setError('Erro de conexão ao servidor')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatNumber = (v: number) => {
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M'
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
    return v.toString()
  }

  return (
    <div className={`bg-[#0d0d14] flex flex-col shrink-0 overflow-y-auto ${isMobile ? 'w-full flex-1' : 'w-96 border-l border-[#1a1a28]'}`}>
      <div className="p-4 space-y-4">
        <p className="text-xs text-zinc-600 font-medium uppercase tracking-wider flex items-center gap-2">
          <ShoppingBag size={14} /> TikTok Shop
        </p>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Pesquisar produtos..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-[#0a0a0f] border border-[#1a1a28] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className={`w-full h-10 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all ${
            loading || !query.trim()
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white'
          }`}
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Buscando...</> : <><Search size={16} /> Buscar</>}
        </button>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="flex-1 px-4 pb-4 space-y-3">
          <p className="text-[10px] text-zinc-600 font-medium uppercase">
            {products.length} produto{products.length > 1 ? 's' : ''} encontrado{products.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl bg-[#0a0a0f] border border-[#1a1a28] overflow-hidden hover:border-zinc-700 transition-all">
                <div className="aspect-[4/5] bg-zinc-900 relative overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {p.commission !== undefined && (
                    <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {p.commission}%
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-1.5">
                  <p className="text-[11px] text-zinc-300 font-medium leading-tight line-clamp-2">{p.title}</p>
                  <p className="text-sm font-bold text-violet-400">{formatCurrency(p.price)}</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-600">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={10} />
                      <span>{formatNumber(p.sales)} vendidos</span>
                    </div>
                    {p.gmv !== undefined && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={10} />
                        <span>{formatCurrency(p.gmv)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Users size={10} />
                    <span className="truncate">{p.seller}</span>
                  </div>
                  {p.rating !== undefined && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400">
                      <Star size={10} fill="currentColor" />
                      <span>{p.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && searched && products.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-600 px-4">
          <ShoppingBag size={32} />
          <p className="text-sm">Nenhum produto encontrado</p>
          <p className="text-xs text-center">Tente outro termo de busca</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-600 px-4">
          <ShoppingBag size={40} />
          <p className="text-sm font-medium text-zinc-500">Pesquise produtos do TikTok Shop</p>
          <p className="text-xs text-center">Busque por nome, categoria ou palavra-chave</p>
        </div>
      )}
    </div>
  )
}
