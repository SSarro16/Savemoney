# Savemoney baseline audit

Data audit: 2026-06-11

## 1. Stato attuale della repo

- Repository locale auditato: `C:\tmp\Savemoney`.
- Remote `origin`: `https://github.com/SSarro16/Savemoney.git`.
- Branch corrente: `docs/savemoney-baseline-audit`.
- Base branch richiesta: `savemoney`.
- HEAD iniziale: `ed1d1e3 Add brief description of Savemoney App`, allineato a `origin/savemoney`, `origin/HEAD` e `savemoney` al momento del log letto.
- Working tree iniziale: pulito.
- Stack principale rilevato: Expo SDK 54, React 19.1, React Native 0.81, React Navigation 7, Firebase Realtime Database/Identity Toolkit via REST, AsyncStorage, Sentry opzionale.
- L'app usa React Navigation, non expo-router.
- Non sono state fatte modifiche a codice applicativo, config Expo/EAS/Firebase o segreti durante l'audit.

## 2. Script disponibili e risultato dei comandi eseguiti

Script in `package.json`:

- `npm run start`: `expo start`
- `npm run android`: `expo start --android`
- `npm run ios`: `expo start --ios`
- `npm run web`: `expo start --web`
- `npm run lint`: `eslint . --ext .js,.jsx`
- `npm run lint:fix`: `eslint . --ext .js,.jsx --fix`
- `npm run format`: `prettier . --write`
- `npm run format:check`: `prettier . --check`
- `npm run test`: `jest`

Comandi di stato eseguiti:

- `git status --short --branch`: `## docs/savemoney-baseline-audit`
- `git branch --show-current`: `docs/savemoney-baseline-audit`
- `git remote -v`: `origin https://github.com/SSarro16/Savemoney.git` per fetch e push
- `git fetch origin`: completato senza errori
- `git log --oneline --decorate -5`: ultimi commit letti:
  - `ed1d1e3 (HEAD -> docs/savemoney-baseline-audit, origin/savemoney, origin/HEAD, savemoney) Add brief description of Savemoney App`
  - `0f584ee Add initial README content for Savemoney App`
  - `2389e5c Merge branch 'fix/expense-balance-goals-period-v1-1-0' into savemoney`
  - `240bc94 fix: stabilize expense delete/balance flows and extend goals periods`
  - `e0772a2 fix(env): inline Expo public Firebase key access`

Comandi di audit eseguiti:

- `rg --files`: inventario repo completato.
- `Get-Content` su config, README, contesti, utility e schermate core indicate dal task.
- `rg -n "AsyncStorage|console\.|logger\.|TODO|FIXME|SecureStore|Sentry|EXPO_PUBLIC|firebase|auth=|refreshToken|token|password" ...`: scan mirato su sicurezza/storage/logging/config.
- `Get-ChildItem -Recurse -File -Include *.js,*.json | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length`: rilevati file grandi, dettagli in sezione 7.

Risultati test/verifiche:

- Da aggiornare dopo la verifica path e l'esecuzione dei comandi richiesti.

## 3. Struttura generale app

