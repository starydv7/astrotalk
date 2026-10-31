import { describe, expect, it } from 'vitest';

import { JoseAccessTokenService } from '../src/auth/access-token.js';
import { Argon2PasswordHasher } from '../src/auth/password.js';

describe('Argon2 password hashing', () => {
  it('creates Argon2id hashes and verifies without exposing the password', async () => {
    const hasher = new Argon2PasswordHasher();
    const hash = await hasher.hash('A secure password 123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).not.toContain('A secure password 123');
    await expect(hasher.verify(hash, 'A secure password 123')).resolves.toBe(true);
    await expect(hasher.verify(hash, 'wrong')).resolves.toBe(false);
    await expect(hasher.verify(null, 'wrong')).resolves.toBe(false);
  });
});

describe('access tokens', () => {
  it('enforces signature, issuer, audience, and required claims', async () => {
    const service = new JoseAccessTokenService('a-strong-secret-that-is-more-than-32-bytes', 'issuer-a', 'audience-a');
    const token = await service.issue({ userId: 'user-id', sessionId: 'session-id' });
    await expect(service.verify(token)).resolves.toEqual({ userId: 'user-id', sessionId: 'session-id' });

    const wrongAudience = new JoseAccessTokenService('a-strong-secret-that-is-more-than-32-bytes', 'issuer-a', 'audience-b');
    await expect(wrongAudience.verify(token)).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });

    const wrongSecret = new JoseAccessTokenService('another-strong-secret-that-is-over-32-bytes', 'issuer-a', 'audience-a');
    await expect(wrongSecret.verify(token)).rejects.toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });

  it('rejects weak signing secrets', () => {
    expect(() => new JoseAccessTokenService('too-short', 'issuer', 'audience')).toThrow(/32/);
  });
});
