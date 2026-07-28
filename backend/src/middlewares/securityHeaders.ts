import type { Context, Next } from 'koa';

interface MiddlewareConfig {
  enabled?: boolean;
}

interface StrapiInstance {
  log: {
    error: (msg: string, err: Error) => void;
  };
}

const securityHeadersMiddleware = (
  _config: MiddlewareConfig,
  { strapi: _strapi }: { strapi: StrapiInstance }
) => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.strapi.io https://*.cloudinary.com https://*.sentry.io",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ];

  return async (ctx: Context, next: Next) => {
    await next();

    ctx.set('X-Frame-Options', 'SAMEORIGIN');
    ctx.set('X-Content-Type-Options', 'nosniff');
    ctx.set('X-XSS-Protection', '1; mode=block');
    ctx.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    ctx.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    ctx.set('Cross-Origin-Opener-Policy', 'same-origin');
    ctx.set('Cross-Origin-Resource-Policy', 'cross-origin');
    ctx.set('Content-Security-Policy', cspDirectives.join('; '));
  };
};

export default securityHeadersMiddleware;
