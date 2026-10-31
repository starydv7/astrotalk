import { randomUUID } from 'node:crypto';

import type { AccessTokenService } from '../auth/access-token.js';
import type { PasswordHasher } from '../auth/password.js';
import type { AppConfig } from '../config.js';
import type { AuthUser, SessionRecord } from '../domain/types.js';
import type { DeliveryStatus, EmailProvider } from '../email/email-provider.js';
import { randomOpaqueToken, sha256 } from '../lib/crypto.js';
import { AppError } from '../lib/errors.js';
import type { AppRepository, SessionMaterial } from '../repositories/repository.js';

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;
const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1_000;
const VERIFY_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1_000;
const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1_000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: AuthUser;
}

export interface RequestDevice {
  deviceName: string | null;
  userAgent: string | null;
}

export interface RegistrationResult {
  user: AuthUser;
  verification: {
    deliveryStatus: DeliveryStatus;
    previewToken?: string;
  };
}

export class AuthService {
  public constructor(
    private readonly repository: AppRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokens: AccessTokenService,
    private readonly emailProvider: EmailProvider,
    private readonly config: AppConfig,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private actionUrl(action: 'verify_email' | 'reset_password', token: string): string {
    const path = action === 'verify_email' ? '/auth/verify-email' : '/auth/reset-password';
    const url = new URL(path, this.config.appPublicUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private sessionMaterial(device: RequestDevice, now: Date): { rawToken: string; session: SessionMaterial } {
    const rawToken = randomOpaqueToken();
    return {
      rawToken,
      session: {
        id: randomUUID(),
        familyId: randomUUID(),
        refreshTokenHash: sha256(rawToken),
        expiresAt: new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS),
        userAgent: device.userAgent,
        deviceName: device.deviceName,
        now,
      },
    };
  }

  private async tokenPair(user: AuthUser, session: SessionRecord, refreshToken: string): Promise<TokenPair> {
    const accessToken = await this.accessTokens.issue({ userId: user.id, sessionId: session.id });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      user,
    };
  }

  public async register(input: { displayName: string; email: string; password: string }): Promise<RegistrationResult> {
    const now = this.clock();
    const passwordHash = await this.passwordHasher.hash(input.password);
    const verificationToken = randomOpaqueToken();
    const result = await this.repository.registerLocal({
      userId: randomUUID(),
      identityId: randomUUID(),
      emailTokenId: randomUUID(),
      email: input.email,
      displayName: input.displayName,
      passwordHash,
      emailTokenHash: sha256(verificationToken),
      emailTokenExpiresAt: new Date(now.getTime() + VERIFY_TOKEN_LIFETIME_MS),
      now,
    });
    if (result.kind === 'duplicate') {
      throw new AppError(409, 'ACCOUNT_EXISTS', 'An account with these details already exists.');
    }

    const deliveryStatus = await this.emailProvider.send({
      to: result.user.email,
      displayName: result.user.displayName,
      action: 'verify_email',
      actionUrl: this.actionUrl('verify_email', verificationToken),
    });
    const verification: RegistrationResult['verification'] = { deliveryStatus };
    if (deliveryStatus === 'preview' && this.config.nodeEnv !== 'production' && this.config.emailDeliveryMode === 'console') {
      verification.previewToken = verificationToken;
    }
    return { user: result.user, verification };
  }

  public async login(email: string, password: string, device: RequestDevice): Promise<TokenPair> {
    const record = await this.repository.findLoginByEmail(email);
    const valid = await this.passwordHasher.verify(record?.passwordHash ?? null, password);
    if (!record || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    if (record.user.accountStatus !== 'active') {
      throw new AppError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
    }
    if (record.user.emailVerifiedAt === null) {
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before signing in.');
    }

    const now = this.clock();
    const material = this.sessionMaterial(device, now);
    const session = await this.repository.createSession({ ...material.session, userId: record.user.id });
    return this.tokenPair(record.user, session, material.rawToken);
  }

  public async refresh(refreshToken: string, device: RequestDevice): Promise<TokenPair> {
    const now = this.clock();
    const material = this.sessionMaterial(device, now);
    const result = await this.repository.rotateSession(sha256(refreshToken), {
      id: material.session.id,
      refreshTokenHash: material.session.refreshTokenHash,
      expiresAt: material.session.expiresAt,
      userAgent: material.session.userAgent,
      deviceName: material.session.deviceName,
      now,
    });
    if (result.kind === 'reuse') {
      throw new AppError(401, 'REFRESH_TOKEN_REUSED', 'The refresh token was already used. This session family has been revoked.');
    }
    if (result.kind === 'disabled') throw new AppError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
    if (result.kind === 'invalid') throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired.');
    return this.tokenPair(result.user, result.session, material.rawToken);
  }

  public async exchangeOAuthCode(code: string, device: RequestDevice): Promise<TokenPair> {
    const now = this.clock();
    const material = this.sessionMaterial(device, now);
    const result = await this.repository.consumeOAuthExchange(sha256(code), material.session);
    if (result.kind === 'disabled') throw new AppError(403, 'ACCOUNT_UNAVAILABLE', 'This account is not available.');
    if (result.kind === 'invalid') throw new AppError(400, 'INVALID_EXCHANGE_CODE', 'The exchange code is invalid or expired.');
    return this.tokenPair(result.user, result.session, material.rawToken);
  }

  public async logout(userId: string, currentSessionId: string, refreshToken?: string): Promise<void> {
    const now = this.clock();
    if (refreshToken) {
      const revoked = await this.repository.revokeSessionByToken(userId, sha256(refreshToken), now);
      if (!revoked) throw new AppError(404, 'SESSION_NOT_FOUND', 'The session was not found.');
      return;
    }
    await this.repository.revokeSessionById(userId, currentSessionId, now);
  }

  public revokeAll(userId: string): Promise<void> {
    return this.repository.revokeAllSessions(userId, this.clock());
  }

  public async verifyEmail(token: string): Promise<void> {
    const result = await this.repository.consumeEmailVerification(sha256(token), this.clock());
    if (result === 'invalid') throw new AppError(400, 'INVALID_ACTION_TOKEN', 'The verification token is invalid or expired.');
  }

  private async requestEmailAction(email: string, kind: 'verify_email' | 'reset_password'): Promise<void> {
    const now = this.clock();
    const token = randomOpaqueToken();
    const lifetime = kind === 'verify_email' ? VERIFY_TOKEN_LIFETIME_MS : RESET_TOKEN_LIFETIME_MS;
    const recipient = await this.repository.issueEmailAction(
      email,
      kind,
      randomUUID(),
      sha256(token),
      new Date(now.getTime() + lifetime),
      now,
    );
    if (!recipient) return;
    await this.emailProvider.send({
      to: recipient.email,
      displayName: recipient.displayName,
      action: kind,
      actionUrl: this.actionUrl(kind, token),
    });
  }

  public resendVerification(email: string): Promise<void> {
    return this.requestEmailAction(email, 'verify_email');
  }

  public forgotPassword(email: string): Promise<void> {
    return this.requestEmailAction(email, 'reset_password');
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(newPassword);
    const result = await this.repository.consumePasswordReset(sha256(token), passwordHash, this.clock());
    if (result === 'invalid') throw new AppError(400, 'INVALID_ACTION_TOKEN', 'The reset token is invalid or expired.');
  }

  public async changePassword(userId: string, sessionId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repository.findAuthUser(userId);
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const login = await this.repository.findLoginByEmail(user.email);
    const valid = await this.passwordHasher.verify(login?.passwordHash ?? null, currentPassword);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'The current password is incorrect.');
    if (await this.passwordHasher.verify(login?.passwordHash ?? null, newPassword)) {
      throw new AppError(400, 'PASSWORD_UNCHANGED', 'The new password must be different.');
    }
    const passwordHash = await this.passwordHasher.hash(newPassword);
    const changed = await this.repository.changePassword(userId, passwordHash, this.clock(), sessionId);
    if (!changed) throw new AppError(400, 'LOCAL_PASSWORD_UNAVAILABLE', 'This account does not have a local password.');
  }

  public listSessions(userId: string, currentSessionId: string): Promise<SessionRecord[]> {
    return this.repository.listSessions(userId, currentSessionId);
  }

  public async revokeOwnedSession(userId: string, sessionId: string): Promise<void> {
    const revoked = await this.repository.revokeSessionById(userId, sessionId, this.clock());
    if (!revoked) throw new AppError(404, 'SESSION_NOT_FOUND', 'The session was not found.');
  }
}
