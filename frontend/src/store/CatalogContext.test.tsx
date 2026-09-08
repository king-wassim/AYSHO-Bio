import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { CatalogProvider, useCatalog } from './CatalogContext'

const CATEGORIES_RESPONSE = {
  data: [
    {
      // Strapi v5 "attributes" shape
      id: 1,
      attributes: {
        slug: 'soins-visage',
        name: 'Soins visage',
        tagline: 'Une peau saine',
        description: 'Dermocosmétique',
        images: {
          data: [
            { attributes: { url: 'soins.jpg' } },
            { attributes: { url: 'soins-2.jpg' } },
          ],
        },
      },
    },
    {
      // Strapi v5 flat shape
      documentId: 'abc123',
      slug: 'corps',
      name: 'Corps',
      image: {
        url: 'https://res.cloudinary.com/demo/image/upload/v1/aysho/corps.jpg',
      },
    },
  ],
}

const PRODUCTS_RESPONSE = {
  data: [
    {
      // v5 flat shape with nested category
      documentId: 'prod123',
      name: 'Huile d argan',
      brand: 'AYSHO',
      price: 39000,
      oldPrice: 45000,
      shortDescription: 'Cheveux et peau',
      description: 'BIO',
      volume: '100ml',
      badges: ['BIO', 'Nouveau'],
      rating: 4.5,
      reviews: 12,
      category: { slug: 'soins-visage' },
      images: [
        { url: 'https://res.cloudinary.com/demo/image/upload/v1/aysho/a.jpg' },
        { url: 'a2.jpg' },
      ],
    },
    {
      id: 2,
      attributes: {
        name: 'Crème réparatrice',
        price: 25000,
        category: { data: { attributes: { slug: 'corps' } } },
        image: { attributes: { url: 'creme.jpg' } },
      },
    },
    {
      id: 3,
      name: 'Magnésium marin',
      category: { data: [{ slug: 'complements-alimentaires' }] },
      image: { url: 'magnesium.jpg' },
    },
  ],
}

function Consumer() {
  const { categories, products, loading, error } = useCatalog()
  return (
    <div>
      <p data-testid="loading">{String(loading)}</p>
      <p data-testid="error">{error ?? 'none'}</p>
      <ul>
        {categories.map((c) => (
          <li key={c.id} data-testid={`cat-${c.id}`}>
            {c.name}|{c.image}
          </li>
        ))}
      </ul>
      <ul>
        {products.map((p) => (
          <li key={p.id} data-testid={`prod-${p.id}`}>
            {p.name}|{p.categoryId}|{p.image}|{(p.gallery ?? []).length}
          </li>
        ))}
      </ul>
    </div>
  )
}

describe('CatalogProvider', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) =>
        Promise.resolve({
          ok: true,
          // eslint-disable-next-line @typescript-eslint/require-await
          json: async () =>
            String(input).includes('/categories')
              ? CATEGORIES_RESPONSE
              : PRODUCTS_RESPONSE,
        } as Response),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('normalizes mixed Strapi v5 shapes and resolves media URLs', async () => {
    render(
      <CatalogProvider>
        <Consumer />
      </CatalogProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    })
    expect(screen.getByTestId('error')).toHaveTextContent('none')

    const catVisage = screen.getByTestId('cat-soins-visage')
    expect(catVisage).toHaveTextContent('Soins visage')
    expect(catVisage).toHaveTextContent('/soins.jpg')

    const catCorps = screen.getByTestId('cat-corps')
    expect(catCorps).toHaveTextContent('Corps')
    expect(catCorps).toHaveTextContent(
      'https://res.cloudinary.com/demo/image/upload/v1/aysho/corps.jpg',
    )

    const prodArgan = screen.getByTestId('prod-prod123')
    expect(prodArgan).toHaveTextContent('Huile d argan')
    expect(prodArgan).toHaveTextContent('soins-visage')
    expect(prodArgan).toHaveTextContent(
      'https://res.cloudinary.com/demo/image/upload/v1/aysho/a.jpg',
    )
    expect(prodArgan).toHaveTextContent('|2')

    const prodCreme = screen.getByTestId('prod-2')
    expect(prodCreme).toHaveTextContent('Crème réparatrice')
    expect(prodCreme).toHaveTextContent('corps')

    const prodMagnesium = screen.getByTestId('prod-3')
    expect(prodMagnesium).toHaveTextContent('Magnésium marin')
    expect(prodMagnesium).toHaveTextContent('complements-alimentaires')
  })

  it('surfaces fetch errors through the error state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: false } as unknown as Response),
      ),
    )

    render(
      <CatalogProvider>
        <Consumer />
      </CatalogProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Erreur lors de la récupération des données depuis Strapi',
      )
    })
  })
})