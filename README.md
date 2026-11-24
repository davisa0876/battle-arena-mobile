# Battle Arena Mobile

Expo React Native client for Battle Arena.

## Stack

- Expo SDK 54 + Expo Router
- TypeScript
- i18next + expo-localization + AsyncStorage
- expo-image for catalog artwork

## Features (this phase)

- Home, Creatures catalog, Settings (language)
- Five languages: `en`, `fr`, `pt-BR`, `it`, `es`
- Catalog/detail from Laravel API with remote `image_url`
- Neutral placeholder when artwork is missing/fails

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_BASE_URL`:

- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Physical device: `http://<LAN-IP>:8000` (infra `BIND_ADDRESS=0.0.0.0`)

## Commands

```bash
npm run typecheck
npm run lint
npm start
```

## i18n

Translations live in `src/i18n/locales/{en,fr,pt-BR,it,es}/app.json`.

Language preference persists in AsyncStorage. Device locale is used on first launch.

## Image note

Remote PokéAPI artwork URLs are for local demo only. They are not downloaded into the repo or S3. Replace with original/licensed art later.

## Structure

- `app/` thin Expo Router screens
- `src/features/` creatures + home logic
- `src/shared/` API client and UI primitives
- `src/theme/` design tokens
- `.cursor/rules/` persistent project rules
