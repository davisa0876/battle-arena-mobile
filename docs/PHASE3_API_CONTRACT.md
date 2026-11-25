# Phase 3 Mobile — API contract

Base URL: `EXPO_PUBLIC_API_BASE_URL` (Android emu `http://10.0.2.2:8000`, iOS sim `http://localhost:8000`, device LAN IP)

## Auth (mobile = bearer tokens in SecureStore ONLY)

- `POST /api/register` and `POST /api/login` with `device_name` (e.g. `expo`) → response includes `token`
- Store token in `expo-secure-store`; never AsyncStorage
- Send `Authorization: Bearer {token}` on authenticated requests
- `POST /api/logout` then clear SecureStore
- Restore session on launch via `GET /api/me`; on 401 clear token

## Same endpoints as web

Profile, avatar (multipart), collection, starter, game rules, public player, forgot/reset password.

Avatar URLs from API are absolute `/api/avatars/{id}` — use EXPO_PUBLIC_API_BASE_URL host.

## Packages (npx expo install)

- expo-secure-store
- expo-image-picker (SDK 54 compatible)
