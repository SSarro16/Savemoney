import { useContext, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import AuthContent from "../../components/Auth/AuthContent";
import ErrorOverlay from "../../components/ui/ErrorOverlay";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import {
  extractGoogleIdToken,
  getGoogleAuthPlatformStatus,
  getGoogleAuthRequestConfig,
} from "../../services/googleAuthService";

WebBrowser.maybeCompleteAuthSession();

function resolveGoogleHint(reason, t) {
  if (reason === "missing_ios_client_id") {
    return t("auth.googleMissingIosClientId");
  }
  if (reason === "missing_android_client_id") {
    return t("auth.googleMissingAndroidClientId");
  }
  if (reason === "missing_web_client_id") {
    return t("auth.googleMissingWebClientId");
  }
  return t("auth.googleSetupHint");
}

function GoogleLoginBridge({
  config,
  onGoogleIdToken,
  setGoogleAction,
  setBridgeReady,
  t,
}) {
  const [googleRequest, _googleResponse, promptGoogleAsync] = Google.useAuthRequest(config);

  useEffect(() => {
    setBridgeReady(true);
    setGoogleAction(() => async () => {
      if (!googleRequest) {
        throw new Error(t("auth.googleUnavailable"));
      }

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

      await onGoogleIdToken(idToken);
    });

    return () => {
      setBridgeReady(false);
      setGoogleAction(null);
    };
  }, [googleRequest, onGoogleIdToken, promptGoogleAsync, setBridgeReady, setGoogleAction, t]);

  return null;
}

export default function LoginScreen() {
  const authContext = useContext(AuthContext);
  const colors = GlobalStyles.colors;
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [googleAction, setGoogleAction] = useState(null);
  const [shouldMountGoogleBridge, setShouldMountGoogleBridge] = useState(false);
  const [isGoogleBridgeReady, setIsGoogleBridgeReady] = useState(false);
  const [pendingGoogleRequest, setPendingGoogleRequest] = useState(false);

  const googleConfig = useMemo(() => getGoogleAuthRequestConfig(), []);
  const googleStatus = useMemo(
    () => getGoogleAuthPlatformStatus(googleConfig, Platform.OS),
    [googleConfig],
  );
  const isGoogleEnabled = googleStatus.enabled;
  const googleHintText = useMemo(
    () => resolveGoogleHint(googleStatus.reason, t),
    [googleStatus.reason, t],
  );

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
      setError(googleHintText);
      return;
    }

    setError(null);
    if (!shouldMountGoogleBridge) {
      setShouldMountGoogleBridge(true);
      setPendingGoogleRequest(true);
      return;
    }

    if (!isGoogleBridgeReady) {
      setPendingGoogleRequest(true);
      return;
    }

    setPendingGoogleRequest(true);
  };

  useEffect(() => {
    if (!pendingGoogleRequest || !googleAction || isGoogleSubmitting) {
      return;
    }

    let isMounted = true;
    const executeGoogleFlow = async () => {
      setPendingGoogleRequest(false);
      setIsGoogleSubmitting(true);
      try {
        await googleAction();
      } catch (googleError) {
        if (isMounted) {
          setError(googleError?.message || t("errors.somethingWrong"));
        }
      } finally {
        if (isMounted) {
          setIsGoogleSubmitting(false);
        }
      }
    };

    executeGoogleFlow();

    return () => {
      isMounted = false;
    };
  }, [googleAction, isGoogleSubmitting, pendingGoogleRequest, t]);

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
        googleHintText={googleHintText}
      />

      {shouldMountGoogleBridge && isGoogleEnabled && (
        <GoogleLoginBridge
          config={googleConfig}
          onGoogleIdToken={authContext.loginWithGoogleIdToken}
          setGoogleAction={setGoogleAction}
          setBridgeReady={setIsGoogleBridgeReady}
          t={t}
        />
      )}
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
