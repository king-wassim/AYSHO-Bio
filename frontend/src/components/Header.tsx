import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../store/CartContext'
import {
  CartIcon,
  MenuIcon,
  CloseIcon,
  PhoneIcon,
  TruckIcon,
} from './icons'
import SearchBar from './SearchBar'

export default function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { totalItems, openCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)

  const current = pathname === '/' ? 'home' : pathname === '/produits' ? 'all' : 'category'

  const goHome = () => {
    navigate('/')
    setMobileOpen(false)
  }

  const navAll = () => {
    navigate('/produits')
    setMobileOpen(false)
  }
{/*base < lg < xl */} 
return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-brand-800 text-xl font-semibold text-brand-50 sm:text-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:py-4">
          <span className="flex items-center gap-3">
            <TruckIcon className="size-6 shrink-0 sm:size-7" />
            <span className="hidden sm:inline">Livraison à domicile <span className="font-bold">gratuite</span> partout en Tunisie</span>
            <span className="sm:hidden">Livraison <span className="font-bold">gratuite</span> en Tunisie</span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <PhoneIcon className="size-6 sm:size-7" />
            +216 92 901 310
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-sand-200 bg-white/95 shadow-sm backdrop-blur">
        {/* Logo + nav + search + panier */}
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">

          {/* Gauche : Logo + "Tous les produits" desktop */}
          <div className="flex shrink-0 items-center gap-5">
            <button onClick={goHome} className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-sand-200 shadow-soft">
                <img
                  src="/LOGO.jpg"
                  alt="Logo Aysho"
                  className="size-full object-cover"
                />
              </span>
              <span className="font-display text-3xl font-extrabold tracking-tight text-brand-800 sm:text-4xl">
                Aysho
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
              className="relative flex size-11 items-center justify-center rounded-xl bg-brand-700 text-white shadow-soft transition hover:bg-brand-800"
              aria-label="Panier"
            >
              <CartIcon className="size-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sand-400 px-1 text-xs font-bold text-brand-900">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex size-11 items-center justify-center rounded-xl border border-sand-200 text-slate-700 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
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
                className="rounded-lg p-3 text-left text-sm font-semibold text-slate-700 hover:bg-sand-50"
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
