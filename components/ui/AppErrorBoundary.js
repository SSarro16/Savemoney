import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { captureException } from "../../util/monitoring";
import { LanguageContext } from "../../store/language-context";

export default class AppErrorBoundary extends React.Component {
  static contextType = LanguageContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    captureException(error, {
      componentStack: errorInfo?.componentStack || "",
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    const t = this.context?.t || ((key) => key);

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.title}>{t("errors.unexpectedTitle")}</Text>
          <Text style={styles.subtitle}>
            {t("errors.unexpectedSubtitle")}
          </Text>
          <Pressable onPress={this.retry} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
            <Text style={styles.btnText}>{t("common.retry")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 16,
  },
  title: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
  },
  subtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "700",
    lineHeight: 20,
  },
  btn: {
    marginTop: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: { opacity: 0.88 },
  btnText: {
    color: "#ffffff",
    fontWeight: "900",
  },
});
