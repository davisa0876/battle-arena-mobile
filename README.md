# Battle Arena Mobile

Phase 1 mobile client built with TypeScript, Expo SDK 54, React Native, and Expo Router.

## Setup

```bash
npm install
copy .env.example .env
npm start
```

Edit `.env` for the device running the app. Expo exposes variables prefixed with
`EXPO_PUBLIC_` to client code, so never store secrets in them. Restart Expo after changing the file.

## Mobile API access

The home screen checks `GET /api/health` on startup and shows Connecting, Connected, or Offline.
When offline, use Retry to make another request.

Set `EXPO_PUBLIC_API_BASE_URL` to the host as seen by the mobile device:

- Android Studio emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://localhost:8000`
- Physical device: `http://<computer-lan-ip>:8000`

For a physical device, the phone and development computer must be on the same network. The API
must listen on `0.0.0.0` (not only `127.0.0.1`), and the host firewall must allow port 8000.
Plain HTTP can be used during local Expo development; use HTTPS for deployed environments.

## Commands

```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
```
