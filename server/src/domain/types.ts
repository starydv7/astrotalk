export const AUTH_PROVIDERS = ['local', 'google', 'facebook'] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];
export type OAuthProviderName = Exclude<AuthProvider, 'local'>;

export const ACCOUNT_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const GUIDANCE_TOPICS = [
  'relationships',
  'career',
  'wellbeing',
  'spirituality',
  'family',
  'finances',
  'personal-growth',
] as const;
export type GuidanceTopic = (typeof GUIDANCE_TOPICS)[number];

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
  accountStatus: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  avatarUrl: string | null;
  bio: string | null;
  pronouns: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  guidanceTopics: GuidanceTopic[];
  notifications: NotificationPreferences;
  preferences: Record<string, never>;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface PrivacyPreferences {
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  profileDiscoverable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderSummary {
  provider: AuthProvider;
  providerEmail: string | null;
  linkedAt: Date;
}

export interface UserBundle {
  user: AuthUser;
  profile: UserProfile;
  privacy: PrivacyPreferences;
  providers: ProviderSummary[];
}

export interface LoginRecord {
  user: AuthUser;
  passwordHash: string | null;
}

export interface SessionRecord {
  id: string;
  userId: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  deviceName: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  current?: boolean;
}

export interface OAuthIdentity {
  provider: OAuthProviderName;
  subject: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

export interface SafeAuditEvent {
  id: string;
  eventType: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface UserExport extends UserBundle {
  auditEvents: SafeAuditEvent[];
  exportedAt: Date;
}
