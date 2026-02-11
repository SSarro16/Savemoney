# Savemoney App Study Notes (IT + EN Technical Terms)

## 0) Come usare questo quaderno

Questo file non e un riassunto veloce: e un quaderno operativo.
Usalo in 3 modi:

1. Prima di implementare una feature: leggi `Architecture` + la sezione del componente che userai.
2. Durante il coding: copia i pattern dai blocchi `code example` e adattali.
3. Prima di una release: usa le checklist (navigation/state/env/sentry/notifications).

Regola lingua del quaderno:
- spiegazioni in italiano.
- termini tecnici sempre in English (`View`, `useMemo`, `Stack.Navigator`, `queryClient.invalidateQueries`, ecc.).

---

## 1) Project structure e architecture (molto approfondito)

### 1.1 Mappa cartelle attuale (progetto reale)

- `App.js`
  - root navigation (`Stack`, `Drawer`, `BottomTabs`)
  - provider composition order
  - global setup (`initMonitoring`, `configureNotifications`)
- `screens/`
  - orchestrazione schermata (fetch, event handlers, coordinamento Context)
- `components/`
  - blocchi UI riusabili, con business-light logic
- `store/`
  - domain state (`auth`, `expenses`, `budget`, `payment`, `theme`, `customization`, `goals`)
- `util/`
  - HTTP layer, env, normalization, notifications, migration/backfill helpers
- `constants/`
  - design tokens, icon maps, navigation constants

### 1.2 Data flow end-to-end

Flow tipico add expense:

`ExpenseForm -> onSubmit -> ManageExpenses -> expensesCtx.addExpense -> util/http.storeExpense -> normalizeExpense -> reducer ADD -> rerender ExpensesList`

Punti chiave:
- normalizzazione ai bordi: entra sporco, esce pulito.
- UI components non devono conoscere dettagli Firebase.
- i Context devono esporre API stabili (`useCallback` + `useMemo`).

### 1.3 Provider composition e perche l'ordine conta

Provider order attuale (in `App.js`) e sensato:

- `AuthContextProvider`
- `ThemeContextProvider`
- `CustomizationContextProvider`
- `ExpenseCategoriesContextProvider`
- `BudgetContextProvider`
- `PaymentContextProvider`
- `GoalsContextProvider`
- `ExpensesContextProvider`

Perche funziona:
- `ExpensesContext` dipende da `BudgetContext`, `PaymentContext`, `CustomizationContext`.
- `BudgetContext` dipende da `AuthContext` e `ExpenseCategoriesContext`.

Se inverti provider in modo sbagliato, rompi dipendenze implicite.

### 1.4 Pattern architetturali presenti nel progetto

Pattern usati bene:
- `service boundary`: `util/http.js`, `util/profile-http.js`, `util/budget/budget-storage.js`.
- `state mutation through context actions`: niente mutate dirette in screen.
- `domain normalization`: `normalizeExpense`, `normalizeProfile`, `normalizeBudget`.
- `resilience`: retry su auth expiry (`withAuthRetry` pattern).
- `undo pattern`: delete differita + timer + rollback.

Rischi da tenere sotto controllo:
- Context troppo larghi: troppe responsabilita nello stesso provider.
- derived data pesanti dentro render.
- props drilling se non definisci bene boundaries tra `screen` e `component`.

### 1.5 Boundary rule pratica (da applicare sempre)

- `screen`:
  - gestisce navigation
  - chiama actions del context
  - compone section component
- `component`:
  - riceve dati gia pronti
  - al massimo valida input UI
  - non fa fetch globale
- `util`:
  - pura logica o I/O remoto/local

Checklist rapida architecture:
- ogni file in `store/` ha una singola responsabilita dominio?
- ogni `screen` puo essere testata con context mock?
- ogni payload remoto viene normalizzato una volta sola?

---

## 2) React Native core components deep dive (super approfondito)

Nota: in ogni sottosezione trovi:
- `what it is`
- `when to use`
- props importanti (incluse meno ovvie)
- gotchas
- pattern tipici
- 3 `code example` completi

---

### 2.1 `View`

#### What it is
`View` e il container base per layout e grouping.

#### When to use
- creare blocchi visuali (`card`, `row`, `section`)
- applicare flexbox
- raggruppare elementi interattivi e testo

#### Props importanti
- `style`: layout, spacing, border, background
- `pointerEvents`: controllo hit testing (`auto`, `none`, `box-only`, `box-none`)
- `onLayout`: misura runtime (`width`, `height`) utile per animation/calcoli
- `accessible`: wrapper per accessibility tree

#### Gotchas
- troppi wrapper inutili aumentano costo render.
- `View` non renderizza testo raw: usa sempre `Text`.
- `pointerEvents` errato puo bloccare press in layer sottostanti.

#### Pattern tipici
- layout primitives (`Row`, `Card`, `Section`)
- overlay non interattivo con `pointerEvents="none"`
- `onLayout` per misurazioni dinamiche

#### Code example 1 - base container

```jsx
import { View, Text, StyleSheet } from "react-native";

export default function BasicCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Saldo mensile</Text>
      <Text style={styles.value}>1,240.00 EUR</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    backgroundColor: "#1b2433",
    borderColor: "#2a3a52",
  },
  title: { color: "#a8b3c7", fontWeight: "700", fontSize: 12 },
  value: { marginTop: 6, color: "#ffffff", fontWeight: "900", fontSize: 24 },
});
```

#### Code example 2 - realistic expense app row layout

```jsx
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function ExpenseMetaRow({ category, payLabel, dateLabel }) {
  return (
    <View style={styles.row}>
      <View style={styles.pill}>
        <Ionicons name="pricetag-outline" size={12} color="#9aa6bb" />
        <Text style={styles.pillText}>{category || "Senza categoria"}</Text>
      </View>

      <View style={styles.pill}>
        <Ionicons name="card-outline" size={12} color="#9aa6bb" />
        <Text style={styles.pillText}>{payLabel || "Contanti"}</Text>
      </View>

      <View style={styles.pill}>
        <Ionicons name="calendar-outline" size={12} color="#9aa6bb" />
        <Text style={styles.pillText}>{dateLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2d3d55",
    backgroundColor: "#121a27",
  },
  pillText: { color: "#d9e1ee", fontWeight: "800", fontSize: 10 },
});
```

#### Code example 3 - edge case overlay + pointerEvents

```jsx
import { View, Text, Pressable, StyleSheet } from "react-native";

export function OverlayExample({ onPressMain }) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.button} onPress={onPressMain}>
        <Text style={styles.buttonText}>Apri dettaglio</Text>
      </Pressable>

      <View pointerEvents="none" style={styles.overlayDecoration}>
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", borderRadius: 16, overflow: "hidden" },
  button: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#1f2d43",
    borderWidth: 1,
    borderColor: "#304766",
  },
  buttonText: { color: "#fff", fontWeight: "900" },
  overlayDecoration: { ...StyleSheet.absoluteFillObject },
  orbTop: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 90,
    top: -30,
    right: -20,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orbBottom: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 40,
    right: 32,
    bottom: -14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});
```

---

### 2.2 `Text`

#### What it is
`Text` e l'unico componente affidabile per rendering testuale in React Native.

#### When to use
- titoli, label, body
- inline styling con `Text` nested
- truncation (`numberOfLines`) in list row

#### Props importanti
- `numberOfLines`
- `ellipsizeMode` (`head`, `middle`, `tail`, `clip`)
- `selectable`
- `allowFontScaling`
- `onPress` (per link inline)

