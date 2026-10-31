import type {
    AuthUser,
    LoginRecord,
    OAuthIdentity,
    OAuthProviderName,
    SessionRecord,
    UserBundle,
    UserExport,
} from '../domain/types.js';
import type { PreferencesPatch, ProfilePatch } from '../schemas.js';

export interface SessionMaterial {
  id: string;
  familyId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  deviceName: string | null;
  now: Date;
}

export interface NewSession extends SessionMaterial {
  userId: string;
}

export type RotatedSessionMaterial = Omit<SessionMaterial, 'familyId'>;

export interface RegistrationInput {
  userId: string;
  identityId: string;
  emailTokenId: string;
  email: string;
  displayName: string;
  passwordHash: string;
  emailTokenHash: string;
  emailTokenExpiresAt: Date;
  now: Date;
}

export type RegisterResult = { kind: 'created'; user: AuthUser } | { kind: 'duplicate' };

export type RotateSessionResult =
  | { kind: 'ok'; user: AuthUser; session: SessionRecord }
  | { kind: 'invalid' }
  | { kind: 'reuse' }
  | { kind: 'disabled' };

export interface EmailActionRecipient {
  userId: string;
  email: string;
  displayName: string;
}

export type ConsumeTokenResult = 'consumed' | 'invalid';

export interface OAuthStateInput {
  id: string;
  stateHash: string;
  provider: OAuthProviderName;
  redirectUri: string;
  expiresAt: Date;
  now: Date;
}

export type ConsumeOAuthStateResult =
  | { kind: 'ok'; redirectUri: string }
  | { kind: 'invalid' };

export interface OAuthLoginInput {
  identity: OAuthIdentity;
  userId: string;
  identityId: string;
  exchangeCodeId: string;
  exchangeCodeHash: string;
  exchangeCodeExpiresAt: Date;
  now: Date;
}

export type OAuthLoginResult =
  | { kind: 'ok'; user: AuthUser }
  | { kind: 'disabled' }
  | { kind: 'conflict' };

export type OAuthExchangeResult =
  | { kind: 'ok'; user: AuthUser; session: SessionRecord }
  | { kind: 'invalid' }
  | { kind: 'disabled' };

export interface DeletionCredentials {
  passwordHash: string | null;
  providers: string[];
}

export interface AppRepository {
  checkHealth(): Promise<void>;
  registerLocal(input: RegistrationInput): Promise<RegisterResult>;
  findLoginByEmail(email: string): Promise<LoginRecord | null>;
  findAuthUser(userId: string): Promise<AuthUser | null>;
  createSession(input: NewSession): Promise<SessionRecord>;
  rotateSession(oldTokenHash: string, next: RotatedSessionMaterial): Promise<RotateSessionResult>;
  revokeSessionByToken(userId: string, refreshTokenHash: string, now: Date): Promise<boolean>;
  revokeSessionById(userId: string, sessionId: string, now: Date): Promise<boolean>;
  revokeAllSessions(userId: string, now: Date, exceptSessionId?: string): Promise<void>;
  listSessions(userId: string, currentSessionId: string): Promise<SessionRecord[]>;
  issueEmailAction(email: string, kind: 'verify_email' | 'reset_password', tokenId: string, tokenHash: string, expiresAt: Date, now: Date): Promise<EmailActionRecipient | null>;
  consumeEmailVerification(tokenHash: string, now: Date): Promise<ConsumeTokenResult>;
  consumePasswordReset(tokenHash: string, passwordHash: string, now: Date): Promise<ConsumeTokenResult>;
  changePassword(userId: string, passwordHash: string, now: Date, currentSessionId: string): Promise<boolean>;
  saveOAuthState(input: OAuthStateInput): Promise<void>;
  consumeOAuthState(stateHash: string, provider: OAuthProviderName, now: Date): Promise<ConsumeOAuthStateResult>;
  finishOAuthLogin(input: OAuthLoginInput): Promise<OAuthLoginResult>;
  consumeOAuthExchange(codeHash: string, session: SessionMaterial): Promise<OAuthExchangeResult>;
  getUserBundle(userId: string): Promise<UserBundle | null>;
  updateProfile(userId: string, patch: ProfilePatch, now: Date): Promise<UserBundle | null>;
  updatePreferences(userId: string, patch: PreferencesPatch, now: Date): Promise<UserBundle | null>;
  exportUser(userId: string, now: Date): Promise<UserExport | null>;
  getDeletionCredentials(userId: string): Promise<DeletionCredentials | null>;
  deleteAccount(userId: string, now: Date): Promise<boolean>;
}
