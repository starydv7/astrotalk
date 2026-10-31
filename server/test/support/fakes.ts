import { randomUUID } from 'node:crypto';

import type { PasswordHasher } from '../../src/auth/password.js';
import type { AppConfig } from '../../src/config.js';
import type {
  AuthProvider,
  AuthUser,
  OAuthIdentity,
  OAuthProviderName,
  SessionRecord,
  UserBundle,
  UserExport,
} from '../../src/domain/types.js';
import type { DeliveryStatus, EmailMessage, EmailProvider } from '../../src/email/email-provider.js';
import type { OAuthProviderClient } from '../../src/oauth/provider.js';
import type {
  AppRepository,
  ConsumeOAuthStateResult,
  ConsumeTokenResult,
  DeletionCredentials,
  EmailActionRecipient,
  NewSession,
  OAuthExchangeResult,
  OAuthLoginInput,
  OAuthLoginResult,
  OAuthStateInput,
  RegisterResult,
  RegistrationInput,
  RotatedSessionMaterial,
  RotateSessionResult,
  SessionMaterial,
} from '../../src/repositories/repository.js';
import type { PreferencesPatch, ProfilePatch } from '../../src/schemas.js';

interface StoredUser {
  bundle: UserBundle;
  passwordHash: string | null;
}

interface StoredAction {
  userId: string;
  kind: 'verify_email' | 'reset_password';
  expiresAt: Date;
  consumed: boolean;
}

interface StoredState {
  provider: OAuthProviderName;
  redirectUri: string;
  expiresAt: Date;
  consumed: boolean;
}

interface StoredExchange {
  userId: string;
  expiresAt: Date;
  consumed: boolean;
}

export class FakePasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return `fake:${password}`;
  }

  public async verify(passwordHash: string | null, candidate: string): Promise<boolean> {
    return passwordHash === `fake:${candidate}`;
  }
}

export class FakeEmailProvider implements EmailProvider {
  public readonly messages: EmailMessage[] = [];

  public constructor(public status: DeliveryStatus = 'sent') {}

  public async send(message: EmailMessage): Promise<DeliveryStatus> {
    this.messages.push(message);
    return this.status;
  }
}

export class FakeOAuthProvider implements OAuthProviderClient {
  public exchangeCalls = 0;

  public constructor(
    public readonly name: OAuthProviderName,
    public identity: OAuthIdentity = {
      provider: name,
      subject: `${name}-subject`,
      email: `${name}@example.com`,
      emailVerified: true,
      displayName: `${name} user`,
    },
  ) {}

  public authorizationUrl(state: string, callbackUrl: string): string {
    const url = new URL(`https://provider.example/${this.name}/authorize`);
    url.searchParams.set('state', state);
    url.searchParams.set('redirect_uri', callbackUrl);
    return url.toString();
  }

  public async exchangeCode(_code: string, _callbackUrl: string): Promise<OAuthIdentity> {
    this.exchangeCalls += 1;
    return this.identity;
  }
}

export class MemoryRepository implements AppRepository {
  private readonly users = new Map<string, StoredUser>();
  private readonly userByEmail = new Map<string, string>();
  private readonly sessions = new Map<string, SessionRecord & { refreshTokenHash: string }>();
  private readonly actions = new Map<string, StoredAction>();
  private readonly states = new Map<string, StoredState>();
  private readonly exchanges = new Map<string, StoredExchange>();
  private readonly oauthIdentityUsers = new Map<string, string>();
  public healthy = true;

  public seedLocalUser(input: {
    email?: string;
    password?: string;
    verified?: boolean;
    status?: AuthUser['accountStatus'];
    displayName?: string;
  } = {}): AuthUser {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const user: AuthUser = {
      id: randomUUID(),
      email: input.email ?? 'person@example.com',
      displayName: input.displayName ?? 'Test Person',
      emailVerifiedAt: input.verified === false ? null : now,
      accountStatus: input.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    };
    const stored = this.createStoredUser(user, [{ provider: 'local', providerEmail: user.email, linkedAt: now }]);
    stored.passwordHash = `fake:${input.password ?? 'SecurePass123'}`;
    this.users.set(user.id, stored);
    this.userByEmail.set(user.email, user.id);
    return user;
  }

