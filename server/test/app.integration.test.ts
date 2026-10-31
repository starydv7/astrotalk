import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { JoseAccessTokenService } from '../src/auth/access-token.js';
import {
  FakeEmailProvider,
  FakeOAuthProvider,
  FakePasswordHasher,
  MemoryRepository,
  providerMap,
  testConfig,
} from './support/fakes.js';

const NOW = new Date('2026-01-02T12:00:00.000Z');
const openApps: FastifyInstance[] = [];

async function createTestApp(options: {
  repository?: MemoryRepository;
  email?: FakeEmailProvider;
  google?: FakeOAuthProvider;
  emailMode?: 'disabled' | 'console' | 'resend';
} = {}) {
  const repository = options.repository ?? new MemoryRepository();
  const email = options.email ?? new FakeEmailProvider();
  const config = testConfig({ emailDeliveryMode: options.emailMode ?? 'disabled' });
  const app = await buildApp({
    config,
    repository,
    passwordHasher: new FakePasswordHasher(),
    emailProvider: email,
    oauthProviders: options.google ? providerMap(options.google) : new Map(),
    clock: () => new Date(NOW),
    logger: false,
  });
  openApps.push(app);
  return { app, repository, email, config };
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map((app) => app.close()));
});

async function login(app: FastifyInstance, email = 'person@example.com', password = 'SecurePass123') {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email, password, deviceName: 'Test phone' },
  });
  expect(response.statusCode).toBe(200);
  return response.json<{ accessToken: string; refreshToken: string; user: { id: string } }>();
}

async function directAccessToken(config: ReturnType<typeof testConfig>, userId: string, sessionId = randomUUID()): Promise<string> {
  const tokens = new JoseAccessTokenService(config.accessTokenSecret, config.accessTokenIssuer, config.accessTokenAudience);
  return tokens.issue({ userId, sessionId });
}

describe('registration', () => {
  it('validates input, enforces password policy, and only previews in console development mode', async () => {
    const email = new FakeEmailProvider('preview');
    const { app } = await createTestApp({ email, emailMode: 'console' });

    const weak = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { displayName: 'A', email: 'not-email', password: 'password' },
    });
    expect(weak.statusCode).toBe(400);
    expect(weak.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', retryable: false } });

    const extraField = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { displayName: 'Valid Person', email: 'valid@example.com', password: 'Long Enough 123', admin: true },
    });
    expect(extraField.statusCode).toBe(400);

    const created = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { displayName: 'Valid Person', email: '  VALID@Example.COM ', password: 'Long Enough 123' },
    });
    expect(created.statusCode).toBe(201);
    const body = created.json<{
      user: { email: string };
      verification: { deliveryStatus: string; previewToken?: string };
    }>();
    expect(body.user.email).toBe('valid@example.com');
    expect(body.verification.deliveryStatus).toBe('preview');
    expect(body.verification.previewToken).toMatch(/^[A-Za-z0-9_-]{32,}$/);
    expect(email.messages).toHaveLength(1);
  });

  it('returns a safe conflict for a duplicate account', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser({ email: 'taken@example.com' });
    const { app } = await createTestApp({ repository });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { displayName: 'Another Person', email: 'taken@example.com', password: 'Unique pass 9283' },
    });
    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: {
        code: 'ACCOUNT_EXISTS',
        message: 'An account with these details already exists.',
        retryable: false,
      },
    });
  });
});

