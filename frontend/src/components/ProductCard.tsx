import { formatPrice, type Product } from '../data/catalog'
import { useCart } from '../store/CartContext'
import { useNavigate } from 'react-router-dom'
import { CartIcon, StarIcon } from './icons'
import { optimizeMediaUrl } from '../lib/api'

const badgeStyles: Record<string, string> = {
  Promo: 'bg-sand-400 text-brand-900',
  'Best-seller': 'bg-brand-600 text-white',
  Nouveau: 'bg-emerald-500 text-white',
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const navigate = useNavigate()

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
  }

  const handleCardClick = () => {
    navigate(`/produit/${product.id}`)
  }

  return (
    <article
      onClick={handleCardClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden bg-sand-50">
        <img
          src={optimizeMediaUrl(product.image, { w: 500 })}
          alt={product.name}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {product.badges && product.badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.badges.map((b) => (
              <span
                key={b}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  badgeStyles[b] ?? 'bg-slate-700 text-white'
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
          {product.brand}
        </p>
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-slate-800">
          {product.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {product.shortDescription}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          <StarIcon className="size-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-700">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">({product.reviews})</span>
          <span className="ml-auto text-xs text-slate-400">{product.volume}</span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="flex flex-col">
            {product.oldPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.oldPrice)} DT
              </span>
            )}
            <span className="font-display text-lg font-bold text-brand-800">
              {formatPrice(product.price)}{' '}
              <span className="text-sm font-semibold">DT</span>
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-soft transition hover:bg-brand-800 active:scale-95"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <CartIcon className="size-5" />
          </button>
        </div>
      </div>
    </article>
  )
}
