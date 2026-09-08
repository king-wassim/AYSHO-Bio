import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Category, CategoryId, Product } from '../data/catalog';
import { resolveMediaUrl, joinApi } from '../lib/api';

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
  image?: StrapiMedia | string;
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
  image?: StrapiMedia | string;
}

interface StrapiProductAttrs {
  name?: string;
  brand?: string;
  price?: number;
  oldPrice?: number;
  shortDescription?: string;
  description?: string;
  volume?: string;
  badges?: string[];
  rating?: number;
  reviews?: number;
  category?: {
    slug?: string;
    data?:
      | { slug?: string; attributes?: { slug?: string } }
      | Array<{ slug?: string; attributes?: { slug?: string } }>;
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
  description?: string;
  volume?: string;
  badges?: string[];
  rating?: number;
  reviews?: number;
  category?: {
    slug?: string;
    data?:
      | { slug?: string; attributes?: { slug?: string } }
      | Array<{ slug?: string; attributes?: { slug?: string } }>;
  };
  images?: StrapiMedia | StrapiMedia[];
  image?: StrapiMedia;
}

interface StrapiListResponse<T> {
  data: T[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMediaUrl(media: StrapiMedia | StrapiMedia[] | string | undefined): string {
  if (!media) return '';
  if (typeof media === 'string') return resolveMediaUrl(media);

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

  return resolveMediaUrl(url || undefined);
}

function getMediaUrls(media: StrapiMedia | StrapiMedia[] | string | undefined): string[] {
  if (!media) return [];
  if (typeof media === 'string') return [resolveMediaUrl(media)];

  const urls: string[] = [];

  const extractUrl = (m: StrapiMedia): string | undefined => {
    if (m.url) return m.url;
    if (m.attributes?.url) return m.attributes.url;
    if (m.data) {
      if (Array.isArray(m.data)) {
        return m.data[0]?.url ?? m.data[0]?.attributes?.url;
      }
      return m.data.url ?? m.data.attributes?.url;
    }
    return undefined;
  };

  if (Array.isArray(media)) {
    for (const m of media) {
      const url = extractUrl(m);
      if (url) urls.push(resolveMediaUrl(url));
    }
  } else {
    const url = extractUrl(media);
    if (url) urls.push(resolveMediaUrl(url));
  }

  return urls;
}

function getCategorySlug(category: StrapiProductAttrs['category']): string {
  if (!category) return '';

  const relatedCategory = Array.isArray(category.data) ? category.data[0] : category.data;
  return (
    category.slug ??
    relatedCategory?.slug ??
    relatedCategory?.attributes?.slug ??
    ''
  );
}

// ── Context ──────────────────────────────────────────────────────────────────

interface CatalogContextType {
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  getCategoryById: (id: string) => Category | undefined;
  getProductById: (id: string) => Product | undefined;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let abortController = new AbortController();

    // FIX P0 #1 — fetchData ne remet plus setLoading(true) lors des refreshes de fond.
    // setLoading(true) n'est appelé qu'à l'initialisation (quand categories est encore vide).
    // Les polls de 30s et les refreshes sur focus mettent à jour les données en silence,
    // sans déclencher le spinner ni démonter l'arborescence (CartProvider, Checkout, etc.).
    const fetchData = async (isInitialLoad: boolean) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }

        const [catsRes, prodsRes] = await Promise.all([
          fetch(joinApi('categories?populate=*'), { signal: abortController.signal }),
          fetch(joinApi('products?populate=*'), { signal: abortController.signal }),
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
          const catSlug = getCategorySlug(attrs.category);
          const gallery = getMediaUrls(attrs.images ?? attrs.image);
          return {
            id: item.documentId ?? String(item.id ?? ''),
            name: attrs.name ?? '',
            brand: attrs.brand ?? 'AYSHO',
            categoryId: catSlug as CategoryId,
            price: attrs.price ?? 0,
            oldPrice: attrs.oldPrice,
            image: gallery[0] ?? '',
            gallery,
            shortDescription: attrs.shortDescription ?? '',
            description: attrs.description ?? '',
            volume: attrs.volume ?? '',
            badges: attrs.badges ?? [],
            rating: attrs.rating ?? 5.0,
            reviews: attrs.reviews ?? 0,
          };
        });

        setCategories(mappedCategories);
        setProducts(mappedProducts);
        // Effacer l'erreur si le refresh de fond réussit
        setError(null);
      } catch (err: unknown) {
        // Ignorer les erreurs d'annulation (abort sur unmount / navigation)
        if (err instanceof DOMException && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        // N'écraser l'erreur que si c'est le chargement initial (pas en background)
        if (isInitialLoad) {
          setError(message);
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    void fetchData(true);

    // FIX P0 #1 — Les rafraîchissements de fond (poll + focus) ne passent pas isInitialLoad=true
    // → pas de setLoading(true) → pas de démontage du panier/checkout
    const refreshOnFocus = () => {
      // Annuler la requête précédente en vol si elle n'est pas encore terminée
      abortController.abort();
      abortController = new AbortController();
      void fetchData(false);
    };
    const refreshTimer = window.setInterval(() => {
      abortController.abort();
      abortController = new AbortController();
      void fetchData(false);
    }, 30_000);
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      abortController.abort();
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, []);

  const getCategoryById = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  return (
    <CatalogContext.Provider value={{ categories, products, loading, error, getCategoryById, getProductById }}>
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