describe('authentication and sessions', () => {
  it('uses the same generic login error for unknown accounts and wrong passwords', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser();
    const { app } = await createTestApp({ repository });
    const unknown = await app.inject({ method: 'POST', url: '/v1/auth/login', payload: { email: 'missing@example.com', password: 'WrongPass123' } });
    const wrong = await app.inject({ method: 'POST', url: '/v1/auth/login', payload: { email: 'person@example.com', password: 'WrongPass123' } });
    expect(unknown.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(unknown.json()).toEqual(wrong.json());
    expect(wrong.json()).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', retryable: false },
    });
  });

  it('rotates refresh tokens once and revokes the family on reuse', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser();
    const { app } = await createTestApp({ repository });
    const first = await login(app);

    const rotated = await app.inject({ method: 'POST', url: '/v1/auth/refresh', payload: { refreshToken: first.refreshToken } });
    expect(rotated.statusCode).toBe(200);
    const second = rotated.json<{ accessToken: string; refreshToken: string }>();
    expect(second.refreshToken).not.toBe(first.refreshToken);

    const reused = await app.inject({ method: 'POST', url: '/v1/auth/refresh', payload: { refreshToken: first.refreshToken } });
    expect(reused.statusCode).toBe(401);
    expect(reused.json()).toMatchObject({ error: { code: 'REFRESH_TOKEN_REUSED' } });

    const familyRevoked = await app.inject({ method: 'POST', url: '/v1/auth/refresh', payload: { refreshToken: second.refreshToken } });
    expect(familyRevoked.statusCode).toBe(401);
  });

  it('protects authenticated routes and accepts a valid access token', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser();
    const { app } = await createTestApp({ repository });
    const denied = await app.inject({ method: 'GET', url: '/v1/me' });
    expect(denied.statusCode).toBe(401);
    expect(denied.headers['www-authenticate']).toBe('Bearer');

    const tokens = await login(app);
    const allowed = await app.inject({ method: 'GET', url: '/v1/me', headers: { authorization: `Bearer ${tokens.accessToken}` } });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toMatchObject({ user: { id: tokens.user.id }, profile: { timezone: 'UTC' } });
  });

  it('enforces session ownership', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser({ email: 'one@example.com', password: 'SecurePass123' });
    repository.seedLocalUser({ email: 'two@example.com', password: 'SecurePass456' });
    const { app } = await createTestApp({ repository });
    const first = await login(app, 'one@example.com', 'SecurePass123');
    const second = await login(app, 'two@example.com', 'SecurePass456');
    const secondSessions = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${second.accessToken}` },
    });
    const otherSessionId = secondSessions.json<{ sessions: Array<{ id: string }> }>().sessions[0]?.id;
    expect(otherSessionId).toBeDefined();

    const denied = await app.inject({
      method: 'DELETE',
      url: `/v1/auth/sessions/${otherSessionId}`,
      headers: { authorization: `Bearer ${first.accessToken}` },
    });
    expect(denied.statusCode).toBe(404);

    const ownSessions = await app.inject({
      method: 'GET',
      url: '/v1/auth/sessions',
      headers: { authorization: `Bearer ${first.accessToken}` },
    });
    const ownSessionId = ownSessions.json<{ sessions: Array<{ id: string }> }>().sessions[0]?.id;
    const revoked = await app.inject({
      method: 'DELETE',
      url: `/v1/auth/sessions/${ownSessionId}`,
      headers: { authorization: `Bearer ${first.accessToken}` },
    });
    expect(revoked.statusCode).toBe(204);
  });
});

describe('profile', () => {
  it('rejects unknown, malformed, and untrusted profile fields and accepts a valid patch', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser();
    const { app } = await createTestApp({ repository });
    const tokens = await login(app);
    const headers = { authorization: `Bearer ${tokens.accessToken}` };

    for (const payload of [
      { role: 'admin' },
      { phone: '555-1234' },
      { timezone: 'Moon/SeaOfTranquility' },
      { avatarUrl: 'http://cdn.example.com/avatar.png' },
      { avatarUrl: 'https://evil.example/avatar.png' },
      { guidanceTopics: ['not-approved'] },
    ]) {
      const response = await app.inject({ method: 'PATCH', url: '/v1/me/profile', headers, payload });
      expect(response.statusCode).toBe(400);
    }

    const valid = await app.inject({
      method: 'PATCH',
      url: '/v1/me/profile',
      headers,
      payload: {
        displayName: 'Updated Person',
        avatarUrl: 'https://cdn.example.com/avatar.png',
        phone: '+14155552671',
        timezone: 'Asia/Kolkata',
        locale: 'en-IN',
        guidanceTopics: ['career', 'relationships'],
      },
    });
    expect(valid.statusCode).toBe(200);
    expect(valid.json()).toMatchObject({
      user: { displayName: 'Updated Person' },
      profile: { phone: '+14155552671', timezone: 'Asia/Kolkata' },
    });
  });
});

describe('OAuth broker', () => {
  it('enforces the redirect allowlist, consumes state once, and exchanges a one-time app code', async () => {
    const google = new FakeOAuthProvider('google');
    const { app } = await createTestApp({ google });

    const disallowed = await app.inject({
      method: 'GET',
      url: '/v1/auth/oauth/google/start?redirectUri=https%3A%2F%2Fevil.example%2Fcallback',
    });
    expect(disallowed.statusCode).toBe(400);
    expect(disallowed.json()).toMatchObject({ error: { code: 'INVALID_REDIRECT_URI' } });

    const start = await app.inject({
      method: 'GET',
      url: '/v1/auth/oauth/google/start?redirectUri=astrotalk%3A%2F%2Fauth%2Fcallback',
    });
    expect(start.statusCode).toBe(302);
    const authorizationUrl = new URL(start.headers.location ?? '');
    const state = authorizationUrl.searchParams.get('state');
    expect(state).toBeTruthy();
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe('https://api.example.com/v1/auth/oauth/google/callback');

    const wrongState = await app.inject({
      method: 'GET',
      url: `/v1/auth/oauth/google/callback?state=${'x'.repeat(43)}&code=provider-code`,
    });
    expect(wrongState.statusCode).toBe(400);

    const callback = await app.inject({
      method: 'GET',
      url: `/v1/auth/oauth/google/callback?state=${encodeURIComponent(state ?? '')}&code=provider-code`,
    });
    expect(callback.statusCode).toBe(302);
    const appRedirect = new URL(callback.headers.location ?? '');
    const exchangeCode = appRedirect.searchParams.get('code');
    expect(appRedirect.origin).toBe('null');
    expect(appRedirect.protocol).toBe('astrotalk:');
    expect(exchangeCode).toBeTruthy();
    expect(appRedirect.searchParams.has('accessToken')).toBe(false);
    expect(appRedirect.searchParams.has('refreshToken')).toBe(false);

    const stateReuse = await app.inject({
      method: 'GET',
      url: `/v1/auth/oauth/google/callback?state=${encodeURIComponent(state ?? '')}&code=provider-code`,
    });
    expect(stateReuse.statusCode).toBe(400);

    const exchanged = await app.inject({
      method: 'POST',
      url: '/v1/auth/oauth/exchange',
      payload: { code: exchangeCode, deviceName: 'OAuth phone' },
    });
    expect(exchanged.statusCode).toBe(200);
    expect(exchanged.json()).toMatchObject({ tokenType: 'Bearer', user: { email: 'google@example.com' } });

    const codeReuse = await app.inject({ method: 'POST', url: '/v1/auth/oauth/exchange', payload: { code: exchangeCode } });
    expect(codeReuse.statusCode).toBe(400);
    expect(codeReuse.json()).toMatchObject({ error: { code: 'INVALID_EXCHANGE_CODE' } });
  });

  it('handles provider denial without exposing provider details', async () => {
    const google = new FakeOAuthProvider('google');
    const { app } = await createTestApp({ google });
    const start = await app.inject({
      method: 'GET',
      url: '/v1/auth/oauth/google/start?redirectUri=astrotalk%3A%2F%2Fauth%2Fcallback',
    });
    const state = new URL(start.headers.location ?? '').searchParams.get('state');
    const callback = await app.inject({
      method: 'GET',
      url: `/v1/auth/oauth/google/callback?state=${encodeURIComponent(state ?? '')}&error=access_denied&error_description=private`,
    });
    expect(callback.statusCode).toBe(302);
    const redirect = new URL(callback.headers.location ?? '');
    expect(redirect.searchParams.get('error')).toBe('oauth_denied');
    expect(redirect.searchParams.has('error_description')).toBe(false);
    expect(google.exchangeCalls).toBe(0);
  });
});

describe('account recovery and deletion', () => {
  it('makes forgot-password responses indistinguishable for existing and missing users', async () => {
    const repository = new MemoryRepository();
    repository.seedLocalUser({ email: 'known@example.com' });
    const email = new FakeEmailProvider('sent');
    const { app } = await createTestApp({ repository, email });
    const known = await app.inject({ method: 'POST', url: '/v1/auth/forgot-password', payload: { email: 'known@example.com' } });
    const missing = await app.inject({ method: 'POST', url: '/v1/auth/forgot-password', payload: { email: 'missing@example.com' } });
    expect(known.statusCode).toBe(202);
    expect(missing.statusCode).toBe(202);
    expect(known.json()).toEqual(missing.json());
    expect(email.messages).toHaveLength(1);
  });

  it('requires the local password or the exact OAuth-only confirmation', async () => {
    const repository = new MemoryRepository();
    const local = repository.seedLocalUser({ email: 'local@example.com', password: 'SecurePass123' });
    const oauth = repository.seedOAuthUser({ email: 'oauth@example.com' });
    const { app, config } = await createTestApp({ repository });
    const localToken = await directAccessToken(config, local.id);
    const oauthToken = await directAccessToken(config, oauth.id);

    const noPassword = await app.inject({ method: 'DELETE', url: '/v1/me', headers: { authorization: `Bearer ${localToken}` }, payload: {} });
    expect(noPassword.statusCode).toBe(401);
    const wrongPassword = await app.inject({ method: 'DELETE', url: '/v1/me', headers: { authorization: `Bearer ${localToken}` }, payload: { password: 'wrong' } });
    expect(wrongPassword.statusCode).toBe(401);
    const deletedLocal = await app.inject({ method: 'DELETE', url: '/v1/me', headers: { authorization: `Bearer ${localToken}` }, payload: { password: 'SecurePass123' } });
    expect(deletedLocal.statusCode).toBe(204);

    const wrongConfirmation = await app.inject({ method: 'DELETE', url: '/v1/me', headers: { authorization: `Bearer ${oauthToken}` }, payload: { confirmation: 'delete' } });
    expect(wrongConfirmation.statusCode).toBe(400);
    const deletedOauth = await app.inject({ method: 'DELETE', url: '/v1/me', headers: { authorization: `Bearer ${oauthToken}` }, payload: { confirmation: 'DELETE' } });
    expect(deletedOauth.statusCode).toBe(204);
  });
});