#### Gotchas
- string raw dentro `View` puo causare warning/error.
- nested `Text` eredita style parent (utile ma va controllato).
- su Android alcune metriche font variano per device/font fallback.

#### Pattern tipici
- `Text` semantic wrappers (`AppTitle`, `BodyText`, `Caption`)
- truncation in `FlatList` item
- evidenziazione query con chunk split

#### Code example 1 - typography primitives

```jsx
import { Text, StyleSheet, View } from "react-native";

function AppTitle({ children }) {
  return <Text style={styles.title}>{children}</Text>;
}

function AppBody({ children, muted = false }) {
  return <Text style={[styles.body, muted && styles.bodyMuted]}>{children}</Text>;
}

export default function TypographyPreview() {
  return (
    <View style={styles.card}>
      <AppTitle>Riepilogo Settimana</AppTitle>
      <AppBody>Hai registrato 17 movimenti.</AppBody>
      <AppBody muted>Controlla la categoria "Svago" per ottimizzare.</AppBody>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 14, backgroundColor: "#182233" },
  title: { color: "#fff", fontWeight: "900", fontSize: 19 },
  body: { marginTop: 6, color: "#d6deeb", fontWeight: "700", fontSize: 14 },
  bodyMuted: { color: "#9eabc1" },
});
```

#### Code example 2 - realistic expense title con truncation

```jsx
import { View, Text, StyleSheet } from "react-native";

export function ExpenseRowTitle({ description, category }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
        {description}
      </Text>
      <Text style={styles.meta} numberOfLines={1} ellipsizeMode="tail">
        {category || "Senza categoria"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 0 },
  description: { color: "#ffffff", fontWeight: "900", fontSize: 15 },
  meta: { marginTop: 2, color: "#9aa9bf", fontWeight: "700", fontSize: 11 },
});
```

#### Code example 3 - edge case highlight search match

```jsx
import { Text, StyleSheet } from "react-native";

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({ text, query }) {
  const safeText = String(text || "");
  const q = String(query || "").trim();

  if (!q) return <Text style={styles.base}>{safeText}</Text>;

  const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
  const parts = safeText.split(re);

  return (
    <Text style={styles.base} numberOfLines={2}>
      {parts.map((part, idx) => {
        const isMatch = part.toLowerCase() === q.toLowerCase();
        return (
          <Text key={`${part}_${idx}`} style={isMatch ? styles.match : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { color: "#dce5f2", fontWeight: "700", lineHeight: 20 },
  match: { backgroundColor: "#f6df64", color: "#0f172a", fontWeight: "900" },
});
```

---

### 2.3 `Pressable`

#### What it is
`Pressable` e il componente moderno per touch interactions.

#### When to use
- button primari/secondari
- row cliccabili in list
- long press actions (`edit`, `delete`, `open menu`)

#### Props importanti
- `onPress`, `onLongPress`, `onPressIn`, `onPressOut`
- `disabled`
- `style={({ pressed }) => ...}`
- `android_ripple`
- `hitSlop`
- `pressRetentionOffset`

#### Gotchas
- style callback inline pesante in list grandi puo aumentare costo render.
- `disabled` va riflesso anche visivamente.
- senza `hitSlop`, target touch piccolo penalizza usability.

#### Pattern tipici
- callback `style` con pressed feedback
- button wrapper centralizzato (`CButton` style)
- double-submit guard (`isSubmitting` + lock ref)

#### Code example 1 - base button con style callback

```jsx
import { Pressable, Text, StyleSheet } from "react-native";

export function PrimaryButton({ label, onPress, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: "rgba(255,255,255,0.16)" }}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#39b3f5",
    backgroundColor: "#35c3ff",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  label: { color: "#0f172a", fontWeight: "900", letterSpacing: 0.2 },
});
```

#### Code example 2 - realistic expense row actions

```jsx
import { View, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function ExpenseActions({ onEdit, onDelete }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onEdit}
        hitSlop={8}
        style={({ pressed }) => [styles.action, styles.edit, pressed && styles.pressed]}
      >
        <Ionicons name="create-outline" size={16} color="#e2eefc" />
        <Text style={styles.text}>Modifica</Text>
      </Pressable>

      <Pressable
        onPress={onDelete}
        onLongPress={onDelete}
        delayLongPress={320}
        hitSlop={8}
        style={({ pressed }) => [styles.action, styles.delete, pressed && styles.pressed]}
      >
        <Ionicons name="trash-outline" size={16} color="#ffe5ef" />
        <Text style={styles.text}>Elimina</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  edit: { backgroundColor: "#1d3047", borderColor: "#304f73" },
  delete: { backgroundColor: "#481d2b", borderColor: "#7a2e4b" },
  pressed: { opacity: 0.9 },
  text: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
```

#### Code example 3 - edge case submit guard

```jsx
import { useRef, useState } from "react";
import { Alert, View } from "react-native";
import { PrimaryButton } from "./PrimaryButton";

export function GuardedSave({ saveExpense }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);

  async function onSave() {
    if (isSubmitting || submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      await saveExpense();
    } catch (e) {
      Alert.alert("Errore", "Salvataggio non riuscito");
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  }

  return (
    <View>
      <PrimaryButton
        label={isSubmitting ? "Salvataggio..." : "Salva"}
        onPress={onSave}
        disabled={isSubmitting}
      />
    </View>
  );
}
```

---

### 2.4 `ScrollView`

#### What it is
Container scrollabile che renderizza tutti i children insieme.

#### When to use
- contenuto piccolo/medio
- form con pochi campi
- schermate statiche con sezioni verticali

#### When NOT to use
- liste lunghe dinamiche: usa `FlatList`/`SectionList`

#### Props importanti
- `contentContainerStyle`
- `keyboardShouldPersistTaps`
- `keyboardDismissMode`
- `showsVerticalScrollIndicator`
- `refreshControl`
- `stickyHeaderIndices`

#### Gotchas
- renderizza tutto: puo pesare molto su dataset lunghi.
- con `TextInput` e tastiera, senza `keyboardShouldPersistTaps="handled"` perdi tap su button.

#### Pattern tipici
- form inside `KeyboardAvoidingView`
- settings page con blocchi card
- sticky summary header su content statico

#### Code example 1 - base settings screen

```jsx
import { ScrollView, View, Text, StyleSheet } from "react-native";

export default function SettingsScreenSimple() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}><Text style={styles.title}>Interfaccia</Text></View>
      <View style={styles.card}><Text style={styles.title}>Notifiche</Text></View>
      <View style={styles.card}><Text style={styles.title}>Privacy</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f1726" },
  content: { padding: 14, gap: 10, paddingBottom: 28 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2a3e5f", backgroundColor: "#152136" },
  title: { color: "#fff", fontWeight: "900" },
});
```

#### Code example 2 - realistic form con keyboard taps

```jsx
import { ScrollView, View, TextInput, StyleSheet } from "react-native";
import { PrimaryButton } from "./PrimaryButton";

export function ProfileForm({ draft, setDraft, onSubmit }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      <TextInput
        style={styles.input}
        value={draft.firstName}
        onChangeText={(v) => setDraft((s) => ({ ...s, firstName: v }))}
        placeholder="Nome"
      />

      <TextInput
        style={styles.input}
        value={draft.lastName}
        onChangeText={(v) => setDraft((s) => ({ ...s, lastName: v }))}
        placeholder="Cognome"
      />

      <View style={{ marginTop: 12 }}>
        <PrimaryButton label="Salva profilo" onPress={onSubmit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, gap: 10, paddingBottom: 30 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#29405f",
    backgroundColor: "#111b2c",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
```

