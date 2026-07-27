import { useCatalog } from '../store/CatalogContext'
import { ChevronRightIcon } from './icons'

interface CategoryShowcaseProps {
  onSelect: (id: string) => void
}

export default function CategoryShowcase({ onSelect }: CategoryShowcaseProps) {
  const { categories } = useCatalog()

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-brand-900">
            Nos produits
          </h2>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`group relative overflow-hidden rounded-2xl text-left shadow-soft ring-1 ring-sand-200 transition hover:shadow-card ${
              i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''
            }`}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={cat.image}
                alt={cat.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-100">
                {cat.tagline}
              </p>
              <h3 className="mt-1 font-display text-xl font-bold">{cat.name}</h3>
              <p className="mt-1 hidden text-sm text-brand-50/90 sm:block">
                {cat.description}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">
                Explorer
                <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
