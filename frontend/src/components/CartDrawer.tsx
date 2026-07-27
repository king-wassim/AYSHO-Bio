import { formatPrice } from '../data/catalog'
import { useCart } from '../store/CartContext'
import {
  CartIcon,
  CloseIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  BanknoteIcon,
  TruckIcon,
} from './icons'

interface CartDrawerProps {
  onCheckout: () => void
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    totalPrice,
    totalItems,
  } = useCart()

  const shipping = 0
  const grandTotal = totalPrice + shipping

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-brand-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-sand-50 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-sand-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <CartIcon className="h-5 w-5 text-brand-700" />
            <h2 className="font-display text-lg font-bold text-brand-900">
              Mon panier
            </h2>
            {totalItems > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-sand-100"
            aria-label="Fermer"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50">
              <CartIcon className="h-9 w-9 text-brand-300" />
            </div>
            <p className="mt-4 font-display text-lg font-semibold text-slate-700">
              Votre panier est vide
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Parcourez nos rayons et ajoutez vos produits.
            </p>
            <button
              onClick={closeCart}
              className="mt-6 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3 rounded-xl border border-sand-200 bg-white p-3"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-sand-500">
                          {product.brand}
                        </p>
                        <h3 className="text-sm font-semibold leading-tight text-slate-800">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-400">{product.volume}</p>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-slate-400 transition hover:text-red-500"
                        aria-label="Retirer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border border-sand-200">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-sand-50"
                          aria-label="Diminuer"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-sand-50"
                          aria-label="Augmenter"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-display text-sm font-bold text-brand-800">
                        {formatPrice(product.price * quantity)} DT
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-sand-200 bg-white px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span className="font-medium">{formatPrice(totalPrice)} DT</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <TruckIcon className="h-4 w-4" /> Livraison
                  </span>
                  <span className="font-medium text-emerald-600">Gratuite</span>
                </div>
                <div className="flex justify-between border-t border-sand-200 pt-2 font-display text-base font-bold text-brand-900">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)} DT</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
                <BanknoteIcon className="h-4 w-4" />
                Paiement à la livraison (espèces)
              </div>

              <button
                onClick={onCheckout}
                className="mt-3 w-full rounded-xl bg-brand-700 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-800"
              >
                Valider ma commande
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
