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

export default function SignupScreen() {
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

  const signupHandler = async (payload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await authContext.signup(payload.email, payload.password, {
        firstName: payload.firstName,
        lastName: payload.lastName,
        gender: payload.gender,
        dateOfBirth: payload.dateOfBirth,
      });
    } catch (signupError) {
      setError(signupError.message || t("errors.somethingWrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const signupWithGoogleHandler = async () => {
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
        isLogin={false}
        onAuthenticate={signupHandler}
        onGoogleAuthenticate={signupWithGoogleHandler}
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
