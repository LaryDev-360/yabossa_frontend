import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { getMySubscription } from "../features/subscriptions/api";
import { setSubscriptionBlockedHandler } from "../features/subscriptions/subscriptionNotify";
import type { Subscription } from "../features/subscriptions/types";

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isOperational: boolean;
  isLoading: boolean;
  blockedByMutation: boolean;
  refresh: () => Promise<void>;
  clearBlocked: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockedByMutation, setBlockedByMutation] = useState(false);

  const refresh = useCallback(async () => {
    if (user?.role !== "MERCHANT") {
      setSubscription(null);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getMySubscription();
      setSubscription(data);
      if (data.is_operational) {
        setBlockedByMutation(false);
      }
    } catch {
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSubscription(null);
      setBlockedByMutation(false);
      return;
    }
    void refresh();
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    setSubscriptionBlockedHandler(() => setBlockedByMutation(true));
    return () => setSubscriptionBlockedHandler(null);
  }, []);

  const isOperational = useMemo(() => {
    if (user?.role === "ADMIN") {
      return true;
    }
    if (user?.role === "MERCHANT" && subscription) {
      return subscription.is_operational && !blockedByMutation;
    }
    if (user?.role === "CASHIER") {
      return !blockedByMutation;
    }
    return true;
  }, [user?.role, subscription, blockedByMutation]);

  const value = useMemo(
    () => ({
      subscription,
      isOperational,
      isLoading,
      blockedByMutation,
      refresh,
      clearBlocked: () => setBlockedByMutation(false),
    }),
    [subscription, isOperational, isLoading, blockedByMutation, refresh],
  );

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return ctx;
}