- `App.js` contiene setup globale, inizializzazione monitoring, navigator stack/tab/drawer, drawer custom e composizione dei provider.
- Provider globali in ordine effettivo: `AuthContextProvider`, `LanguageContextProvider`, `ThemeContextProvider`, `CustomizationContextProvider`, `ExpenseCategoriesContextProvider`, `BudgetContextProvider`, `PaymentContextProvider`, `GoalsContextProvider`, `ExpensesContextProvider`.
- Autenticazione: `screens/LoginLogoutScreens/LogInScreen.js`, `SignUpScreen.js`, `components/AuthContent/*`, `util/auth.js`, `store/auth-context.js`, `util/profile-http.js`.
- Dati spese: `store/expenses-context.js`, `util/http.js`, `screens/HomeScreenStack/ExpensesScreen.js`, `ManageExpenses.js`, `ExpenseDetailScreen.js`, `components/ExpensesOutput/*`, `components/ManageExpense/ExpenseForm.js`.
- Budget: `store/budget-context.js`, `util/budget/budget-storage.js`, `screens/DrawerScreens/BudgetsHubScreen.js`, `BudgetScreen.js`, `BudgetOverviewScreen.js`, `components/ManageBudget/*`.
- Pagamenti/cash/carte: `store/payment-context.js`, `util/payment-http.js`, `screens/DrawerScreens/PaymentsScreen.js`, `CardsScreen.js`, `CashScreen.js`, `PaymentMethodDetailScreen.js`.
- Obiettivi e ricorrenze: `store/goals-context.js`, `util/goals-storage.js`, `screens/DrawerScreens/GoalsScreen.js`, `screens/DrawerScreens/RecurringScreen.js`, `util/recurring/recurring-storage.js`.
- Preferenze locali: `store/theme-context.js`, `store/customization-context.js`, `store/language-context.js`, `store/expense-categories-context.js`.
- Documentazione esistente: `README.md` minimale, piu documenti in `docs/` su setup release/env, notifiche, e2e account flow e note Expo/React Native.

## 4. Aree piu delicate

- `store/auth-context.js`: salva `authData` con `token`, `refreshToken`, `userId`, `expiryDate` e profilo in AsyncStorage; gestisce bootstrap, refresh proattivo e pulizia legacy.
- `util/firebase-rest.js`: costruisce URL REST con `auth=<idToken>` in query string. Funziona con Firebase REST, ma aumenta il rischio che token finiscano in log/proxy/crash report se un URL completo viene loggato.
- `firebase.database.rules.json`: accesso per-user sui nodi `users`, `budget`, `expenses`, `cards`, `cash`, `recurring`; mancano validazioni schema/tipo/campi.
- `store/expenses-context.js`: concentra fetch, retry auth, backfill legacy, deduplica add, undo delete, aggiornamenti saldo cash/card e notifiche budget.
- `store/budget-context.js` e `util/budget/budget-storage.js`: gestiscono budget remoti, budget legacy, migrazione da AsyncStorage e active budget locale.
- `store/payment-context.js`: muta saldi carte/cash in cascata dalle spese; rischio di inconsistenza se una chiamata remota fallisce dopo update parziale.
- `App.js`: 35 KB con navigazione e drawer; un cambiamento qui puo impattare login/logout, tab, drawer, tema, traduzioni e safe area.
- `components/ManageExpense/ExpenseForm.js`: 37 KB con validazione, category/icon picker, metodo pagamento, template favorite e modali.

## 5. Problemi ordinati per priorita

### P0 critici

- Nessun P0 confermato solo da audit statico. Non sono stati trovati segreti hardcoded evidenti nei file letti.

### P1 importanti

- Token e refresh token persistiti in AsyncStorage: `store/auth-context.js` usa `AsyncStorage.setItem("authData", JSON.stringify(next))`. Su mobile, AsyncStorage non e un keystore cifrato. Per dati auth e refresh token e preferibile migrare a storage sicuro dedicato, con piano di migrazione e logout controllato.
- Token Firebase passato in query string: `util/firebase-rest.js` genera URL `.json?auth=...`. E il pattern REST Firebase, ma e fragile lato osservabilita: evitare qualunque log di URL completi e valutare SDK Firebase o wrapper che mascheri query.
- Regole Firebase senza validazione schema: `firebase.database.rules.json` limita read/write per UID, ma non valida tipi, lunghezze, importi, date, categorie o campi consentiti. Un client autenticato puo scrivere payload incoerenti nel proprio nodo.
- Duplicazione del retry auth: `withAuthRetry` e `isAuthHttpError` ricorrono in `expenses-context`, `budget-context`, `payment-context`, `goals-context`, schermate ricorrenti e profilo. Questo aumenta rischio di divergenze sul refresh token e sugli errori 401/403.
- Migrazioni client-side senza versionamento centrale: budget, recurring, template e auth legacy hanno fallback/migration key locali. Se cambia lo schema, e difficile garantire idempotenza e osservabilita cross-device.
- Aggiornamenti saldo non atomici: quando una spesa cambia, `ExpensesContext` aggiorna spesa e poi cash/card tramite `PaymentContext`. Firebase Realtime Database REST non usa qui transazioni multi-path atomiche, quindi crash/network failure possono lasciare spese e saldi divergenti.