#### Code example 3 - edge case sticky header

```jsx
import { ScrollView, View, Text, StyleSheet } from "react-native";

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function StickyBudgetOverview() {
  return (
    <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.stickySummary}>
        <Text style={styles.summaryText}>Utilizzo budget: 78%</Text>
      </View>

      <Section title="Spese">...</Section>
      <Section title="Risparmio">...</Section>
      <Section title="Svago">...</Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stickySummary: { padding: 12, backgroundColor: "#0d1726", borderBottomWidth: 1, borderBottomColor: "#27405f" },
  summaryText: { color: "#fff", fontWeight: "900" },
  section: { padding: 14, borderBottomWidth: 1, borderBottomColor: "#1f3450" },
  sectionTitle: { color: "#d6dfec", fontWeight: "900", marginBottom: 6 },
});
```

---

### 2.5 `FlatList`

#### What it is
List virtualizzata per dataset medio-lunghi.

#### When to use
- feed spese
- timeline ricorrenze
- card list con pagination/infinite scroll

#### Props importanti
- `data`
- `renderItem`
- `keyExtractor`
- `ListEmptyComponent`, `ListHeaderComponent`, `ListFooterComponent`
- `onEndReached`, `onEndReachedThreshold`
- `initialNumToRender`, `windowSize`, `maxToRenderPerBatch`
- `removeClippedSubviews`
- `getItemLayout` (se item height fissa)

#### Gotchas
- `keyExtractor` instabile = rerender inutili + flicker.
- `renderItem` inline non memoizzata in list pesanti.
- `onEndReached` puo trigger multipli senza guard.

#### Pattern tipici
- item memoizzato (`React.memo`)
- callback stabili (`useCallback`)
- pagination guard (`isFetchingMoreRef`)

#### Code example 1 - base expenses list

```jsx
import { FlatList, Text, View } from "react-native";

function ExpenseRow({ item }) {
  return (
    <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#203653" }}>
      <Text style={{ color: "#fff", fontWeight: "800" }}>{item.description}</Text>
      <Text style={{ color: "#9fb0c9" }}>{Number(item.amount || 0).toFixed(2)} EUR</Text>
    </View>
  );
}

export function BasicExpenseList({ expenses }) {
  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ExpenseRow item={item} />}
      ListEmptyComponent={<Text style={{ color: "#9fb0c9", textAlign: "center", marginTop: 24 }}>Nessuna spesa</Text>}
    />
  );
}
```

#### Code example 2 - realistic + memoized renderItem

```jsx
import React, { useCallback } from "react";
import { FlatList } from "react-native";

const ExpenseItem = React.memo(function ExpenseItem({ item, onOpen }) {
  return <YourExpenseCard item={item} onPress={() => onOpen(item.id)} />;
});

export function OptimizedExpenseList({ data, onOpenExpense }) {
  const renderItem = useCallback(
    ({ item }) => <ExpenseItem item={item} onOpen={onOpenExpense} />,
    [onOpenExpense],
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      initialNumToRender={10}
      windowSize={7}
      maxToRenderPerBatch={8}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews
    />
  );
}
```

#### Code example 3 - edge case pagination guard

```jsx
import { useRef } from "react";
import { FlatList, ActivityIndicator, View } from "react-native";

export function InfiniteExpenseList({ data, loadingMore, loadMore, hasNextPage }) {
  const loadingRef = useRef(false);

  async function handleEndReached() {
    if (loadingRef.current || loadingMore || !hasNextPage) return;
    loadingRef.current = true;
    try {
      await loadMore();
    } finally {
      loadingRef.current = false;
    }
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <YourExpenseCard item={item} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.35}
      ListFooterComponent={
        loadingMore ? (
          <View style={{ padding: 12 }}>
            <ActivityIndicator />
          </View>
        ) : null
      }
    />
  );
}
```

---

### 2.6 `SectionList`

#### What it is
List virtualizzata con grouping per sezioni.

#### When to use
- spese raggruppate per mese
- ricorrenze per tipo (`SUBSCRIPTION`, `HABIT`)
- report per category group

#### Props importanti
- `sections` (`[{ title, data }]`)
- `renderItem`
- `renderSectionHeader`
- `stickySectionHeadersEnabled`
- `keyExtractor`
- `SectionSeparatorComponent`

#### Gotchas
- preprocessing delle sezioni va memoizzato (`useMemo`).
- header sticky + nested gesture possono creare conflitti UI.

#### Pattern tipici
- pre-grouping in selector helper
- section footer con totals
- sorted section order (es. mese decrescente)

#### Code example 1 - base grouping by month

```jsx
import { SectionList, Text, View } from "react-native";

function groupByMonth(expenses) {
  const map = new Map();
  for (const e of expenses || []) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([title, data]) => ({ title, data }));
}

export function ExpensesByMonth({ expenses }) {
  const sections = groupByMonth(expenses);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={{ padding: 8, backgroundColor: "#132238" }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => <YourExpenseCard item={item} />}
    />
  );
}
```

#### Code example 2 - realistic recurring sections

```jsx
import { useMemo } from "react";
import { SectionList, Text, View } from "react-native";

export function RecurringSectionList({ items }) {
  const sections = useMemo(() => {
    const subs = (items || []).filter((x) => x.type === "SUBSCRIPTION");
    const habits = (items || []).filter((x) => x.type === "HABIT");

    return [
      { title: "Subscriptions", data: subs },
      { title: "Habits", data: habits },
    ].filter((section) => section.data.length > 0);
  }, [items]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <Text style={{ color: "#b8c5da", fontWeight: "900" }}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => <RecurringRow item={item} />}
      stickySectionHeadersEnabled
    />
  );
}
```

#### Code example 3 - edge case section totals

```jsx
import { SectionList, View, Text } from "react-native";

function sectionTotal(section) {
  return (section.data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

export function BudgetSectionReport({ sections }) {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={{ padding: 10, backgroundColor: "#112036" }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => <ReportRow item={item} />}
      renderSectionFooter={({ section }) => (
        <View style={{ padding: 10 }}>
          <Text style={{ color: "#a3b2c8", fontWeight: "800" }}>
            Totale sezione: {sectionTotal(section).toFixed(2)} EUR
          </Text>
        </View>
      )}
    />
  );
}
```

---

### 2.7 `TextInput`

#### What it is
Input control per testo libero, numeri, password, ricerca.

#### When to use
- form auth/profile
- form expense/budget
- search/filter UI

#### Props importanti
- `value` + `onChangeText` (controlled pattern)
- `placeholder`, `placeholderTextColor`
- `keyboardType`, `returnKeyType`
- `secureTextEntry`
- `autoCapitalize`, `autoCorrect`
- `multiline`, `textAlignVertical`
- `onBlur`, `onSubmitEditing`
- `editable`

#### Gotchas
- uncontrolled input in form complessi porta inconsistenza.
- numeric parsing locale (`12,50` vs `12.50`) va normalizzato.
- in modal/form scrollabile serve `keyboardShouldPersistTaps`.

#### Pattern tipici
- controlled + touched/submitted validation
- parse helper per amount
- debounced search input

#### Code example 1 - controlled basic

```jsx
import { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

export function ControlledInputExample() {
  const [name, setName] = useState("");

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome categoria"
        placeholderTextColor="#8ea0b8"
      />
      <Text style={styles.preview}>Preview: {name || "(vuoto)"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: { borderWidth: 1, borderColor: "#2f4568", borderRadius: 12, color: "#fff", paddingHorizontal: 12, paddingVertical: 10 },
  preview: { color: "#9db0c9", fontWeight: "700" },
});
```

