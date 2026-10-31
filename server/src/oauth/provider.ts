import { z } from 'zod';

import type { AppConfig } from '../config.js';
import type { OAuthIdentity, OAuthProviderName } from '../domain/types.js';
import { AppError } from '../lib/errors.js';

export interface OAuthProviderClient {
  readonly name: OAuthProviderName;
  authorizationUrl(state: string, callbackUrl: string): string;
  exchangeCode(code: string, callbackUrl: string): Promise<OAuthIdentity>;
}

const tokenResponseSchema = z.object({ access_token: z.string().min(1) }).passthrough();
const googleProfileSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  email_verified: z.boolean(),
  name: z.string().min(1).max(80).optional(),
});
const facebookProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
});

async function providerFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new AppError(502, 'OAUTH_PROVIDER_ERROR', 'The identity provider could not complete sign-in.', true);
    return response;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'OAUTH_PROVIDER_ERROR', 'The identity provider could not complete sign-in.', true);
  } finally {
    clearTimeout(timeout);
  }
}

export class GoogleOAuthProvider implements OAuthProviderClient {
  public readonly name = 'google' as const;

  public constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly timeoutMs: number,
  ) {}

  public authorizationUrl(state: string, callbackUrl: string): string {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    }).toString();
    return url.toString();
  }

  public async exchangeCode(code: string, callbackUrl: string): Promise<OAuthIdentity> {
    const tokenResponse = await providerFetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    }, this.timeoutMs);
    const token = tokenResponseSchema.safeParse(await tokenResponse.json());
    if (!token.success) throw new AppError(502, 'OAUTH_PROVIDER_ERROR', 'The identity provider returned an invalid response.', true);

    const profileResponse = await providerFetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${token.data.access_token}` },
    }, this.timeoutMs);
    const profile = googleProfileSchema.safeParse(await profileResponse.json());
    if (!profile.success || !profile.data.email_verified) {
      throw new AppError(403, 'OAUTH_EMAIL_UNVERIFIED', 'A verified provider email is required.');
    }
    return {
      provider: this.name,
      subject: profile.data.sub,
      email: profile.data.email.trim().toLowerCase(),
      emailVerified: true,
      displayName: profile.data.name ?? 'AstroTalk User',
    };
  }
}

export class FacebookOAuthProvider implements OAuthProviderClient {
  public readonly name = 'facebook' as const;

  public constructor(
    private readonly appId: string,
    private readonly appSecret: string,
    private readonly apiVersion: string,
    private readonly timeoutMs: number,
  ) {}

  public authorizationUrl(state: string, callbackUrl: string): string {
    const url = new URL(`https://www.facebook.com/${this.apiVersion}/dialog/oauth`);
    url.search = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    }).toString();
    return url.toString();
  }

  public async exchangeCode(code: string, callbackUrl: string): Promise<OAuthIdentity> {
    const tokenResponse = await providerFetch(`https://graph.facebook.com/${this.apiVersion}/oauth/access_token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.appId,
        client_secret: this.appSecret,
        redirect_uri: callbackUrl,
      }),
    }, this.timeoutMs);
    const token = tokenResponseSchema.safeParse(await tokenResponse.json());
    if (!token.success) throw new AppError(502, 'OAUTH_PROVIDER_ERROR', 'The identity provider returned an invalid response.', true);

    const profileUrl = new URL(`https://graph.facebook.com/${this.apiVersion}/me`);
    profileUrl.search = new URLSearchParams({ fields: 'id,name,email' }).toString();
    const profileResponse = await providerFetch(profileUrl.toString(), {
      headers: { authorization: `Bearer ${token.data.access_token}` },
    }, this.timeoutMs);
    const profile = facebookProfileSchema.safeParse(await profileResponse.json());
    if (!profile.success) throw new AppError(403, 'OAUTH_EMAIL_REQUIRED', 'A provider email is required.');
    return {
      provider: this.name,
      subject: profile.data.id,
      email: profile.data.email.trim().toLowerCase(),
      // Facebook does not expose an email_verified field; email returned by this endpoint is provider-controlled.
      emailVerified: true,
      displayName: profile.data.name ?? 'AstroTalk User',
    };
  }
}

export function createOAuthProviders(config: AppConfig): Map<OAuthProviderName, OAuthProviderClient> {
  const providers = new Map<OAuthProviderName, OAuthProviderClient>();
  if (config.googleClientId && config.googleClientSecret) {
    providers.set('google', new GoogleOAuthProvider(config.googleClientId, config.googleClientSecret, config.oauthHttpTimeoutMs));
  }
  if (config.facebookAppId && config.facebookAppSecret) {
    providers.set('facebook', new FacebookOAuthProvider(
      config.facebookAppId,
      config.facebookAppSecret,
      config.facebookApiVersion,
      config.oauthHttpTimeoutMs,
    ));
  }
  return providers;
}
