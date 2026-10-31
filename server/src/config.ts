import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const optionalUrl = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.url().optional(),
);

const rawConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: booleanFromString,
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  ACCESS_TOKEN_SECRET: z.string().min(1),
  ACCESS_TOKEN_ISSUER: z.string().min(1).default('astrotalk-api'),
  ACCESS_TOKEN_AUDIENCE: z.string().min(1).default('astrotalk-app'),
  CORS_ORIGINS: z.string().default('astrotalk://auth/callback,http://localhost:8081'),
  PUBLIC_API_URL: z.url(),
  APP_PUBLIC_URL: z.url(),
  WEB_AUTH_CALLBACK_URL: optionalUrl,
  AVATAR_URL_ALLOWED_HOSTS: z.string().default(''),
  EMAIL_DELIVERY_MODE: z.enum(['disabled', 'console', 'resend']).default('disabled'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  FACEBOOK_API_VERSION: z.string().regex(/^v\d+\.\d+$/).default('v22.0'),
  OAUTH_HTTP_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(30_000).default(5_000),
  TRUST_PROXY: booleanFromString,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
}).superRefine((value, context) => {
  if (new TextEncoder().encode(value.ACCESS_TOKEN_SECRET).byteLength < 32) {
    context.addIssue({
      code: 'custom',
      path: ['ACCESS_TOKEN_SECRET'],
      message: 'Must contain at least 32 UTF-8 bytes.',
    });
  }
  if (value.NODE_ENV === 'production' && value.EMAIL_DELIVERY_MODE === 'console') {
    context.addIssue({
      code: 'custom',
      path: ['EMAIL_DELIVERY_MODE'],
      message: 'Console email delivery is forbidden in production.',
    });
  }
  if (value.EMAIL_DELIVERY_MODE === 'resend' && (!value.RESEND_API_KEY || !value.EMAIL_FROM)) {
    context.addIssue({
      code: 'custom',
      path: ['EMAIL_DELIVERY_MODE'],
      message: 'RESEND_API_KEY and EMAIL_FROM are required for Resend delivery.',
    });
  }
  if (Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET)) {
    context.addIssue({ code: 'custom', path: ['GOOGLE_CLIENT_ID'], message: 'Google client ID and secret must be configured together.' });
  }
  if (Boolean(value.FACEBOOK_APP_ID) !== Boolean(value.FACEBOOK_APP_SECRET)) {
    context.addIssue({ code: 'custom', path: ['FACEBOOK_APP_ID'], message: 'Facebook app ID and secret must be configured together.' });
  }
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  databaseSsl: boolean;
  databasePoolMax: number;
  accessTokenSecret: string;
  accessTokenIssuer: string;
  accessTokenAudience: string;
  corsOrigins: string[];
  publicApiUrl: string;
  appPublicUrl: string;
  oauthRedirectAllowlist: ReadonlySet<string>;
  avatarUrlAllowedHosts: ReadonlySet<string>;
  emailDeliveryMode: 'disabled' | 'console' | 'resend';
  resendApiKey?: string;
  emailFrom?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
  facebookApiVersion: string;
  oauthHttpTimeoutMs: number;
  trustProxy: boolean;
  logLevel: string;
}

function parseCommaSeparated(value: string): string[] {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function assertUrlSecurity(config: AppConfig): void {
  const apiUrl = new URL(config.publicApiUrl);
  if (config.nodeEnv === 'production' && apiUrl.protocol !== 'https:') {
    throw new Error('PUBLIC_API_URL must use HTTPS in production.');
  }
  if (config.nodeEnv === 'production' && config.corsOrigins.includes('*')) {
    throw new Error('CORS_ORIGINS cannot contain a wildcard in production.');
  }
  for (const redirect of config.oauthRedirectAllowlist) {
    const url = new URL(redirect);
    if (redirect !== 'astrotalk://auth/callback' && url.protocol !== 'https:') {
      throw new Error('OAuth redirects must be astrotalk://auth/callback or HTTPS URLs.');
    }
  }
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const raw = rawConfigSchema.parse(environment);
  const redirects = new Set<string>(['astrotalk://auth/callback']);
  if (raw.WEB_AUTH_CALLBACK_URL) {
    redirects.add(new URL(raw.WEB_AUTH_CALLBACK_URL).toString());
  }
  const config: AppConfig = {
    nodeEnv: raw.NODE_ENV,
    host: raw.HOST,
    port: raw.PORT,
    databaseUrl: raw.DATABASE_URL,
    databaseSsl: raw.DATABASE_SSL,
    databasePoolMax: raw.DATABASE_POOL_MAX,
    accessTokenSecret: raw.ACCESS_TOKEN_SECRET,
    accessTokenIssuer: raw.ACCESS_TOKEN_ISSUER,
    accessTokenAudience: raw.ACCESS_TOKEN_AUDIENCE,
    corsOrigins: parseCommaSeparated(raw.CORS_ORIGINS),
    publicApiUrl: new URL(raw.PUBLIC_API_URL).toString().replace(/\/$/, ''),
    appPublicUrl: new URL(raw.APP_PUBLIC_URL).toString(),
    oauthRedirectAllowlist: redirects,
    avatarUrlAllowedHosts: new Set(parseCommaSeparated(raw.AVATAR_URL_ALLOWED_HOSTS).map((host) => host.toLowerCase())),
    emailDeliveryMode: raw.EMAIL_DELIVERY_MODE,
    facebookApiVersion: raw.FACEBOOK_API_VERSION,
    oauthHttpTimeoutMs: raw.OAUTH_HTTP_TIMEOUT_MS,
    trustProxy: raw.TRUST_PROXY,
    logLevel: raw.LOG_LEVEL,
  };
  if (raw.RESEND_API_KEY) config.resendApiKey = raw.RESEND_API_KEY;
  if (raw.EMAIL_FROM) config.emailFrom = raw.EMAIL_FROM;
  if (raw.GOOGLE_CLIENT_ID) config.googleClientId = raw.GOOGLE_CLIENT_ID;
  if (raw.GOOGLE_CLIENT_SECRET) config.googleClientSecret = raw.GOOGLE_CLIENT_SECRET;
  if (raw.FACEBOOK_APP_ID) config.facebookAppId = raw.FACEBOOK_APP_ID;
  if (raw.FACEBOOK_APP_SECRET) config.facebookAppSecret = raw.FACEBOOK_APP_SECRET;
  assertUrlSecurity(config);
  return config;
}

export function loadDatabaseConfig(environment: NodeJS.ProcessEnv = process.env): Pick<AppConfig, 'databaseUrl' | 'databaseSsl' | 'databasePoolMax'> {
  const schema = rawConfigSchema.pick({ DATABASE_URL: true, DATABASE_SSL: true, DATABASE_POOL_MAX: true });
  const raw = schema.parse(environment);
  return {
    databaseUrl: raw.DATABASE_URL,
    databaseSsl: raw.DATABASE_SSL,
    databasePoolMax: raw.DATABASE_POOL_MAX,
  };
}
