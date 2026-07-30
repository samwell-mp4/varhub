export interface TiktokCategory {
  id: string
  name: string
  slug: string
  image?: string
  children?: TiktokCategory[]
}

const SEED_CATEGORIES: TiktokCategory[] = [
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    children: [
      { id: 'beauty-skincare', name: 'Skincare', slug: 'beauty-personal-care/skincare' },
      { id: 'beauty-makeup', name: 'Makeup', slug: 'beauty-personal-care/makeup' },
      { id: 'beauty-hair', name: 'Hair Care', slug: 'beauty-personal-care/hair' },
      { id: 'beauty-fragrance', name: 'Fragrance', slug: 'beauty-personal-care/fragrance' },
      { id: 'beauty-nails', name: 'Nails', slug: 'beauty-personal-care/nails' },
      { id: 'beauty-tools', name: 'Beauty Tools', slug: 'beauty-personal-care/tools' },
    ],
  },
  {
    id: 'womenswear',
    name: "Women's Fashion",
    slug: 'womenswear-underwear',
    children: [
      { id: 'women-dresses', name: 'Dresses', slug: 'womenswear-underwear/dresses' },
      { id: 'women-tops', name: 'Tops & Blouses', slug: 'womenswear-underwear/tops' },
      { id: 'women-bottoms', name: 'Pants & Skirts', slug: 'womenswear-underwear/bottoms' },
      { id: 'women-outerwear', name: 'Outerwear & Jackets', slug: 'womenswear-underwear/outerwear' },
      { id: 'women-swimwear', name: 'Swimwear & Lingerie', slug: 'womenswear-underwear/swimwear' },
      { id: 'women-activewear', name: 'Activewear', slug: 'womenswear-underwear/activewear' },
    ],
  },
  {
    id: 'menswear',
    name: "Men's Fashion",
    slug: 'menswear-underwear',
    children: [
      { id: 'men-tops', name: 'Tops & T-shirts', slug: 'menswear-underwear/tops' },
      { id: 'men-bottoms', name: 'Pants & Shorts', slug: 'menswear-underwear/bottoms' },
      { id: 'men-outerwear', name: 'Jackets & Hoodies', slug: 'menswear-underwear/outerwear' },
      { id: 'men-swimwear', name: 'Underwear & Swimwear', slug: 'menswear-underwear/swimwear' },
      { id: 'men-suits', name: 'Suits & Blazers', slug: 'menswear-underwear/suits' },
    ],
  },
  {
    id: 'fashion-accessories',
    name: 'Fashion Accessories',
    slug: 'fashion-accessories',
    children: [
      { id: 'acc-jewelry', name: 'Jewelry', slug: 'fashion-accessories/jewelry' },
      { id: 'acc-watches', name: 'Watches', slug: 'fashion-accessories/watches' },
      { id: 'acc-bags', name: 'Bags & Wallets', slug: 'fashion-accessories/bags' },
      { id: 'acc-sunglasses', name: 'Sunglasses', slug: 'fashion-accessories/sunglasses' },
      { id: 'acc-belts', name: 'Belts & Scarves', slug: 'fashion-accessories/belts' },
      { id: 'acc-hats', name: 'Hats & Gloves', slug: 'fashion-accessories/hats' },
    ],
  },
  {
    id: 'phones-electronics',
    name: 'Phones & Electronics',
    slug: 'phones-electronics',
    children: [
      { id: 'elec-phones', name: 'Smartphones', slug: 'phones-electronics/smartphones' },
      { id: 'elec-headphones', name: 'Headphones & Earbuds', slug: 'phones-electronics/headphones' },
      { id: 'elec-chargers', name: 'Chargers & Cables', slug: 'phones-electronics/chargers' },
      { id: 'elec-cases', name: 'Phone Cases & Screen Protectors', slug: 'phones-electronics/cases' },
      { id: 'elec-wearables', name: 'Wearables', slug: 'phones-electronics/wearables' },
      { id: 'elec-computer', name: 'Computer & Accessories', slug: 'phones-electronics/computers' },
    ],
  },
  {
    id: 'home-supplies',
    name: 'Home Supplies',
    slug: 'home-supplies',
    children: [
      { id: 'home-decor', name: 'Home Decor', slug: 'home-supplies/decor' },
      { id: 'home-furniture', name: 'Furniture', slug: 'home-supplies/furniture' },
      { id: 'home-bedding', name: 'Bedding & Linens', slug: 'home-supplies/bedding' },
      { id: 'home-lighting', name: 'Lighting', slug: 'home-supplies/lighting' },
      { id: 'home-storage', name: 'Storage & Organization', slug: 'home-supplies/storage' },
      { id: 'home-cleaning', name: 'Cleaning Supplies', slug: 'home-supplies/cleaning' },
    ],
  },
  {
    id: 'kitchenware',
    name: 'Kitchenware',
    slug: 'kitchenware',
    children: [
      { id: 'kitchen-cookware', name: 'Cookware', slug: 'kitchenware/cookware' },
      { id: 'kitchen-utensils', name: 'Utensils & Gadgets', slug: 'kitchenware/utensils' },
      { id: 'kitchen-dining', name: 'Dining & Serving', slug: 'kitchenware/dining' },
      { id: 'kitchen-appliances', name: 'Small Appliances', slug: 'kitchenware/appliances' },
      { id: 'kitchen-drinkware', name: 'Drinkware', slug: 'kitchenware/drinkware' },
    ],
  },
  {
    id: 'shoes',
    name: 'Shoes',
    slug: 'shoes',
    children: [
      { id: 'shoes-women', name: "Women's Shoes", slug: 'shoes/women' },
      { id: 'shoes-men', name: "Men's Shoes", slug: 'shoes/men' },
      { id: 'shoes-sneakers', name: 'Sneakers', slug: 'shoes/sneakers' },
      { id: 'shoes-sandals', name: 'Sandals & Flip-flops', slug: 'shoes/sandals' },
      { id: 'shoes-boots', name: 'Boots', slug: 'shoes/boots' },
      { id: 'shoes-accessories', name: 'Shoe Care & Accessories', slug: 'shoes/accessories' },
    ],
  },
  {
    id: 'sports-outdoor',
    name: 'Sports & Outdoors',
    slug: 'sports-outdoor',
    children: [
      { id: 'sport-fitness', name: 'Fitness & Gym', slug: 'sports-outdoor/fitness' },
      { id: 'sport-camping', name: 'Camping & Hiking', slug: 'sports-outdoor/camping' },
      { id: 'sport-cycling', name: 'Cycling', slug: 'sports-outdoor/cycling' },
      { id: 'sport-water', name: 'Water Sports', slug: 'sports-outdoor/water-sports' },
      { id: 'sport-ball', name: 'Ball Sports', slug: 'sports-outdoor/ball-sports' },
      { id: 'sport-outdoor-games', name: 'Outdoor Games', slug: 'sports-outdoor/games' },
    ],
  },
  {
    id: 'baby-maternity',
    name: 'Baby & Maternity',
    slug: 'baby-maternity',
    children: [
      { id: 'baby-clothing', name: 'Baby Clothing', slug: 'baby-maternity/clothing' },
      { id: 'baby-toys', name: 'Baby Toys & Activities', slug: 'baby-maternity/toys' },
      { id: 'baby-feeding', name: 'Feeding & Nursing', slug: 'baby-maternity/feeding' },
      { id: 'baby-diapers', name: 'Diapers & Potty', slug: 'baby-maternity/diapers' },
      { id: 'baby-nursery', name: 'Nursery & Furniture', slug: 'baby-maternity/nursery' },
      { id: 'baby-maternity-wear', name: 'Maternity Wear', slug: 'baby-maternity/maternity-wear' },
    ],
  },
  {
    id: 'pets',
    name: 'Pets',
    slug: 'pets',
    children: [
      { id: 'pets-dogs', name: 'Dog Supplies', slug: 'pets/dogs' },
      { id: 'pets-cats', name: 'Cat Supplies', slug: 'pets/cats' },
      { id: 'pets-food', name: 'Pet Food & Treats', slug: 'pets/food' },
      { id: 'pets-toys', name: 'Pet Toys', slug: 'pets/toys' },
      { id: 'pets-grooming', name: 'Grooming & Health', slug: 'pets/grooming' },
    ],
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    slug: 'food-beverage',
    children: [
      { id: 'food-snacks', name: 'Snacks & Sweets', slug: 'food-beverage/snacks' },
      { id: 'food-drinks', name: 'Drinks & Beverages', slug: 'food-beverage/drinks' },
      { id: 'food-coffee', name: 'Coffee & Tea', slug: 'food-beverage/coffee-tea' },
      { id: 'food-health-supps', name: 'Health Supplements', slug: 'food-beverage/supplements' },
      { id: 'food-sauces', name: 'Sauces & Condiments', slug: 'food-beverage/sauces' },
    ],
  },
  {
    id: 'office-school',
    name: 'Office & School',
    slug: 'office-school',
    children: [
      { id: 'office-stationery', name: 'Stationery', slug: 'office-school/stationery' },
      { id: 'office-supplies', name: 'Office Supplies', slug: 'office-school/supplies' },
      { id: 'office-art', name: 'Art & Craft Supplies', slug: 'office-school/art-craft' },
      { id: 'office-tech', name: 'Office Electronics', slug: 'office-school/electronics' },
    ],
  },
  {
    id: 'automotive',
    name: 'Automotive',
    slug: 'automotive',
    children: [
      { id: 'auto-interior', name: 'Interior Accessories', slug: 'automotive/interior' },
      { id: 'auto-exterior', name: 'Exterior Accessories', slug: 'automotive/exterior' },
      { id: 'auto-tools', name: 'Tools & Equipment', slug: 'automotive/tools' },
      { id: 'auto-electronics', name: 'Car Electronics', slug: 'automotive/electronics' },
      { id: 'auto-motorcycle', name: 'Motorcycle Accessories', slug: 'automotive/motorcycle' },
    ],
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    children: [
      { id: 'health-supplements', name: 'Vitamins & Supplements', slug: 'health-wellness/supplements' },
      { id: 'health-personal-care', name: 'Personal Care', slug: 'health-wellness/personal-care' },
      { id: 'health-medical', name: 'Medical Supplies', slug: 'health-wellness/medical' },
      { id: 'health-massage', name: 'Massage & Relaxation', slug: 'health-wellness/massage' },
      { id: 'health-oral', name: 'Oral Care', slug: 'health-wellness/oral-care' },
    ],
  },
]

