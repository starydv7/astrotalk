import { randomUUID } from 'node:crypto';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Fastify from 'fastify';
import { z, ZodError } from 'zod';

import type { AccessTokenService } from './auth/access-token.js';
import { JoseAccessTokenService } from './auth/access-token.js';
import type { PasswordHasher } from './auth/password.js';
import { Argon2PasswordHasher } from './auth/password.js';
import type { AppConfig } from './config.js';
import type { OAuthProviderName } from './domain/types.js';
import type { EmailProvider } from './email/email-provider.js';
import { createEmailProvider } from './email/email-provider.js';
import { AppError, errorEnvelope, validationError } from './lib/errors.js';
import type { OAuthProviderClient } from './oauth/provider.js';
import { createOAuthProviders } from './oauth/provider.js';
import type { AppRepository } from './repositories/repository.js';
import {
    actionTokenSchema,
    changePasswordSchema,
    deleteAccountSchema,
    emailOnlySchema,
    loginSchema,
    logoutSchema,
    oauthExchangeSchema,
    preferencesPatchSchema,
    profilePatchSchema,
    refreshSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema,
} from './schemas.js';
import { AuthService } from './services/auth-service.js';
import { OAuthService } from './services/oauth-service.js';
import { ProfileService } from './services/profile-service.js';

const authRateLimit = { max: 20, timeWindow: '1 minute' } as const;
const sensitiveAuthRateLimit = { max: 5, timeWindow: '15 minutes' } as const;

