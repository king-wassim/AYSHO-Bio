import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { formatPrice } from '../data/catalog'
import { useCatalog } from '../store/CatalogContext'
import { useCart } from '../store/CartContext'
import { optimizeMediaUrl } from '../lib/api'
import {
  StarIcon,
  CartIcon,
  MinusIcon,
  PlusIcon,
  TruckIcon,
  ChevronLeftIcon,
} from '../components/icons'
import ReactMarkdown from 'react-markdown'

const badgeStyles: Record<string, string> = {
  Promo: 'bg-sand-400 text-brand-900',
  'Best-seller': 'bg-brand-600 text-white',
  Nouveau: 'bg-emerald-500 text-white',
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getProductById, getCategoryById } = useCatalog()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const product = id ? getProductById(id) : undefined
  const category = product?.categoryId ? getCategoryById(product.categoryId) : undefined

  const discount = product?.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-brand-900">Produit introuvable</p>
          <p className="mt-2 text-slate-500">Ce produit n&apos;existe pas ou a été supprimé.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-800"
          >
            <ChevronLeftIcon className="size-5" />
            Retour
          </button>
        </div>
      </div>
    )
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product, quantity)
  }

  const mainImage = (product.gallery && product.gallery.length > 0
    ? product.gallery[selectedImageIndex] ?? product.image
    : product.image) ?? ''
  const hasGallery = (product.gallery?.length ?? 0) > 1

  return (
    <div className="min-h-screen bg-sand-50">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 sm:mb-6 sm:gap-2 sm:text-sm" aria-label="Fil d'Ariane">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 hover:text-brand-700"
          >
            <ChevronLeftIcon className="size-4" />
            Accueil
          </button>
          {category && (
            <>
              <span>/</span>
              <button
                onClick={() => navigate(`/categorie/${category.id}`)}
                className="hover:text-brand-700"
              >
                {category.name}
              </button>
            </>
          )}
          <span>/</span>
          <span className="max-w-[calc(100vw-6rem)] truncate text-slate-700 sm:max-w-[200px]">{product.name}</span>
        </nav>

        <div className="gap-8 animate-fade-up lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand-50">
              <img
                src={optimizeMediaUrl(mainImage, { w: 1600 })}
                alt={product.name}
                className="size-full object-contain p-4 transition-opacity duration-300"
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

            {hasGallery && (
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {(product.gallery ?? []).map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${
                      idx === selectedImageIndex
                        ? 'border-brand-600 ring-2 ring-brand-200'
                        : 'border-transparent hover:border-brand-300'
                    }`}
                    aria-label={`Voir image ${idx + 1}`}
                    aria-current={idx === selectedImageIndex ? 'true' : 'false'}
                  >
                    <img
                      src={optimizeMediaUrl(img, { w: 180 })}
                      alt={`Vue ${idx + 1} de ${product.name}`}
                      className="size-full object-contain p-1"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-wide text-sand-500">
              {product.brand}
            </p>
            <h1 className="font-display text-2xl font-bold leading-snug text-brand-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <StarIcon className="size-4 text-amber-400" />
              <span className="font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-slate-400">({product.reviews} avis)</span>
              <span className="ml-auto text-sm text-slate-400">{product.volume}</span>
            </div>

            <div className="text-base leading-relaxed text-slate-600">
              {product.description ? (
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-4 ml-5 list-disc space-y-1 last:mb-0" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-4 ml-5 list-decimal space-y-1 last:mb-0" {...props} />,
                    li: ({ node, ...props }) => <li {...props} />,
                    h1: ({ node, ...props }) => <h1 className="mb-4 text-2xl font-bold text-slate-900" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="mb-3 text-xl font-bold text-slate-900" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="mb-2 text-lg font-bold text-slate-900" {...props} />,
                    a: ({ node, ...props }) => <a className="text-brand-600 hover:underline" {...props} />,
                    br: ({ node, ...props }) => <br {...props} />,
                  }}
                >
                  {product.description}
                </ReactMarkdown>
              ) : (
                <p>{product.shortDescription}</p>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              {product.oldPrice && (
                <span className="text-xl text-slate-400 line-through">
                  {formatPrice(product.oldPrice)} DT
                </span>
              )}
              <span className="font-display text-3xl font-bold text-brand-800 sm:text-4xl">
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
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 sm:px-6 sm:py-4 sm:text-base">
              <TruckIcon className="size-6 shrink-0" />
              Livraison gratuite partout en Tunisie
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}