  public seedOAuthUser(input: { email?: string; provider?: OAuthProviderName } = {}): AuthUser {
    const provider = input.provider ?? 'google';
    const now = new Date('2026-01-01T00:00:00.000Z');
    const user: AuthUser = {
      id: randomUUID(),
      email: input.email ?? 'oauth@example.com',
      displayName: 'OAuth Person',
      emailVerifiedAt: now,
      accountStatus: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, this.createStoredUser(user, [{ provider, providerEmail: user.email, linkedAt: now }]));
    this.userByEmail.set(user.email, user.id);
    this.oauthIdentityUsers.set(`${provider}:${provider}-subject`, user.id);
    return user;
  }

  private createStoredUser(user: AuthUser, providers: UserBundle['providers']): StoredUser {
    const now = user.createdAt;
    return {
      passwordHash: null,
      bundle: {
        user,
        profile: {
          avatarUrl: null,
          bio: null,
          pronouns: null,
          phone: null,
          timezone: 'UTC',
          locale: 'en',
          guidanceTopics: [],
          notifications: { email: true, push: true, marketing: false },
          preferences: {},
          createdAt: now,
          updatedAt: now,
        },
        privacy: {
          analytics: false,
          personalization: false,
          marketing: false,
          profileDiscoverable: false,
          createdAt: now,
          updatedAt: now,
        },
        providers,
      },
    };
  }

  public async checkHealth(): Promise<void> {
    if (!this.healthy) throw new Error('unhealthy');
  }

  public async registerLocal(input: RegistrationInput): Promise<RegisterResult> {
    if (this.userByEmail.has(input.email)) return { kind: 'duplicate' };
    const user: AuthUser = {
      id: input.userId,
      email: input.email,
      displayName: input.displayName,
      emailVerifiedAt: null,
      accountStatus: 'active',
      createdAt: input.now,
      updatedAt: input.now,
    };
    const stored = this.createStoredUser(user, [{ provider: 'local', providerEmail: input.email, linkedAt: input.now }]);
    stored.passwordHash = input.passwordHash;
    this.users.set(user.id, stored);
    this.userByEmail.set(user.email, user.id);
    this.actions.set(input.emailTokenHash, {
      userId: user.id,
      kind: 'verify_email',
      expiresAt: input.emailTokenExpiresAt,
      consumed: false,
    });
    return { kind: 'created', user };
  }

  public async findLoginByEmail(email: string) {
    const id = this.userByEmail.get(email);
    const stored = id ? this.users.get(id) : undefined;
    return stored ? { user: stored.bundle.user, passwordHash: stored.passwordHash } : null;
  }

  public async findAuthUser(userId: string): Promise<AuthUser | null> {
    return this.users.get(userId)?.bundle.user ?? null;
  }

  private materializeSession(input: NewSession): SessionRecord & { refreshTokenHash: string } {
    return {
      id: input.id,
      userId: input.userId,
      familyId: input.familyId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      userAgent: input.userAgent,
      deviceName: input.deviceName,
      createdAt: input.now,
      lastUsedAt: input.now,
    };
  }

  public async createSession(input: NewSession): Promise<SessionRecord> {
    const session = this.materializeSession(input);
    this.sessions.set(session.id, session);
    return session;
  }

  public async rotateSession(oldTokenHash: string, next: RotatedSessionMaterial): Promise<RotateSessionResult> {
    const old = [...this.sessions.values()].find((session) => session.refreshTokenHash === oldTokenHash);
    if (!old) return { kind: 'invalid' };
    if (old.revokedAt) {
      for (const session of this.sessions.values()) {
        if (session.familyId === old.familyId && !session.revokedAt) session.revokedAt = next.now;
      }
      return { kind: 'reuse' };
    }
    if (old.expiresAt.getTime() <= next.now.getTime()) {
      old.revokedAt = next.now;
      return { kind: 'invalid' };
    }
    const user = this.users.get(old.userId)?.bundle.user;
    if (!user || user.accountStatus !== 'active' || !user.emailVerifiedAt) return { kind: 'disabled' };
    old.revokedAt = next.now;
    old.lastUsedAt = next.now;
    const session = this.materializeSession({ ...next, userId: old.userId, familyId: old.familyId });
    this.sessions.set(session.id, session);
    return { kind: 'ok', user, session };
  }

  public async revokeSessionByToken(userId: string, refreshTokenHash: string, now: Date): Promise<boolean> {
    const session = [...this.sessions.values()].find((candidate) => candidate.userId === userId && candidate.refreshTokenHash === refreshTokenHash);
    if (!session) return false;
    session.revokedAt ??= now;
    return true;
  }