#### Code example 2 - realistic expense amount parsing

```jsx
import { useMemo, useState } from "react";
import { View, TextInput, Text } from "react-native";

function parseAmount(value) {
  const cleaned = String(value || "").replace(",", ".").replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function AmountField() {
  const [amountText, setAmountText] = useState("");
  const amount = useMemo(() => parseAmount(amountText), [amountText]);
  const valid = Number.isFinite(amount) && amount > 0;

  return (
    <View>
      <TextInput
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        placeholder="12,50"
      />
      <Text>
        {valid ? `Importo valido: ${amount.toFixed(2)} EUR` : "Inserisci importo valido"}
      </Text>
    </View>
  );
}
```

#### Code example 3 - edge case debounced search

```jsx
import { useEffect, useState } from "react";
import { TextInput } from "react-native";

export function SearchInput({ onQueryChange }) {
  const [local, setLocal] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(String(local || "").trim());
    }, 220);

    return () => clearTimeout(timer);
  }, [local, onQueryChange]);

  return (
    <TextInput
      value={local}
      onChangeText={setLocal}
      placeholder="Cerca descrizione o categoria"
      returnKeyType="search"
      autoCorrect={false}
      autoCapitalize="none"
    />
  );
}
```

---

### 2.8 `Image`

#### What it is
Rendering di immagini locali o remote.

#### When to use
- app logo/icon
- avatar utente
- hero image nelle card

#### Props importanti
- `source` (`require(...)` o `{ uri }`)
- `resizeMode` (`cover`, `contain`, `stretch`, `center`)
- `onLoad`, `onError`
- `defaultSource` (iOS)
- `fadeDuration` (Android)

#### Gotchas
- dimensione obbligatoria quasi sempre (`width`/`height`).
- remote image senza fallback rompe UX in connessioni lente.
- list con molte immagini remote richiede caching strategy.

#### Pattern tipici
- fallback image state
- skeleton while loading
- prefetch in feed

#### Code example 1 - local asset

```jsx
import { Image, View, StyleSheet } from "react-native";

export function AppLogoBadge() {
  return (
    <View style={styles.wrap}>
      <Image source={require("../../assets/icon.png")} style={styles.image} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 52, height: 52, borderRadius: 16, overflow: "hidden" },
  image: { width: "100%", height: "100%" },
});
```

#### Code example 2 - realistic remote profile avatar

```jsx
import { useState } from "react";
import { Image, View, Text, StyleSheet } from "react-native";

export function ProfileAvatar({ uri, initials = "SM" }) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={styles.avatar}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: 22 },
  fallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2a3e5f",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: "#fff", fontWeight: "900" },
});
```

#### Code example 3 - edge case list thumbnails

```jsx
import { useEffect } from "react";
import { Image } from "react-native";

export function PrefetchedThumb({ uri }) {
  useEffect(() => {
    if (!uri) return;
    Image.prefetch(uri).catch(() => {});
  }, [uri]);

  return (
    <Image
      source={uri ? { uri } : require("../../assets/icon.png")}
      style={{ width: 56, height: 56, borderRadius: 12 }}
      resizeMode="cover"
      fadeDuration={120}
    />
  );
}
```

---

### 2.9 `Modal`

#### What it is
Layer temporaneo sopra la schermata corrente, utile per task focalizzati.

#### When to use
- conferme critiche
- filter sheet
- profile completion prompt

#### Props importanti
- `visible`
- `animationType` (`none`, `slide`, `fade`)
- `transparent`
- `onRequestClose` (importante su Android)
- `presentationStyle` (iOS)
- `statusBarTranslucent` (Android)

#### Gotchas
- modal stack multipli = UX confusa.
- senza backdrop dismiss/close action l'utente resta bloccato.
- keyboard overlap se non usi `KeyboardAvoidingView`.

#### Pattern tipici
- controlled modal state in screen
- backdrop press to dismiss (per non destructive flow)
- explicit primary/secondary actions

#### Code example 1 - basic confirm modal

```jsx
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

export function ConfirmDeleteModal({ open, onCancel, onConfirm }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Eliminare la spesa?</Text>
          <Text style={styles.sub}>Potrai annullare per alcuni secondi.</Text>

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.secondary}><Text>Annulla</Text></Pressable>
            <Pressable onPress={onConfirm} style={styles.primary}><Text>Elimina</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.65)" },
  card: { borderRadius: 16, padding: 14, backgroundColor: "#172235" },
  title: { color: "#fff", fontWeight: "900", fontSize: 16 },
  sub: { marginTop: 6, color: "#a8b7cd" },
  actions: { marginTop: 14, flexDirection: "row", gap: 8 },
  secondary: { flex: 1, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#2a3a50" },
  primary: { flex: 1, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#c03557" },
});
```

#### Code example 2 - realistic filter bottom sheet

```jsx
import { Modal, View, Pressable, TextInput, Text, StyleSheet } from "react-native";

export function FiltersModal({ open, query, setQuery, onClose }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Ricerca e filtri</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cerca descrizione o categoria"
            style={styles.input}
          />

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Chiudi filtri</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a3f61",
    backgroundColor: "#131f31",
  },
  title: { color: "#fff", fontWeight: "900", fontSize: 18 },
  input: { marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#335177", color: "#fff", paddingHorizontal: 12, paddingVertical: 10 },
  closeBtn: { marginTop: 16, height: 44, borderRadius: 12, borderWidth: 1, borderColor: "#3aaee6", alignItems: "center", justifyContent: "center" },
  closeText: { color: "#cde9fb", fontWeight: "900" },
});
```

#### Code example 3 - edge case modal with critical flow guard

```jsx
import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";

export function UnsavedChangesModal({ open, onDiscard, onKeepEditing }) {
  const [busy, setBusy] = useState(false);

  async function discardSafe() {
    if (busy) return;
    setBusy(true);
    try {
      await onDiscard();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onKeepEditing}>
      <View style={{ flex: 1, justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.65)" }}>
        <View style={{ borderRadius: 14, backgroundColor: "#172335", padding: 14 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Hai modifiche non salvate</Text>
          <Text style={{ color: "#aebdd4", marginTop: 6 }}>Vuoi uscire senza salvare?</Text>

          <Pressable onPress={onKeepEditing}><Text>Continua modifica</Text></Pressable>
          <Pressable disabled={busy} onPress={discardSafe}><Text>{busy ? "Attendi..." : "Esci senza salvare"}</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}
```

---

### 2.10 `KeyboardAvoidingView`

#### What it is
Componente per evitare che la tastiera copra input/buttons.

#### When to use
- form login/signup
- modal con campi input
- editor profilo con salvataggio in basso

#### Props importanti
- `behavior` (`padding`, `height`, `position`)
- `keyboardVerticalOffset`
- `enabled`

#### Gotchas
- offset errato se hai header custom.
- Android e iOS richiedono `behavior` diversi.

#### Pattern tipici
- iOS `padding`, Android `height` o `undefined`
- combinazione con `useHeaderHeight`
- nested con `ScrollView keyboardShouldPersistTaps="handled"`

#### Code example 1 - base login

```jsx
import { KeyboardAvoidingView, Platform, View, TextInput, StyleSheet } from "react-native";

export function LoginForm() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 82 : 0}
    >
      <View style={styles.wrap}>
        <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 16, gap: 10 },
  input: { borderRadius: 12, borderWidth: 1, borderColor: "#334e73", paddingHorizontal: 12, paddingVertical: 10, color: "#fff" },
});
```

