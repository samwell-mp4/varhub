import { NextResponse } from 'next/server'
import { InstagramPost, ACCOUNTS } from '@/types'

export const dynamic = 'force-dynamic'

const FALLBACK_ACCOUNTS: Record<string, { posts: InstagramPost[] }> = {
  choquei: {
    posts: [
      { id: 'fb_c1', shortcode: 'fb_c1', caption: '🔔 As notificações do Instagram estão temporariamente indisponíveis no servidor.\n\nTente novamente mais tarde.', likes: '—', comments: '—', time: '—', thumbnail: '' },
    ],
  },
  hugogloss: {
    posts: [
      { id: 'fb_h1', shortcode: 'fb_h1', caption: '📢 Serviço de notificações offline.\n\nSuas notificações voltarão a funcionar assim que o servidor conseguir acessar a fonte de dados.', likes: '—', comments: '—', time: '—', thumbnail: '' },
    ],
  },
  letsgossip: {
    posts: [
      { id: 'fb_l1', shortcode: 'fb_l1', caption: '⚙️ Estamos resolvendo a conectividade com o Instagram.\n\nEnquanto isso, você pode continuar criando suas artes normalmente.', likes: '—', comments: '—', time: '—', thumbnail: '' },
    ],
  },
  oamarelinhoof: {
    posts: [
      { id: 'fb_o1', shortcode: 'fb_o1', caption: '📡 Notificações temporariamente desativadas.\n\nVerifique se o servidor tem acesso à internet.', likes: '—', comments: '—', time: '—', thumbnail: '' },
    ],
  },
}

async function fetchWithRetry(url: string, retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      })
      if (res.ok) {
        const text = await res.text()
        if (text && text.length > 500) return text
        console.error(`[check-instagram] ${url}: response too short (${text?.length || 0})`)
      } else {
        console.error(`[check-instagram] ${url}: status ${res.status} ${res.statusText}`)
      }
    } catch (err: any) {
      console.error(`[check-instagram] ${url}:`, err?.cause?.code || err?.message || err)
      if (i === retries) return null
    }
  }
  return null
}

const SOURCES = [
  (a: string) => 'https://imginn.com/' + a + '/?_=' + Date.now(),
  (a: string) => 'https://imginn.com/' + a + '/',
  (a: string) => 'https://imginn.org/' + a + '/?_=' + Date.now(),
  (a: string) => 'https://imginn.org/' + a + '/',
]

function parseImginn(html: string): InstagramPost[] | null {
  const posts: InstagramPost[] = []
  const rawItems = html.split('<div class="item">')
  rawItems.shift()

  for (const raw of rawItems) {
    if (raw.includes('{code}') || raw.includes('class="demand-supply"')) continue

    const codeMatch = raw.match(/href="\/p\/([^"{]+)\//)
    if (!codeMatch) continue
    const shortcode = codeMatch[1]
    if (shortcode.startsWith('{')) continue

    const altMatch = raw.match(/alt="([^"]*)"/)
    const caption = altMatch ? altMatch[1].trim() : ''

    const likesMatch = raw.match(/<div class="likes">.*?<span[^>]*>([^<]+)<\/span>/)
    const commentsMatch = raw.match(/<div class="comments">.*?<span[^>]*>([^<]+)<\/span>/)

    const timeMatch = raw.match(/<div class="time">([^<]+)<\/div>/)
    const time = timeMatch ? timeMatch[1].trim() : ''

    posts.push({
      id: shortcode,
      shortcode,
      caption,
      likes: likesMatch ? likesMatch[1].trim() : '',
      comments: commentsMatch ? commentsMatch[1].trim() : '',
      time,
      thumbnail: '',
    })
  }

  return posts.length > 0 ? posts.slice(0, 30) : null
}

async function scrapeAccount(account: string): Promise<InstagramPost[] | null> {
  for (const source of SOURCES) {
    const url = source(account)
    const html = await fetchWithRetry(url)
    if (!html) continue
    const parsed = parseImginn(html)
    if (parsed) return parsed
    console.error(`[check-instagram] ${url}: parsed 0 posts (length=${html.length})`)
  }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')

  try {
    if (account) {
      const posts = await scrapeAccount(account)
      return NextResponse.json({ posts, account }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    }

    const accounts = ACCOUNTS.map((a) => a.username)
    const results = await Promise.allSettled(
      accounts.map((a) => scrapeAccount(a))
    )

    const data: Record<string, { posts: InstagramPost[]; error?: string }> = {}
    let anySuccess = false
    for (let i = 0; i < accounts.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled' && r.value) {
        data[accounts[i]] = { posts: r.value }
        anySuccess = true
      } else {
        data[accounts[i]] = { posts: [], error: 'Falha ao buscar' }
      }
    }

    if (!anySuccess) {
      for (const acc of accounts) {
        data[acc] = FALLBACK_ACCOUNTS[acc] || { posts: [], error: 'Serviço indisponível' }
      }
    }

    return NextResponse.json({ all: data }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (e) {
    console.error('[check-instagram] Fatal error:', e)
    const accounts = ACCOUNTS.map((a) => a.username)
    const fallback: Record<string, { posts: InstagramPost[]; error?: string }> = {}
    for (const acc of accounts) {
      fallback[acc] = FALLBACK_ACCOUNTS[acc] || { posts: [], error: 'Serviço indisponível' }
    }
    return NextResponse.json({ all: fallback }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
