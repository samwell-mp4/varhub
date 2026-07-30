/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'

interface TiktokProduct {
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

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Origin': 'https://shop.tiktok.com',
  'Referer': 'https://shop.tiktok.com/',
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url='

function extractNumber(v: any): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.,]/g, '').replace('.', '').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }
  return 0
}

async function tryDirectApi(query: string): Promise<TiktokProduct[] | null> {
  const urls = [
    `https://shop.tiktok.com/api/product/search?keyword=${encodeURIComponent(query)}&page=1&page_size=12&sort_type=0`,
    `https://shop.tiktok.com/api/v2/search?keyword=${encodeURIComponent(query)}&page=1&page_size=12`,
    `https://www.tiktok.com/api/search/general/full/?keyword=${encodeURIComponent(query)}&aid=1988`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { continue }
      const products = extractProducts(data)
      if (products.length > 0) return products
    } catch {}
  }
  return null
}

function extractProducts(data: any): TiktokProduct[] {
  const products: TiktokProduct[] = []

  const items = data?.data?.products || data?.products || data?.data?.items || data?.itemList || data?.items || []

  for (const item of items) {
    const p = item?.product || item
    const title = p?.title || p?.product_name || p?.name || ''
    if (!title) continue

    const image = p?.image || p?.thumbnail || p?.main_image || p?.images?.[0] || p?.cover || ''

    const rawPrice = p?.price || p?.price_text || p?.sale_price || p?.min_price || 0
    const price = extractNumber(rawPrice)

    const rawSales = p?.sales || p?.sold || p?.sold_count || p?.sales_count || p?.order_count || 0
    const sales = extractNumber(rawSales)

    const seller = p?.shop_name || p?.seller_name || p?.shop?.name || p?.author?.nickname || p?.nickname || p?.seller || 'TikTok Shop'

    const rawCommission = p?.commission || p?.commission_rate || item?.commission || 0
    const commission = extractNumber(rawCommission) || undefined

    const rating = p?.rating || p?.score || item?.rating || undefined

    const rawGmv = p?.gmv || p?.gmv_text || p?.revenue || p?.sales_amount || 0
    const gmv = extractNumber(rawGmv) || undefined

    const id = p?.id || p?.product_id || p?.item_id || String(Math.random()).slice(2)

    products.push({
      id: String(id),
      title: String(title).trim(),
      image: String(image).startsWith('http') ? String(image) : '',
      price,
      sales,
      seller: String(seller).trim(),
      commission: commission && commission > 0 ? commission : undefined,
      rating: rating ? extractNumber(rating) : undefined,
      gmv: gmv && gmv > 0 ? gmv : undefined,
    })
  }

  return products
}

async function tryProxy(query: string): Promise<TiktokProduct[] | null> {
  const urls = [
    `https://shop.tiktok.com/search?keyword=${encodeURIComponent(query)}`,
    `https://www.tiktok.com/search?q=${encodeURIComponent(query)}&type=product`,
    `https://tikrank.com/shop?keyword=${encodeURIComponent(query)}`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(CORS_PROXY + encodeURIComponent(url), {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const html = await res.text()

      const products = parseHtmlProducts(html)
      if (products.length > 0) return products
    } catch {}
  }
  return null
}

function parseHtmlProducts(html: string): TiktokProduct[] {
  const products: TiktokProduct[] = []

  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/)
  if (initialStateMatch) {
    try {
      const state = JSON.parse(initialStateMatch[1])
      const items = state?.search?.products || state?.searchResult?.productList || state?.productList || []
      for (const item of items) {
        const p = item?.product || item
        products.push({
          id: String(p?.id || p?.productId || Math.random()).slice(0, 12),
          title: String(p?.title || p?.productName || '').trim(),
          image: String(p?.image || p?.thumbnail || p?.mainImage || ''),
          price: extractNumber(p?.price || p?.salePrice || p?.minPrice || 0),
          sales: extractNumber(p?.sales || p?.soldCount || p?.salesCount || 0),
          seller: String(p?.shopName || p?.sellerName || p?.shop?.name || 'TikTok Shop').trim(),
          commission: p?.commission ? extractNumber(p.commission) : undefined,
          rating: p?.rating ? extractNumber(p.rating) : undefined,
          gmv: p?.gmv || p?.revenue ? extractNumber(p.gmv || p.revenue) : undefined,
        })
      }
      if (products.length > 0) return products
    } catch {}
  }

  const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  if (jsonLdBlocks) {
    for (const block of jsonLdBlocks) {
      try {
        const json = JSON.parse(block.replace(/<[^>]+>/g, ''))
        const items = Array.isArray(json) ? json : json?.itemListElement ? json.itemListElement.map((e: any) => e.item) : [json]
        for (const item of items) {
          if (item?.['@type'] === 'Product' || item?.name) {
            products.push({
              id: String(item?.sku || item?.productID || Math.random()).slice(0, 12),
              title: String(item?.name || '').trim(),
              image: String(item?.image?.[0] || item?.image || ''),
              price: extractNumber(item?.offers?.price || item?.price || 0),
              sales: 0,
              seller: String(item?.brand?.name || item?.seller || 'TikTok Shop').trim(),
              rating: item?.aggregateRating?.ratingValue ? extractNumber(item.aggregateRating.ratingValue) : undefined,
            })
          }
        }
        if (products.length > 0) return products
      } catch {}
    }
  }

  const cards = html.match(/<div[^>]*class="[^"]*product[^"]*"[^>]*>/gi)
  if (cards && cards.length > 0) {
    const nameMatches = html.match(/<h[23][^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h[23]>/gi)
    const priceMatches = html.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>R?\$?\s?([\d.,]+)<\/span>/gi)
    for (let i = 0; i < Math.min(cards.length, 12); i++) {
      products.push({
        id: `card_${i}`,
        title: nameMatches?.[i] ? nameMatches[i].replace(/<[^>]+>/g, '').trim() : `Produto ${i + 1}`,
        image: '',
        price: priceMatches?.[i] ? extractNumber(priceMatches[i]) : 0,
        sales: 0,
        seller: 'TikTok Shop',
      })
    }
    if (products.length > 0) return products
  }

  return products
}

export async function POST(request: Request) {
  try {
    const { query, category } = await request.json()
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Digite um termo para buscar' }, { status: 400 })
    }
    let q = query.trim()
    if (category && typeof category === 'string' && category.trim()) {
      const catSlug = category.trim()
      q = `${q} ${catSlug.replace(/[^a-zA-Z0-9-]/g, ' ')}`
    }

    let products = await tryDirectApi(q)
    if (!products) products = await tryProxy(q)
    if (!products) products = []

    return NextResponse.json({ products })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar produtos: ' + (e instanceof Error ? e.message : 'desconhecido') }, { status: 500 })
  }
}
