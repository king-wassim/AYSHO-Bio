import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: { env: any }): any => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
        secure: env.bool('SESSION_SECURE', true),
        sameSite: env('SESSION_SAME_SITE', 'lax'),
      },
    },
  },
  upload: {
    config: {
      provider: env('UPLOAD_PROVIDER', 'local'),
      providerOptions: {
        // Correction : Cloudinary n'accepte pas les options dans un sous-bloc 'cloudinary'
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
        uploadOptions: {
          folder: env('CLOUDINARY_FOLDER', 'aysho'),
          useFilename: true,
          uniqueFilename: true,
          overwrite: false,
          resourceType: 'auto',
          transformation: [
            { quality: 'auto', fetchFormat: 'auto' },
            { width: 1920, height: 1080, crop: 'limit' },
          ],
        },
        deleteOptions: {
          invalidate: true,
        },
      },
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
      sizeLimit: 10 * 1024 * 1024, // 10MB
    },
  },
  sentry: {
    enabled: env.bool('SENTRY_ENABLED', false),
    config: {
      dsn: env('SENTRY_DSN'),
      environment: env('SENTRY_ENVIRONMENT', 'development'),
      tracesSampleRate: env.float('SENTRY_TRACES_SAMPLE_RATE', 0.1),
      profilesSampleRate: env.float('SENTRY_PROFILES_SAMPLE_RATE', 0.1),
    },
  },
});

export default config;


/*import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
        secure: env.bool('SESSION_SECURE', true),
        sameSite: env('SESSION_SAME_SITE', 'lax'),
      },
    },
  },
  upload: {
    config: {
      provider: env('UPLOAD_PROVIDER', 'local'),
      providerOptions: {
        local: {
          uploadDir: 'public/uploads',
        },
        cloudinary: {
          cloudName: env('CLOUDINARY_NAME'),
          apiKey: env('CLOUDINARY_KEY'),
          apiSecret: env('CLOUDINARY_SECRET'),
          uploadOptions: {
            folder: env('CLOUDINARY_FOLDER', 'aysho'),
            useFilename: true,
            uniqueFilename: true,
            overwrite: false,
            resourceType: 'auto',
            transformation: [
              { quality: 'auto', fetchFormat: 'auto' },
              { width: 1920, height: 1080, crop: 'limit' },
            ],
          },
          deleteOptions: {
            invalidate: true,
          },
        },
      },
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
      sizeLimit: 10 * 1024 * 1024,
    },
  },
  sentry: {
    enabled: env.bool('SENTRY_ENABLED', false),
    config: {
      dsn: env('SENTRY_DSN'),
      environment: env('SENTRY_ENVIRONMENT', 'development'),
      tracesSampleRate: env.float('SENTRY_TRACES_SAMPLE_RATE', 0.1),
      profilesSampleRate: env.float('SENTRY_PROFILES_SAMPLE_RATE', 0.1),
    },
  },
});

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

export default config;
*/