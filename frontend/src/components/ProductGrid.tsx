import { useMemo, useState } from 'react'
import { type CategoryId } from '../data/catalog'
import { useCatalog } from '../store/CatalogContext'
import ProductCard from './ProductCard'

interface ProductGridProps {
  categoryFilter?: CategoryId | null
  title?: string
  subtitle?: string
}

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating'

export default function ProductGrid({
  categoryFilter = null,
  title = 'Tous les produits',
  subtitle = 'Découvrez notre sélection ',
}: ProductGridProps) {
  const { products } = useCatalog()
  const [sort, setSort] = useState<SortKey>('price-asc')

  const filtered = useMemo(() => {
    let list = categoryFilter
      ? products.filter((p) => p.categoryId === categoryFilter)
      : products

    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list = [...list].sort((a, b) => b.rating - a.rating)
        break
      default:
        break
    }
    return list
  }, [categoryFilter, products, sort])

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-xs font-medium text-slate-500">
            Trier
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="rating">Mieux notés</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-12 text-center">
          <p className="font-display text-lg font-semibold text-slate-700">
            Aucun produit dans ce rayon pour le moment
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Le catalogue AYSHO est alimenté progressivement. Revenez bientôt !
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
