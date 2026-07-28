import { NextResponse } from 'next/server'

const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `Você é um especialista em criar legendas otimizadas para redes sociais.
Sempre responda APENAS com JSON válido no formato:
{
  "tiktok": { "caption": "texto da legenda (detalhada, com storytelling)", "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"] },
  "youtube": { "title": "título com até 100 caracteres" }
}

Regras:
- TikTok: legenda detalhada contando uma história, no máximo 5 hashtags relevantes
- YouTube: título chamativo com no máximo 100 caracteres
- Hashtags em português ou inglês dependendo do conteúdo
- Seja direto e evite floreios desnecessários`

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Texto obrigatório' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    const body = {
      model: 'openai/gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://var-hub-var-hub.hx8235.easypanel.host',
        'X-Title': 'Story Studio',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `IA (${res.status}): ${err.slice(0, 300)}` }, { status: 502 })
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Resposta vazia da IA' }, { status: 502 })
    }

    const json = JSON.parse(content.replace(/```json\s*|\s*```/g, '').trim())
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar legenda' }, { status: 500 })
  }
}
