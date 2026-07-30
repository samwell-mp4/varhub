'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUIStore } from '@/store'
import {
  Search, ShoppingBag, Loader2, TrendingUp, DollarSign, Users, Star,
  Sparkles, Shirt, Gem, Smartphone, Home, CookingPot, Footprints,
  Dumbbell, Baby, PawPrint, Apple, BookOpen, Car, Heart, ChevronRight,
  ArrowLeft, Layers,
} from 'lucide-react'

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

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  children?: Category[]
}

type TabMode = 'search' | 'categories'

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  beauty: Sparkles,
  womenswear: Shirt,
  menswear: Shirt,
  'fashion-accessories': Gem,
  'phones-electronics': Smartphone,
  'home-supplies': Home,
  kitchenware: CookingPot,
  shoes: Footprints,
  'sports-outdoor': Dumbbell,
  'baby-maternity': Baby,
  pets: PawPrint,
  'food-beverage': Apple,
  'office-school': BookOpen,
  automotive: Car,
  'health-wellness': Heart,
}

function CategoryIcon({ id, size = 16 }: { id: string; size?: number }) {
  const Icon = CATEGORY_ICONS[id] || ShoppingBag
  return <Icon size={size} />
}

export function TiktokShopPanel() {
  const isMobile = useUIStore((s) => s.isMobile)
  const [mode, setMode] = useState<TabMode>('search')
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<Category | null>(null)
  const [selectedSubCat, setSelectedSubCat] = useState<Category | null>(null)

  useEffect(() => {
    if (mode !== 'categories' || categories.length > 0) return
    let cancelled = false
    fetch('/api/tiktok-shop/categories')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.categories) setCategories(data.categories)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [mode, categories.length])

  const doSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setProducts([])
    setSearched(true)
    try {
      const body: Record<string, string> = { query: searchQuery.trim() }
      if (selectedSubCat) body.category = selectedSubCat.slug
      else if (selectedCat) body.category = selectedCat.slug

      const res = await fetch('/api/tiktok-shop/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao buscar produtos'); return }
      setProducts(data.products || [])
    } catch {
      setError('Erro de conexão ao servidor')
    } finally {
      setLoading(false)
    }
  }, [selectedCat, selectedSubCat])

  const handleSearch = () => doSearch(query)

  const handleCategoryClick = (cat: Category) => {
    setSelectedCat(cat)
    setSelectedSubCat(null)
    if (!cat.children || cat.children.length === 0) {
      setMode('search')
      setQuery(cat.name)
      doSearch(cat.name)
    }
  }

  const handleSubCategoryClick = (sub: Category) => {
    setSelectedSubCat(sub)
    setMode('search')
    setQuery(sub.name)
    doSearch(sub.name)
  }

  const goBackToCategories = () => {
    setSelectedCat(null)
    setSelectedSubCat(null)
  }

  const goBackToSubCategories = () => {
    setSelectedSubCat(null)
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

        <div className="flex gap-1 bg-[#0a0a0f] border border-[#1a1a28] rounded-lg p-0.5">
          <button
            onClick={() => { setMode('search'); goBackToCategories() }}
            className={`flex-1 h-8 text-xs font-medium rounded-md transition-all ${
              mode === 'search' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Search size={12} className="inline mr-1.5 -mt-0.5" />
            Busca
          </button>
          <button
            onClick={() => { setMode('categories'); goBackToCategories() }}
            className={`flex-1 h-8 text-xs font-medium rounded-md transition-all ${
              mode === 'categories' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Layers size={12} className="inline mr-1.5 -mt-0.5" />
            Categorias
          </button>
        </div>

        {mode === 'search' && (
          <div className="space-y-3">
            {(selectedCat || selectedSubCat) && (
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <button onClick={selectedSubCat ? goBackToSubCategories : goBackToCategories} className="hover:text-zinc-300 transition-all">
                  <ArrowLeft size={12} />
                </button>
                <span className="truncate">
                  {selectedSubCat
                    ? `${selectedCat?.name} / ${selectedSubCat.name}`
                    : selectedCat?.name}
                </span>
              </div>
            )}
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
        )}
      </div>

      {mode === 'categories' && (
        <div className="flex-1 px-4 pb-4">
          {selectedCat && selectedCat.children && selectedCat.children.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={goBackToCategories} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-all">
                  <ArrowLeft size={14} />
                </button>
                <div className="flex items-center gap-1.5">
                  <CategoryIcon id={selectedCat.id} size={14} />
                  <span className="text-xs text-zinc-400 font-medium">{selectedCat.name}</span>
                </div>
              </div>
              {selectedCat.children.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSubCategoryClick(sub)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0a0a0f] border border-[#1a1a28] hover:border-zinc-700 text-left transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-violet-400 uppercase">{sub.name.charAt(0)}</span>
                  </div>
                  <span className="flex-1 text-xs text-zinc-300 group-hover:text-zinc-200 transition-colors">{sub.name}</span>
                  <ChevronRight size={12} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0a0a0f] border border-[#1a1a28] hover:border-zinc-700 text-left transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <CategoryIcon id={cat.id} size={20} />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium text-center leading-tight group-hover:text-zinc-300 transition-colors line-clamp-2">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'search' && (
        <>
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
              {selectedCat ? (
                <>
                  <p className="text-sm font-medium text-zinc-500 text-center">{selectedCat.name}</p>
                  <p className="text-xs text-center">Digite um termo ou clique em Buscar</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-zinc-500">Pesquise produtos do TikTok Shop</p>
                  <p className="text-xs text-center">Busque por nome, categoria ou palavra-chave</p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
