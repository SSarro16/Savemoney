import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { refreshIdToken } from "../util/auth";

export const AuthContext = createContext({
  token: null,
  userId: null,
  profile: null,
  firstName: "",
  lastName: "",
  fullName: "",
  isAuthenticated: false,
  isBootstrapping: true,
  authenticate: async (authData) => {},
  setProfile: async (_profilePatch) => {},
  refreshSession: async (_force) => null,
  logout: async () => {},
});

const STORAGE_KEY = "authData";

function normalizeProfile(input) {
  const source = input?.profile && typeof input.profile === "object" ? input.profile : input;
  const firstName = String(source?.firstName || "").trim();
  const lastName = String(source?.lastName || "").trim();
  const email = String(source?.email || "").trim();

  return { firstName, lastName, email };
}

function withProfile(data) {
  const profile = normalizeProfile(data);
  return { ...data, profile };
}

function AuthContextProvider({ children }) {
  const [authData, setAuthData] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const refreshPromiseRef = useRef(null);

  const authenticate = useCallback(async (data) => {
    const next = withProfile(data || {});
    setAuthData(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setProfile = useCallback(
    async (profilePatch = {}) => {
      if (!authData) return;

      const next = withProfile({
        ...authData,
        profile: {
          ...(authData?.profile || {}),
          ...(profilePatch || {}),
        },
      });

      setAuthData(next);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
    [authData],
  );

  const logout = useCallback(async () => {
    setAuthData(null);
    await AsyncStorage.multiRemove([STORAGE_KEY, "token", "userId"]); // pulizia anche legacy
  }, []);

  const refreshSession = useCallback(
    async (force = false) => {
      const current = authData;
      if (!current?.refreshToken) return null;

      if (!force && current?.expiryDate && Date.now() < Number(current.expiryDate) - 60_000) {
        return current;
      }

      if (refreshPromiseRef.current) return await refreshPromiseRef.current;

      refreshPromiseRef.current = (async () => {
        try {
          const fresh = await refreshIdToken(current.refreshToken);
          const merged = withProfile({ ...fresh, profile: current?.profile || current });
          setAuthData(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        } catch (error) {
          await logout();
          throw error;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();

      return await refreshPromiseRef.current;
    },
    [authData, logout],
  );

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      const safety = setTimeout(() => {
        if (!isActive) return;
        console.log("AUTH bootstrap timeout -> continuing anyway");
        setIsBootstrapping(false);
      }, 2500);

      try {
        // 1) Nuovo formato
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        let stored = raw ? JSON.parse(raw) : null;

        // 2) Fallback legacy (token/userId separati)
        if (!stored?.token || !stored?.userId) {
          const [t, u] = await Promise.all([
            AsyncStorage.getItem("token"),
            AsyncStorage.getItem("userId"),
          ]);
          if (t && u) stored = { token: t, userId: u };
        }

        console.log("BOOTSTRAP read:", {
          hasToken: !!stored?.token,
          hasUserId: !!stored?.userId,
          hasRefreshToken: !!stored?.refreshToken,
          hasExpiryDate: !!stored?.expiryDate,
        });

        if (!stored?.token || !stored?.userId) return;

        const expired = !stored.expiryDate || Date.now() >= stored.expiryDate;

        if (expired) {
          if (!stored.refreshToken) {
            // non posso refreshare -> logout pulito
            await logout();
            return;
          }

          const fresh = await refreshIdToken(stored.refreshToken);
          if (!isActive) return;

          const merged = withProfile({ ...fresh, profile: stored?.profile || stored });
          setAuthData(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } else {
          if (!isActive) return;
          setAuthData(withProfile(stored));
        }
      } catch (e) {
        console.log("Errore bootstrap auth:", e?.message || e);
      } finally {
        clearTimeout(safety);
        if (isActive) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      isActive = false;
    };
  }, [logout]);

  useEffect(() => {
    if (!authData?.refreshToken || !authData?.expiryDate) return;

    const ms = Math.max(Number(authData.expiryDate) - Date.now() - 60_000, 0);
    const timer = setTimeout(() => {
      refreshSession(true).catch(() => {});
    }, ms);

    return () => clearTimeout(timer);
  }, [authData?.refreshToken, authData?.expiryDate, refreshSession]);

  const value = useMemo(
    () => ({
      token: authData?.token ?? null,
      userId: authData?.userId ?? null,
      profile: authData?.profile || null,
      firstName: authData?.profile?.firstName || "",
      lastName: authData?.profile?.lastName || "",
      fullName: [authData?.profile?.firstName, authData?.profile?.lastName]
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .join(" "),
      isAuthenticated: !!authData?.token && !!authData?.userId,
      isBootstrapping,
      authenticate,
      setProfile,
      refreshSession,
      logout,
    }),
    [authData, isBootstrapping, authenticate, setProfile, refreshSession, logout],
  );

  if (isBootstrapping) return <LoadingOverlay message="Avvio in corso..." />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;