#### Code example 2 - realistic profile modal

```jsx
import { KeyboardAvoidingView, Platform, Modal, View, TextInput } from "react-native";

export function ProfileModal({ open, firstName, setFirstName, onClose }) {
  return (
    <Modal visible={open} transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.66)" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 24}
        >
          <View style={{ borderRadius: 14, backgroundColor: "#16253a", padding: 14 }}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nome"
              style={{ borderWidth: 1, borderColor: "#2f4d72", borderRadius: 12, padding: 10, color: "#fff" }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
```

#### Code example 3 - edge case con header offset dinamico

```jsx
import { KeyboardAvoidingView, Platform } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

export function FormWithDynamicOffset({ children }) {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
```

---

### 2.11 `SafeAreaView` (via `react-native-safe-area-context`)

#### What it is
Gestione aree sicure (notch, home indicator, status bar region).

#### When to use
- root screen container
- floating footer/bottom bar
- modal full-screen

#### Props/metodi importanti
- `SafeAreaView` (`edges`)
- `useSafeAreaInsets()` per offset custom

#### Gotchas
- usare sia padding manuale che safe insets senza criterio = doppio spacing.
- modals custom full-screen vanno testate su device con notch.

#### Pattern tipici
- root wrapper con `edges={["top", "bottom"]}`
- floating elements offset con `insets.bottom`

#### Code example 1 - base safe area wrapper

```jsx
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";

export function SafeRoot() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1726" }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, padding: 14 }}>
        <Text style={{ color: "#fff", fontWeight: "900" }}>Dashboard</Text>
      </View>
    </SafeAreaView>
  );
}
```

#### Code example 2 - realistic floating action

```jsx
import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function FloatingQuickAdd({ onPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
      <Pressable
        onPress={onPress}
        style={{
          marginHorizontal: 16,
          marginBottom: Math.max(insets.bottom + 12, 16),
          height: 52,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#35c3ff",
        }}
      >
        <Text style={{ color: "#0f172a", fontWeight: "900" }}>Aggiunta rapida</Text>
      </Pressable>
    </View>
  );
}
```

#### Code example 3 - edge case modal safe edges

```jsx
import { Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function FullscreenModalSafe({ open, children, onClose }) {
  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f1726" }} edges={["top", "bottom"]}>
        <View style={{ flex: 1 }}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
}
```

---

### 2.12 `Animated` (core API)

#### What it is
API built-in per animazioni semplici e performanti.

#### When to use
- fade/slide micro transitions
- press feedback
- collapse/expand element

#### When NOT to use
- gesture/physics avanzata complessa -> meglio `react-native-reanimated`

#### Props/API importanti
- `new Animated.Value(initial)`
- `Animated.timing`, `Animated.spring`, `Animated.decay`
- `useNativeDriver` (quando possibile)
- `interpolate`
- `Animated.sequence`, `Animated.parallel`, `Animated.loop`

#### Gotchas
- non tutte le properties supportano `useNativeDriver: true`.
- creare nuovi `Animated.Value` ad ogni render rompe animazioni.

#### Pattern tipici
- `useRef(new Animated.Value(...)).current`
- press in/out animation
- enter animation on mount

#### Code example 1 - fade in card on mount

```jsx
import { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";

export function FadeInCard({ title }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity, padding: 14, borderRadius: 14, backgroundColor: "#1a2a40" }}>
      <Text style={{ color: "#fff", fontWeight: "900" }}>{title}</Text>
    </Animated.View>
  );
}
```

#### Code example 2 - realistic press micro animation

```jsx
import { useRef } from "react";
import { Animated, Pressable, Text } from "react-native";

export function AnimatedPressButton({ onPress, label }) {
  const anim = useRef(new Animated.Value(0)).current;
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.timing(anim, { toValue: 1, duration: 90, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(anim, { toValue: 0, duration: 130, useNativeDriver: true }).start()}
    >
      <Animated.View style={{ transform: [{ scale }], height: 46, borderRadius: 14, backgroundColor: "#39c4ff", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#0f172a", fontWeight: "900" }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
```

#### Code example 3 - edge case delete collapse

```jsx
import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

export function RemovableRow({ item, onRemove }) {
  const rowAnim = useRef(new Animated.Value(1)).current;

  async function removeWithCollapse() {
    await new Promise((resolve) => {
      Animated.timing(rowAnim, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }).start(() => resolve());
    });
    onRemove(item.id);
  }

  return (
    <Animated.View style={{ opacity: rowAnim, transform: [{ scaleY: rowAnim }] }}>
      <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#16243a", marginBottom: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{item.description}</Text>
        <Pressable onPress={removeWithCollapse}><Text style={{ color: "#ff86ab" }}>Elimina</Text></Pressable>
      </View>
    </Animated.View>
  );
}
```

---

### 2.13 `ImageBackground`, `Switch`, `ActivityIndicator` (extra pratici)

#### Perche questa sezione extra
Non sono nel cuore di ogni screen, ma in app reali (come la tua) compaiono spesso.

`ImageBackground`
- utile per hero area con testo sopra.
- attenzione al contrasto testo/background.

`Switch`
- perfetto per quick settings (`compactMode`, `budgetAlertsEnabled`).
- evita side effects multipli direttamente in `onValueChange`: delega a context action.

`ActivityIndicator`
- mostra loading state corto e chiaro.
- non usarlo senza testo in flow critici (utente non capisce cosa sta caricando).

---

## 3) Navigation pratica: Stack + Drawer + Tabs + patterns

### 3.1 Struttura reale attuale (dal progetto)

Nesting usato:
- Root `NavigationContainer`
- `AuthenticatedStack` (`Stack.Navigator`)
  - `Drawer` (screen principale)
  - `QuickAddExpense` (transparent modal)
  - `ManageExpenses` (modal)
- `Drawer.Navigator`
  - `Spese` -> `BottomTabs`
  - `Budget` -> `BudgetStack`
  - `Recurring` -> `RecurringStack`
  - `Payments` -> `PaymentsStack`
  - `Goals` -> `GoalsStack`
  - `Settings` -> `SettingsStack`

Perche e una buona scelta:
- `Drawer` gestisce macro-aree.
- `Tabs` dentro area spese per switching rapido.
- `Stack` root isola modali globali.

### 3.2 File structure suggerita (scalabile)

```txt
src/
  navigation/
    RootNavigation.js
    AuthStack.js
    AppDrawer.js
    tabs/
      ExpensesTabs.js
    stacks/
      BudgetStack.js
      PaymentsStack.js
      SettingsStack.js
  screens/
    Home/
    Budget/
    Payments/
    Settings/
```

### 3.3 Navigator setup completo (reference)

