# Savemoney App Study Notes (EN + IT)

## 0) How to read these notes / Come leggere questi appunti
- EN: Each topic is split into practical bullets: what, when, when not, props/limits, examples.
- IT: Ogni argomento e diviso in punti pratici: cos e, quando usarlo, quando no, props/limiti, esempi.
- EN: Use this file as a review reference before coding a new feature.
- IT: Usa questo file come riferimento di ripasso prima di sviluppare una nuova feature.

---

## 1) Project structure and architecture / Struttura progetto e architettura

### Folder map (current app) / Mappa cartelle (app attuale)
- `App.js`: navigation root, providers composition, main stacks/drawer/tabs.
- `screens/`: screen-level UI and orchestration logic.
- `components/`: reusable UI/business components (forms, list items, output blocks).
- `store/`: Context providers and app state logic (auth, expenses, budget, customization, theme, payments).
- `util/`: HTTP, env, normalization, notifications, recurring helpers, storage utilities.
- `constants/`: theme tokens, icons mapping, navigation icon constants.
- `assets/`: app visuals (icon/splash/logo images).

### Architecture style / Stile architettura
- EN: Presentation + Context services + utility layer.
- IT: Presentazione + servizi Context + layer utility.
- EN: Screens coordinate user actions; providers own business state and side effects.
- IT: Le schermate coordinano le azioni utente; i provider gestiscono stato business ed effetti.

### Data flow / Flusso dati
- EN: `UI -> Context action -> util/http or storage -> normalize -> Context state -> UI rerender`.
- IT: `UI -> azione Context -> util/http o storage -> normalize -> stato Context -> rerender UI`.

### Why this architecture / Perche questa architettura
- EN: Good speed for medium apps, simple mental model, low boilerplate.
- IT: Buona velocita per app medie, modello mentale semplice, poco boilerplate.

### Risks / Rischi
- EN: If Context files grow too much, complexity and rerender cost increase.
- IT: Se i file Context crescono troppo, aumenta la complessita e il costo di rerender.
- EN: Mitigate with module split and memoized selectors.
- IT: Mitigare con split moduli e selector memoizzati.

---

## 2) Providers, Context, state management, and Redux / Provider, Context, stato e Redux

### Context in this app / Context in questa app
- EN: `AuthContext`, `ExpensesContext`, `BudgetContext`, `CustomizationContext`, `ThemeContext`, `PaymentContext`, `ExpenseCategoriesContext`, `GoalsContext`.
- IT: Ogni Context isola un dominio: auth, spese, budget, preferenze UI, tema, pagamenti, categorie, obiettivi.

### When to use Context / Quando usare Context
- EN: Cross-screen state with moderate write frequency and custom domain logic.
- IT: Stato condiviso tra schermate con frequenza di scrittura moderata e logica dominio custom.

### When NOT to use only Context / Quando NON usare solo Context
- EN: Very high-frequency updates, complex async caching, or large derived selector trees.
- IT: Update molto frequenti, caching async complesso, o molti selector derivati.

### Context best practices / Best practice Context
- EN: Keep provider value memoized (`useMemo`) and actions stable (`useCallback`).
- IT: Mantieni il valore provider memoizzato (`useMemo`) e azioni stabili (`useCallback`).
- EN: Normalize at boundaries (incoming/outgoing data).
- IT: Normalizza ai confini (dati in ingresso/uscita).
- EN: Keep UI-specific state local in screen/component.
- IT: Mantieni stato solo-UI locale in screen/componente.

### Redux concept notes / Appunti concetto Redux
How Redux works / Come funziona Redux:
- Basic usage:
```js
import { configureStore, createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
  },
});

export const { increment } = counterSlice.actions;
export const store = configureStore({ reducer: { counter: counterSlice.reducer } });
```
- EN: Redux centralizes state with predictable reducer transitions.
- IT: Redux centralizza lo stato con transizioni prevedibili via reducer.
- When to use:
  - EN: Complex multi-team app, strict event history, heavy devtools need.
  - IT: App complessa multi-team, cronologia eventi rigorosa, forte esigenza devtools.
- When NOT:
  - EN: Small app with simple shared state.
  - IT: App piccola con stato condiviso semplice.
- Store/slices/actions:
  - EN: Store = global container; Slice = domain state + reducers; Action = event intent.
  - IT: Store = contenitore globale; Slice = stato dominio + reducer; Action = intento evento.
- Best practices:
  - EN: Use RTK, keep slices domain-oriented, use selectors, avoid giant slices.
  - IT: Usa RTK, slices per dominio, selector, evita slice monolitiche.

