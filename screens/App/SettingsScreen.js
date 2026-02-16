import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";

export default function SettingsScreen() {
  const colors = GlobalStyles.colors;
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
      edges={["left", "right"]}
    >
      <Text style={[styles.title, { color: colors.textTitle }]}>Settings</Text>

      <Card style={[styles.card, { backgroundColor: colors.surface2 }]}> 
        <Text style={[styles.label, { color: colors.textMuted }]}>Email</Text>
        <Text style={[styles.value, { color: colors.textBody }]}>
          {user?.email || "No email available"}
        </Text>

        <Text style={[styles.label, styles.versionLabel, { color: colors.textMuted }]}>App version</Text>
        <Text style={[styles.value, { color: colors.textBody }]}>
          {Constants.expoConfig?.version || "0.0.0"}
        </Text>

        <View style={styles.actionWrap}>
          <Button variant="danger" onPress={logout}>
            Logout
          </Button>
        </View>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "800",
  },
  versionLabel: {
    marginTop: 14,
  },
  actionWrap: {
    marginTop: 18,
  },
});