  public async revokeSessionById(userId: string, sessionId: string, now: Date): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) return false;
    session.revokedAt ??= now;
    return true;
  }

  public async revokeAllSessions(userId: string, now: Date, exceptSessionId?: string): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.id !== exceptSessionId) session.revokedAt ??= now;
    }
  }

  public async listSessions(userId: string, currentSessionId: string): Promise<SessionRecord[]> {
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId && !session.revokedAt)
      .map(({ refreshTokenHash: _hash, ...session }) => ({ ...session, current: session.id === currentSessionId }));
  }

  public async issueEmailAction(
    email: string,
    kind: 'verify_email' | 'reset_password',
    _tokenId: string,
    tokenHash: string,
    expiresAt: Date,
    _now: Date,
  ): Promise<EmailActionRecipient | null> {
    const id = this.userByEmail.get(email);
    const stored = id ? this.users.get(id) : undefined;
    if (!stored || stored.bundle.user.accountStatus !== 'active') return null;
    if (kind === 'verify_email' && stored.bundle.user.emailVerifiedAt) return null;
    if (kind === 'reset_password' && !stored.passwordHash) return null;
    this.actions.set(tokenHash, { userId: stored.bundle.user.id, kind, expiresAt, consumed: false });
    return { userId: stored.bundle.user.id, email, displayName: stored.bundle.user.displayName };
  }

  public async consumeEmailVerification(tokenHash: string, now: Date): Promise<ConsumeTokenResult> {
    const action = this.actions.get(tokenHash);
    if (!action || action.kind !== 'verify_email' || action.consumed || action.expiresAt <= now) return 'invalid';
    action.consumed = true;
    const user = this.users.get(action.userId)?.bundle.user;
    if (!user) return 'invalid';
    user.emailVerifiedAt = now;
    user.updatedAt = now;
    return 'consumed';
  }

  public async consumePasswordReset(tokenHash: string, passwordHash: string, now: Date): Promise<ConsumeTokenResult> {
    const action = this.actions.get(tokenHash);
    if (!action || action.kind !== 'reset_password' || action.consumed || action.expiresAt <= now) return 'invalid';
    const user = this.users.get(action.userId);
    if (!user?.passwordHash) return 'invalid';
    action.consumed = true;
    user.passwordHash = passwordHash;
    await this.revokeAllSessions(action.userId, now);
    return 'consumed';
  }

  public async changePassword(userId: string, passwordHash: string, now: Date, currentSessionId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user?.passwordHash) return false;
    user.passwordHash = passwordHash;
    await this.revokeAllSessions(userId, now, currentSessionId);
    return true;
  }

  public async saveOAuthState(input: OAuthStateInput): Promise<void> {
    this.states.set(input.stateHash, {
      provider: input.provider,
      redirectUri: input.redirectUri,
      expiresAt: input.expiresAt,
      consumed: false,
    });
  }

  public async consumeOAuthState(stateHash: string, provider: OAuthProviderName, now: Date): Promise<ConsumeOAuthStateResult> {
    const state = this.states.get(stateHash);
    if (!state || state.provider !== provider || state.consumed || state.expiresAt <= now) return { kind: 'invalid' };
    state.consumed = true;
    return { kind: 'ok', redirectUri: state.redirectUri };
  }

  public async finishOAuthLogin(input: OAuthLoginInput): Promise<OAuthLoginResult> {
    const identityKey = `${input.identity.provider}:${input.identity.subject}`;
    let userId = this.oauthIdentityUsers.get(identityKey) ?? this.userByEmail.get(input.identity.email);
    let user = userId ? this.users.get(userId) : undefined;
    if (!user) {
      const authUser: AuthUser = {
        id: input.userId,
        email: input.identity.email,
        displayName: input.identity.displayName,
        emailVerifiedAt: input.now,
        accountStatus: 'active',
        createdAt: input.now,
        updatedAt: input.now,
      };
      user = this.createStoredUser(authUser, [{
        provider: input.identity.provider,
        providerEmail: input.identity.email,
        linkedAt: input.now,
      }]);
      userId = authUser.id;
      this.users.set(userId, user);
      this.userByEmail.set(authUser.email, userId);
    } else if (!user.bundle.providers.some((provider) => provider.provider === input.identity.provider)) {
      user.bundle.providers.push({ provider: input.identity.provider, providerEmail: input.identity.email, linkedAt: input.now });
      user.bundle.user.emailVerifiedAt ??= input.now;
    }
    if (!userId || !user) throw new Error('Fake OAuth user resolution failed.');
    if (user.bundle.user.accountStatus !== 'active') return { kind: 'disabled' };
    this.oauthIdentityUsers.set(identityKey, userId);
    this.exchanges.set(input.exchangeCodeHash, { userId, expiresAt: input.exchangeCodeExpiresAt, consumed: false });
    return { kind: 'ok', user: user.bundle.user };
  }

  public async consumeOAuthExchange(codeHash: string, session: SessionMaterial): Promise<OAuthExchangeResult> {
    const exchange = this.exchanges.get(codeHash);
    if (!exchange || exchange.consumed || exchange.expiresAt <= session.now) return { kind: 'invalid' };
    exchange.consumed = true;
    const user = this.users.get(exchange.userId)?.bundle.user;
    if (!user || user.accountStatus !== 'active') return { kind: 'disabled' };
    const created = await this.createSession({ ...session, userId: user.id });
    return { kind: 'ok', user, session: created };
  }

  public async getUserBundle(userId: string): Promise<UserBundle | null> {
    return this.users.get(userId)?.bundle ?? null;
  }

  public async updateProfile(userId: string, patch: ProfilePatch, now: Date): Promise<UserBundle | null> {
    const stored = this.users.get(userId);
    if (!stored) return null;
    if (patch.displayName !== undefined) stored.bundle.user.displayName = patch.displayName;
    if (patch.avatarUrl !== undefined) stored.bundle.profile.avatarUrl = patch.avatarUrl;
    if (patch.bio !== undefined) stored.bundle.profile.bio = patch.bio;
    if (patch.pronouns !== undefined) stored.bundle.profile.pronouns = patch.pronouns;
    if (patch.phone !== undefined) stored.bundle.profile.phone = patch.phone;
    if (patch.timezone !== undefined) stored.bundle.profile.timezone = patch.timezone;
    if (patch.locale !== undefined) stored.bundle.profile.locale = patch.locale;
    if (patch.guidanceTopics !== undefined) stored.bundle.profile.guidanceTopics = patch.guidanceTopics;
    stored.bundle.profile.updatedAt = now;
    stored.bundle.user.updatedAt = now;
    return stored.bundle;
  }

  public async updatePreferences(userId: string, patch: PreferencesPatch, now: Date): Promise<UserBundle | null> {
    const stored = this.users.get(userId);
    if (!stored) return null;
    if (patch.notifications) Object.assign(stored.bundle.profile.notifications, patch.notifications);
    if (patch.privacy) Object.assign(stored.bundle.privacy, patch.privacy);
    stored.bundle.profile.updatedAt = now;
    stored.bundle.privacy.updatedAt = now;
    return stored.bundle;
  }

  public async exportUser(userId: string, now: Date): Promise<UserExport | null> {
    const bundle = this.users.get(userId)?.bundle;
    return bundle ? { ...bundle, auditEvents: [], exportedAt: now } : null;
  }

  public async getDeletionCredentials(userId: string): Promise<DeletionCredentials | null> {
    const stored = this.users.get(userId);
    if (!stored) return null;
    return {
      passwordHash: stored.passwordHash,
      providers: stored.bundle.providers.map((provider) => provider.provider),
    };
  }

  public async deleteAccount(userId: string, _now: Date): Promise<boolean> {
    const stored = this.users.get(userId);
    if (!stored) return false;
    this.users.delete(userId);
    this.userByEmail.delete(stored.bundle.user.email);
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) this.sessions.delete(sessionId);
    }
    return true;
  }
}

export function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 3000,
    databaseUrl: 'postgres://unused',
    databaseSsl: false,
    databasePoolMax: 2,
    accessTokenSecret: 'test-secret-with-at-least-thirty-two-bytes-123',
    accessTokenIssuer: 'astrotalk-test',
    accessTokenAudience: 'astrotalk-test-client',
    corsOrigins: ['https://app.example.com'],
    publicApiUrl: 'https://api.example.com',
    appPublicUrl: 'astrotalk://app/',
    oauthRedirectAllowlist: new Set(['astrotalk://auth/callback', 'https://app.example.com/auth/callback']),
    avatarUrlAllowedHosts: new Set(['cdn.example.com']),
    emailDeliveryMode: 'disabled',
    facebookApiVersion: 'v22.0',
    oauthHttpTimeoutMs: 5_000,
    trustProxy: false,
    logLevel: 'silent',
    ...overrides,
  };
}

export function providerMap(...providers: OAuthProviderClient[]): ReadonlyMap<OAuthProviderName, OAuthProviderClient> {
  return new Map(providers.map((provider) => [provider.name, provider]));
}

export function hasProvider(bundle: UserBundle, provider: AuthProvider): boolean {
  return bundle.providers.some((entry) => entry.provider === provider);
}
