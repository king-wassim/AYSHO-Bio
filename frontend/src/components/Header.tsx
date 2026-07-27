import { useState } from 'react'
import { useCart } from '../store/CartContext'
import {
  CartIcon,
  MenuIcon,
  CloseIcon,
  PhoneIcon,
  TruckIcon,
} from './icons'
import SearchBar from './SearchBar'

interface HeaderProps {
  onNavigate: (target: 'home' | { type: 'category'; id: string } | 'all-products') => void
  current: string
}

export default function Header({ onNavigate, current }: HeaderProps) {
  const { totalItems, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  const goHome = () => {
    onNavigate('home')
    setMobileOpen(false)
  }

  const navAll = () => {
    onNavigate('all-products')
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-brand-800 text-brand-50 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span className="flex items-center gap-1.5">
            <TruckIcon className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Livraison à domicile gratuite partout en Tunisie</span>
            <span className="sm:hidden">Livraison gratuite en Tunisie</span>
          </span>
          <span className="flex flex-shrink-0 items-center gap-1.5">
            <PhoneIcon className="h-4 w-4" />
            +216 92 901 310
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-sand-200 bg-white/95 shadow-sm backdrop-blur">
        {/* Logo + nav + search + panier */}
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">

          {/* Gauche : Logo + "Tous les produits" desktop */}
          <div className="flex flex-shrink-0 items-center gap-5">
            <button onClick={goHome} className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-soft">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5a3 3 0 0 1 3 3v3h3a3 3 0 0 1 0 6h-3v3a3 3 0 0 1-6 0v-3H6a3 3 0 0 1 0-6h3V8a3 3 0 0 1 3-3z" />
                </svg>
              </div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-brand-800">
                AYSHO Bio
              </span>
            </button>

            {/* Nav desktop uniquement */}
            <nav className="hidden lg:flex">
              <button
                onClick={navAll}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  current === 'all'
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-600 hover:bg-sand-50 hover:text-brand-800'
                }`}
              >
                Tous les produits
              </button>
            </nav>
          </div>

          {/* Centre : SearchBar desktop */}
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <SearchBar />
          </div>

          {/* Droite : panier + burger */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={openCart}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white shadow-soft transition hover:bg-brand-800"
              aria-label="Panier"
            >
              <CartIcon className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sand-400 px-1 text-xs font-bold text-brand-900">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-sand-200 text-slate-700 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* SearchBar mobile — toujours visible sous la barre principale */}
        <div className="border-t border-sand-100 px-4 py-2.5 lg:hidden">
          <SearchBar fullWidth />
        </div>

        {/* Menu burger déroulant mobile */}
        {mobileOpen && (
          <div className="border-t border-sand-200 bg-white lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2">
              <button
                onClick={navAll}
                className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-sand-50"
              >
                Tous les produits
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
