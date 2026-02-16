import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async () => {
    setUser({ uid: "mock-user", email: "demo@savetime.app" });
  };

  const signup = async () => {
    setUser({ uid: "mock-user", email: "demo@savetime.app" });
  };

  const logout = async () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      login,
      signup,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
