# Release Env Setup

## Required public env vars
- `EXPO_PUBLIC_FIREBASE_WEB_API_KEY`
- `EXPO_PUBLIC_FIREBASE_DB_URL`
- `EXPO_PUBLIC_SENTRY_DSN` (optional)

## Sentry source map upload env vars
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

## Local setup (PowerShell)
```powershell
$env:EXPO_PUBLIC_FIREBASE_WEB_API_KEY="..."
$env:EXPO_PUBLIC_FIREBASE_DB_URL="https://<project>.europe-west1.firebasedatabase.app"
$env:EXPO_PUBLIC_SENTRY_DSN=""
$env:SENTRY_ORG="..."
$env:SENTRY_PROJECT="..."
$env:SENTRY_AUTH_TOKEN="..."
```

## EAS setup (recommended)
Use EAS project secrets (or environment variables in EAS dashboard) with the exact names above.

Example:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_WEB_API_KEY --value "<value>"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_DB_URL --value "<value>"
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "<value>"
eas secret:create --scope project --name SENTRY_ORG --value "<value>"
eas secret:create --scope project --name SENTRY_PROJECT --value "<value>"
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "<value>"
```