### Alternative state tools / Alternative gestione stato
- Zustand:
  - EN: Light global store with minimal boilerplate.
  - IT: Store globale leggero con poco boilerplate.
- TanStack Query:
  - EN: Server-state caching, retries, stale/fresh strategy.
  - IT: Caching server-state, retry, strategia stale/fresh.
- Hybrid pattern:
  - EN: Context/Redux for local domain state + Query for remote server cache.
  - IT: Context/Redux per stato dominio + Query per cache remota.

---

## 3) Component strategy / Strategia componenti

### When to create a component / Quando creare un componente
- EN: Repeated UI pattern, reusable behavior, or complexity isolation.
- IT: Pattern UI ripetuto, comportamento riusabile, o isolamento complessita.

### Splitting rules / Regole di split
- EN: Screen orchestrates data, component renders a focused part.
- IT: La screen orchestra i dati, il componente renderizza una parte focalizzata.
- EN: Keep component API explicit (`props` for data and callbacks).
- IT: Mantieni API del componente esplicita (`props` per dati e callback).

### Clean/reusable checklist / Checklist pulizia e riuso
- EN: Single responsibility.
- IT: Responsabilita singola.
- EN: No hidden side effects inside presentational components.
- IT: Nessun effetto collaterale nascosto nei componenti presentazionali.
- EN: Document expected props and empty/error/loading behaviors.
- IT: Documenta props attese e comportamenti empty/error/loading.

---

## 4) Routing and navigation / Routing e navigazione

### Current app pattern / Pattern attuale
- EN: React Navigation with nested `Stack + Drawer + BottomTabs`.
- IT: React Navigation con nesting `Stack + Drawer + BottomTabs`.

### Route design notes / Appunti design route
- EN: Keep feature stacks isolated (`BudgetStack`, `SettingsStack`, etc.).
- IT: Mantieni stack funzionali isolati (`BudgetStack`, `SettingsStack`, ecc.).
- EN: Use route params only for screen input, not as hidden global state.
- IT: Usa params route solo per input schermata, non come stato globale nascosto.

### expo-router vs React Navigation / expo-router vs React Navigation
- React Navigation:
  - EN: Full control, explicit route tree in code.
  - IT: Controllo totale, albero route esplicito nel codice.
- expo-router:
  - EN: File-based routing, faster convention setup.
  - IT: Routing file-based, setup rapido a convenzioni.
- Choose React Navigation when:
  - EN: You want custom nested patterns and full runtime control.
  - IT: Vuoi pattern nested custom e controllo completo runtime.
- Choose expo-router when:
  - EN: You prefer filesystem routing and web-like mental model.
  - IT: Preferisci routing da filesystem e modello mentale simile al web.

---

## 5) SVG notes / Appunti SVG

How SVG works in React Native / Come funziona SVG in React Native:
- Basic usage:
```jsx
import Svg, { Circle } from "react-native-svg";

<Svg width={40} height={40}>
  <Circle cx={20} cy={20} r={16} fill="#4dd0e1" />
</Svg>
```
- What it is for:
  - EN: Resolution-independent icons/charts/shapes.
  - IT: Icone/grafici/forme senza perdita di qualita.
- When to use:
  - EN: Custom charts, logos, dynamic vector graphics.
  - IT: Grafici custom, loghi, grafiche vettoriali dinamiche.
- When NOT:
  - EN: Simple static bitmap that never scales.
  - IT: Bitmap statica semplice che non scala mai.
- Edge cases:
  - EN: Complex SVG paths can hurt performance on low-end devices.
  - IT: Path SVG complessi possono impattare performance su device deboli.

---

## 6) Styling system / Sistema stile

### StyleSheet usage / Uso StyleSheet
- EN: Use `StyleSheet.create` for static style objects and stable references.
- IT: Usa `StyleSheet.create` per oggetti stile statici e riferimenti stabili.
- EN: Compose runtime colors via theme tokens (`GlobalStyles.colors`).
- IT: Componi colori runtime con token tema (`GlobalStyles.colors`).

### Theme tokens / Token tema
- EN: Keep semantic tokens (`textTitle`, `surface`, `accent500`) not raw hex in components.
- IT: Mantieni token semantici (`textTitle`, `surface`, `accent500`) non hex hardcoded.

### Consistency rules / Regole consistenza
- EN: Reuse spacing scale and border radius ranges across screens.
- IT: Riusa scala spaziatura e range border radius tra schermate.
- EN: Prefer visual primitives (card, pill, row) repeated consistently.
- IT: Preferisci primitive visuali (card, pill, row) ripetute in modo consistente.

