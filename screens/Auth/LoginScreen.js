import { useContext, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import AuthContent from "../../components/Auth/AuthContent";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import {
  extractGoogleIdToken,
  getGoogleAuthRequestConfig,
  isGoogleAuthConfigured,
} from "../../services/googleAuthService";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const authContext = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const googleConfig = useMemo(() => getGoogleAuthRequestConfig(), []);
  const isGoogleEnabled = useMemo(
    () => isGoogleAuthConfigured(googleConfig),
    [googleConfig],
  );
  const authRequestConfig = useMemo(
    () =>
      isGoogleEnabled
        ? googleConfig
        : { webClientId: "missing-google-client-id.apps.googleusercontent.com" },
    [googleConfig, isGoogleEnabled],
  );
  const [googleRequest, _googleResponse, promptGoogleAsync] = Google.useAuthRequest(authRequestConfig);

  const loginHandler = async ({ email, password }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authContext.login(email, password);
    } catch (loginError) {
      setError(loginError.message || t("errors.somethingWrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginWithGoogleHandler = async () => {
    if (!isGoogleEnabled) {
      setError(t("auth.googleNotConfigured"));
      return;
    }

    if (!googleRequest) {
      setError(t("auth.googleUnavailable"));
      return;
    }

    setIsGoogleSubmitting(true);
    setError(null);

    try {
      const result = await promptGoogleAsync();
      if (result?.type === "cancel" || result?.type === "dismiss") {
        return;
      }

      if (result?.type !== "success") {
        throw new Error(t("auth.googleFailed"));
      }

      const idToken = extractGoogleIdToken(result);
      if (!idToken) {
        throw new Error(t("auth.googleMissingToken"));
      }

      await authContext.loginWithGoogleIdToken(idToken);
    } catch (googleError) {
      setError(googleError.message || t("errors.somethingWrong"));
    } finally {
      setIsGoogleSubmitting(false);
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

      <AuthContent
        isLogin
        onAuthenticate={loginHandler}
        onGoogleAuthenticate={loginWithGoogleHandler}
        isSubmitting={isSubmitting}
        isGoogleSubmitting={isGoogleSubmitting}
        isGoogleEnabled={isGoogleEnabled}
      />
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
    width: 280,
    height: 280,
    top: -132,
    right: -82,
  },
  bgBubbleB: {
    width: 176,
    height: 176,
    bottom: 34,
    left: -68,
  },
  bgBubbleC: {
    width: 84,
    height: 84,
    top: 190,
    left: -26,
  },
  bgBubbleD: {
    width: 110,
    height: 110,
    bottom: -36,
    right: 68,
  },
  bgTrack: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: "transparent",
  },
  bgTrackA: {
    width: 92,
    height: 48,
    top: 154,
    right: 18,
  },
  bgTrackB: {
    width: 116,
    height: 58,
    bottom: 126,
    right: -22,
  },
  bgTrackC: {
    width: 82,
    height: 42,
    bottom: 62,
    left: 18,
  },
});
