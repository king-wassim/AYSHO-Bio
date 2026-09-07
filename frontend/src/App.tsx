import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, useParams } from 'react-router-dom'
import { CartProvider } from './store/CartContext'
import { CatalogProvider, useCatalog } from './store/CatalogContext'
import { type CategoryId } from './data/catalog'
import Header from './components/Header'
import Hero from './components/Hero'
import CategoryShowcase from './components/CategoryShowcase'
import ProductGrid from './components/ProductGrid'
import CartDrawer from './components/CartDrawer'
import Checkout from './components/Checkout'
import Footer from './components/Footer'
import ProductPage from './pages/ProductPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { getCategoryById } = useCatalog()
  const cat = categoryId ? getCategoryById(categoryId) : undefined

  return (
    <ProductGrid
      categoryFilter={categoryId as CategoryId}
      title={cat?.name ?? 'Rayon'}
      subtitle={cat?.description}
    />
  )
}

function AllProductsPage() {
  return (
    <ProductGrid
      title="Tous les produits"
      subtitle="Parcourez l'ensemble du catalogue Aysho"
    />
  )
}

function HomePage() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const scrollToProducts = () => {
    document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={
              <>
                <Hero onShopNow={scrollToProducts} />
                <div id="catalogue">
                  <CategoryShowcase />
                  <ProductGrid title="Produits en vedette" />
                </div>
              </>
            } />
            <Route path="/produits" element={<AllProductsPage />} />
            <Route path="/categorie/:categoryId" element={<CategoryPage />} />
            <Route path="/produit/:id" element={<ProductPage />} />
          </Routes>
        </main>

        <Footer />
        <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
        {checkoutOpen && <Checkout onClose={() => setCheckoutOpen(false)} />}
      </div>
    </CartProvider>
  )
}

function AppContent() {
  const { loading, error } = useCatalog()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50">
        <div className="size-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700"></div>
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

  return <HomePage />
}

export default function App() {
  return (
    <CatalogProvider>
      <AppContent />
    </CatalogProvider>
  )
}