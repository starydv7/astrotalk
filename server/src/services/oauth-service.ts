import { randomUUID } from 'node:crypto';

import type { AppConfig } from '../config.js';
import type { OAuthProviderName } from '../domain/types.js';
import { randomOpaqueToken, sha256 } from '../lib/crypto.js';
import { AppError } from '../lib/errors.js';
import type { OAuthProviderClient } from '../oauth/provider.js';
import type { AppRepository } from '../repositories/repository.js';

const STATE_LIFETIME_MS = 10 * 60 * 1_000;
const EXCHANGE_CODE_LIFETIME_MS = 60 * 1_000;

export class OAuthService {
  public constructor(
    private readonly repository: AppRepository,
    private readonly providers: ReadonlyMap<OAuthProviderName, OAuthProviderClient>,
    private readonly config: AppConfig,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private provider(providerName: OAuthProviderName): OAuthProviderClient {
    const provider = this.providers.get(providerName);
    if (!provider) throw new AppError(503, 'OAUTH_PROVIDER_UNAVAILABLE', 'This sign-in provider is not configured.', true);
    return provider;
  }

  private callbackUrl(provider: OAuthProviderName): string {
    return `${this.config.publicApiUrl}/v1/auth/oauth/${provider}/callback`;
  }

  private errorRedirect(redirectUri: string, code: string): string {
    const url = new URL(redirectUri);
    url.searchParams.set('error', code);
    return url.toString();
  }

  public async start(providerName: OAuthProviderName, redirectUri: string): Promise<string> {
    if (!this.config.oauthRedirectAllowlist.has(redirectUri)) {
      throw new AppError(400, 'INVALID_REDIRECT_URI', 'The redirect URI is not allowed.');
    }
    const provider = this.provider(providerName);
    const now = this.clock();
    const state = randomOpaqueToken();
    await this.repository.saveOAuthState({
      id: randomUUID(),
      stateHash: sha256(state),
      provider: providerName,
      redirectUri,
      expiresAt: new Date(now.getTime() + STATE_LIFETIME_MS),
      now,
    });
    return provider.authorizationUrl(state, this.callbackUrl(providerName));
  }

  public async callback(
    providerName: OAuthProviderName,
    input: { state?: string; code?: string; error?: string },
  ): Promise<string> {
    if (!input.state) throw new AppError(400, 'INVALID_OAUTH_STATE', 'OAuth state is missing or invalid.');
    const state = await this.repository.consumeOAuthState(sha256(input.state), providerName, this.clock());
    if (state.kind === 'invalid') throw new AppError(400, 'INVALID_OAUTH_STATE', 'OAuth state is missing or invalid.');
    if (input.error) return this.errorRedirect(state.redirectUri, 'oauth_denied');
    if (!input.code) return this.errorRedirect(state.redirectUri, 'oauth_failed');

    let identity;
    try {
      identity = await this.provider(providerName).exchangeCode(input.code, this.callbackUrl(providerName));
    } catch (error) {
      if (error instanceof AppError && error.statusCode < 500) {
        return this.errorRedirect(state.redirectUri, 'oauth_email_unavailable');
      }
      if (error instanceof AppError) return this.errorRedirect(state.redirectUri, 'oauth_provider_failed');
      throw error;
    }
    if (!identity.emailVerified) return this.errorRedirect(state.redirectUri, 'oauth_email_unverified');

    const now = this.clock();
    const exchangeCode = randomOpaqueToken();
    const result = await this.repository.finishOAuthLogin({
      identity,
      userId: randomUUID(),
      identityId: randomUUID(),
      exchangeCodeId: randomUUID(),
      exchangeCodeHash: sha256(exchangeCode),
      exchangeCodeExpiresAt: new Date(now.getTime() + EXCHANGE_CODE_LIFETIME_MS),
      now,
    });
    if (result.kind === 'disabled') return this.errorRedirect(state.redirectUri, 'account_unavailable');
    if (result.kind === 'conflict') return this.errorRedirect(state.redirectUri, 'oauth_conflict');
    const redirect = new URL(state.redirectUri);
    redirect.searchParams.set('code', exchangeCode);
    return redirect.toString();
  }
}
