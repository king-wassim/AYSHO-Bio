import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams) => ({
  enabled: env.bool('RATE_LIMIT_ENABLED', true),
  rateLimit: {
    windowMs: env.int('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    maxRequests: env.int('RATE_LIMIT_MAX_REQUESTS', 100),
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
});

export default config;