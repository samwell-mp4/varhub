import { NextResponse } from 'next/server'

const MOCK_PRODUCTS: Record<string, { id: string; title: string; image: string; price: number; sales: number; seller: string; commission: number; rating: number; gmv: number }[]> = {
  'beleza': [
    { id: 'tt001', title: 'Escova Secadora Modeladora 3 em 1', image: 'https://picsum.photos/seed/brush/400/500', price: 89.90, sales: 15230, seller: 'BelezaStore', commission: 15, rating: 4.7, gmv: 1368917 },
    { id: 'tt002', title: 'Kit Maquiagem Profissional 12 Cores', image: 'https://picsum.photos/seed/makeup/400/500', price: 49.90, sales: 23450, seller: 'GlamourShop', commission: 12, rating: 4.5, gmv: 1170155 },
    { id: 'tt003', title: 'Cremes para Pentear sem Enxágue', image: 'https://picsum.photos/seed/cream/400/500', price: 19.90, sales: 45210, seller: 'CapilarPro', commission: 10, rating: 4.3, gmv: 899679 },
    { id: 'tt004', title: 'Máscara de Cílios Alongadora', image: 'https://picsum.photos/seed/mascara/400/500', price: 34.90, sales: 18200, seller: 'BelezaTotal', commission: 18, rating: 4.6, gmv: 635180 },
  ],
  'fitness': [
    { id: 'tt101', title: 'Garrafa Térmica 2L Inox', image: 'https://picsum.photos/seed/bottle/400/500', price: 59.90, sales: 32100, seller: 'FitLife', commission: 12, rating: 4.8, gmv: 1922790 },
    { id: 'tt102', title: 'Tapete Yoga Antiderrapante', image: 'https://picsum.photos/seed/mat/400/500', price: 79.90, sales: 18450, seller: 'YogaPlus', commission: 10, rating: 4.4, gmv: 1474155 },
    { id: 'tt103', title: 'Corda Pular Speed Aço', image: 'https://picsum.photos/seed/rope/400/500', price: 29.90, sales: 25600, seller: 'EsportesBR', commission: 15, rating: 4.6, gmv: 765440 },
    { id: 'tt104', title: 'Kit Elásticos Resistência 5 níveis', image: 'https://picsum.photos/seed/bands/400/500', price: 39.90, sales: 19800, seller: 'StrongFit', commission: 8, rating: 4.2, gmv: 790020 },
  ],
  'cozinha': [
    { id: 'tt201', title: 'Panela Elétrica Multifuncional', image: 'https://picsum.photos/seed/pot/400/500', price: 149.90, sales: 12300, seller: 'CozinhaFácil', commission: 8, rating: 4.5, gmv: 1843770 },
    { id: 'tt202', title: 'Faqueiro 24 Peças Inox', image: 'https://picsum.photos/seed/silverware/400/500', price: 69.90, sales: 21500, seller: 'MesaRica', commission: 10, rating: 4.3, gmv: 1502850 },
    { id: 'tt203', title: 'Processador Elétrico 3 em 1', image: 'https://picsum.photos/seed/processor/400/500', price: 99.90, sales: 9800, seller: 'EletroPopular', commission: 12, rating: 4.1, gmv: 979020 },
    { id: 'tt204', title: 'Jogo de Panelas Antiaderente 5 Peças', image: 'https://picsum.photos/seed/pans/400/500', price: 199.90, sales: 7600, seller: 'CozinhaLuxo', commission: 7, rating: 4.6, gmv: 1519240 },
  ],
  'pet': [
    { id: 'tt301', title: 'Ração Premium Cães 15kg', image: 'https://picsum.photos/seed/dogfood/400/500', price: 129.90, sales: 28900, seller: 'PetFeliz', commission: 5, rating: 4.7, gmv: 3754110 },
    { id: 'tt302', title: 'Cama Ortopédica Cães 70cm', image: 'https://picsum.photos/seed/dogbed/400/500', price: 89.90, sales: 14200, seller: 'PetConforto', commission: 10, rating: 4.4, gmv: 1276580 },
    { id: 'tt303', title: 'Brinquedo Interativo Cães', image: 'https://picsum.photos/seed/toy/400/500', price: 24.90, sales: 36500, seller: 'PetDiversão', commission: 15, rating: 4.2, gmv: 908850 },
    { id: 'tt304', title: 'Comedouro Automático Programável', image: 'https://picsum.photos/seed/feeder/400/500', price: 159.90, sales: 6700, seller: 'PetTech', commission: 8, rating: 4.5, gmv: 1071330 },
  ],
  'casa': [
    { id: 'tt401', title: 'Luminária LED Mesa Decorativa', image: 'https://picsum.photos/seed/lamp/400/500', price: 45.90, sales: 19800, seller: 'CasaBela', commission: 12, rating: 4.3, gmv: 908820 },
    { id: 'tt402', title: 'Kit Organizador Gavetas 10 Peças', image: 'https://picsum.photos/seed/organizer/400/500', price: 29.90, sales: 31200, seller: 'OrganizeJá', commission: 15, rating: 4.1, gmv: 932880 },
    { id: 'tt403', title: 'Aspirador Robô Inteligente', image: 'https://picsum.photos/seed/robot/400/500', price: 899.90, sales: 4300, seller: 'CasaInteligente', commission: 6, rating: 4.4, gmv: 3869570 },
    { id: 'tt404', title: 'Kit Panelas Pedra Sabão', image: 'https://picsum.photos/seed/stone/400/500', price: 249.90, sales: 5600, seller: 'ArtesanalCasa', commission: 10, rating: 4.7, gmv: 1399440 },
  ],
  'celular': [
    { id: 'tt501', title: 'Suporte Veicular Magnético 360°', image: 'https://picsum.photos/seed/mount/400/500', price: 19.90, sales: 45200, seller: 'TechAcessórios', commission: 20, rating: 4.5, gmv: 899480 },
    { id: 'tt502', title: 'Fone Bluetooth 5.3 Cancelamento', image: 'https://picsum.photos/seed/earbuds/400/500', price: 79.90, sales: 28700, seller: 'SomPremium', commission: 12, rating: 4.6, gmv: 2293130 },
    { id: 'tt503', title: 'Kit Carregador Rápido 65W', image: 'https://picsum.photos/seed/charger/400/500', price: 49.90, sales: 19850, seller: 'PowerTech', commission: 15, rating: 4.3, gmv: 990515 },
    { id: 'tt504', title: 'Película Privacidade iPhone', image: 'https://picsum.photos/seed/screen/400/500', price: 29.90, sales: 32100, seller: 'TelaPro', commission: 18, rating: 4.1, gmv: 959790 },
  ],
  'moda': [
    { id: 'tt601', title: 'Cinto Ajustável Couro Legítimo', image: 'https://picsum.photos/seed/belt/400/500', price: 39.90, sales: 25400, seller: 'ModaMasculina', commission: 15, rating: 4.4, gmv: 1013460 },
    { id: 'tt602', title: 'Bolsa Feminina Couro Ecológico', image: 'https://picsum.photos/seed/bag/400/500', price: 89.90, sales: 16700, seller: 'EstiloFeminino', commission: 12, rating: 4.6, gmv: 1501330 },
    { id: 'tt603', title: 'Kit Meias Algodão 6 Pares', image: 'https://picsum.photos/seed/socks/400/500', price: 19.90, sales: 52300, seller: 'VestuarioBR', commission: 20, rating: 4.2, gmv: 1040770 },
    { id: 'tt604', title: 'Tênis Casual Respirável', image: 'https://picsum.photos/seed/shoes/400/500', price: 129.90, sales: 12300, seller: 'ConfortoTotal', commission: 10, rating: 4.3, gmv: 1597770 },
  ],
}

function findRelevantProducts(query: string) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const results: typeof MOCK_PRODUCTS['beleza'] = []

  for (const [category, products] of Object.entries(MOCK_PRODUCTS)) {
    if (q.includes(category) || category.includes(q)) {
      results.push(...products)
    }
  }

  for (const products of Object.values(MOCK_PRODUCTS)) {
    for (const p of products) {
      const title = p.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const seller = p.seller.toLowerCase()
      if ((title.includes(q) || seller.includes(q)) && !results.some(r => r.id === p.id)) {
        results.push(p)
      }
    }
  }

  if (results.length === 0) {
    const allProducts = Object.values(MOCK_PRODUCTS).flat()
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5)
    results.push(...shuffled.slice(0, 8))
  }

  return results.slice(0, 8)
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query é obrigatória' }, { status: 400 })
    }
    const products = findRelevantProducts(query)
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