### P2 miglioramenti

- File grandi da scomporre: `ExpenseForm.js`, `App.js`, `PaymentsScreen.js`, `GoalsScreen.js`, `QuickAddExpenseScreen.js`, `ExpensesScreen.js`, `ManageBudget.js`, `ExpensesContext`.
- `util/budget-http.js` sembra sovrapporsi al nuovo `util/budget/budget-storage.js` e usa path legacy `budget/{userId}`: candidato a verifica dead code/import prima di rimozioni.
- `README.md` e molto minimale; mancano setup locale, env richieste, Firebase rules deploy, comandi test e note EAS/Sentry.
- `app.config.js` richiede Sentry env in CI/EAS se `SENTRY_REQUIRE_CONFIG=1`, ma `SENTRY_DSN` e solo runtime `EXPO_PUBLIC_SENTRY_DSN`; documentare chiaramente differenza tra token build e DSN pubblico.
- `util/env.js` contiene fallback hardcoded a un DB Realtime Database specifico. Non e un segreto, ma puo portare build locali o preview a scrivere su ambiente inatteso se manca `EXPO_PUBLIC_FIREBASE_DB_URL`.
- Logging: `logger.warn` e `logger.debug` non sembrano loggare token in chiaro nei punti letti, ma alcuni errori remoti potrebbero includere dettagli di rete. Serve policy di redazione centralizzata.

### P3 idee future

- Estrarre un data layer unico per Firebase REST con retry auth, mascheramento token, normalizzazione errori e supporto schema version.
- Introdurre un backend/BFF per operazioni sensibili, import CSV, transaction inbox, sync multi-device e categorizzazione.
- Progettare integrazione Revolut/Open Banking tramite backend, mai direttamente dal client mobile.
- Spostare categorie cloud sotto `users/{uid}/categories` con migrazione da AsyncStorage.
- Aggiungere auto-categorizzazione basata su regole locali prima, poi modello/servizio backend.
- Creare report/insights con cache derivata e test su timezone/date range.
- Aggiungere test di navigazione smoke per login/logout, tab principali e drawer.

## 6. Rischi specifici

### Auth

- `util/auth.js` usa Identity Toolkit REST e fallback legacy v3. Buono per compatibilita, ma il fallback va mantenuto con test per errori `CONFIGURATION_NOT_FOUND`, `PROJECT_NUMBER_MISMATCH`, `INVALID_API_KEY`.
- `store/auth-context.js` salva refresh token in AsyncStorage; rischio principale di sicurezza mobile.
- Bootstrap auth ha timeout di 2500 ms che prosegue comunque. Riduce blocchi UI, ma puo produrre stati transitori difficili da diagnosticare se AsyncStorage o refresh sono lenti.
- Logout rimuove `authData`, `token`, `userId`, ma non cancella altre preferenze locali user-scoped come categorie/template/migration key. Va bene per UX, ma da chiarire per privacy su dispositivi condivisi.

### Firebase

- Rules per UID corrette per isolamento base, ma senza `.validate`.
- Path primari e legacy coesistono: `users/{uid}/expenses`, `expenses/{uid}`, `users/{uid}/budgets`, `budget/{uid}`, `users/{uid}/cards`, `cards/{uid}`, ecc. Questo complica migrazioni e pulizia.
- Molte write usano `put`, `patch`, `post`, `delete` via REST senza schema condiviso e senza transazioni cross-path.

### AsyncStorage

