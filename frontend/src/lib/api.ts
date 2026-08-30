const configured = import.meta.env.VITE_STRAPI_URL as string | undefined;

export const STRAPI_URL = (configured && configured.trim() ? configured.trim() : '').replace(/\/+$/, '');

export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (/^(https?:)?\/\//.test(url)) return url
  const normalized = url.startsWith('/') ? url : `/${url}`
  return STRAPI_URL ? `${STRAPI_URL}${normalized}` : normalized
}

export function joinApi(path: string): string {
  const clean = path.replace(/^\/+/, '')
  return `${STRAPI_URL}/api/${clean}`
}

export interface MediaOpts {
  w?: number
  h?: number
}

export function optimizeMediaUrl(url: string, opts: MediaOpts = {}): string {
  const m = url.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/)(.*)$/)
  if (!m) return url

  const params: string[] = ['q_auto', 'f_auto']
  if (opts.h) params.push(`h_${opts.h}`)
  if (opts.w) params.push(`w_${opts.w}`)
  if (opts.h || opts.w) params.push('c_limit')

  return `${m[1]}${params.join(',')}/${m[3]}`
}