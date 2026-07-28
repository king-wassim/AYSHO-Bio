import { useState, useEffect, useRef } from 'react'
import { useCatalog } from '../store/CatalogContext'
import { useCart } from '../store/CartContext'
import { SearchIcon, CartIcon } from './icons'
import { formatPrice, type Product } from '../data/catalog'

interface SearchBarProps {
  fullWidth?: boolean
}

export default function SearchBar({ fullWidth = false }: SearchBarProps) {
  const { products } = useCatalog()
  const { addItem } = useCart()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim() === '') {
      setResults([])
      setIsOpen(false)
      return
    }

    const lowerQuery = query.toLowerCase()
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.shortDescription.toLowerCase().includes(lowerQuery)
    )

    setResults(matches)
    setIsOpen(true)
  }, [query, products])

  // Fermer si clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = (product: Product) => {
    addItem(product)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative ${fullWidth ? 'w-full' : 'w-full max-w-sm lg:w-96'}`}
    >
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="size-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() !== '') setIsOpen(true) }}
          placeholder="Rechercher un produit, marque..."
          className="w-full rounded-xl border border-sand-200 bg-sand-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false) }}
            className="absolute right-3 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-sand-200 bg-white shadow-card">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </div>
          ) : (
            <ul className="divide-y divide-sand-100">
              {results.slice(0, 6).map((product) => (
                <li key={product.id} className="flex items-center gap-3 p-3 transition hover:bg-sand-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-12 shrink-0 rounded-lg bg-sand-100 object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-[10px] font-medium uppercase tracking-wide text-sand-500">
                      {product.brand}
                    </p>
                    <h4 className="truncate text-sm font-semibold text-slate-800">
                      {product.name}
                    </h4>
                    <p className="text-sm font-bold text-brand-800">
                      {formatPrice(product.price)} DT
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(product)}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 transition hover:bg-brand-700 hover:text-white"
                    aria-label={`Ajouter ${product.name}`}
                  >
                    <CartIcon className="size-4" />
                  </button>
                </li>
              ))}
              {results.length > 6 && (
                <li className="bg-sand-50 p-2 text-center text-xs font-medium text-slate-500">
                  Et {results.length - 6} autre{results.length - 6 > 1 ? 's' : ''} produit{results.length - 6 > 1 ? 's' : ''}…
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
