import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Category, Product } from '../data/catalog';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

interface CatalogContextType {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  getCategoryById: (id: string) => Category | undefined;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

function getMediaUrl(media: any): string {
  if (!media) return '';

  // Strapi v5 with populate=* returns:
  // - Single image: { data: { id, url, ... } } or { url, ... }
  // - Multiple images: { data: [{ id, url, ... }, ...] }
  // - In your case: images is array of objects with direct `url` property

  let url = '';

  if (Array.isArray(media)) {
    // images: array of media objects
    url = media[0]?.url || '';
  } else if (media.data) {
    if (Array.isArray(media.data)) {
      url = media.data[0]?.url || media.data[0]?.attributes?.url || '';
    } else {
      url = media.data.url || media.data.attributes?.url || '';
    }
  } else if (media.url) {
    // Direct url property
    url = media.url;
  } else if (media.attributes?.url) {
    // Nested in attributes
    url = media.attributes.url;
  }

  return url ? `${STRAPI_URL}${url}` : '';
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          fetch(`${STRAPI_URL}/api/categories?populate=*`),
          fetch(`${STRAPI_URL}/api/products?populate=*`)
        ]);

        if (!catsRes.ok || !prodsRes.ok) {
          throw new Error('Erreur lors de la récupération des données depuis Strapi');
        }

        const catsData = await catsRes.json();
        const prodsData = await prodsRes.json();

        const mappedCategories: Category[] = catsData.data.map((item: any) => {
          const attrs = item.attributes || item;
          return {
            id: attrs.slug,
            name: attrs.name,
            tagline: attrs.tagline || '',
            description: attrs.description || '',
            image: getMediaUrl(attrs.images || attrs.image)
          };
        });

        const mappedProducts: Product[] = prodsData.data.map((item: any) => {
          const attrs = item.attributes || item;
          const catSlug = attrs.category?.slug || attrs.category?.data?.attributes?.slug || '';
          return {
            id: item.documentId || item.id,
            name: attrs.name,
            brand: attrs.brand || 'AYSHO',
            categoryId: catSlug,
            price: attrs.price,
            oldPrice: attrs.oldPrice,
            image: getMediaUrl(attrs.images || attrs.image),
            shortDescription: attrs.shortDescription || '',
            volume: attrs.volume || '',
            badges: attrs.badges || [],
            rating: attrs.rating || 5.0,
            reviews: attrs.reviews || 0
          };
        });

        setCategories(mappedCategories);
        setProducts(mappedProducts);

        // Debug: log category IDs and product categoryIds
        console.log('🏷️ Categories:', mappedCategories.map(c => c.id));
        console.log('📦 Products:', mappedProducts.map(p => ({ name: p.name, categoryId: p.categoryId })));
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  return (
    <CatalogContext.Provider value={{ categories, products, loading, error, getCategoryById }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