export function getSeedCategories(): TiktokCategory[] {
  return SEED_CATEGORIES
}

export function getFlatCategories(): { id: string; name: string; slug: string; parentId?: string }[] {
  const flat: { id: string; name: string; slug: string; parentId?: string }[] = []
  for (const cat of SEED_CATEGORIES) {
    flat.push({ id: cat.id, name: cat.name, slug: cat.slug })
    for (const sub of cat.children || []) {
      flat.push({ id: sub.id, name: sub.name, slug: sub.slug, parentId: cat.id })
    }
  }
  return flat
}

export function findCategoryBySlug(slug: string): TiktokCategory | undefined {
  for (const cat of SEED_CATEGORIES) {
    if (cat.slug === slug) return cat
    const child = cat.children?.find(c => c.slug === slug)
    if (child) return child
  }
  return undefined
}

export function findCategoryById(id: string): TiktokCategory | undefined {
  for (const cat of SEED_CATEGORIES) {
    if (cat.id === id) return cat
    const child = cat.children?.find(c => c.id === id)
    if (child) return child
  }
  return undefined
}

export async function discoverCategoriesFromProxy(): Promise<TiktokCategory[] | null> {
  const proxyUrl = 'https://api.allorigins.win/raw?url='
  const targetUrl = 'https://shop.tiktok.com/br/c'

  try {
    const res = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const html = await res.text()

    const found = parseCategoriesFromHtml(html)
    if (found.length > 0) return found
    return null
  } catch {
    return null
  }
}

