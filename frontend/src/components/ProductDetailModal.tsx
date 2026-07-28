import { formatPrice, type Product } from '../data/catalog'
import { useCart } from '../store/CartContext'
import { useState } from 'react'
import {
  CloseIcon,
  StarIcon,
  CartIcon,
  MinusIcon,
  PlusIcon,
} from './icons'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
}

const badgeStyles: Record<string, string> = {
  Promo: 'bg-sand-400 text-brand-900',
  'Best-seller': 'bg-brand-600 text-white',
  Nouveau: 'bg-emerald-500 text-white',
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product, quantity)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl animate-fade-up overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm hover:bg-sand-100"
          aria-label="Fermer"
        >
          <CloseIcon className="size-5" />
        </button>

        <div className="relative aspect-square bg-sand-50">
          <img
            src={product.image}
            alt={product.name}
            className="size-full object-cover"
          />
          {product.badges && product.badges.length > 0 && (
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {product.badges.map((b) => (
                <span
                  key={b}
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    badgeStyles[b] ?? 'bg-slate-700 text-white'
                  }`}
                >
                  {b}
                </span>
              ))}
            </div>
          )}
          {discount > 0 && (
            <span className="absolute right-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
              -{discount}%
            </span>
          )}
        </div>

        <div className="space-y-4 p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
            {product.brand}
          </p>
          <h2 className="font-display text-2xl font-bold leading-snug text-brand-900">
            {product.name}
          </h2>

          <div className="flex items-center gap-2">
            <StarIcon className="size-4 text-amber-400" />
            <span className="font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
            <span className="text-sm text-slate-400">({product.reviews} avis)</span>
            <span className="ml-auto text-sm text-slate-400">{product.volume}</span>
          </div>

          <p className="text-sm leading-relaxed text-slate-600">{product.shortDescription}</p>

          <div className="flex items-baseline gap-3">
            {product.oldPrice && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(product.oldPrice)} DT
              </span>
            )}
            <span className="font-display text-3xl font-bold text-brand-800">
              {formatPrice(product.price)} DT
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-sand-200">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex size-12 items-center justify-center rounded-l-lg text-slate-600 hover:bg-sand-50"
              aria-label="Diminuer"
            >
              <MinusIcon className="size-5" />
            </button>
            <span className="w-12 text-center text-lg font-semibold text-slate-800">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex size-12 items-center justify-center text-slate-600 hover:bg-sand-50"
              aria-label="Augmenter"
            >
              <PlusIcon className="size-5" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-800"
          >
            <CartIcon className="size-5" />
            Ajouter au panier
          </button>

          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <StarIcon className="size-4" />
            Livraison gratuite à partir de 100 DT
          </div>
        </div>
      </div>
    </div>
  )
}