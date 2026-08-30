import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';

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

interface RouteRule {
  match: RegExp;
  windowMs: number;
  max: number;
}

const ROUTE_RULES: RouteRule[] = [
  {
    match: /^\/api\/health($|\/)/i,
    windowMs: 15 * 60 * 1000,
    max: 60,
  },
  {
    match: /^\/api\/orders($|\/)/i,
    windowMs: 60 * 60 * 1000,
    max: 30,
  },
  {
    match: /^\/api\/auth($|\/)/i,
    windowMs: 15 * 60 * 1000,
    max: 50,
  },
  {
    match: /^\/admin($|\/)/i,
    windowMs: 15 * 60 * 1000,
    max: 300,
  },
  {
    match: /.*/,
    windowMs: 15 * 60 * 1000,
    max: 200,
  },
];

function getClientIp(ctx: Context): string {
  const forwarded = ctx.request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.includes(',')) {
    const parts = forwarded.split(',').map((p: string) => p.trim());
    return parts[parts.length - 1] || forwarded;
  }
  return ctx.request.ip ?? String(forwarded ?? 'unknown');
}

function resolveRule(path: string): RouteRule {
  for (const rule of ROUTE_RULES) {
    if (rule.match.test(path)) {
      return rule;
    }
  }
  return ROUTE_RULES[ROUTE_RULES.length - 1];
}

const rateLimitMiddleware: Core.MiddlewareFactory = (_config, { strapi }) => {
  const isEnabled = strapi.config.get('rate-limit.enabled', true) as boolean;
  if (!isEnabled) {
    strapi.log.info('Rate limiting: disabled');
    return async (_ctx: Context, _next: Next) => {
      await _next();
    };
  }

  strapi.log.info('Rate limiting: enabled');

  return async (ctx: Context, next: Next) => {
    const path: string = ctx.path ?? '';
    const rule = resolveRule(path);

    const ip = getClientIp(ctx);
    const key = `rate-limit:${rule.max}:${rule.windowMs}:${ip}`;
    const now = Date.now();

    if (!store[key] || store[key].resetTime < now) {
      store[key] = { count: 0, resetTime: now + rule.windowMs };
    }

    store[key].count++;

    const remaining = Math.max(0, rule.max - store[key].count);
    const resetTime = Math.ceil((store[key].resetTime - now) / 1000);

    ctx.set('RateLimit-Limit', rule.max.toString());
    ctx.set('RateLimit-Remaining', remaining.toString());
    ctx.set('RateLimit-Reset', resetTime.toString());

    if (store[key].count > rule.max) {
      ctx.set('Retry-After', resetTime.toString());
      ctx.status = 429;
      ctx.body = { error: { message: 'Too many requests, please try again later.', status: 429 } };
      return;
    }

    await next();
  };
};

export default rateLimitMiddleware;