---

## 7) React Native core components deep notes / Appunti approfonditi componenti core RN

## 7.1 `View`
How to use `View` / Come usare `View`:
- Basic usage:
```jsx
<View style={{ padding: 12 }}>
  <Text>Content</Text>
</View>
```
- What it is for: layout container.
- When to use: grouping, spacing, flex layout.
- When NOT: textual inline fragments.
- Props highlights: `style`, `pointerEvents`, `onLayout`.
- Children: accepts RN elements/components.
- Styling: flexbox, background, borders.
- Edge cases: nested heavy trees can rerender often.

## 7.2 `Text`
How to use `Text` / Come usare `Text`:
- Basic usage:
```jsx
<Text style={{ fontWeight: "700" }}>Titolo</Text>
```
- What it is for: all textual rendering.
- When to use: labels, messages, headings.
- When NOT: never place raw string directly in `View`.
- Props highlights: `numberOfLines`, `ellipsizeMode`, `selectable`.
- Children: strings or nested `Text`.
- Styling rules: text style only; nested `Text` inherits parent text style.
- Edge case: long text + no width constraints may overflow.

## 7.3 `Pressable` and `Touchable*`
How to use / Come usare:
- Basic usage:
```jsx
<Pressable onPress={onTap} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}>
  <Text>Save</Text>
</Pressable>
```
- What it is for: interaction.
- When to use: buttons, tappable rows, icons.
- When NOT: static visual blocks.
- Props highlights: `onPress`, `onLongPress`, `disabled`, state-based style callback.
- Best practice: centralize button component for consistency.

## 7.4 `ScrollView`
- Basic usage:
```jsx
<ScrollView contentContainerStyle={{ padding: 16 }}>
  {children}
</ScrollView>
```
- Use when: small/medium content length.
- Do not use for long lists (use FlatList).
- Props highlights: `contentContainerStyle`, `keyboardShouldPersistTaps`, `refreshControl`.

## 7.5 `FlatList` and `SectionList`
- Basic usage:
```jsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Row item={item} />}
/>
```
- Use for long lists (virtualization).
- Key props: `data`, `renderItem`, `keyExtractor`, `ListEmptyComponent`, `onEndReached`.
- Mistakes: unstable keys, inline heavy render functions without memoization.

## 7.6 `TextInput`
- Basic usage:
```jsx
<TextInput
  value={title}
  onChangeText={setTitle}
  placeholder="Cosa hai comprato?"
/>
```
- Use for forms and filters.
- Key props: `value`, `onChangeText`, `keyboardType`, `secureTextEntry`, `multiline`.
- Best practice: controlled inputs + validation by touched/submitted state.

## 7.7 `Image`
- Basic usage:
```jsx
<Image source={require("../assets/icon.png")} style={{ width: 40, height: 40 }} />
```
- Use for local/remote images.
- Key props: `source`, `resizeMode`.
- Edge case: remote image flicker; consider placeholders/caching strategies.

## 7.8 `Modal`
- Basic usage:
```jsx
<Modal visible={open} transparent animationType="slide">
  <View>{/* modal content */}</View>
</Modal>
```
- Use for focused temporary workflows (filters, picker, confirmations).
- Avoid modal stacking chaos.
- Best practice: provide clear close action and backdrop handling.

## 7.9 `KeyboardAvoidingView`
- Use to prevent keyboard from covering form inputs.
- Key props: `behavior`, `keyboardVerticalOffset`.
- On iOS usually `padding`; on Android often `height` or none.

## 7.10 `SafeAreaView`
- Use for notches/system bars.
- In this project, `react-native-safe-area-context` is used (`useSafeAreaInsets`).

## 7.11 `Animated`
- Basic usage:
```jsx
const opacity = useRef(new Animated.Value(0)).current;
Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
```
- Use for lightweight transitions and feedback.
- For advanced interactions prefer Reanimated.

---

## 8) Expo deep coverage / Expo approfondito

### How Expo works / Come funziona Expo
- EN: Expo provides managed runtime, build tooling, module APIs, and fast dev workflow.
- IT: Expo offre runtime gestito, tooling build, API moduli e workflow veloce.

### `app.json` notes / Appunti `app.json`
- Key fields:
  - `name`, `slug`, `version`
  - platform blocks (`ios`, `android`)
  - plugins list
  - `extra.eas.projectId`
- EN: Keep plugin list aligned with used native modules.
- IT: Mantieni lista plugin coerente con i moduli nativi usati.