```jsx
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const RootStack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tabs = createBottomTabNavigator();

function ExpensesTabs() {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Expenses" component={ExpensesScreen} />
      <Tabs.Screen name="Insights" component={InsightsScreen} />
    </Tabs.Navigator>
  );
}

function AppDrawer() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Spese" component={ExpensesTabs} />
      <Drawer.Screen name="Budget" component={BudgetStack} />
      <Drawer.Screen name="Settings" component={SettingsStack} />
    </Drawer.Navigator>
  );
}

export default function RootNavigation({ isAuthenticated }) {
  return (
    <NavigationContainer>
      <RootStack.Navigator>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
        ) : (
          <>
            <RootStack.Screen name="Drawer" component={AppDrawer} options={{ headerShown: false }} />
            <RootStack.Screen name="ManageExpenses" component={ManageExpenses} options={{ presentation: "modal" }} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

### 3.4 Route params: quando usarli e quando evitarli

Usa route params per:
- identificatore di entita da aprire (`expenseId`, `budgetId`)
- stato iniziale della screen (`preset`, `title`)

Evita route params per:
- stato globale mutabile (auth, selected filters persistenti)
- payload pesanti (array/lista grande)

Pattern giusto:
- passa `id` in params
- recupera dati aggiornati dal Context/store

### 3.5 Route params tipizzati (TypeScript reference)

Anche se ora usi JS, questo ti prepara a TS:

```ts
export type BudgetStackParamList = {
  BudgetsHub: undefined;
  BudgetOverview: { budgetId: string; title?: string };
  BudgetScreen: { budgetId: string } | undefined;
};
```

Uso con `navigation.navigate("BudgetOverview", { budgetId, title })`.

### 3.6 Header customization pattern

Nel progetto usi:
- `screenHeader(colors, textScale)` helper
- `headerLeft` per drawer menu button
- `headerRight` per azioni contestuali (`add`, `edit`)

Best practice:
- non fare logica business dentro `headerRight` inline.
- crea handler stabili e passali a `IconButton`.

### 3.7 Auth flow / protected routes

Pattern attuale corretto:
- `AuthContext` espone `isAuthenticated`.
- root navigator decide `AuthStack` vs `AuthenticatedStack`.

Checklist protected routes:
- se token scade: refresh automatico (`refreshSession`).
- se refresh fallisce: `logout` e redirect a login.
- screen protette non devono renderizzare dati prima di auth pronta.

### 3.8 Deep linking basics (pratico)

Setup base:

```js
const linking = {
  prefixes: ["savemoney://", "https://savemoney.app"],
  config: {
    screens: {
      Drawer: {
        screens: {
          Budget: {
            screens: {
              BudgetOverview: "budget/:budgetId",
            },
          },
        },
      },
      ManageExpenses: "expense/:expenseId",
    },
  },
};
```

Quando introdurlo davvero:
- hai share links o push notification con destination specifica.

---

## 4) State management: Context ben fatto + Redux Toolkit + TanStack Query

### 4.1 Context architecture fatta bene

#### State shape: regola pratica

Non mettere tutto in un singolo oggetto globale.
Usa shape per dominio:

```js
const expensesState = {
  entities: [],
  canUndo: false,
  lastDeleted: null,
  loading: false,
  error: null,
};
```

Regole:
- naming esplicito (`canUndo` meglio di `flag1`).
- campi `loading/error` separati dal payload.
- default robusti per evitare `undefined` sparsi.

### 4.2 `useState` vs `useReducer` in Context

Usa `useState` quando:
- stato piccolo
- update indipendenti

Usa `useReducer` quando:
- eventi multipli sullo stesso stato (`ADD`, `UPDATE`, `DELETE`, `SET`)
- vuoi transizioni prevedibili
- vuoi testare reducer in isolamento

Esempio reducer pattern:

```js
function expensesReducer(state, action) {
  switch (action.type) {
    case "ADD":
      return [action.payload, ...state];
    case "UPDATE":
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload.data } : item,
      );
    case "DELETE":
      return state.filter((item) => item.id !== action.payload);
    default:
      return state;
  }
}
```

### 4.3 Memoization corretta nel provider

Pattern corretto:
- actions in `useCallback`
- provider `value` in `useMemo`

```jsx
const addExpense = useCallback(async (payload) => {
  // async mutation
}, []);

const value = useMemo(
  () => ({
    expenses,
    addExpense,
    deleteExpense,
  }),
  [expenses, addExpense, deleteExpense],
);
```

### 4.4 Selectors: evita rerender inutili

In Context puro non hai selector nativo come Redux, ma puoi:
- creare hook specializzati (`useBudgetSummary`, `useVisibleExpenses`)
- memoizzare `derived data` con `useMemo`
- splittare provider per dominio

### 4.5 Splitting providers

Nel tuo progetto e gia ben fatto:
- `AuthContext`, `ThemeContext`, `BudgetContext`, `ExpensesContext`, ecc.

Quando splittare ancora:
- provider con > 8-10 actions e > 300 righe tende a diventare fragile.
- se un provider ha sottodomini eterogenei (es. settings UI + notifications + experiments), separa.

### 4.6 Bad vs Good (anti-patterns)

Bad:

```jsx
// value nuovo ad ogni render, action inline
<MyContext.Provider value={{ state, add: (x) => setState([...state, x]) }}>
  {children}
</MyContext.Provider>
```

Good:

```jsx
const add = useCallback((x) => setState((prev) => [...prev, x]), []);
const value = useMemo(() => ({ state, add }), [state, add]);

<MyContext.Provider value={value}>{children}</MyContext.Provider>
```

Bad:
- mettere chiamate API direttamente nel JSX della screen.

Good:
- screen chiama `contextAction`.
- la action gestisce I/O e normalizzazione.

---

### 4.7 Redux Toolkit (sezione estesa)

#### Quando conviene rispetto a Context

Redux Toolkit conviene quando:
- team piu grande
- feature cross-domain con eventi complessi
- necessiti `Redux DevTools` e tracing actions
- hai molti selectors derivati condivisi

Context conviene quando:
- app medio-piccola
- pochi domini e dipendenze semplici
- vuoi meno boilerplate

#### Store setup completo

```js
// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import expensesReducer from "./slices/expensesSlice";
import budgetReducer from "./slices/budgetSlice";
import goalsReducer from "./slices/goalsSlice";

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    budget: budgetReducer,
    goals: goalsReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});
```

#### Slice per domain

```js
// store/slices/expensesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchExpenses, storeExpense } from "../../util/http";

export const fetchExpensesThunk = createAsyncThunk(
  "expenses/fetchAll",
  async ({ userId, token }) => {
    const items = await fetchExpenses(userId, token);
    return items;
  },
);

export const addExpenseThunk = createAsyncThunk(
  "expenses/add",
  async ({ userId, token, payload }) => {
    const id = await storeExpense(userId, token, payload);
    return { ...payload, id };
  },
);

const expensesSlice = createSlice({
  name: "expenses",
  initialState: {
    entities: [],
    loading: false,
    error: null,
  },
  reducers: {
    expenseDeleted(state, action) {
      state.entities = state.entities.filter((e) => e.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpensesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpensesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload || [];
      })
      .addCase(fetchExpensesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Fetch failed";
      })
      .addCase(addExpenseThunk.fulfilled, (state, action) => {
        state.entities.unshift(action.payload);
      });
  },
});

export const { expenseDeleted } = expensesSlice.actions;
export default expensesSlice.reducer;
```

#### Selectors (con memoization)

```js
import { createSelector } from "@reduxjs/toolkit";

export const selectExpenses = (state) => state.expenses.entities;
export const selectBudgetTotal = (state) => Number(state.budget.total || 0);

export const selectThisMonthSpent = createSelector([selectExpenses], (expenses) => {
  const now = new Date();
  return (expenses || []).reduce((sum, e) => {
    const d = new Date(e.date);
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return sum;
    return sum + Number(e.amount || 0);
  }, 0);
});

export const selectBudgetUsagePct = createSelector(
  [selectThisMonthSpent, selectBudgetTotal],
  (spent, total) => (total > 0 ? Math.round((spent / total) * 100) : 0),
);
```

#### Async thunks pratici (expenses + budget + goals)

Pattern:
- thunk per I/O remoto
- optimistic update opzionale
- rollback on error

```js
export const saveBudgetThunk = createAsyncThunk(
  "budget/save",
  async ({ userId, token, patch }, { rejectWithValue }) => {
    try {
      const result = await upsertBudget(userId, token, patch);
      return result;
    } catch (e) {
      return rejectWithValue(e?.message || "Budget save failed");
    }
  },
);
```

### 4.8 TanStack Query: caching/invalidation/mutations/optimistic rollback

#### Setup base

```jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

