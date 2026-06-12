# Release Env Setup (Firebase + Sentry)

Questa guida e aggiornata alla configurazione corrente del progetto:
- plugin Sentry gestito in `app.config.js`
- validazione Sentry obbligatoria in EAS build tramite `SENTRY_REQUIRE_CONFIG=1`
- plugin Sentry abilitato solo con config completa (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`)

## 1) Variabili supportate

### 1.1 Firebase public env (`EXPO_PUBLIC_*`)

- `EXPO_PUBLIC_FIREBASE_WEB_API_KEY`: richiesta per login, registrazione e
  refresh della sessione.
- `EXPO_PUBLIC_FIREBASE_DB_URL`: richiesta per scegliere esplicitamente il
  Realtime Database usato dall'app.

`EXPO_PUBLIC_FIREBASE_API_KEY` e ancora accettata dal codice come alias legacy
per la chiave API, ma le nuove configurazioni devono usare
`EXPO_PUBLIC_FIREBASE_WEB_API_KEY`.

Il codice contiene un fallback storico per il database quando
`EXPO_PUBLIC_FIREBASE_DB_URL` manca. Non usarlo come default di configurazione:
imposta sempre la variabile in locale e in ogni environment EAS per evitare di
collegarsi per errore a un database inatteso.

Le variabili `EXPO_PUBLIC_*` sono incluse nel bundle client e non devono
contenere segreti.

### 1.2 Sentry runtime env

- `EXPO_PUBLIC_SENTRY_DSN` (opzionale, ma necessario se vuoi invio eventi runtime)

### 1.3 Sentry build env (obbligatorie nelle build EAS)

- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_URL` (opzionale, default `https://sentry.io/`)

`SENTRY_AUTH_TOKEN` e un segreto build-time: impostalo nei secret CI/EAS, mai
in un file committato o con prefisso `EXPO_PUBLIC_`.

## 2) Come funziona ora la config Sentry

In `app.config.js`:
- il plugin `@sentry/react-native/expo` riceve esplicitamente `organization` e `project`
- in build (`SENTRY_REQUIRE_CONFIG=1`) se mancano env Sentry, la config fallisce subito
- in locale, se la triade Sentry non e completa, il plugin non viene iniettato (evita errori `sentry.properties` su Xcode)

Obiettivo:
- evitare fallback impliciti del tipo "Environment variables will be used as fallback"
- evitare build apparentemente riuscite ma senza upload sourcemaps corretto

## 3) Setup locale (PowerShell)

### 3.1 Temporaneo nella shell corrente

```powershell
$env:EXPO_PUBLIC_FIREBASE_WEB_API_KEY="..."
$env:EXPO_PUBLIC_FIREBASE_DB_URL="https://<project>.europe-west1.firebasedatabase.app"
$env:EXPO_PUBLIC_SENTRY_DSN="..."

$env:SENTRY_ORG="your-sentry-org-slug"
$env:SENTRY_PROJECT="your-sentry-project-slug"
$env:SENTRY_AUTH_TOKEN="<set-in-ci-only>"
$env:SENTRY_URL="https://sentry.io/"
```

### 3.2 Persistente in `.env`

Copia le chiavi di `.env.example` in un file `.env` locale e valorizza solo
quelle necessarie. `.env` e ignorato da Git e non deve essere committato.

Non salvare `SENTRY_AUTH_TOKEN` nel `.env` condiviso: per le build usa i secret
CI/EAS. Se devi verificare temporaneamente la config in locale, impostalo solo
nella shell corrente.

## 4) Setup EAS (consigliato)

Il progetto usa `SENTRY_REQUIRE_CONFIG=1` nei profili EAS (`development`, `preview`, `production`).
Quindi in EAS devi impostare le env Sentry obbligatorie.

### 4.1 Creazione env per environment `development`

```bash
eas env:create --environment development --name SENTRY_ORG --value "<org-slug>"
eas env:create --environment development --name SENTRY_PROJECT --value "<project-slug>"
eas env:create --environment development --name SENTRY_AUTH_TOKEN --value "<auth-token>"
eas env:create --environment development --name SENTRY_URL --value "https://sentry.io/"
```

### 4.2 Ripeti per `preview` e `production`

```bash
eas env:create --environment preview --name SENTRY_ORG --value "<org-slug>"
eas env:create --environment preview --name SENTRY_PROJECT --value "<project-slug>"
eas env:create --environment preview --name SENTRY_AUTH_TOKEN --value "<auth-token>"

eas env:create --environment production --name SENTRY_ORG --value "<org-slug>"
eas env:create --environment production --name SENTRY_PROJECT --value "<project-slug>"
eas env:create --environment production --name SENTRY_AUTH_TOKEN --value "<auth-token>"
```

Configura anche `EXPO_PUBLIC_FIREBASE_WEB_API_KEY`,
`EXPO_PUBLIC_FIREBASE_DB_URL` e, se usato, `EXPO_PUBLIC_SENTRY_DSN` per ciascun
environment.

## 5) Verifica veloce

### 5.1 Verifica config Expo

```bash
npx expo config --json
npx expo install --check
```

Senza la triade Sentry build, il comando locale deve restare valido e il plugin
Sentry non viene aggiunto. Con la triade impostata, controlla che nei `plugins`
sia presente:
- `["@sentry/react-native/expo", { "organization": "...", "project": "...", ... }]`

### 5.2 Verifica env EAS

```bash
eas env:list --environment development
eas env:list --environment preview
eas env:list --environment production
```

## 6) Troubleshooting

Se compare errore di build env mancanti:
- verifica `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` nel giusto environment EAS.
- verifica che gli slug siano corretti (slug, non display name).

Se runtime Sentry non invia eventi:
- verifica `EXPO_PUBLIC_SENTRY_DSN` valorizzata.
- verifica che `initMonitoring()` sia chiamata (in `App.js` e gia presente).
