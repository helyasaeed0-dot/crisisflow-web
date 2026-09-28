import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function homePathFor(role) {
  switch (role) {
    case 'CITIZEN':
      return '/citizen';
    case 'RESPONDER':
      return '/responder';
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    default:
      return '/';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [responder, setResponder] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setResponder(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const data = await authApi.me();
    setUser(data.user);
    setResponder(data.responder);
    return data;
  }, []);

  // Restore the session on page load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (tokenStore.getAccess()) {
        try {
          await refreshMe();
        } catch {
          if (!cancelled) clearSession();
        }
      }
      if (!cancelled) setLoading(false);
    })();

    // Fired by the API client when the refresh token is no longer valid
    const onForcedLogout = () => clearSession();
    window.addEventListener('auth:logout', onForcedLogout);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:logout', onForcedLogout);
    };
  }, [refreshMe, clearSession]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    tokenStore.set(data);
    setUser(data.user);
    setResponder(data.responder);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    tokenStore.set(data);
    setUser(data.user);
    setResponder(data.responder);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore: the local session is cleared either way
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, responder, loading, login, register, logout, refreshMe, setResponder }),
    [user, responder, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}