#### Query + mutation realistic (expenses)

```js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchExpenses, storeExpense } from "../util/http";

export function useExpensesQuery({ userId, token }) {
  return useQuery({
    queryKey: ["expenses", userId],
    queryFn: () => fetchExpenses(userId, token),
    enabled: !!userId && !!token,
  });
}

export function useAddExpenseMutation({ userId, token }) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const id = await storeExpense(userId, token, payload);
      return { ...payload, id };
    },
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: ["expenses", userId] });
      const prev = qc.getQueryData(["expenses", userId]) || [];
      const optimistic = [{ ...payload, id: `tmp_${Date.now()}` }, ...prev];
      qc.setQueryData(["expenses", userId], optimistic);
      return { prev };
    },
    onError: (_error, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(["expenses", userId], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", userId] });
    },
  });
}
```

### 4.9 Context + Query e Redux + Query: combinazioni sane

`Context + Query`:
- Query gestisce solo server state (`expenses`, `budget` fetch/cache).
- Context gestisce UI local domain (modal states, undo states, theme).

`Redux + Query`:
- Redux per client state complesso (wizard state, cross-feature toggles).
- Query per remoto + invalidation.

Non duplicare lo stesso dato in due store senza motivo.

---

## 5) Styling e theming (dettagliata)

### 5.1 `StyleSheet.create`: cosa migliora davvero e cosa no

Migliora:
- validazione style keys
- object identity stabile (meno allocazioni runtime)
- codice piu leggibile/organizzato

Non migliora magicamente:
- performance globale se il problema e render architecture.
- calcoli dinamici pesanti dentro render.

Regola:
- static style in `StyleSheet.create`
- runtime style minimo e mirato (`[styles.base, condition && styles.active]`)

### 5.2 Design tokens: semantic naming

Nel tuo progetto hai token solidi (`GlobalStyles.colors`), esempio:
- `bg`, `surface`, `surface2`
- `textTitle`, `textBody`, `textMuted`
- `accent500`, `accent18`, `danger20`

Regola importante:
- evita hex hardcoded nei componenti.
- usa token semantici, non colore assoluto.

### 5.3 Spacing scale e typography scale

Esempio scalabile:

```js
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
};

export const typography = {
  caption: 11,
  body: 14,
  title: 18,
  hero: 28,
};
```

### 5.4 Theme strategy: light/dark/creative senza temi fotocopia

Regole:
- cambia sia `hue` che `contrast` e `accent energy`.
- verifica leggibilita (`textTitle` vs `bg`, ratio pratico alto).
- evita 10 temi identici con solo accent diverso.

Nel progetto attuale:
- temi base e creativi sono gia differenziati (`DARK`, `LIGHT`, `OCEAN`, `AURORA`, ecc.).
- `applyTheme` aggiorna `GlobalStyles.colors` in place.

### 5.5 Componenti riusabili con tokens: `Card`, `Button`, `Input`

#### `Card`

```jsx
import { View, StyleSheet } from "react-native";
import { GlobalStyles } from "../constants/styles";

export function Card({ children, elevated = false }) {
  const c = GlobalStyles.colors;
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          shadowOpacity: elevated ? 0.2 : 0,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
```

#### `Button`

```jsx
import { Pressable, Text } from "react-native";
import { GlobalStyles } from "../constants/styles";

export function CtaButton({ label, onPress, disabled }) {
  const c = GlobalStyles.colors;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: c.accent30,
        backgroundColor: c.accent500,
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : pressed ? 0.88 : 1,
      })}
    >
      <Text style={{ color: c.textOnAccentStrong, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}
```

#### `Input`

```jsx
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../constants/styles";

export function AppInput({ icon, value, onChangeText, placeholder }) {
  const c = GlobalStyles.colors;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        backgroundColor: c.surface2,
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <Ionicons name={icon || "create-outline"} size={16} color={c.textMuted} />
      <TextInput
        style={{ flex: 1, color: c.textTitle, fontWeight: "700" }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textFaint}
      />
    </View>
  );
}
```

### 5.6 Micro-animations utili (non decorative)

Esempi pratici:
- press feedback (`scale 0.97`)
- toast enter/exit (`opacity + translateY`)
- theme switch conferma visuale (toast + preview)

Regola:
- animation deve comunicare stato o affordance.
- se non comunica nulla, toglila.

---

## 6) Expo completo: Dev flow, EAS, env, notifications, plugins

### 6.1 Expo Go vs Dev Client (differenza pratica reale)

`Expo Go`:
- velocissimo per UI iteration
- limitato su native modules e plugin configuration avanzata
- per `expo-notifications` ha limitazioni note

`Dev Client`:
- build nativa personalizzata con i tuoi plugin
- necessario per test realistici di notifications e behavior nativo
- richiede `eas build --profile development`

Decisione pratica:
- UI/layout daily: `Expo Go`
- feature native-sensitive: `Dev Client`

### 6.2 EAS Build profiles

Nel progetto hai:
- `development` (`developmentClient: true`)
- `preview` (internal distribution)
- `production`

Best practice:
- non usare stesso profile per tutti gli scopi.
- separa env e behavior per profile.

### 6.3 Env vars: `EXPO_PUBLIC_*` vs private vars

`EXPO_PUBLIC_*`:
- disponibili nel bundle JS
- da usare per valori non-segreti runtime (API key Firebase client-side gia pubblica per design)

private vars (senza `EXPO_PUBLIC_`):
- non devono finire nel client bundle
- usale per build-time tools (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`)

### 6.4 Validazione env (evita fallback impliciti)

Obiettivo:
- se env critiche mancano in build, fallisci presto.

Nella configurazione aggiornata:
- `app.config.js` imposta plugin `@sentry/react-native/expo` con `organization` e `project`.
- in build (`SENTRY_REQUIRE_CONFIG=1`) se mancano `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` la config fallisce subito.

### 6.5 Notifications: problema in Expo Go e soluzione corretta

Pattern adottato nel progetto:
- `canUseLocalNotifications()` ritorna `false` in Expo Go.
- setup notifications viene saltato in Expo Go.

Vantaggio:
- niente warning rumorosi in sviluppo rapido.
- codice notifications resta attivo per Dev Client / production.

### 6.6 Plugins, `app.json` / `app.config.js`, permissions

Pattern robusto:
- `app.json`: base config statica.
- `app.config.js`: logica dinamica (env-aware plugin config).

Pitfalls comuni:
- plugin dichiarato senza options richieste.
- affidarsi a fallback env senza validazione.
- chiedere permissions troppo presto (prima del bisogno reale).

### 6.7 Checklist Expo release

1. `cmd /c npx expo config --json` senza warning critici.
2. env Firebase presenti (`EXPO_PUBLIC_FIREBASE_*`).
3. env Sentry build presenti (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`).
4. build profile corretto (`preview` vs `production`).
5. smoke test in Dev Client prima di store build.

---

## 7) Real examples dal progetto (problem -> solution -> code -> why -> mistakes)

## 7.1 Duplicate save guard

### Problem
Tap rapidi su `Salva` possono creare duplicate inserts, soprattutto con lag di rete.

### Solution
- lock UI locale (`isSubmitting` + `submitLockRef`)
- fingerprint dedup a livello context (`pendingAddsRef` + recent window)

