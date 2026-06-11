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
import { logger } from "../util/logger";
import {
  clearStoredAuthData,
  getStoredAuthData,
  setStoredAuthData,
} from "../util/secure-auth-storage";

export const AuthContext = createContext({
  token: null,
  userId: null,
  profile: null,
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  profileCompletionV2: false,
  fullName: "",
  isAuthenticated: false,
  isBootstrapping: true,
  authenticate: async (authData) => {},
  setProfile: async (_profilePatch) => {},
  refreshSession: async (_force) => null,
  logout: async () => {},
});

function normalizeProfile(input) {
  const source = input?.profile && typeof input.profile === "object" ? input.profile : input;
  const firstName = String(source?.firstName || "").trim();
  const lastName = String(source?.lastName || "").trim();
  const email = String(source?.email || "").trim();
  const genderRaw = String(source?.gender || "").trim().toUpperCase();
  const gender = genderRaw === "MALE" || genderRaw === "FEMALE" ? genderRaw : "";
  const dobCandidate = source?.dateOfBirth ? new Date(source.dateOfBirth) : null;
  const dateOfBirth =
    dobCandidate instanceof Date && !Number.isNaN(dobCandidate.getTime())
      ? dobCandidate.toISOString()
      : "";
  const profileCompletionV2 =
    source?.profileCompletionV2 === true || source?.profileCompletionV2 === "true";
  const updatedAt = String(source?.updatedAt || "").trim() || new Date().toISOString();

  return {
    firstName,
    lastName,
    email,
    gender,
    dateOfBirth,
    profileCompletionV2,
    updatedAt,
  };
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
    await setStoredAuthData(next);
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
      await setStoredAuthData(next);
    },
    [authData],
  );

  const logout = useCallback(async () => {
    setAuthData(null);
    await clearStoredAuthData();
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
          await setStoredAuthData(merged);
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
        logger.warn("AUTH bootstrap timeout -> continuing anyway");
        setIsBootstrapping(false);
      }, 2500);

      try {
        const stored = await getStoredAuthData();

        logger.debug("BOOTSTRAP read", {
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
          await setStoredAuthData(merged);
        } else {
          if (!isActive) return;
          setAuthData(withProfile(stored));
        }
      } catch (e) {
        logger.warn("Errore bootstrap auth", e);
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
      gender: authData?.profile?.gender || "",
      dateOfBirth: authData?.profile?.dateOfBirth || "",
      profileCompletionV2: !!authData?.profile?.profileCompletionV2,
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
