# AstroTalk

A premium astrology consultation mobile app built with Expo (SDK 58) and Expo Router.
Users browse verified astrologers and connect over chat, voice, or video for guidance on
love, career, finance, health, and life decisions.

## Stack

- Expo SDK 58, React Native 0.88, React 19
- Expo Router (file-based, typed routes)
- TypeScript (strict)
- Reanimated 4 (voice waveform animation)
- `expo-linear-gradient`, `@expo/vector-icons` (Ionicons)
- `expo-secure-store` / `expo-auth-session` installed for the auth layer

The backend API lives in `server/` (Fastify + PostgreSQL) and is a separate package.

## Project structure

```text
src/
├── app/                      # Expo Router routes
│   ├── _layout.tsx           # Root stack + theme/provider setup
│   ├── index.tsx             # Entry → redirects to welcome
│   ├── (auth)/               # welcome, onboarding, login, register,
│   │                         # forgot-password, verify-email
│   ├── (tabs)/               # Home, Chats, Astrologers, Profile
│   ├── astrologer/[id].tsx   # Astrologer profile (About/Services/Reviews)
│   ├── chat/[id].tsx         # Chat conversation
│   ├── call/[id].tsx         # Voice/video call screen
│   ├── reviews/[id].tsx      # Ratings & reviews
│   ├── categories.tsx        # Guidance categories grid
│   ├── premium.tsx           # Subscription plans
│   └── profile/              # edit, wallet, privacy, settings,
│                             # notifications, questions, support
├── components/
│   ├── ui/                   # Text, Screen, Card, Button, Input, Avatar,
│   │                         # Badge, Chip, Rating, SearchBar, EmptyState…
│   ├── auth/                 # Social buttons, divider
│   ├── astrology/            # Astrologer card, category tile
│   ├── brand/                # Logo
│   └── voice/                # Animated waveform
├── theme/                    # Design tokens + theme provider
├── data/                     # SAMPLE directory/profile/conversation data
├── types/                    # Domain models
└── utils/                    # Validation + formatting
```

## Design system

All color, spacing, radius, typography, shadow, and motion values are defined in
`src/theme/tokens.ts` and consumed through `useAppTheme()`. The look is a premium
midnight-navy base with violet/lavender accents and soft gold for astrology highlights,
with full light/dark support.

## Getting started

```bash
npm install
npx expo start
```

Then press `a` (Android), `i` (iOS, macOS only), or `w` (web).

### Type checking

```bash
npx tsc --noEmit
```

### Validate the bundle

```bash
npx expo export --platform web
```

## Android development build

Voice calling relies on native audio and does not run in Expo Go. For voice, build a
development build:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```

Install the resulting build on a physical Android device, then run `npx expo start --dev-client`.

## What is implemented

**UI — fully built and bundle-verified**
- Onboarding & auth: welcome, onboarding carousel, login, register (with password
  strength), forgot-password, verify-email.
- Email/password forms plus Google & Facebook buttons (wired to the backend OAuth broker;
  see integration points below).
- Tabs: Home (greeting, search, category chips, promo banner, top astrologers), Chats,
  Astrologers (search + filters), Profile.
- Astrologer profile with About/Services/Reviews tabs and Chat/Voice/Video actions.
- Chat screen with message bubbles, multiline input, keyboard handling.
- Voice call screen with full call-state lifecycle, animated waveform, and controls.
- Reviews & ratings with score breakdown and filters.
- Categories grid, Premium plans, and profile sub-screens (edit, wallet, privacy,
  settings, notifications, questions, support).

**Sample data**
Astrologer directory, conversations, and the signed-in user are static sample data in
`src/data/` (clearly labeled). They drive the UI until the API is connected.

## Backend integration points

Screens contain marked integration points where the API should be called:
- `POST /v1/auth/login`, `POST /v1/auth/register`, `POST /v1/auth/forgot-password`
- OAuth: open `GET /v1/auth/oauth/:provider/start` in a browser session, then
  `POST /v1/auth/oauth/exchange`
- `PATCH /v1/me/profile`
- `POST /v1/conversations/:id/messages` (and `/stream`)
- Voice session start via the backend-signed provider session

## Not yet wired (requires backend + credentials)

- Live API calls (currently sample data)
- Real Google/Facebook OAuth (needs provider credentials on the backend)
- Real voice provider session (needs provider credentials + a development build)
- Store-based subscription billing (prices shown are examples)
