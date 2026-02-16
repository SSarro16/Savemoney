import { createContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "@firebase/auth";

import { auth, assertFirebaseConfigured } from "../services/firebase";

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signup: async (_email, _password) => {},
  login: async (_email, _password) => {},
  logout: async () => {},
});

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    assertFirebaseConfigured();
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    assertFirebaseConfigured();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      signup,
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
