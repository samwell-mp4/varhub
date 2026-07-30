import { NextResponse } from 'next/server'
import { getSeedCategories, getFlatCategories, discoverCategoriesFromProxy } from '@/lib/tiktokCategories'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'tree'

    if (mode === 'flat') {
      return NextResponse.json({ categories: getFlatCategories() })
    }

    if (mode === 'discover') {
      const discovered = await discoverCategoriesFromProxy()
      if (discovered && discovered.length > 0) {
        return NextResponse.json({ categories: discovered, source: 'discovered' })
      }
      return NextResponse.json({ categories: getSeedCategories(), source: 'seed' })
    }

    return NextResponse.json({ categories: getSeedCategories() })
  } catch (e) {
    return NextResponse.json(
      { error: 'Erro ao carregar categorias: ' + (e instanceof Error ? e.message : 'desconhecido') },
      { status: 500 }
    )
  }
}