### Code example

```js
// UI layer guard (screen)
if (isSubmitting || submitLockRef.current) return;
submitLockRef.current = true;
setIsSubmitting(true);
await expensesCtx.addExpense(expenseData);

// Context layer guard (domain)
const fingerprint = buildExpenseFingerprint(expenseData, defaultCashWalletId);
const inFlight = pendingAddsRef.current.get(fingerprint);
if (inFlight) return await inFlight;
```

### Why this way
- proteggi sia interaction layer che domain layer.
- se un altro caller usa la stessa action, il domain guard copre comunque.

### Common mistakes
- solo `disabled` UI senza guard server/domain.
- reset lock solo in success e non in `finally`.
- fingerprint non stabile (campi variabili non normalizzati).

---

## 7.2 Filters/search in modal

### Problem
Toolbar sovraccarica quando metti ricerca + filtri + range direttamente inline.

### Solution
- top toolbar con CTA sintetiche (`Periodo`, `Filtri`)
- bottom sheet modal per filtri avanzati
- stato filtro centralizzato in screen

### Code example

```jsx
<Pressable onPress={() => setFiltersModalOpen(true)}>
  <Text>Filtri</Text>
</Pressable>

<Modal visible={filtersModalOpen} transparent animationType="slide">
  <View style={styles.modalBackdropBottom}>
    <Pressable style={StyleSheet.absoluteFill} onPress={() => setFiltersModalOpen(false)} />
    <View style={styles.filtersSheet}>
      <TextInput value={searchQuery} onChangeText={setSearchQuery} />
      <Chip label="Carta" active={selectedMethod === "CARD"} onPress={() => setSelectedMethod("CARD")} />
    </View>
  </View>
</Modal>
```

### Why this way
- migliore focus cognitivo: lista pulita, controlli avanzati separati.
- mobile ergonomics migliori con sheet bottom.

### Common mistakes
- mettere 10 controlli nella header area.
- non mostrare stato filtro attivo (utente non capisce perche lista vuota).
- dimenticare `Reset` rapido.

---

## 7.3 Budget save rules (`0% allowed` o `min 20% rule`)

### Problem
Regole rigide tipo "devi allocare almeno 20%" possono bloccare flussi legittimi.

### Solution
- default: `0% allowed` (come nel progetto attuale)
- se business richiede soglia minima: renderla opzionale/feature flag, non hardcoded globale

### Code example

```js
function validateBudget({ total, categories, enforceMinAllocation = false }) {
  const safeTotal = Number(total || 0);
  const allocated = Object.values(categories || {}).reduce((s, v) => s + Number(v || 0), 0);
  const pct = safeTotal > 0 ? allocated / safeTotal : 0;

  if (!enforceMinAllocation) return { ok: true };
  if (pct < 0.2) return { ok: false, message: "Allocazione minima 20% richiesta" };
  return { ok: true };
}
```

### Why this way
- mantieni UX flessibile.
- eviti regressioni su utenti esistenti.

### Common mistakes
- regola minima hardcoded senza documentazione.
- validazione solo UI e non nel domain layer.
- blocco save per mismatch minimi non rilevanti.

---

## 7.4 Theme switching senza redirect (live preview)

### Problem
Cambio tema con redirect/remount brutale crea flicker e confusione.

### Solution
- aggiornare token in place (`applyTheme`)
- incrementare `version` per refresh controllato di navigation theme
- mostrare preview e toast immediato in `CustomizeScreen`

### Code example

```js
const setThemeKey = useCallback(async (key) => {
  const safeKey = THEMES[key] ? key : "OCEAN";
  setThemeKeyState(safeKey);
  applyTheme(safeKey);   // update token object in place
  await AsyncStorage.setItem(STORAGE_KEY, safeKey);
  setVersion((v) => v + 1);
}, []);
```

### Why this way
- esperienza live, senza navigare via.
- stato screen resta consistente.

### Common mistakes
- reset navigation stack inutile ad ogni switch.
- token hardcoded in component (theme non si propaga bene).
- mancanza persistenza su storage.

---

## 7.5 Backfill missing user data per pre-patch users

### Problem
Utenti storici possono avere profilo incompleto (nome/genere/data nascita mancanti o invalidi).

### Solution
- detection `missingProfile` in `ExpensesScreen`
- modal guidata per completamento
- patch remoto + update locale (`authCtx.setProfile`)
- retry auth refresh su `401/403`

### Code example

```js
const needsProfileData =
  Object.values(missingProfile).some(Boolean) &&
  !authCtx.profileCompletionV2 &&
  !profilePromptDismissed;

if (needsProfileData) {
  setProfileModalOpen(true);
}

await saveUserProfile(authCtx.userId, token, payload);
await authCtx.setProfile(payload);
```

### Why this way
- correggi dati legacy senza bloccare tutta l'app forever.
- percorso esplicito e comprensibile per utente.

### Common mistakes
- migrazione silenziosa senza UI (utente confuso).
- validazioni troppo deboli (dati sporchi persistono).
- nessun fallback su token scaduto.

---

## 8) Checklist operative (how-to)

### 8.1 Prima di creare una nuova screen

1. Definisci responsabilita (`screen orchestration` vs `component rendering`).
2. Scegli container list giusto (`ScrollView` vs `FlatList`).
3. Decidi dove sta lo state (local, Context, Redux, Query).
4. Prepara empty/loading/error states.
5. Aggancia navigation route con params minimi.

### 8.2 Prima di aggiungere una mutation remota

1. Normalizza payload input/output.
2. Definisci guard duplicazione (UI + domain).
3. Gestisci retry auth (`401/403` refresh).
4. Definisci rollback se optimistic update.
5. Traccia error con logger/Sentry.

### 8.3 Prima di release EAS

1. `cmd /c npx expo config --json` OK.
2. `EXPO_PUBLIC_FIREBASE_*` configurate.
3. `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` configurate.
4. build profile corretto.
5. smoke test login/add expense/edit/delete/theme switch.

---

## 9) Mini project guidati (pratici)

### 9.1 Mini project A - expense search sheet

Obiettivo:
- aprire modal bottom
- cercare per description/category
- filtrare per method (`CASH`/`CARD`)

Steps:
1. stato `filtersModalOpen`, `searchQuery`, `selectedMethod`.
2. UI toolbar con badge attivo.
3. applica filtro in `useMemo` sul dataset.
4. aggiungi `Reset`.

### 9.2 Mini project B - undo delete flow robusto

Obiettivo:
- delete ottimistica in list
- undo entro 4.5 secondi
- commit remoto post-timeout

Steps:
1. snapshot item prima di rimuoverlo.
2. schedule timer per delete remoto.
3. se undo: cancella timer + ripristina item.
4. se commit fallisce: rollback item locale.

### 9.3 Mini project C - budget analytics card

Obiettivo:
- totale allocato, residuo, percentuale uso
- progress bar colorata (`ok` vs `over`)

Steps:
1. calcola `used`, `remaining`, `progress`.
2. visual summary card con KPI.
3. warning visual/haptic quando vai `over`.

---

## 10) Regole finali (course-level)

1. Tieni i componenti semplici, ma il domain rigoroso.
2. Metti guard dove nasce il problema (interaction + domain).
3. Non duplicare fonte di verita.
4. Se non puoi spiegare un flow in 3 frasi, probabilmente e troppo complesso.
5. Ogni feature deve avere: loading state, error state, empty state, retry path.

Questo quaderno deve essere usato come riferimento operativo quotidiano.

