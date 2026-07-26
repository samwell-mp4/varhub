import { InstagramPost } from '@/types'

export function parseImginn(html: string): InstagramPost[] | null {
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
