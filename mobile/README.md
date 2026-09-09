# Asteroid Mobile

Expo (SDK 57) client for Asteroid AI — shares Clerk identity and search
history with the Next.js web app and consumes the same `/api/*` routes.
Design spec: [`docs/superpowers/specs/2026-08-28-asteroid-mobile-design.md`](../docs/superpowers/specs/2026-08-28-asteroid-mobile-design.md)
and the visual baseline in [`2026-08-27-asteroid-splash-auth-design.md`](../docs/superpowers/specs/2026-08-27-asteroid-splash-auth-design.md).

## Prerequisites

- Node 20+, npm
- Android Studio (for the emulator) — or Expo Go on a device
- The Asteroid web app running (repo root: `npm run dev`)
- Redis for the web app's cache/rate limiting (`docker-compose up -d redis`)
- Web `.env.local` with `SERPER_API_KEY`, `GROQ_API_KEY`, Clerk + Supabase keys

## Setup

```bash
cd mobile
cp .env.example .env.local   # fill in Clerk publishable key + Supabase keys
npm install
npx expo start               # then press `a` for the Android emulator
```

- **Android emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` (default)
  reaches the web app on your host machine.
- **Physical device** (same Wi-Fi): set `EXPO_PUBLIC_API_URL=http://<LAN-IP>:3000`.
- After changing `.env.local`, restart with `npx expo start -c`.

## Verification

```bash
npx tsc --noEmit                    # type gate
npm run lint                        # lint gate
node --test scripts/smoke-api.mjs   # API contract check (needs web server + Redis)
node scripts/spike-bearer-auth.mjs "<token>"  # Bearer-auth spike (see file header)
```

## Build & Deployment

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Build Standalone Android APK (Direct install on device/emulator)**:
   ```bash
   cd mobile
   eas build -p android --profile preview
   ```

3. **Build Production Bundles (Google Play AAB / iOS IPA)**:
   ```bash
   # Android Play Store Bundle
   eas build -p android --profile production

   # iOS App Store Bundle
   eas build -p ios --profile production
   ```

4. **Local Android Build (Alternative without cloud)**:
   ```bash
   npx expo prebuild
   npx expo run:android --variant release
   ```