- Usato per auth, tema, lingua, preferenze UI, categorie, budget active id, migration flags, template spese, recurring migration/reminder flags.
- Dati user-scoped in locale hanno chiavi con userId per categorie/template/budget active, ma alcune preferenze sono globali (`themeKey_v2`, `appLanguage_v1`, `uiPrefs_v2`).
- Rischio privacy: su logout restano preferenze e possibili dati non-auth locali user-scoped.

### Dati utente

- Profili salvati in `users/{uid}/profile` con nome, cognome, email, genere e data di nascita.
- Spese includono importo, descrizione, categoria, icona, metodo pagamento e riferimenti carta/cash.
- Carte salvano nome, brand, last4 e saldo; non sembrano salvare PAN completo o token di pagamento.
- La normalizzazione lato client tronca vari campi, ma senza rules Firebase un client alterato puo inviare payload diversi.

### Navigazione

- `App.js` contiene stack auth separato da stack autenticato in `NavigationContainer`.
- Logout e un `Drawer.Screen` chiamato `Logout` che usa `ExpensesTabs` come component e intercetta `drawerItemPress` per confermare e chiamare `authCtx.logout()`. Pattern funzionante ma fragile: lo screen non rappresenta una vera route di contenuto.
- `NavigationContainer` ha key legata alla lingua, quindi cambio lingua forza remount. Utile per titoli, ma puo resettare stato navigazione.

### Build Expo/iOS/Android

- Expo SDK 54, new architecture abilitata in `app.json`.
- `eas.json` impone `SENTRY_REQUIRE_CONFIG=1` per development/preview/production: build EAS fallira se mancano `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`.
- `appVersionSource` e `remote`; release/versioning dipendono da EAS remoto.
- Android ha `edgeToEdgeEnabled: true`; servono smoke UI su dispositivi reali per safe area e modal.

### Tema/stili globali

- `constants/styles.js` espone `GlobalStyles.colors` mutabile tramite `applyTheme`. Molti componenti leggono direttamente `GlobalStyles.colors` e usano `useThemeRefresh` per forzare refresh.
- Pattern funziona, ma e diverso da un tema React immutabile: refactor tema va fatto con task dedicato per evitare regressioni diffuse.

## 7. File candidati a refactor futuri

File piu grandi rilevati:

- `components/ManageExpense/ExpenseForm.js`: 37556 byte.
- `App.js`: 35952 byte.
- `screens/DrawerScreens/PaymentsScreen.js`: 32910 byte.
- `screens/DrawerScreens/GoalsScreen.js`: 31627 byte.
- `screens/HomeScreenStack/QuickAddExpenseScreen.js`: 30287 byte.
- `screens/HomeScreenStack/ExpensesScreen.js`: 25854 byte.
- `components/ExpensesOutput/ExpensesOutput.js`: 25182 byte.
- `components/ManageBudget/ManageBudget.js`: 24946 byte.
- `screens/DrawerScreens/UserProfileScreen.js`: 22876 byte.
- `screens/DrawerScreens/RecurringScreen.js`: 22553 byte.
- `store/expenses-context.js`: 21566 byte.

Refactor consigliati solo con task dedicati:

- Estrarre navigators/drawer da `App.js`.
- Estrarre hook e componenti da `ExpenseForm.js` per payment picker, category/icon picker, amount/date fields.
- Spostare retry auth in utility condivisa.
- Spostare logica saldi cash/card in service testabile.
- Separare migration/backfill da Context React.
- Verificare e consolidare `util/budget-http.js` rispetto a `util/budget/budget-storage.js`.

## 8. Cose da NON toccare senza task dedicato

- Storage auth e migrazione token.
- Firebase rules e path legacy.
- Expo/EAS/Sentry config.
- Refactor di `App.js` e navigazione logout.
- Introduzione di expo-router.
- Nuovo backend o Open Banking/Revolut.
- Migrazione categorie da AsyncStorage a cloud.
- Cambio tema globale o rimozione di `GlobalStyles`.
- Pulizia file apparentemente legacy senza conferma di import e dati reali.

