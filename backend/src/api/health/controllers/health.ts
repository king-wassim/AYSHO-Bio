import type { Context } from 'koa';
import type { Core } from '@strapi/strapi';

// strapi is available as a global in Strapi controllers
declare const strapi: Core.Strapi;

export default {
  async check(ctx: Context) {
    const start = Date.now();

    try {
      await strapi.db.connection.raw('SELECT 1');
      const dbLatency = Date.now() - start;

      const info = strapi.config.get<{ version?: string }>('info', {});
      const version: string = info.version ?? '0.1.0';
      const environment: string = strapi.config.get('environment', 'development');

      ctx.body = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
        version,
        environment,
      };
    } catch (error) {
      ctx.status = 503;
      ctx.body = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  live(ctx: Context) {
    ctx.body = {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  },

  async ready(ctx: Context) {
    try {
      await strapi.db.connection.raw('SELECT 1');
      ctx.body = {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      ctx.status = 503;
      ctx.body = {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
