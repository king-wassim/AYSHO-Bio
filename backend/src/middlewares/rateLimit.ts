import type { Core } from '@strapi/strapi';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const store: RateLimitStore = {};

setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

const rateLimitMiddleware: Core.MiddlewareFactory = (config, { strapi }) => {
  const windowMs = (strapi.config.get('rate-limit.rateLimit.windowMs') as number | undefined) ?? 15 * 60 * 1000;
  const maxRequests = (strapi.config.get('rate-limit.rateLimit.maxRequests') as number | undefined) ?? 100;
  const message = (strapi.config.get('rate-limit.rateLimit.message') as string | undefined) ?? 'Too many requests, please try again later.';
  const standardHeaders = (strapi.config.get('rate-limit.rateLimit.standardHeaders') as boolean | undefined) ?? true;
  const legacyHeaders = (strapi.config.get('rate-limit.rateLimit.legacyHeaders') as boolean | undefined) ?? false;

  strapi.log.info(`Rate limiting: ${maxRequests} requests per ${windowMs}ms`);

  return async (ctx, next) => {
    const ip =
      (ctx.request.ip as string | undefined) ??
      String(ctx.request.headers['x-forwarded-for'] ?? 'unknown');
    const key = `rate-limit:${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = { count: 0, resetTime: now + windowMs };
    }

    store[key].count++;

    const remaining = Math.max(0, maxRequests - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    if (standardHeaders) {
      ctx.set('RateLimit-Limit', maxRequests.toString());
      ctx.set('RateLimit-Remaining', remaining.toString());
      ctx.set('RateLimit-Reset', resetTime.toString());
    }

    if (legacyHeaders) {
      ctx.set('X-RateLimit-Limit', maxRequests.toString());
      ctx.set('X-RateLimit-Remaining', remaining.toString());
      ctx.set('X-RateLimit-Reset', resetTime.toString());
    }

    if (store[key].count > maxRequests) {
      ctx.set('Retry-After', resetTime.toString());
      ctx.status = 429;
      ctx.body = { error: { message, status: 429 } };
      return;
    }

    await next();
  };
};

export default rateLimitMiddleware;
