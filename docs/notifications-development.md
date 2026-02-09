# Notifications in Development

## Current behavior
- Local notification features are now disabled automatically when running in **Expo Go**.
- This keeps normal development clean (no `expo-notifications` runtime warnings in Expo Go).
- Reminder and budget alert calls become safe no-op operations in Expo Go.

## How to test notifications
- Use an **EAS development build** (Dev Client), not Expo Go.
- Build command example:
  - `eas build --profile development --platform android`
  - `eas build --profile development --platform ios`
- Install the dev build on device/emulator, then run:
  - `npx expo start --dev-client`

## Why this choice
- Expo Go has known limitations with `expo-notifications`.
- The app keeps notification code for production/dev-client, while Expo Go stays warning-free.