### Permissions / Permessi
- EN: Request only when feature is used (just-in-time permission).
- IT: Richiedi permessi solo quando la feature serve (just-in-time).

### Builds and EAS / Build e EAS
- EN: Use `eas.json` profiles (`development`, `preview`, `production`).
- IT: Usa profili `eas.json` per ambienti diversi.
- EN: Test native-sensitive modules (notifications, deep links, etc.) in dev build, not Expo Go.
- IT: Testa moduli sensibili nativi in dev build, non in Expo Go.

### Common Expo modules / Moduli Expo comuni
- `expo-notifications`: local/push notifications.
- `expo-haptics`: tactile feedback.
- `expo-blur`: blur surfaces.
- `expo-file-system`, `expo-sharing`: file export/share flows.
- `expo-dev-client`: custom dev runtime for native features.

---

## 9) Libraries and tooling patterns / Librerie e pattern tooling

### Navigation
- React Navigation:
  - Problem solved / Problema risolto: native-like navigation model.
  - When to adopt / Quando adottare: almost always in custom nav architectures.
  - Pattern:
```jsx
<Stack.Navigator>
  <Stack.Screen name="Home" component={HomeScreen} />
</Stack.Navigator>
```

### State management
- Redux Toolkit: strict event-driven global state.
- Zustand: fast lightweight store.
- TanStack Query: server-state fetch/cache/retry.

### Forms and validation
- React Hook Form + Zod:
  - EN: Great for scalable forms and typed validation schemas.
  - IT: Ottimo per form scalabili e validazione tipizzata.
- Formik + Yup:
  - EN: Mature pattern for many legacy codebases.
  - IT: Pattern maturo per molti codebase legacy.

### Networking
- `fetch`:
  - EN: built-in minimal API.
  - IT: API base integrata.
- `axios`:
  - EN: interceptors, better ergonomics for auth/error pipelines.
  - IT: interceptors, ergonomia migliore per pipeline auth/error.

### Storage
- AsyncStorage: simple key/value local persistence.
- SecureStore: sensitive values (tokens, secrets).
- SQLite/MMKV:
  - EN: structured/offline heavy data or high-perf local reads.
  - IT: dati strutturati/offline pesanti o letture locali ad alte prestazioni.

### UI libs and icons
- `@expo/vector-icons` for iconography.
- UI kits (`react-native-paper`, etc.) when you need fast consistency.

### Animations and gestures
- Reanimated + Gesture Handler:
  - EN: performant gesture-driven animations.
  - IT: animazioni performanti guidate da gesture.
- Moti:
  - EN: high-level animation API on top of Reanimated.
  - IT: API high-level sopra Reanimated.

### Charts and SVG stack
- `react-native-chart-kit` + `react-native-svg` for dashboards.

### Auth and backend options
- Firebase Auth/Realtime DB (used in this project).
- Alternatives: Supabase, Appwrite, custom backend.

### Testing
- Jest: unit tests.
- React Native Testing Library: component behavior tests.
- Detox: end-to-end flows on device/simulator.

### Lint/format
- ESLint + Prettier.
- Convention:
  - EN: lint in CI, format before commit.
  - IT: lint in CI, format prima del commit.

---

## 10) Concept-by-concept mini templates / Mini template concetti

Use this template for any library/component / Usa questo template per ogni libreria/componente:
- Basic usage / Uso base.
- What it is for / A cosa serve.
- When to use / Quando usarlo.
- When NOT / Cosa NON fare.
- Important props/options / Props-opzioni importanti.
- Accepted input/children / Input-children accettati.
- Styling/integration rules / Regole stile-integrazione.
- Edge cases + best practices / Casi limite + best practice.
- Practical mini example / Mini esempio pratico.

This file applies that pattern to core app topics.  
Questo file applica quel pattern ai topic principali dell'app.

---

## 11) Screen-by-screen app notes (project specific) / Appunti schermata per schermata (specifici progetto)

### `ExpensesScreen`
- EN: Fetches expenses, period filters, search and advanced filtering states.
- IT: Recupera spese, filtri periodo, ricerca e filtri avanzati.
- EN: Search/filters now open via modal (hidden by default).
- IT: Ricerca/filtri ora in modal (nascosti di default).

### `ManageExpenses`
- EN: Add/edit expense flow, favorite template save, delete with undo.
- IT: Flusso aggiunta/modifica spesa, salvataggio preferiti, delete con undo.
- EN: Submit guard now prevents rapid duplicate inserts.
- IT: Ora esiste guard di submit che evita duplicati da tap rapidi.

