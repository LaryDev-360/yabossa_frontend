import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import { refreshAccessToken } from "../api/client";
import type { User } from "../api/types";
import { tokenStorage } from "./tokenStorage";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerMerchant: (payload: {
    email: string;
    password: string;
    passwordConfirm: string;
    fullName: string;
    businessName: string;
    phoneNumber?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applySession(access: string, refresh: string, user: User) {
  tokenStorage.setTokens(access, refresh);
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const access = tokenStorage.getAccess();
      const refresh = tokenStorage.getRefresh();

      if (!access && !refresh) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        if (!access && refresh) {
          const newAccess = await refreshAccessToken();
          if (!newAccess) {
            throw new Error("Session expired");
          }
        }
        const me = await authApi.fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        tokenStorage.clear();
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    tokenStorage.setTokens(data.access, data.refresh);
    const me = await authApi.fetchMe();
    setUser(me);
    return me;
  }, []);

  const registerMerchant = useCallback(
    async (payload: {
      email: string;
      password: string;
      passwordConfirm: string;
      fullName: string;
      businessName: string;
      phoneNumber?: string;
    }) => {
      const data = await authApi.registerMerchant({
        email: payload.email,
        password: payload.password,
        password_confirm: payload.passwordConfirm,
        full_name: payload.fullName,
        business_name: payload.businessName,
        phone_number: payload.phoneNumber || undefined,
      });
      const nextUser = applySession(data.access, data.refresh, data.user);
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) {
        await authApi.logout(refresh);
      }
    } catch {
      // Clear local session even if blacklist call fails (expired token, offline).
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      registerMerchant,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, registerMerchant, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
