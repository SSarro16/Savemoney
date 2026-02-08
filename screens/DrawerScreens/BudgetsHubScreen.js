import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import LoadingOverlay from "../../components/ui/LoadingOverlay";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import {
  getBudgets,
  makeEmptyBudget,
  removeBudget,
  setActiveBudgetId,
  upsertBudget,
} from "../../util/budget/budget-storage";

export default function BudgetsHubScreen({ navigation }) {
  const colors = GlobalStyles.colors;
  const authCtx = useContext(AuthContext);
  const userId = authCtx.userId;
  const token = authCtx.token;
  const refreshSession = authCtx.refreshSession;

  const [items, setItems] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const hasLoadedRef = useRef(false);
  const refreshSessionRef = useRef(refreshSession);

  const hubStats = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const totalBudgets = list.length;
    const totalPlanned = list.reduce(
      (sum, b) => sum + Number(b?.total || 0),
      0,
    );
    const richest = list.reduce(
      (best, b) => {
        const value = Number(b?.total || 0);
        if (value > best.value) {
          return {
            value,
            title: String(b?.title || b?.name || "Nuovo budget"),
          };
        }
        return best;
      },
      { value: 0, title: "-" },
    );
    return {
      totalBudgets,
      totalPlanned,
      topName: richest.title,
      topTotal: richest.value,
    };
  }, [items]);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  const withAuthRetry = useCallback(
    async (request) => {
      try {
        return await request(token);
      } catch (error) {
        const status = Number(error?.response?.status || 0);
        if (status !== 401 && status !== 403) throw error;

        const refreshed = await refreshSessionRef
          .current?.(true)
          .catch(() => null);
        const nextToken = refreshed?.token;
        if (!nextToken) throw error;

        return await request(nextToken);
      }
    },
    [token],
  );

  const load = useCallback(
    async (showLoader = true) => {
      try {
        setError(null);
        if (showLoader) setIsFetching(true);
        const list = await withAuthRetry((t) => getBudgets(userId, t));
        setItems(list);
      } catch (e) {
        setError(e?.message || "Errore");
      } finally {
        if (showLoader) setIsFetching(false);
        hasLoadedRef.current = true;
      }
    },
    [userId, withAuthRetry],
  );

  useFocusEffect(
    useCallback(() => {
      load(!hasLoadedRef.current);
    }, [load]),
  );

  const openBudget = async (b) => {
    const budgetTitle = String(b?.title || b?.name || "Nuovo budget");
    await setActiveBudgetId(b.id, userId);
    navigation.navigate("BudgetOverview", {
      budgetId: b.id,
      title: budgetTitle,
    });
  };

  const confirmDelete = (b) => {
    const budgetTitle = String(b?.title || b?.name || "Nuovo budget");
    Alert.alert("Elimina budget", `Vuoi eliminare \"${budgetTitle}\"?`, [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: async () => {
          const next = await withAuthRetry((t) =>
            removeBudget(userId, t, b.id),
          );
          setItems(next);
        },
      },
    ]);
  };

  const createNew = async () => {
    try {
      const cleanTitle = String(title || "").trim() || "Nuovo budget";
      const b = makeEmptyBudget({ title: cleanTitle });
      const next = await withAuthRetry((t) => upsertBudget(userId, t, b));
      setItems(next);
      setCreating(false);
      setTitle("");
      navigation.navigate("BudgetOverview", {
        budgetId: b.id,
        title: String(b?.title || b?.name || cleanTitle),
      });
    } catch (e) {
      Alert.alert("Errore", e?.message || "Impossibile creare il budget.");
    }
  };

  const styles = useMemo(
    () => makeStyles(colors),
    [colors.primary800, colors.accent500, colors.textTitle, colors.accent30],
  );

  if (isFetching) return <LoadingOverlay message="Caricamento budget..." />;
  if (error) return <ErrorOverlay message={error} onRetry={load} />;

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={[styles.heroBlob, styles.heroBlobTop]} />
        <View style={[styles.heroBlob, styles.heroBlobBottom]} />
        <View style={styles.heroIcon}>
          <Ionicons name="cash-outline" size={18} color={colors.textTitle} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>I tuoi budget</Text>
          <Text style={styles.heroSub}>
            Crea piu budget e gestiscili separatamente.
          </Text>
        </View>

        <Pressable
          onPress={() => setCreating((v) => !v)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.9 }]}
        >
          <Ionicons
            name={creating ? "close" : "add"}
            size={18}
            color={colors.textOnAccentStrong}
          />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Budget attivi</Text>
          <Text style={styles.statValue}>{hubStats.totalBudgets}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Plafond totale</Text>
          <Text style={styles.statValue}>
            {hubStats.totalPlanned.toFixed(2)} EUR
          </Text>
        </View>
      </View>

      {!!hubStats.totalBudgets && (
        <View style={styles.topBudgetCard}>
          <Ionicons name="trophy-outline" size={16} color={colors.textTitle} />
          <Text style={styles.topBudgetText} numberOfLines={1}>
            Budget principale: {hubStats.topName} (
            {hubStats.topTotal.toFixed(2)} EUR)
          </Text>
        </View>
      )}

      {creating && (
        <View style={styles.createCard}>
          <Text style={styles.label}>Nome budget</Text>
          <View style={styles.field}>
            <Ionicons name="pencil-outline" size={18} color={colors.white70} />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Es. Universita / Casa / Viaggi"
              placeholderTextColor={colors.white45}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          <Pressable
            onPress={createNew}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.primaryBtnText}>Crea e apri</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {!items.length ? (
          <View style={styles.empty}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.white70}
            />
            <Text style={styles.emptyText}>
              Nessun budget salvato. Creane uno.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => openBudget(b)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.badge}>
                    <Ionicons
                      name="wallet-outline"
                      size={18}
                      color={colors.textTitle}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {b?.title || b?.name || "Nuovo budget"}
                    </Text>
                    {(() => {
                      const total = Number(b?.total || 0);
                      const allocated = Object.values(
                        b?.categories || {},
                      ).reduce((sum, value) => sum + Number(value || 0), 0);
                      return (
                        <View style={styles.metricsWrap}>
                          <Text style={styles.cardSub}>
                            Totale: {total.toFixed(2)} EUR
                          </Text>
                          <Text style={styles.cardSub}>
                            Allocati: {allocated.toFixed(2)} EUR
                          </Text>
                        </View>
                      );
                    })()}
                    <View style={styles.miniBarTrack}>
                      <View
                        style={[
                          styles.miniBarFill,
                          {
                            width: `${Math.max(
                              6,
                              Math.min(
                                100,
                                Number(b?.total || 0) > 0
                                  ? (Object.values(b?.categories || {}).reduce(
                                      (sum, value) => sum + Number(value || 0),
                                      0,
                                    ) /
                                      Number(b?.total || 0)) *
                                      100
                                  : 0,
                              ),
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => confirmDelete(b)}
                  style={({ pressed }) => [
                    styles.trashBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.textTitle}
                  />
                </Pressable>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.white45}
                />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.primary800, padding: 14 },
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.primary700,
      borderWidth: 1,
      borderColor: colors.white10,
      marginBottom: 12,
      overflow: "hidden",
    },
    heroBlob: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: colors.accent16,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    heroBlobTop: { width: 110, height: 110, right: -36, top: -24 },
    heroBlobBottom: { width: 72, height: 72, right: 40, bottom: -28 },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white08,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    heroTitle: { color: colors.textTitle, fontWeight: "900", fontSize: 16 },
    heroSub: {
      marginTop: 2,
      color: colors.textMuted,
      fontWeight: "800",
      fontSize: 12,
    },

    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: colors.accent500,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    statCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    statLabel: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    statValue: { color: colors.textTitle, fontWeight: "900", marginTop: 4 },
    topBudgetCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.white10,
      backgroundColor: colors.white06,
      padding: 10,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    topBudgetText: {
      color: colors.textBody,
      fontWeight: "800",
      flex: 1,
      fontSize: 12,
    },

    createCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.primary700,
      borderWidth: 1,
      borderColor: colors.white10,
      gap: 10,
      marginBottom: 12,
    },
    label: { color: colors.white75, fontWeight: "900", fontSize: 12 },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.primary800,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    input: { flex: 1, color: colors.textTitle, fontWeight: "900" },
    primaryBtn: {
      height: 50,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent500,
      borderWidth: 1,
      borderColor: colors.accent30,
    },
    primaryBtnText: { color: colors.textOnAccentStrong, fontWeight: "900" },

    empty: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    emptyText: { color: colors.textMuted, fontWeight: "800", flex: 1 },

    card: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: colors.white06,
      borderWidth: 1,
      borderColor: colors.white10,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    cardLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    badge: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.white08,
      borderWidth: 1,
      borderColor: colors.white10,
    },
    cardTitle: { color: colors.textTitle, fontWeight: "900" },
    metricsWrap: { marginTop: 3, gap: 2 },
    cardSub: { color: colors.textMuted, fontWeight: "800", fontSize: 12 },
    miniBarTrack: {
      marginTop: 7,
      height: 6,
      borderRadius: 999,
      overflow: "hidden",
      backgroundColor: colors.white10,
    },
    miniBarFill: {
      height: 6,
      borderRadius: 999,
      backgroundColor: colors.accent500,
    },

    trashBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.danger12,
      borderWidth: 1,
      borderColor: colors.danger22,
    },
  });
}

