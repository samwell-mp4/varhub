import { NextResponse } from 'next/server'
import { InstagramPost, ACCOUNTS } from '@/types'
import { parseImginn } from '@/lib/parseImginn'

export const dynamic = 'force-dynamic'

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
      } else {
        console.error(`[check-instagram] ${url}: status ${res.status}`)
      }
    } catch {
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

async function scrapeAccount(account: string): Promise<InstagramPost[] | null> {
  for (const source of SOURCES) {
    const url = source(account)
    const html = await fetchWithRetry(url)
    if (!html) continue
    const parsed = parseImginn(html)
    if (parsed) return parsed
  }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')

  try {
    if (account) {
      const posts = await scrapeAccount(account)
      if (posts) return NextResponse.json({ posts, account }, {
        headers: { 'Cache-Control': 'no-store' },
      })
      return NextResponse.json({ useProxy: true, account }, {
        headers: { 'Cache-Control': 'no-store' },
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
      }
    }

    if (!anySuccess) {
      return NextResponse.json({ useProxy: true, accounts }, {
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    return NextResponse.json({ all: data }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ useProxy: true, accounts: ACCOUNTS.map((a) => a.username) }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
