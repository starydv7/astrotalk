import { describe, expect, it } from 'vitest';

import {
  actionTokenSchema,
  passwordSchema,
  preferencesPatchSchema,
  profilePatchSchema,
  refreshTokenSchema,
} from '../src/schemas.js';

describe('password schema', () => {
  it('accepts long mixed passwords and passphrases', () => {
    expect(passwordSchema.safeParse('Correct horse battery staple').success).toBe(true);
    expect(passwordSchema.safeParse('A-secure-passphrase-123').success).toBe(true);
  });

  it('rejects short, common, repetitive, control-character, and all-letter passwords', () => {
    for (const password of [
      'Short1!',
      'password123',
      'aaaaaaaaaa1',
      'Onlyletterslong',
      'Secure\nPass123',
      `${'a'.repeat(129)}1`,
    ]) {
      expect(passwordSchema.safeParse(password).success, password).toBe(false);
    }
  });
});

describe('token schemas', () => {
  it('accepts bounded base64url opaque tokens', () => {
    const token = 'Abcdefghijklmnopqrstuvwxyz_0123456789-ABCDE';
    expect(refreshTokenSchema.safeParse(token).success).toBe(true);
    expect(actionTokenSchema.safeParse(token).success).toBe(true);
  });

  it('rejects short tokens, whitespace, punctuation, and oversized tokens', () => {
    for (const token of ['short', 'x'.repeat(31), `${'x'.repeat(40)}!`, `x ${'y'.repeat(40)}`, 'x'.repeat(257)]) {
      expect(refreshTokenSchema.safeParse(token).success, token.slice(0, 20)).toBe(false);
    }
  });
});

describe('profile and preference schemas', () => {
  it('accepts valid HTTPS profile data and approved topics', () => {
    expect(profilePatchSchema.safeParse({
      avatarUrl: 'https://cdn.example.com/avatar.png',
      phone: '+442079460123',
      timezone: 'Europe/London',
      locale: 'en-GB',
      guidanceTopics: ['career', 'wellbeing'],
    }).success).toBe(true);
  });

  it('rejects unknown fields and malformed profile data', () => {
    expect(profilePatchSchema.safeParse({ admin: true }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ avatarUrl: 'http://example.com/a.png' }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ phone: '+0123' }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ timezone: 'Invalid/Zone' }).success).toBe(false);
    expect(profilePatchSchema.safeParse({ guidanceTopics: ['unknown'] }).success).toBe(false);
  });

  it('only accepts supported preference keys', () => {
    expect(preferencesPatchSchema.safeParse({ notifications: { email: false }, privacy: { analytics: true } }).success).toBe(true);
    expect(preferencesPatchSchema.safeParse({ notifications: { sms: true } }).success).toBe(false);
    expect(preferencesPatchSchema.safeParse({}).success).toBe(false);
  });
});
