import { randomUUID } from 'node:crypto';

import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

import type {
    AccountStatus,
    AuthProvider,
    AuthUser,
    LoginRecord,
    NotificationPreferences,
    PrivacyPreferences,
    ProviderSummary,
    SafeAuditEvent,
    SessionRecord,
    UserBundle,
    UserExport,
    UserProfile,
} from '../domain/types.js';
import { GUIDANCE_TOPICS } from '../domain/types.js';
import type { PreferencesPatch, ProfilePatch } from '../schemas.js';
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
} from './repository.js';

interface Queryable {
  query<R extends QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}

interface UserRow extends QueryResultRow {
  id: string;
  email: string;
  display_name: string;
  email_verified_at: Date | string | null;
  account_status: AccountStatus;
  created_at: Date | string;
  updated_at: Date | string;
}

interface LoginRow extends UserRow {
  password_hash: string | null;
}

interface SessionRow extends QueryResultRow {
  id: string;
  user_id: string;
  family_id: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
  user_agent: string | null;
  device_label: string | null;
  created_at: Date | string;
  last_used_at: Date | string;
}

interface RefreshRow extends UserRow {
  session_id: string;
  user_id: string;
  family_id: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
}

interface BundleRow extends UserRow {
  avatar_url: string | null;
  bio: string | null;
  pronouns: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  guidance_topics: string[];
  notification_preferences: Record<string, unknown>;
  profile_created_at: Date | string;
  profile_updated_at: Date | string;
  analytics: boolean;
  personalization: boolean;
  privacy_marketing: boolean;
  profile_discoverable: boolean;
  privacy_created_at: Date | string;
  privacy_updated_at: Date | string;
}

interface ProviderRow extends QueryResultRow {
  provider: AuthProvider;
  provider_email: string | null;
  created_at: Date | string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function mapUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    emailVerifiedAt: row.email_verified_at === null ? null : toDate(row.email_verified_at),
    accountStatus: row.account_status,
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  };
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    familyId: row.family_id,
    expiresAt: toDate(row.expires_at),
    revokedAt: row.revoked_at === null ? null : toDate(row.revoked_at),
    userAgent: row.user_agent,
    deviceName: row.device_label,
    createdAt: toDate(row.created_at),
    lastUsedAt: toDate(row.last_used_at),
  };
}

function notificationPreferences(value: Record<string, unknown>): NotificationPreferences {
  return {
    email: value.email !== false,
    push: value.push !== false,
    marketing: value.marketing === true,
  };
}

function mapProfile(row: BundleRow): UserProfile {
  const topics = row.guidance_topics.filter((topic): topic is (typeof GUIDANCE_TOPICS)[number] =>
    (GUIDANCE_TOPICS as readonly string[]).includes(topic));
  return {
    avatarUrl: row.avatar_url,
    bio: row.bio,
    pronouns: row.pronouns,
    phone: row.phone,
    timezone: row.timezone,
    locale: row.locale,
    guidanceTopics: topics,
    notifications: notificationPreferences(row.notification_preferences),
    preferences: {},
    createdAt: toDate(row.profile_created_at),
    updatedAt: toDate(row.profile_updated_at),
  };
}

