import type { PasswordHasher } from '../auth/password.js';
import type { AppConfig } from '../config.js';
import type { ProviderSummary, UserBundle, UserExport } from '../domain/types.js';
import { constantTimeEqual } from '../lib/crypto.js';
import { AppError } from '../lib/errors.js';
import type { AppRepository } from '../repositories/repository.js';
import type { PreferencesPatch, ProfilePatch } from '../schemas.js';

export class ProfileService {
  public constructor(
    private readonly repository: AppRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly config: AppConfig,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  public async get(userId: string): Promise<UserBundle> {
    const bundle = await this.repository.getUserBundle(userId);
    if (!bundle) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
    return bundle;
  }

  public async updateProfile(userId: string, patch: ProfilePatch): Promise<UserBundle> {
    if (patch.avatarUrl) {
      const hostname = new URL(patch.avatarUrl).hostname.toLowerCase();
      if (this.config.avatarUrlAllowedHosts.size > 0 && !this.config.avatarUrlAllowedHosts.has(hostname)) {
        throw new AppError(400, 'AVATAR_HOST_NOT_ALLOWED', 'The avatar URL host is not allowed.');
      }
    }
    const bundle = await this.repository.updateProfile(userId, patch, this.clock());
    if (!bundle) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
    return bundle;
  }

  public async updatePreferences(userId: string, patch: PreferencesPatch): Promise<UserBundle> {
    const bundle = await this.repository.updatePreferences(userId, patch, this.clock());
    if (!bundle) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
    return bundle;
  }

  public async export(userId: string): Promise<UserExport> {
    const data = await this.repository.exportUser(userId, this.clock());
    if (!data) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
    return data;
  }

  public async providers(userId: string): Promise<ProviderSummary[]> {
    return (await this.get(userId)).providers;
  }

  public async deleteAccount(userId: string, input: { password?: string; confirmation?: string }): Promise<void> {
    const credentials = await this.repository.getDeletionCredentials(userId);
    if (!credentials) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
    if (credentials.passwordHash) {
      const valid = await this.passwordHasher.verify(credentials.passwordHash, input.password ?? '');
      if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'The password is incorrect.');
    } else if (!input.confirmation || !constantTimeEqual(input.confirmation, 'DELETE')) {
      throw new AppError(400, 'DELETION_CONFIRMATION_REQUIRED', 'Enter DELETE to confirm account deletion.');
    }
    const deleted = await this.repository.deleteAccount(userId, this.clock());
    if (!deleted) throw new AppError(404, 'USER_NOT_FOUND', 'The user was not found.');
  }
}
