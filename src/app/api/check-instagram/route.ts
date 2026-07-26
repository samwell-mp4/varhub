import { NextResponse } from 'next/server'
import { InstagramPost, ACCOUNTS } from '@/types'

export const dynamic = 'force-dynamic'

const FALLBACK_ACCOUNTS: Record<string, { posts: InstagramPost[] }> = {
  choquei: {
    posts: [
      { id: 'fallback1', shortcode: 'fallback1', caption: '🔔 Nenhuma notificação disponível no momento.\n\nTente novamente mais tarde.', likes: '—', comments: '—', time: '—', thumbnail: '' },
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
      }
    } catch (err) {
      console.error(`[check-instagram] fetch attempt ${i} failed:`, err)
      if (i === retries) return null
    }
  }
  return null
}

async function scrapeAccount(account: string): Promise<InstagramPost[] | null> {
  const html = await fetchWithRetry('https://imginn.com/' + account + '/?_=' + Date.now())
  if (!html) return null

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