### `QuickAddExpenseScreen`
- EN: Quick actions from templates and recurring subscriptions/habits.
- IT: Azioni rapide da modelli e ricorrenze.
- EN: Section spacing improved between recurring blocks and models.
- IT: Migliorata spaziatura tra blocchi ricorrenti e modelli.

### `BudgetScreen` + `ManageBudget`
- EN: Save now works even with 0 allocation; no strict allocation requirement.
- IT: Salvataggio ora funziona anche con allocazione 0; nessun vincolo stretto.
- EN: Save button no longer blocked by false dirty-sync behavior.
- IT: Il pulsante salva non e piu bloccato dal falso comportamento dirty-sync.

### `Settings`
- EN: Quick settings moved to dedicated `QuickSettings` sub-screen.
- IT: Impostazioni rapide spostate in sottoschermata dedicata `QuickSettings`.

### `CustomizeScreen`
- EN: Focused on themes only; UI toggles moved to quick settings.
- IT: Focalizzata sui temi; i toggle UI sono in quick settings.

---

## 12) Error handling and reliability notes / Appunti gestione errori e affidabilita
- EN: Use retry for network failures where user action is idempotent.
- IT: Usa retry per errori rete dove azione utente e idempotente.
- EN: Normalize API payloads before state update.
- IT: Normalizza payload API prima dell'update stato.
- EN: Use optimistic UI only with rollback strategy.
- IT: Usa UI ottimistica solo con strategia rollback.

---

## 13) Performance notes / Appunti performance
- EN: Memoize heavy list computations and derived filter outputs.
- IT: Memoizza computazioni pesanti lista e output filtri derivati.
- EN: Prefer `FlatList` over `ScrollView` for long dynamic datasets.
- IT: Preferisci `FlatList` a `ScrollView` per dataset lunghi.
- EN: Keep provider values stable to reduce rerender trees.
- IT: Mantieni stabili i valori provider per ridurre rerender.

---

## 14) Advanced section / Sezione avanzata

### A) Scalable architecture roadmap / Roadmap architettura scalabile
- EN: Move from broad Context providers to feature modules with typed service boundaries.
- IT: Passa da provider Context ampi a moduli feature con confini servizio tipizzati.
- EN: Introduce domain folders: `features/expenses`, `features/budget`, etc.
- IT: Introduci cartelle dominio: `features/expenses`, `features/budget`, ecc.

### B) Server-state strategy / Strategia server-state
- EN: Adopt TanStack Query for fetch/cache/invalidate patterns.
- IT: Adotta TanStack Query per pattern fetch/cache/invalidate.
- EN: Keep mutation side effects centralized in hooks.
- IT: Mantieni side effect delle mutation centralizzati in custom hook.

### C) Offline-first evolution / Evoluzione offline-first
- EN: Queue writes locally, sync when online, conflict policy per entity.
- IT: Metti in coda scritture locali, sync online, policy conflitti per entita.
- EN: Store operation journal with timestamps and deterministic merge rules.
- IT: Salva journal operazioni con timestamp e regole merge deterministiche.

### D) Performance hardening / Hardening performance
- EN: Add list item memoization and stable callbacks.
- IT: Aggiungi memoizzazione item lista e callback stabili.
- EN: Profile startup cost and split heavy screens/components.
- IT: Profila costo startup e splitta schermate/componenti pesanti.

### E) Testing maturity / Maturita testing
- EN: Add component tests for form validation, filters modal, budget save behavior.
- IT: Aggiungi test componenti per validazione form, modal filtri, salvataggio budget.
- EN: Add integration tests around Context + util/http boundaries.
- IT: Aggiungi test integrazione su confini Context + util/http.

### F) Release discipline / Disciplina release
- EN: Add release checklist: env check, build profile selection, smoke tests, crash monitoring.
- IT: Aggiungi checklist release: controllo env, profilo build, smoke test, monitoring crash.

---

## 15) Quick revision checklist / Checklist ripasso rapido
- EN/IT: Can I explain each provider responsibility in one sentence?
- EN/IT: Do I know where navigation routes are declared and why?
- EN/IT: Can I add a new screen without coupling business logic to UI?
- EN/IT: Can I add a new theme token safely?
- EN/IT: Can I explain why duplicate save guards are needed?
- EN/IT: Can I explain Expo Go vs Dev Client for notifications testing?

---

## 16) Final practical rule / Regola pratica finale
- EN: Keep architecture boring, predictable, and testable.
- IT: Mantieni architettura semplice, prevedibile e testabile.
- EN: Add visual polish in components, not chaos in state flow.
- IT: Aggiungi cura visiva nei componenti, non caos nel flusso stato.
