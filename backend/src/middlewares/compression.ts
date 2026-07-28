import type { ZlibOptions, BrotliOptions } from 'zlib';
import { createGzip, createBrotliCompress, constants } from 'zlib';
import { promisify } from 'util';

interface CompressionConfig {
  threshold?: number;
  level?: number;
}

interface StrapiInstance {
  log: {
    error: (message: string, err: Error) => void;
  };
}

interface KoaContext {
  response: {
    is: (type: string) => boolean;
  };
  request: {
    header: Record<string, string | undefined>;
  };
  body: unknown;
  set: (header: string, value: string) => void;
}

type MiddlewareFactory = (
  config: CompressionConfig,
  { strapi }: { strapi: StrapiInstance }
) => (ctx: KoaContext, next: () => Promise<void>) => Promise<void>;

const gzip = promisify(
  (buffer: Buffer, options: ZlibOptions, callback: (err: Error | null, result: Buffer) => void) => {
    const gz = createGzip(options);
    const chunks: Buffer[] = [];
    gz.on('data', (chunk: Buffer) => chunks.push(chunk));
    gz.on('end', () => callback(null, Buffer.concat(chunks)));
    gz.on('error', callback);
    gz.end(buffer);
  }
);

const brotli = promisify(
  (
    buffer: Buffer,
    options: BrotliOptions,
    callback: (err: Error | null, result: Buffer) => void
  ) => {
    const br = createBrotliCompress(options);
    const chunks: Buffer[] = [];
    br.on('data', (chunk: Buffer) => chunks.push(chunk));
    br.on('end', () => callback(null, Buffer.concat(chunks)));
    br.on('error', callback);
    br.end(buffer);
  }
);

const compressionMiddleware: MiddlewareFactory = (config, { strapi }) => {
  return async (ctx, next) => {
    await next();

    if (!ctx.response.is('json') && !ctx.response.is('text') && !ctx.response.is('xml')) {
      return;
    }

    const acceptEncoding = ctx.request.header['accept-encoding'] || '';
    const shouldCompress = acceptEncoding.includes('gzip') || acceptEncoding.includes('br');

    if (!shouldCompress) {
      return;
    }

    const body = ctx.body;
    if (!body) {
      return;
    }

    try {
      const encoding = acceptEncoding.includes('br') ? 'br' : 'gzip';
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

      let compressed: Buffer;
      if (encoding === 'br') {
        compressed = await brotli(Buffer.from(bodyStr), {
          params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
        });
      } else {
        compressed = await gzip(Buffer.from(bodyStr), { level: 6 });
      }

      ctx.set('Content-Encoding', encoding);
      ctx.set('Vary', 'Accept-Encoding');
      ctx.body = compressed;
    } catch (err) {
      strapi.log.error('Compression error:', err as Error);
    }
  };
};

export default compressionMiddleware;
