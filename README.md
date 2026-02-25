# Savetime

"Il tempo e denaro".

## Stato Baseline
- Progetto Expo blank iniziale.
- Tema condiviso disponibile in `constants/styles.js` (single source of truth per colori/tokens UI).
- Reuse source disponibile in `../section8`.

## Note Git
- Branch baseline richiesto: `Savetime`.
- Remote `origin` non ancora configurato in questo repository.

## Prossimi Step MVP
- Architettura cartelle e UI primitives.
- Auth Firebase + Firestore.
- Navigation stack+drawer.
- Planner + eventi CRUD.

## Google Sign-In (Firebase Auth)
Per abilitare login/signup con Google:
1. In Firebase Console attiva provider `Google` in Authentication.
2. Configura gli OAuth Client ID (Android/iOS/Web) e inseriscili in `.env.local`:
   - `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
3. Riavvia Expo (`npx expo start -c`).

## GitHub Workflow
- Contributing guide: `CONTRIBUTING.md`
- One-time setup (project automation + branch protection): `GITHUB_WORKFLOW_SETUP.md`