export interface BuildAppOptions {
  config: AppConfig;
  repository: AppRepository;
  passwordHasher?: PasswordHasher;
  accessTokenService?: AccessTokenService;
  emailProvider?: EmailProvider;
  oauthProviders?: ReadonlyMap<OAuthProviderName, OAuthProviderClient>;
  clock?: () => Date;
  logger?: FastifyBaseLogger | false;
  closeDependencies?: () => Promise<void>;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

function getAuth(request: FastifyRequest): { userId: string; sessionId: string } {
  if (!request.auth) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
  return request.auth;
}

function deviceFrom(request: FastifyRequest, deviceName?: string): { deviceName: string | null; userAgent: string | null } {
  const rawAgent = request.headers['user-agent'];
  const userAgent = typeof rawAgent === 'string'
    ? rawAgent.replace(/[\u0000-\u001F\u007F]/gu, '').slice(0, 512) || null
    : null;
  return { deviceName: deviceName ?? null, userAgent };
}

function fastifyLogger(config: AppConfig, supplied: FastifyBaseLogger | false | undefined): FastifyBaseLogger | false | object {
  if (supplied !== undefined) return supplied;
  if (config.nodeEnv === 'test' || config.logLevel === 'silent') return false;
  return {
    level: config.logLevel,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body',
        'res.headers.set-cookie',
      ],
      censor: '[REDACTED]',
    },
  };
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const clock = options.clock ?? (() => new Date());
  const passwordHasher = options.passwordHasher ?? new Argon2PasswordHasher();
  const accessTokens = options.accessTokenService ?? new JoseAccessTokenService(
    options.config.accessTokenSecret,
    options.config.accessTokenIssuer,
    options.config.accessTokenAudience,
  );
  const emailProvider = options.emailProvider ?? createEmailProvider(options.config);
  const oauthProviders = options.oauthProviders ?? createOAuthProviders(options.config);

  const app = Fastify({
    logger: fastifyLogger(options.config, options.logger),
    logController: new LogController({ disableRequestLogging: true }),
    trustProxy: options.config.trustProxy,
    genReqId: () => randomUUID(),
    bodyLimit: 32 * 1024,
    requestTimeout: 15_000,
    connectionTimeout: 10_000,
  });
  app.decorateRequest('auth', null);

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  });
  await app.register(cors, {
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type', 'x-request-id'],
    origin(origin, callback) {
      if (!origin || options.config.corsOrigins.includes(origin) || options.config.corsOrigins.includes('*')) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed.'), false);
    },
  });
  await app.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: () => errorEnvelope(new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again later.', true)),
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    reply.header('cache-control', 'no-store');
  });

  const authenticate = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      reply.header('www-authenticate', 'Bearer');
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }
    const rawToken = authorization.slice('Bearer '.length);
    if (!rawToken || rawToken.includes(' ')) {
      reply.header('www-authenticate', 'Bearer');
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }
    const claims = await accessTokens.verify(rawToken);
    const user = await options.repository.findAuthUser(claims.userId);
    if (!user || user.accountStatus !== 'active' || user.emailVerifiedAt === null) {
      reply.header('www-authenticate', 'Bearer');
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    }
    request.auth = claims;
  };

  const authService = new AuthService(
    options.repository,
    passwordHasher,
    accessTokens,
    emailProvider,
    options.config,
    clock,
  );
  const oauthService = new OAuthService(options.repository, oauthProviders, options.config, clock);
  const profileService = new ProfileService(options.repository, passwordHasher, options.config, clock);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send(errorEnvelope(error));
      return;
    }
    if (error instanceof ZodError) {
      const formatted = validationError(error);
      void reply.status(formatted.statusCode).send(errorEnvelope(formatted));
      return;
    }
    const possibleStatus = typeof error === 'object' && error !== null && 'statusCode' in error
      ? (error as { statusCode?: unknown }).statusCode
      : undefined;
    const statusCode = typeof possibleStatus === 'number' && possibleStatus >= 400 && possibleStatus < 500
      ? possibleStatus
      : 500;
    if (statusCode === 429) {
      void reply.status(429).send(errorEnvelope(new AppError(429, 'RATE_LIMITED', 'Too many requests. Try again later.', true)));
      return;
    }
    if (statusCode < 500) {
      void reply.status(statusCode).send(errorEnvelope(new AppError(statusCode, 'BAD_REQUEST', 'The request could not be processed.')));
      return;
    }
    request.log.error({ event: 'request_failed', requestId: request.id, method: request.method, route: request.routeOptions.url });
    void reply.status(500).send(errorEnvelope(new AppError(500, 'INTERNAL_ERROR', 'An internal error occurred.', true)));
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.status(404).send(errorEnvelope(new AppError(404, 'NOT_FOUND', 'The requested endpoint was not found.')));
  });

  app.get('/v1/health', async (_request, reply) => {
    try {
      await options.repository.checkHealth();
      return { status: 'ok', checks: { database: 'ok' } };
    } catch {
      return reply.status(503).send(errorEnvelope(new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'The database readiness check failed.',
        true,
        { database: 'unavailable' },
      )));
    }
  });

  app.post('/v1/auth/register', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const body = parse(registerSchema, request.body);
    const result = await authService.register(body);
    return reply.status(201).send(result);
  });

  app.post('/v1/auth/login', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request) => {
    const body = parse(loginSchema, request.body);
    return authService.login(body.email, body.password, deviceFrom(request, body.deviceName));
  });

  app.post('/v1/auth/refresh', { config: { rateLimit: authRateLimit } }, async (request) => {
    const body = parse(refreshSchema, request.body);
    return authService.refresh(body.refreshToken, deviceFrom(request));
  });

  app.post('/v1/auth/logout', { preHandler: authenticate, config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const body = request.body === undefined ? {} : parse(logoutSchema, request.body);
    const auth = getAuth(request);
    await authService.logout(auth.userId, auth.sessionId, body.refreshToken);
    return reply.status(204).send();
  });

  app.post('/v1/auth/logout-all', { preHandler: authenticate, config: { rateLimit: authRateLimit } }, async (request, reply) => {
    await authService.revokeAll(getAuth(request).userId);
    return reply.status(204).send();
  });

  app.post('/v1/auth/verify-email', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request) => {
    const body = parse(verifyEmailSchema, request.body);
    await authService.verifyEmail(body.token);
    return { verified: true };
  });

  app.post('/v1/auth/resend-verification', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const body = parse(emailOnlySchema, request.body);
    await authService.resendVerification(body.email);
    return reply.status(202).send({ message: 'If the account is eligible, verification instructions will be delivered.' });
  });

  app.post('/v1/auth/forgot-password', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const body = parse(emailOnlySchema, request.body);
    await authService.forgotPassword(body.email);
    return reply.status(202).send({ message: 'If the account is eligible, password reset instructions will be delivered.' });
  });

  app.post('/v1/auth/reset-password', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const body = parse(resetPasswordSchema, request.body);
    await authService.resetPassword(body.token, body.newPassword);
    return reply.status(204).send();
  });

  app.post('/v1/auth/change-password', { preHandler: authenticate, config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const body = parse(changePasswordSchema, request.body);
    const auth = getAuth(request);
    await authService.changePassword(auth.userId, auth.sessionId, body.currentPassword, body.newPassword);
    return reply.status(204).send();
  });

  app.get('/v1/auth/sessions', { preHandler: authenticate, config: { rateLimit: authRateLimit } }, async (request) => {
    const auth = getAuth(request);
    return { sessions: await authService.listSessions(auth.userId, auth.sessionId) };
  });

  app.delete('/v1/auth/sessions/:id', { preHandler: authenticate, config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const params = parse(z.object({ id: z.string().uuid() }).strict(), request.params);
    await authService.revokeOwnedSession(getAuth(request).userId, params.id);
    return reply.status(204).send();
  });

  const providerParams = z.object({ provider: z.enum(['google', 'facebook']) }).strict();
  app.get('/v1/auth/oauth/:provider/start', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const params = parse(providerParams, request.params);
    const query = parse(z.object({ redirectUri: z.string().min(1).max(2_048) }).strict(), request.query);
    const location = await oauthService.start(params.provider, query.redirectUri);
    return reply.redirect(location);
  });

  app.get('/v1/auth/oauth/:provider/callback', { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const params = parse(providerParams, request.params);
    const query = parse(z.object({
      state: actionTokenSchema.optional(),
      code: z.string().min(1).max(4_096).optional(),
      error: z.string().min(1).max(200).optional(),
    }).passthrough(), request.query);
    const location = await oauthService.callback(params.provider, query);
    return reply.redirect(location);
  });

  app.post('/v1/auth/oauth/exchange', { config: { rateLimit: sensitiveAuthRateLimit } }, async (request) => {
    const body = parse(oauthExchangeSchema, request.body);
    return authService.exchangeOAuthCode(body.code, deviceFrom(request, body.deviceName));
  });

  app.get('/v1/me', { preHandler: authenticate }, async (request) => profileService.get(getAuth(request).userId));

  app.patch('/v1/me/profile', { preHandler: authenticate }, async (request) => {
    const body = parse(profilePatchSchema, request.body);
    return profileService.updateProfile(getAuth(request).userId, body);
  });

  app.patch('/v1/me/preferences', { preHandler: authenticate }, async (request) => {
    const body = parse(preferencesPatchSchema, request.body);
    return profileService.updatePreferences(getAuth(request).userId, body);
  });

  app.get('/v1/me/export', { preHandler: authenticate }, async (request) => profileService.export(getAuth(request).userId));

  app.delete('/v1/me', { preHandler: authenticate, config: { rateLimit: sensitiveAuthRateLimit } }, async (request, reply) => {
    const body = parse(deleteAccountSchema, request.body ?? {});
    await profileService.deleteAccount(getAuth(request).userId, body);
    return reply.status(204).send();
  });

  app.get('/v1/me/providers', { preHandler: authenticate }, async (request) => ({
    providers: await profileService.providers(getAuth(request).userId),
  }));

  if (options.closeDependencies) {
    app.addHook('onClose', async () => options.closeDependencies?.());
  }

  return app;
}
