import { createContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, assertFirebaseConfigured } from "../services/firebase";
import {
  getMissingProfileFields,
  getUserProfile,
  isProfileComplete,
  saveUserProfile,
} from "../services/userProfileService";

export const AuthContext = createContext({
  user: null,
  profile: null,
  isProfileComplete: false,
  missingProfileFields: [],
  isAuthenticated: false,
  isLoading: true,
  isProfileLoading: false,
  signup: async (_email, _password, _profilePayload) => {},
  login: async (_email, _password) => {},
  logout: async () => {},
  refreshProfile: async () => {},
  saveProfile: async (_profilePayload) => {},
});

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let requestId = 0;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      requestId += 1;
      const currentRequestId = requestId;
      const nextUser = firebaseUser || null;
      setUser(nextUser);

      if (!nextUser?.uid) {
        setProfile(null);
        setIsProfileLoading(false);
        setIsLoading(false);
        return;
      }

      setIsProfileLoading(true);
      setIsLoading(true);
      getUserProfile(nextUser.uid)
        .then((fetchedProfile) => {
          if (!isMounted || currentRequestId !== requestId) {
            return;
          }
          setProfile(fetchedProfile);
        })
        .catch(() => {
          if (!isMounted || currentRequestId !== requestId) {
            return;
          }
          setProfile(null);
        })
        .finally(() => {
          if (!isMounted || currentRequestId !== requestId) {
            return;
          }
          setIsProfileLoading(false);
          setIsLoading(false);
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setProfile(null);
      return null;
    }

    setIsProfileLoading(true);
    try {
      const fetchedProfile = await getUserProfile(uid);
      setProfile(fetchedProfile);
      return fetchedProfile;
    } finally {
      setIsProfileLoading(false);
    }
  };

  const signup = async (email, password, profilePayload) => {
    assertFirebaseConfigured();
    let createdUser = null;

    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = credentials.user;
      const savedProfile = await saveUserProfile(
        credentials.user.uid,
        credentials.user.email || email,
        profilePayload,
      );
      setProfile(savedProfile);
      return credentials.user;
    } catch (error) {
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch {
          // If rollback fails, user can still complete profile from UserProfile screen.
        }
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    assertFirebaseConfigured();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const saveProfile = async (profilePayload) => {
    const uid = auth.currentUser?.uid || user?.uid;
    if (!uid) {
      throw new Error("Sessione utente non valida.");
    }

    const savedProfile = await saveUserProfile(uid, user?.email, profilePayload);
    setProfile(savedProfile);
    return savedProfile;
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      isProfileComplete: isProfileComplete(profile),
      missingProfileFields: getMissingProfileFields(profile),
      isAuthenticated: !!user,
      isLoading,
      isProfileLoading,
      signup,
      login,
      logout,
      refreshProfile,
      saveProfile,
    }),
    [isLoading, isProfileLoading, profile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
