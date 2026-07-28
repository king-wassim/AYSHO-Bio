import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Category, CategoryId, Product } from '../data/catalog';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

// ── Strapi v5 response shapes ────────────────────────────────────────────────

interface StrapiMedia {
  url?: string;
  attributes?: { url?: string };
  data?:
    | { url?: string; attributes?: { url?: string } }
    | Array<{ url?: string; attributes?: { url?: string } }>;
}

interface StrapiCategoryAttrs {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  images?: StrapiMedia | StrapiMedia[];
  image?: StrapiMedia;
}

interface StrapiCategoryItem {
  documentId?: string;
  id?: number;
  attributes?: StrapiCategoryAttrs;
  // Strapi v5 flat shape — attrs merged at top level
  slug?: string;
  name?: string;
  tagline?: string;
  description?: string;
  images?: StrapiMedia | StrapiMedia[];
  image?: StrapiMedia;
}

interface StrapiProductAttrs {
  name?: string;
  brand?: string;
  price?: number;
  oldPrice?: number;
  shortDescription?: string;
  volume?: string;
  badges?: string[];
  rating?: number;
  reviews?: number;
  category?: {
    slug?: string;
    data?: { attributes?: { slug?: string } };
  };
  images?: StrapiMedia | StrapiMedia[];
  image?: StrapiMedia;
}

interface StrapiProductItem {
  documentId?: string;
  id?: number;
  attributes?: StrapiProductAttrs;
  // Strapi v5 flat shape
  name?: string;
  brand?: string;
  price?: number;
  oldPrice?: number;
  shortDescription?: string;
  volume?: string;
  badges?: string[];
  rating?: number;
  reviews?: number;
  category?: {
    slug?: string;
    data?: { attributes?: { slug?: string } };
  };
  images?: StrapiMedia | StrapiMedia[];
  image?: StrapiMedia;
}

interface StrapiListResponse<T> {
  data: T[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMediaUrl(media: StrapiMedia | StrapiMedia[] | undefined): string {
  if (!media) return '';

  let url = '';

  if (Array.isArray(media)) {
    url = media[0]?.url ?? '';
  } else if (media.data) {
    if (Array.isArray(media.data)) {
      url = media.data[0]?.url ?? media.data[0]?.attributes?.url ?? '';
    } else {
      url = media.data.url ?? media.data.attributes?.url ?? '';
    }
  } else if (media.url) {
    url = media.url;
  } else if (media.attributes?.url) {
    url = media.attributes.url;
  }

  return url ? `${STRAPI_URL}${url}` : '';
}

// ── Context ──────────────────────────────────────────────────────────────────

interface CatalogContextType {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  getCategoryById: (id: string) => Category | undefined;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes, prodsRes] = await Promise.all([
          fetch(`${STRAPI_URL}/api/categories?populate=*`),
          fetch(`${STRAPI_URL}/api/products?populate=*`),
        ]);

        if (!catsRes.ok || !prodsRes.ok) {
          throw new Error('Erreur lors de la récupération des données depuis Strapi');
        }

        const catsData = (await catsRes.json()) as StrapiListResponse<StrapiCategoryItem>;
        const prodsData = (await prodsRes.json()) as StrapiListResponse<StrapiProductItem>;

        const mappedCategories: Category[] = catsData.data.map((item) => {
          const attrs = item.attributes ?? item;
          return {
            id: (attrs.slug ?? '') as CategoryId,
            name: attrs.name ?? '',
            tagline: attrs.tagline ?? '',
            description: attrs.description ?? '',
            image: getMediaUrl(attrs.images ?? attrs.image),
          };
        });

        const mappedProducts: Product[] = prodsData.data.map((item) => {
          const attrs = item.attributes ?? item;
          const catSlug =
            attrs.category?.slug ?? attrs.category?.data?.attributes?.slug ?? '';
          return {
            id: item.documentId ?? String(item.id ?? ''),
            name: attrs.name ?? '',
            brand: attrs.brand ?? 'AYSHO',
            categoryId: catSlug as CategoryId,
            price: attrs.price ?? 0,
            oldPrice: attrs.oldPrice,
            image: getMediaUrl(attrs.images ?? attrs.image),
            shortDescription: attrs.shortDescription ?? '',
            volume: attrs.volume ?? '',
            badges: attrs.badges ?? [],
            rating: attrs.rating ?? 5.0,
            reviews: attrs.reviews ?? 0,
          };
        });

        setCategories(mappedCategories);
        setProducts(mappedProducts);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
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
