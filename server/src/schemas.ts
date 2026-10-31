import { z } from 'zod';

import { GUIDANCE_TOPICS } from './domain/types.js';

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const displayNameSchema = z.string().trim().min(2).max(80);

const COMMON_PASSWORDS = new Set([
  '1234567890', '123456789', 'password', 'password1', 'password123', 'qwerty123',
  'qwertyuiop', 'letmein123', 'welcome123', 'admin12345', 'iloveyou', 'monkey123',
  'dragon123', 'football1', 'abc123456', 'astrotalk', 'changeme123',
]);

export const passwordSchema = z.string()
  .min(10, 'Password must be at least 10 characters long.')
  .max(128, 'Password must be at most 128 characters long.')
  .refine((value) => !/[\u0000-\u001F\u007F]/u.test(value), 'Password cannot contain control characters.')
  .refine((value) => !COMMON_PASSWORDS.has(value.trim().toLowerCase()), 'Choose a less common password.')
  .refine((value) => new Set(value).size >= 4, 'Password must contain more varied characters.')
  .refine(
    (value) => /\p{L}/u.test(value) && (/\p{N}/u.test(value) || /[^\p{L}\p{N}]/u.test(value)),
    'Password must include letters and either a number, space, or punctuation.',
  );

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  deviceName: z.string().trim().min(1).max(80).optional(),
}).strict();

const opaqueTokenSchema = z.string().min(32).max(256).regex(/^[A-Za-z0-9_-]+$/, 'Token is malformed.');
export const refreshTokenSchema = opaqueTokenSchema;
export const actionTokenSchema = opaqueTokenSchema;
export const exchangeCodeSchema = opaqueTokenSchema;

export const refreshSchema = z.object({ refreshToken: refreshTokenSchema }).strict();
export const logoutSchema = z.object({ refreshToken: refreshTokenSchema.optional() }).strict();
export const emailOnlySchema = z.object({ email: emailSchema }).strict();
export const verifyEmailSchema = z.object({ token: actionTokenSchema }).strict();
export const resetPasswordSchema = z.object({ token: actionTokenSchema, newPassword: passwordSchema }).strict();
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
}).strict();
export const oauthExchangeSchema = z.object({
  code: exchangeCodeSchema,
  deviceName: z.string().trim().min(1).max(80).optional(),
}).strict();

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function isLocale(value: string): boolean {
  try {
    return Intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
}

const nullableTrimmed = (maximum: number) => z.string().trim().max(maximum).nullable();
const httpsUrlSchema = z.string().trim().url().max(2_048).refine((value) => new URL(value).protocol === 'https:', 'Avatar URL must use HTTPS.');

export const profilePatchSchema = z.object({
  displayName: displayNameSchema.optional(),
  avatarUrl: httpsUrlSchema.nullable().optional(),
  bio: nullableTrimmed(500).optional(),
  pronouns: nullableTrimmed(50).optional(),
  phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format.').nullable().optional(),
  timezone: z.string().trim().min(1).max(100).refine(isIanaTimezone, 'Timezone must be a valid IANA timezone.').optional(),
  locale: z.string().trim().min(2).max(35).refine(isLocale, 'Locale must be a valid BCP 47 locale.').optional(),
  guidanceTopics: z.array(z.enum(GUIDANCE_TOPICS)).max(GUIDANCE_TOPICS.length).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one profile field is required.');

const notificationsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  marketing: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one notification preference is required.');

const privacySchema = z.object({
  analytics: z.boolean().optional(),
  personalization: z.boolean().optional(),
  marketing: z.boolean().optional(),
  profileDiscoverable: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one privacy preference is required.');

export const preferencesPatchSchema = z.object({
  notifications: notificationsSchema.optional(),
  privacy: privacySchema.optional(),
}).strict().refine((value) => value.notifications !== undefined || value.privacy !== undefined, 'At least one preference group is required.');

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128).optional(),
  confirmation: z.string().max(32).optional(),
}).strict();

export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type PreferencesPatch = z.infer<typeof preferencesPatchSchema>;
