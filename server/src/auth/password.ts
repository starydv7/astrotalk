import argon2 from 'argon2';

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(passwordHash: string | null, candidate: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements PasswordHasher {
  private readonly dummyHash: Promise<string>;

  public constructor() {
    this.dummyHash = this.hash('dummy-password-that-is-never-valid-938274');
  }

  public hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
      hashLength: 32,
    });
  }

  public async verify(passwordHash: string | null, candidate: string): Promise<boolean> {
    const hash = passwordHash ?? (await this.dummyHash);
    try {
      const valid = await argon2.verify(hash, candidate);
      return passwordHash === null ? false : valid;
    } catch {
      return false;
    }
  }
}
