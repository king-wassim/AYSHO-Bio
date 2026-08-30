import { describe, expect, it } from 'vitest'
import { joinApi, optimizeMediaUrl, resolveMediaUrl } from './api'

describe('resolveMediaUrl', () => {
  it('returns empty string for falsy values', () => {
    expect(resolveMediaUrl(undefined)).toBe('')
    expect(resolveMediaUrl(null)).toBe('')
    expect(resolveMediaUrl('')).toBe('')
  })

  it('returns absolute URLs untouched (Cloudinary in production)', () => {
    const cloud =
      'https://res.cloudinary.com/demo/image/upload/v1/aysho/products/a.jpg'
    expect(resolveMediaUrl(cloud)).toBe(cloud)
  })

  it('accepts protocol-relative URLs', () => {
    expect(resolveMediaUrl('//res.cloudinary.com/x/image/upload/a.jpg')).toBe(
      '//res.cloudinary.com/x/image/upload/a.jpg',
    )
  })

  it('returns the relative path when STRAPI_URL is empty (same-origin dev)', () => {
    expect(resolveMediaUrl('/uploads/foo.jpg')).toBe('/uploads/foo.jpg')
    expect(resolveMediaUrl('uploads/foo.jpg')).toBe('/uploads/foo.jpg')
  })
})

describe('joinApi', () => {
  it('builds a same-origin /api path when STRAPI_URL is empty', () => {
    expect(joinApi('orders')).toBe('/api/orders')
    expect(joinApi('/categories')).toBe('/api/categories')
  })
})

describe('optimizeMediaUrl', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload/'
  const path = 'v123/aysho/products/cream.jpg'

  it('returns the original URL when not a Cloudinary URL', () => {
    const url = 'https://example.com/foo.jpg'
    expect(optimizeMediaUrl(url)).toBe(url)
  })

  it('appends fetch/quality auto params by default', () => {
    expect(optimizeMediaUrl(`${base}${path}`)).toBe(`${base}q_auto,f_auto/${path}`)
  })

  it('adds w/h/c_limit when requested', () => {
    expect(optimizeMediaUrl(`${base}${path}`, { w: 600 })).toBe(
      `${base}q_auto,f_auto,w_600,c_limit/${path}`,
    )
    expect(optimizeMediaUrl(`${base}${path}`, { h: 300 })).toBe(
      `${base}q_auto,f_auto,h_300,c_limit/${path}`,
    )
    expect(optimizeMediaUrl(`${base}${path}`, { w: 600, h: 600 })).toBe(
      `${base}q_auto,f_auto,h_600,w_600,c_limit/${path}`,
    )
  })
})