function parseCategoriesFromHtml(html: string): TiktokCategory[] {
  const categories: TiktokCategory[] = []

  const initState = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/)
  if (initState) {
    try {
      const state = JSON.parse(initState[1])
      const list = state?.categoryList || state?.categories || state?.data?.categories || []
      if (Array.isArray(list) && list.length > 0) {
        for (const item of list) {
          categories.push({
            id: item.id || item.categoryId || String(Math.random()).slice(2),
            name: item.name || item.localName || item.categoryName || '',
            slug: item.slug || '',
            image: item.image || item.icon || item.categoryPic || '',
            children: (item.children || item.subCategories || []).map((c: Record<string, unknown>) => ({
              id: (c.id || c.categoryId || String(Math.random()).slice(2)) as string,
              name: (c.name || c.localName || c.categoryName || '') as string,
              slug: (c.slug || '') as string,
              image: (c.image || c.icon || c.categoryPic || '') as string,
            })),
          })
        }
      }
    } catch { /* ignore */ }
  }

  if (categories.length > 0) return categories

  const jsonLd = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  if (jsonLd) {
    for (const block of jsonLd) {
      try {
        const json = JSON.parse(block.replace(/<[^>]+>/g, ''))
        const items = json?.itemListElement || json?.categories || (Array.isArray(json) ? json : null)
        if (items && Array.isArray(items)) {
          for (const item of items) {
            if (item?.name) {
              categories.push({
                id: item.id || item.sku || String(Math.random()).slice(2),
                name: item.name,
                slug: item.url?.replace(/https?:\/\/[^/]+\/[a-z]{2}\/c\//, '') || item.slug || '',
              })
            }
          }
        }
      } catch { /* ignore */ }
    }
  }

  return categories
}

export async function discoverFromSearchResults(): Promise<{ id: string; name: string }[]> {
  const seen = new Set<string>()
  const categories: { id: string; name: string }[] = []

  const searchTerms = ['a', 'e', 'i', 'o', 'u', 'b', 'c', 'd']
  for (const term of searchTerms) {
    try {
      const res = await fetch(
        `https://shop.tiktok.com/api/product/search?keyword=${encodeURIComponent(term)}&page=1&page_size=6`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Origin': 'https://shop.tiktok.com',
            'Referer': 'https://shop.tiktok.com/',
          },
          signal: AbortSignal.timeout(5000),
        }
      )
      if (!res.ok) continue
      const text = await res.text()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any
      try { data = JSON.parse(text) } catch { continue }

      const filters = data?.data?.filter?.categories || data?.data?.filters?.categories || data?.filters || []
      for (const f of filters) {
        const id = f.id || f.categoryId || f.value || ''
        const name = f.name || f.label || f.displayName || ''
        if (id && name && !seen.has(id)) {
          seen.add(id)
          categories.push({ id, name })
        }
        for (const c of f.children || f.options || []) {
          const cid = c.id || c.categoryId || c.value || ''
          const cname = c.name || c.label || c.displayName || ''
          if (cid && cname && !seen.has(cid)) {
            seen.add(cid)
            categories.push({ id: cid, name: cname })
          }
        }
      }
    } catch { continue }
  }

  return categories
}