function mapPrivacy(row: BundleRow): PrivacyPreferences {
  return {
    analytics: row.analytics,
    personalization: row.personalization,
    marketing: row.privacy_marketing,
    profileDiscoverable: row.profile_discoverable,
    createdAt: toDate(row.privacy_created_at),
    updatedAt: toDate(row.privacy_updated_at),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export class PostgresRepository implements AppRepository {
  public constructor(private readonly pool: Pool) {}

  private async transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async audit(client: Queryable, userId: string | null, eventType: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await client.query(
      'INSERT INTO audit_events (id, user_id, event_type, metadata) VALUES ($1, $2, $3, $4::jsonb)',
      [randomUUID(), userId, eventType, JSON.stringify(metadata)],
    );
  }

  public async checkHealth(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  public async registerLocal(input: RegistrationInput): Promise<RegisterResult> {
    try {
      return await this.transaction(async (client) => {
        const result = await client.query<UserRow>(
          `INSERT INTO users (id, email, display_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $4)
           RETURNING *`,
          [input.userId, input.email, input.displayName, input.now],
        );
        await client.query('INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES ($1, $2, $2)', [input.userId, input.now]);
        await client.query('INSERT INTO privacy_preferences (user_id, created_at, updated_at) VALUES ($1, $2, $2)', [input.userId, input.now]);
        await client.query(
          `INSERT INTO auth_identities
             (id, user_id, provider, provider_subject, provider_email, password_hash, created_at, updated_at)
           VALUES ($1, $2, 'local', $3, $3, $4, $5, $5)`,
          [input.identityId, input.userId, input.email, input.passwordHash, input.now],
        );
        await client.query(
          `INSERT INTO email_action_tokens (id, user_id, kind, token_hash, expires_at, created_at)
           VALUES ($1, $2, 'verify_email', $3, $4, $5)`,
          [input.emailTokenId, input.userId, input.emailTokenHash, input.emailTokenExpiresAt, input.now],
        );
        await this.audit(client, input.userId, 'account.registered', { provider: 'local' });
        const row = result.rows[0];
        if (!row) throw new Error('User insert returned no row.');
        return { kind: 'created', user: mapUser(row) };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { kind: 'duplicate' };
      throw error;
    }
  }

  public async findLoginByEmail(email: string): Promise<LoginRecord | null> {
    const result = await this.pool.query<LoginRow>(
      `SELECT u.*, i.password_hash
       FROM users u
       LEFT JOIN auth_identities i ON i.user_id = u.id AND i.provider = 'local'
       WHERE u.email = $1`,
      [email],
    );
    const row = result.rows[0];
    return row ? { user: mapUser(row), passwordHash: row.password_hash } : null;
  }

  public async findAuthUser(userId: string): Promise<AuthUser | null> {
    const result = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
    const row = result.rows[0];
    return row ? mapUser(row) : null;
  }

  private async insertSession(client: Queryable, input: NewSession): Promise<SessionRecord> {
    const result = await client.query<SessionRow>(
      `INSERT INTO auth_sessions
         (id, user_id, refresh_token_hash, family_id, expires_at, user_agent, device_label, created_at, last_used_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING *`,
      [input.id, input.userId, input.refreshTokenHash, input.familyId, input.expiresAt, input.userAgent, input.deviceName, input.now],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Session insert returned no row.');
    return mapSession(row);
  }

  public async createSession(input: NewSession): Promise<SessionRecord> {
    return this.transaction(async (client) => {
      const session = await this.insertSession(client, input);
      await this.audit(client, input.userId, 'auth.login', { sessionId: input.id });
      return session;
    });
  }

  public async rotateSession(oldTokenHash: string, next: RotatedSessionMaterial): Promise<RotateSessionResult> {
    return this.transaction(async (client) => {
      const result = await client.query<RefreshRow>(
        `SELECT
           s.id AS session_id, s.user_id, s.family_id, s.expires_at, s.revoked_at,
           u.id, u.email, u.display_name, u.email_verified_at, u.account_status, u.created_at, u.updated_at
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.refresh_token_hash = $1
         FOR UPDATE OF s, u`,
        [oldTokenHash],
      );
      const row = result.rows[0];
      if (!row) return { kind: 'invalid' };

      if (row.revoked_at !== null) {
        await client.query(
          'UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE family_id = $2',
          [next.now, row.family_id],
        );
        await this.audit(client, row.user_id, 'auth.refresh_reuse_detected');
        return { kind: 'reuse' };
      }

      if (toDate(row.expires_at).getTime() <= next.now.getTime()) {
        await client.query('UPDATE auth_sessions SET revoked_at = $1, last_used_at = $1 WHERE id = $2', [next.now, row.session_id]);
        return { kind: 'invalid' };
      }

      if (row.account_status !== 'active' || row.email_verified_at === null) {
        await client.query('UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE family_id = $2', [next.now, row.family_id]);
        return { kind: 'disabled' };
      }

      const session = await this.insertSession(client, {
        ...next,
        userId: row.user_id,
        familyId: row.family_id,
      });
      await client.query(
        'UPDATE auth_sessions SET revoked_at = $1, replaced_by_session_id = $2, last_used_at = $1 WHERE id = $3',
        [next.now, next.id, row.session_id],
      );
      await this.audit(client, row.user_id, 'auth.refresh_rotated', { sessionId: next.id });
      return { kind: 'ok', user: mapUser(row), session };
    });
  }

  public async revokeSessionByToken(userId: string, refreshTokenHash: string, now: Date): Promise<boolean> {
    return this.transaction(async (client) => {
      const result = await client.query<{ id: string }>(
        `UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1), last_used_at = $1
         WHERE user_id = $2 AND refresh_token_hash = $3
         RETURNING id`,
        [now, userId, refreshTokenHash],
      );
      if (result.rowCount === 1) await this.audit(client, userId, 'auth.logout');
      return result.rowCount === 1;
    });
  }

  public async revokeSessionById(userId: string, sessionId: string, now: Date): Promise<boolean> {
    return this.transaction(async (client) => {
      const result = await client.query(
        `UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1), last_used_at = $1
         WHERE user_id = $2 AND id = $3`,
        [now, userId, sessionId],
      );
      if (result.rowCount === 1) await this.audit(client, userId, 'auth.session_revoked', { sessionId });
      return result.rowCount === 1;
    });
  }

  public async revokeAllSessions(userId: string, now: Date, exceptSessionId?: string): Promise<void> {
    await this.transaction(async (client) => {
      if (exceptSessionId) {
        await client.query(
          'UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE user_id = $2 AND id <> $3',
          [now, userId, exceptSessionId],
        );
      } else {
        await client.query('UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE user_id = $2', [now, userId]);
      }
      await this.audit(client, userId, 'auth.sessions_revoked');
    });
  }

  public async listSessions(userId: string, currentSessionId: string): Promise<SessionRecord[]> {
    const result = await this.pool.query<SessionRow>(
      `SELECT * FROM auth_sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY last_used_at DESC
       LIMIT 100`,
      [userId],
    );
    return result.rows.map((row) => ({ ...mapSession(row), current: row.id === currentSessionId }));
  }

  public async issueEmailAction(
    email: string,
    kind: 'verify_email' | 'reset_password',
    tokenId: string,
    tokenHash: string,
    expiresAt: Date,
    now: Date,
  ): Promise<EmailActionRecipient | null> {
    return this.transaction(async (client) => {
      const result = await client.query<UserRow>(
        `SELECT u.* FROM users u
         WHERE u.email = $1
           AND u.account_status = 'active'
           AND ($2::text <> 'verify_email' OR u.email_verified_at IS NULL)
           AND ($2::text <> 'reset_password' OR EXISTS (
             SELECT 1 FROM auth_identities i WHERE i.user_id = u.id AND i.provider = 'local'
           ))
         FOR UPDATE`,
        [email, kind],
      );
      const user = result.rows[0];
      if (!user) return null;
      await client.query(
        `UPDATE email_action_tokens SET consumed_at = $1
         WHERE user_id = $2 AND kind = $3 AND consumed_at IS NULL`,
        [now, user.id, kind],
      );
      await client.query(
        `INSERT INTO email_action_tokens (id, user_id, kind, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tokenId, user.id, kind, tokenHash, expiresAt, now],
      );
      await this.audit(client, user.id, kind === 'verify_email' ? 'email.verification_requested' : 'password.reset_requested');
      return { userId: user.id, email: user.email, displayName: user.display_name };
    });
  }

  public async consumeEmailVerification(tokenHash: string, now: Date): Promise<ConsumeTokenResult> {
    return this.transaction(async (client) => {
      const result = await client.query<{ token_id: string; user_id: string }>(
        `SELECT t.id AS token_id, t.user_id
         FROM email_action_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = $1 AND t.kind = 'verify_email'
           AND t.consumed_at IS NULL AND t.expires_at > $2 AND u.account_status = 'active'
         FOR UPDATE OF t, u`,
        [tokenHash, now],
      );
      const row = result.rows[0];
      if (!row) return 'invalid';
      await client.query('UPDATE email_action_tokens SET consumed_at = $1 WHERE id = $2', [now, row.token_id]);
      await client.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, $1) WHERE id = $2', [now, row.user_id]);
      await this.audit(client, row.user_id, 'email.verified');
      return 'consumed';
    });
  }

  public async consumePasswordReset(tokenHash: string, passwordHash: string, now: Date): Promise<ConsumeTokenResult> {
    return this.transaction(async (client) => {
      const result = await client.query<{ token_id: string; user_id: string }>(
        `SELECT t.id AS token_id, t.user_id
         FROM email_action_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = $1 AND t.kind = 'reset_password'
           AND t.consumed_at IS NULL AND t.expires_at > $2 AND u.account_status = 'active'
         FOR UPDATE OF t, u`,
        [tokenHash, now],
      );
      const row = result.rows[0];
      if (!row) return 'invalid';
      const updated = await client.query(
        `UPDATE auth_identities SET password_hash = $1
         WHERE user_id = $2 AND provider = 'local'`,
        [passwordHash, row.user_id],
      );
      if (updated.rowCount !== 1) return 'invalid';
      await client.query('UPDATE email_action_tokens SET consumed_at = $1 WHERE id = $2', [now, row.token_id]);
      await client.query('UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE user_id = $2', [now, row.user_id]);
      await this.audit(client, row.user_id, 'password.reset_completed');
      return 'consumed';
    });
  }

  public async changePassword(userId: string, passwordHash: string, now: Date, currentSessionId: string): Promise<boolean> {
    return this.transaction(async (client) => {
      const updated = await client.query(
        `UPDATE auth_identities SET password_hash = $1
         WHERE user_id = $2 AND provider = 'local'`,
        [passwordHash, userId],
      );
      if (updated.rowCount !== 1) return false;
      await client.query(
        'UPDATE auth_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE user_id = $2 AND id <> $3',
        [now, userId, currentSessionId],
      );
      await this.audit(client, userId, 'password.changed');
      return true;
    });
  }

  public async saveOAuthState(input: OAuthStateInput): Promise<void> {
    await this.transaction(async (client) => {
      await client.query(
        `INSERT INTO oauth_states (id, state_hash, provider, mobile_redirect_uri, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.id, input.stateHash, input.provider, input.redirectUri, input.expiresAt, input.now],
      );
    });
  }

  public async consumeOAuthState(stateHash: string, provider: 'google' | 'facebook', now: Date): Promise<ConsumeOAuthStateResult> {
    return this.transaction(async (client) => {
      const result = await client.query<{ mobile_redirect_uri: string }>(
        `UPDATE oauth_states SET consumed_at = $1
         WHERE state_hash = $2 AND provider = $3 AND consumed_at IS NULL AND expires_at > $1
         RETURNING mobile_redirect_uri`,
        [now, stateHash, provider],
      );
      const row = result.rows[0];
      return row ? { kind: 'ok', redirectUri: row.mobile_redirect_uri } : { kind: 'invalid' };
    });
  }

  public async finishOAuthLogin(input: OAuthLoginInput): Promise<OAuthLoginResult> {
    try {
      return await this.transaction(async (client) => {
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [input.identity.email]);
        const existingIdentity = await client.query<UserRow>(
          `SELECT u.* FROM auth_identities i
           JOIN users u ON u.id = i.user_id
           WHERE i.provider = $1 AND i.provider_subject = $2
           FOR UPDATE OF i, u`,
          [input.identity.provider, input.identity.subject],
        );

        let userRow = existingIdentity.rows[0];
        if (!userRow) {
          const existingEmail = await client.query<UserRow>('SELECT * FROM users WHERE email = $1 FOR UPDATE', [input.identity.email]);
          userRow = existingEmail.rows[0];
          if (userRow) {
            await client.query(
              `INSERT INTO auth_identities
                 (id, user_id, provider, provider_subject, provider_email, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $6)`,
              [input.identityId, userRow.id, input.identity.provider, input.identity.subject, input.identity.email, input.now],
            );
            const verified = await client.query<UserRow>(
              'UPDATE users SET email_verified_at = COALESCE(email_verified_at, $1) WHERE id = $2 RETURNING *',
              [input.now, userRow.id],
            );
            userRow = verified.rows[0];
          } else {
            const inserted = await client.query<UserRow>(
              `INSERT INTO users
                 (id, email, display_name, email_verified_at, account_status, created_at, updated_at)
               VALUES ($1, $2, $3, $4, 'active', $4, $4)
               RETURNING *`,
              [input.userId, input.identity.email, input.identity.displayName, input.now],
            );
            userRow = inserted.rows[0];
            await client.query('INSERT INTO user_profiles (user_id, created_at, updated_at) VALUES ($1, $2, $2)', [input.userId, input.now]);
            await client.query('INSERT INTO privacy_preferences (user_id, created_at, updated_at) VALUES ($1, $2, $2)', [input.userId, input.now]);
            await client.query(
              `INSERT INTO auth_identities
                 (id, user_id, provider, provider_subject, provider_email, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $6)`,
              [input.identityId, input.userId, input.identity.provider, input.identity.subject, input.identity.email, input.now],
            );
          }
        } else {
          await client.query(
            `UPDATE auth_identities SET provider_email = $1
             WHERE provider = $2 AND provider_subject = $3`,
            [input.identity.email, input.identity.provider, input.identity.subject],
          );
        }

        if (!userRow) throw new Error('OAuth user resolution returned no row.');
        if (userRow.account_status !== 'active') return { kind: 'disabled' };
        await client.query(
          `INSERT INTO oauth_exchange_codes (id, user_id, provider, code_hash, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [input.exchangeCodeId, userRow.id, input.identity.provider, input.exchangeCodeHash, input.exchangeCodeExpiresAt, input.now],
        );
        await this.audit(client, userRow.id, 'oauth.completed', { provider: input.identity.provider });
        return { kind: 'ok', user: mapUser(userRow) };
      });
    } catch (error) {
      if (isUniqueViolation(error)) return { kind: 'conflict' };
      throw error;
    }
  }

  public async consumeOAuthExchange(codeHash: string, session: SessionMaterial): Promise<OAuthExchangeResult> {
    return this.transaction(async (client) => {
      const result = await client.query<UserRow & { code_id: string }>(
        `SELECT c.id AS code_id,
           u.id, u.email, u.display_name, u.email_verified_at, u.account_status, u.created_at, u.updated_at
         FROM oauth_exchange_codes c
         JOIN users u ON u.id = c.user_id
         WHERE c.code_hash = $1 AND c.consumed_at IS NULL AND c.expires_at > $2
         FOR UPDATE OF c, u`,
        [codeHash, session.now],
      );
      const row = result.rows[0];
      if (!row) return { kind: 'invalid' };
      await client.query('UPDATE oauth_exchange_codes SET consumed_at = $1 WHERE id = $2', [session.now, row.code_id]);
      if (row.account_status !== 'active' || row.email_verified_at === null) return { kind: 'disabled' };
      const created = await this.insertSession(client, { ...session, userId: row.id });
      await this.audit(client, row.id, 'auth.login', { provider: 'oauth', sessionId: session.id });
      return { kind: 'ok', user: mapUser(row), session: created };
    });
  }

  private async getBundle(queryable: Queryable, userId: string): Promise<UserBundle | null> {
    const result = await queryable.query<BundleRow>(
      `SELECT
         u.id, u.email, u.display_name, u.email_verified_at, u.account_status, u.created_at, u.updated_at,
         p.avatar_url, p.bio, p.pronouns, p.phone, p.timezone, p.locale, p.guidance_topics,
         p.notification_preferences, p.created_at AS profile_created_at, p.updated_at AS profile_updated_at,
         pp.analytics, pp.personalization, pp.marketing AS privacy_marketing, pp.profile_discoverable,
         pp.created_at AS privacy_created_at, pp.updated_at AS privacy_updated_at
       FROM users u
       JOIN user_profiles p ON p.user_id = u.id
       JOIN privacy_preferences pp ON pp.user_id = u.id
       WHERE u.id = $1`,
      [userId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const providersResult = await queryable.query<ProviderRow>(
      `SELECT provider, provider_email, created_at
       FROM auth_identities WHERE user_id = $1 ORDER BY created_at`,
      [userId],
    );
    const providers: ProviderSummary[] = providersResult.rows.map((provider) => ({
      provider: provider.provider,
      providerEmail: provider.provider_email,
      linkedAt: toDate(provider.created_at),
    }));
    return {
      user: mapUser(row),
      profile: mapProfile(row),
      privacy: mapPrivacy(row),
      providers,
    };
  }

  public getUserBundle(userId: string): Promise<UserBundle | null> {
    return this.getBundle(this.pool, userId);
  }

  public async updateProfile(userId: string, patch: ProfilePatch, _now: Date): Promise<UserBundle | null> {
    return this.transaction(async (client) => {
      if (patch.displayName !== undefined) {
        await client.query('UPDATE users SET display_name = $1 WHERE id = $2', [patch.displayName, userId]);
      }
      const columns: Array<[string, unknown]> = [];
      if (patch.avatarUrl !== undefined) columns.push(['avatar_url', patch.avatarUrl]);
      if (patch.bio !== undefined) columns.push(['bio', patch.bio]);
      if (patch.pronouns !== undefined) columns.push(['pronouns', patch.pronouns]);
      if (patch.phone !== undefined) columns.push(['phone', patch.phone]);
      if (patch.timezone !== undefined) columns.push(['timezone', patch.timezone]);
      if (patch.locale !== undefined) columns.push(['locale', patch.locale]);
      if (patch.guidanceTopics !== undefined) columns.push(['guidance_topics', patch.guidanceTopics]);
      if (columns.length > 0) {
        const values = columns.map((entry) => entry[1]);
        values.push(userId);
        const assignments = columns.map(([column], index) => `${column} = $${index + 1}`).join(', ');
        await client.query(`UPDATE user_profiles SET ${assignments} WHERE user_id = $${values.length}`, values);
      }
      await this.audit(client, userId, 'profile.updated');
      return this.getBundle(client, userId);
    });
  }

  public async updatePreferences(userId: string, patch: PreferencesPatch, _now: Date): Promise<UserBundle | null> {
    return this.transaction(async (client) => {
      if (patch.notifications) {
        await client.query(
          `UPDATE user_profiles
           SET notification_preferences = notification_preferences || $1::jsonb
           WHERE user_id = $2`,
          [JSON.stringify(patch.notifications), userId],
        );
      }
      if (patch.privacy) {
        const columns: Array<[string, boolean]> = [];
        if (patch.privacy.analytics !== undefined) columns.push(['analytics', patch.privacy.analytics]);
        if (patch.privacy.personalization !== undefined) columns.push(['personalization', patch.privacy.personalization]);
        if (patch.privacy.marketing !== undefined) columns.push(['marketing', patch.privacy.marketing]);
        if (patch.privacy.profileDiscoverable !== undefined) columns.push(['profile_discoverable', patch.privacy.profileDiscoverable]);
        if (columns.length > 0) {
          const values: unknown[] = columns.map((entry) => entry[1]);
          values.push(userId);
          const assignments = columns.map(([column], index) => `${column} = $${index + 1}`).join(', ');
          await client.query(`UPDATE privacy_preferences SET ${assignments} WHERE user_id = $${values.length}`, values);
        }
      }
      await this.audit(client, userId, 'preferences.updated');
      return this.getBundle(client, userId);
    });
  }

  public async exportUser(userId: string, now: Date): Promise<UserExport | null> {
    const bundle = await this.getBundle(this.pool, userId);
    if (!bundle) return null;
    const result = await this.pool.query<{
      id: string;
      event_type: string;
      metadata: Record<string, unknown>;
      created_at: Date | string;
    }>(
      `SELECT id, event_type, metadata, created_at
       FROM audit_events WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    const auditEvents: SafeAuditEvent[] = result.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      metadata: row.metadata,
      createdAt: toDate(row.created_at),
    }));
    return { ...bundle, auditEvents, exportedAt: now };
  }

  public async getDeletionCredentials(userId: string): Promise<DeletionCredentials | null> {
    const result = await this.pool.query<{ password_hash: string | null; providers: string[] }>(
      `SELECT
         MAX(i.password_hash) FILTER (WHERE i.provider = 'local') AS password_hash,
         ARRAY_AGG(i.provider ORDER BY i.provider) AS providers
       FROM users u
       JOIN auth_identities i ON i.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId],
    );
    const row = result.rows[0];
    return row ? { passwordHash: row.password_hash, providers: row.providers } : null;
  }

  public async deleteAccount(userId: string, _now: Date): Promise<boolean> {
    return this.transaction(async (client) => {
      await this.audit(client, userId, 'account.deleted', { deletionType: 'user_requested' });
      const result = await client.query('DELETE FROM users WHERE id = $1', [userId]);
      return result.rowCount === 1;
    });
  }
}
