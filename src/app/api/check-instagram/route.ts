import { NextResponse } from 'next/server'
import { InstagramPost, ACCOUNTS } from '@/types'

export const dynamic = 'force-dynamic'

async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      })
      if (res.ok) return await res.text()
    } catch {
      if (i === retries) throw new Error('Fetch failed')
    }
  }
  throw new Error('Fetch failed')
}

async function scrapeAccount(account: string): Promise<InstagramPost[]> {
  const html = await fetchWithRetry('https://imginn.com/' + account + '/?_=' + Date.now())
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

  return posts.slice(0, 30)
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
    for (let i = 0; i < accounts.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled') {
        data[accounts[i]] = { posts: r.value }
      } else {
        data[accounts[i]] = { posts: [], error: 'Falha ao buscar' }
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
    return NextResponse.json(
      { error: 'Falha ao buscar dados do Instagram', posts: [] },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
