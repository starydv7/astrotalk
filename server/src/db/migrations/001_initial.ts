export const initialMigration = {
  name: '001_initial_auth_and_profiles',
  sql: String.raw`
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  email_verified_at TIMESTAMPTZ,
  account_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_normalized CHECK (email = LOWER(BTRIM(email))),
  CONSTRAINT users_email_length CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT users_display_name_length CHECK (char_length(display_name) BETWEEN 2 AND 80),
  CONSTRAINT users_account_status_check CHECK (account_status IN ('active', 'suspended', 'deleted'))
);
CREATE UNIQUE INDEX users_email_unique_lower_idx ON users (LOWER(email));
CREATE INDEX users_account_status_idx ON users (account_status);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  bio VARCHAR(500),
  pronouns VARCHAR(50),
  phone VARCHAR(16),
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  locale VARCHAR(35) NOT NULL DEFAULT 'en',
  guidance_topics TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notification_preferences JSONB NOT NULL DEFAULT '{"email":true,"push":true,"marketing":false}'::JSONB,
  preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_avatar_https CHECK (avatar_url IS NULL OR avatar_url ~ '^https://'),
  CONSTRAINT profile_phone_e164 CHECK (phone IS NULL OR phone ~ '^\\+[1-9][0-9]{7,14}$'),
  CONSTRAINT profile_guidance_count CHECK (cardinality(guidance_topics) <= 20),
  CONSTRAINT profile_notifications_object CHECK (jsonb_typeof(notification_preferences) = 'object'),
  CONSTRAINT profile_preferences_object CHECK (jsonb_typeof(preferences) = 'object')
);

CREATE TABLE privacy_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  personalization BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  profile_discoverable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE auth_identities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  provider_email TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_provider_check CHECK (provider IN ('local', 'google', 'facebook')),
  CONSTRAINT auth_provider_subject_present CHECK (char_length(provider_subject) BETWEEN 1 AND 255),
  CONSTRAINT auth_provider_email_normalized CHECK (provider_email IS NULL OR provider_email = LOWER(BTRIM(provider_email))),
  CONSTRAINT auth_local_password_check CHECK (
    (provider = 'local' AND password_hash IS NOT NULL) OR
    (provider <> 'local' AND password_hash IS NULL)
  ),
  CONSTRAINT auth_identity_provider_subject_unique UNIQUE (provider, provider_subject),
  CONSTRAINT auth_identity_user_provider_unique UNIQUE (user_id, provider)
);
CREATE INDEX auth_identities_user_idx ON auth_identities (user_id);
CREATE INDEX auth_identities_provider_email_idx ON auth_identities (LOWER(provider_email)) WHERE provider_email IS NOT NULL;

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash CHAR(64) NOT NULL UNIQUE,
  family_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_session_id UUID REFERENCES auth_sessions(id) ON DELETE SET NULL,
  user_agent VARCHAR(512),
  device_label VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_sessions_hash_check CHECK (refresh_token_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX auth_sessions_user_active_idx ON auth_sessions (user_id, expires_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX auth_sessions_family_idx ON auth_sessions (family_id);

CREATE TABLE email_action_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_action_kind_check CHECK (kind IN ('verify_email', 'reset_password')),
  CONSTRAINT email_action_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX email_action_user_kind_active_idx ON email_action_tokens (user_id, kind, expires_at DESC) WHERE consumed_at IS NULL;

CREATE TABLE oauth_states (
  id UUID PRIMARY KEY,
  state_hash CHAR(64) NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  mobile_redirect_uri VARCHAR(2048) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT oauth_state_provider_check CHECK (provider IN ('google', 'facebook')),
  CONSTRAINT oauth_state_hash_check CHECK (state_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX oauth_states_active_idx ON oauth_states (expires_at) WHERE consumed_at IS NULL;

CREATE TABLE oauth_exchange_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  code_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT oauth_exchange_provider_check CHECK (provider IN ('google', 'facebook')),
  CONSTRAINT oauth_exchange_hash_check CHECK (code_hash ~ '^[0-9a-f]{64}$')
);
CREATE INDEX oauth_exchange_active_idx ON oauth_exchange_codes (expires_at) WHERE consumed_at IS NULL;

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT audit_metadata_object CHECK (jsonb_typeof(metadata) = 'object')
);
CREATE INDEX audit_events_user_created_idx ON audit_events (user_id, created_at DESC);
CREATE INDEX audit_events_type_created_idx ON audit_events (event_type, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_profiles_set_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER privacy_preferences_set_updated_at BEFORE UPDATE ON privacy_preferences
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER auth_identities_set_updated_at BEFORE UPDATE ON auth_identities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`,
} as const;