## 9. Roadmap consigliata massimo 10 step

1. Documentare setup locale completo: env, Firebase DB URL/API key, Sentry, EAS, test.
2. Aggiungere `.validate` alle Firebase rules per profilo, expenses, budget, cards, cash, recurring e goals.
3. Migrare token/refresh token a secure storage con fallback controllato da AsyncStorage.
4. Estrarre data client Firebase con retry auth condiviso, redazione token e test.
5. Consolidare migrazioni legacy in moduli idempotenti con versioni e test.
6. Rendere atomici o riconciliabili gli update spesa/saldo cash/card.
7. Scomporre `App.js` in navigator separati e drawer content testabile.
8. Scomporre `ExpenseForm.js` e aggiungere test su validazione/metodo pagamento/categorie.
9. Progettare backend/BFF per CSV import, transaction inbox e Open Banking.
10. Aggiungere smoke test mobile su flussi login, add expense, budget, payments, logout.

## 10. Cosa NON ho potuto verificare

- Esecuzione reale su device iOS/Android o Expo Go/dev client.
- Accesso reale a Firebase, dati produttivi o deploy rules.
- Presenza e correttezza delle variabili env locali/EAS/Sentry.
- Comportamento reale delle notifiche push e permessi device.
- Consistenza dei dati legacy gia presenti negli account utente.
- Performance su dataset grandi.
- PR/check GitHub remoti prima dell'apertura PR.

## 11. Comandi eseguiti

- `git status --short --branch`
- `git branch --show-current`
- `git remote -v`
- `git fetch origin`
- `git log --oneline --decorate -5`
- `rg --files`
- `Get-ChildItem -Force`
- `Get-Content -Raw package.json`
- `Get-Content -Raw app.config.js`
- `Get-Content -Raw app.json`
- `Get-Content -Raw eas.json`
- `Get-Content -Raw firebase.database.rules.json`
- `Get-Content -Raw README.md`
- `Get-Content -Raw store\auth-context.js`
- `Get-Content -Raw util\auth.js`
- `Get-Content -Raw util\env.js`
- `Get-Content -Raw util\firebase-rest.js`
- `Get-Content -Raw util\http.js`
- `Get-Content -Raw util\payment-http.js`
- `Get-Content -Raw store\expenses-context.js`
- `Get-Content -Raw store\budget-context.js`
- `Get-Content -Raw store\payment-context.js`
- `Get-Content -Raw store\goals-context.js`
- `Get-Content -Raw store\expense-categories-context.js`
- `Get-Content -Raw store\language-context.js`
- `Get-Content -Raw store\theme-context.js`
- `Get-Content -Raw store\customization-context.js`
- `Get-Content -Raw util\budget\budget-storage.js`
- `Get-Content -Raw util\goals-storage.js`
- `Get-Content -Raw util\profile-http.js`
- `Get-Content -Raw util\monitoring.js`
- `Select-String -Path App.js -Pattern ...`
- `Get-Content -Raw screens\LoginLogoutScreens\LogInScreen.js`
- `Get-Content -Raw screens\LoginLogoutScreens\SignUpScreen.js`
- `Get-Content -Raw screens\HomeScreenStack\ExpensesScreen.js`
- `Get-Content -Raw screens\HomeScreenStack\ManageExpenses.js`
- `Get-Content -Raw components\ManageExpense\ExpenseForm.js`
- `rg -n "AsyncStorage|console\.|logger\.|TODO|FIXME|SecureStore|Sentry|EXPO_PUBLIC|firebase|auth=|refreshToken|token|password" ...`
- `Get-ChildItem -Recurse -File -Include *.js,*.json | Sort-Object Length -Descending | Select-Object -First 20 FullName,Length`
- `Get-Content -Raw screens\DrawerScreens\BudgetScreen.js`
- `Get-Content -Raw components\ManageBudget\ManageBudget.js`
