import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setToken } from "../apis/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(window.localStorage.getItem("wrg.auth.token")));
  useEffect(() => {
    if (!loading) return;
    api.auth.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => setToken(null)).finally(() => setLoading(false));
  }, [loading]);
  const login = async (email, password) => {
    const result = await api.auth.login({ email: email.trim(), password });
    setToken(result.token);
    setUser(result.user);
    return { ok: true };
  };
  const register = async ({ name, email, password, role }) => {
    const result = await api.auth.register({ name: name.trim(), email: email.trim(), password, role });
    setToken(result.token);
    setUser(result.user);
    return { ok: true };
  };
  const logout = async () => {
    try { await api.auth.logout(); } finally { setToken(null); setUser(null); }
  };
  const value = useMemo(
    () => ({
      user,
      isManager: user?.role === "manager",
      loading,
      login,
      register,
      logout,
    }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
