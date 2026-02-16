import { useContext, useState } from "react";
import { StyleSheet, View } from "react-native";

import AuthContent from "../../components/Auth/AuthContent";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";

export default function SignupScreen() {
  const authContext = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const signupHandler = async ({ email, password }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authContext.signup(email, password);
    } catch (signupError) {
      setError(signupError.message || t("errors.somethingWrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <ErrorOverlay message={error} onRetry={() => setError(null)} retryLabel="Back" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={[styles.bgBubble, styles.bgBubbleA, { backgroundColor: colors.accent12, borderColor: colors.accent18 }]} />
      <View style={[styles.bgBubble, styles.bgBubbleB, { backgroundColor: colors.accent12, borderColor: colors.accent18 }]} />
      <View style={[styles.bgBubble, styles.bgBubbleC, { backgroundColor: colors.white08, borderColor: colors.white10 }]} />
      <View style={[styles.bgBubble, styles.bgBubbleD, { backgroundColor: colors.white08, borderColor: colors.white10 }]} />
      <View style={[styles.bgTrack, styles.bgTrackA, { borderColor: colors.white10 }]} />
      <View style={[styles.bgTrack, styles.bgTrackB, { borderColor: colors.white10 }]} />
      <View style={[styles.bgTrack, styles.bgTrackC, { borderColor: colors.accent18 }]} />

      <AuthContent isLogin={false} onAuthenticate={signupHandler} isSubmitting={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgBubble: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
  },
  bgBubbleA: {
    width: 276,
    height: 276,
    top: -146,
    left: -82,
  },
  bgBubbleB: {
    width: 182,
    height: 182,
    bottom: 18,
    right: -62,
  },
  bgBubbleC: {
    width: 92,
    height: 92,
    top: 220,
    right: 18,
  },
  bgBubbleD: {
    width: 76,
    height: 76,
    bottom: -26,
    left: 72,
  },
  bgTrack: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  bgTrackA: {
    width: 108,
    height: 52,
    top: 138,
    left: 16,
  },
  bgTrackB: {
    width: 120,
    height: 58,
    bottom: 106,
    left: -22,
  },
  bgTrackC: {
    width: 84,
    height: 42,
    bottom: 64,
    right: 16,
  },
});
