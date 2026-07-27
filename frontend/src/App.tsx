import { useState, useEffect } from 'react'
import { CartProvider } from './store/CartContext'
import { type CategoryId } from './data/catalog'
import { useCatalog } from './store/CatalogContext'
import Header from './components/Header'
import Hero from './components/Hero'
import CategoryShowcase from './components/CategoryShowcase'
import ProductGrid from './components/ProductGrid'
import CartDrawer from './components/CartDrawer'
import Checkout from './components/Checkout'
import ProductDetailModal from './components/ProductDetailModal'
import Footer from './components/Footer'

type View =
  | { name: 'home' }
  | { name: 'category'; id: CategoryId }
  | { name: 'all' }

export default function App() {
  const { getCategoryById, loading, error } = useCatalog()
  const [view, setView] = useState<View>({ name: 'home' })
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<import('./data/catalog').Product | null>(null)

  const navigate = (target: 'home' | { type: 'category'; id: string } | 'all-products') => {
    if (target === 'home') {
      setView({ name: 'home' })
    } else if (target === 'all-products') {
      setView({ name: 'all' })
    } else {
      setView({ name: 'category', id: target.id as CategoryId })
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  const currentHeader =
    view.name === 'category' ? view.id : view.name === 'all' ? 'all' : 'home'

  const scrollToProducts = () => {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCategorySelect = (id: string) => {
    navigate({ type: 'category', id })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <p className="text-red-500">Erreur : {error}</p>
      </div>
    )
  }

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header onNavigate={navigate} current={currentHeader} />

        <main className="flex-1">
          {view.name === 'home' && (
            <>
              <Hero onShopNow={scrollToProducts} />
              <div id="catalogue">
                <CategoryShowcase onSelect={handleCategorySelect} />
                <ProductGrid
                  title="Produits en vedette"
                />
              </div>
            </>
          )}

          {view.name === 'all' && (
            <ProductGrid
              title="Tous les produits"
              subtitle="Parcourez l'ensemble du catalogue AYSHO Bio"
            />
          )}

          {view.name === 'category' && (() => {
            const cat = getCategoryById(view.id)
            return (
              <ProductGrid
                key={view.id}
                categoryFilter={view.id}
                title={cat?.name ?? 'Rayon'}
                subtitle={cat?.description}
              />
            )
          })()}
        </main>

        <Footer />
        <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
        {checkoutOpen && <Checkout onClose={() => setCheckoutOpen(false)} />}
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </div>
    </CartProvider>
  )
}
