import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import { supabase } from "@/lib/supabase";
import { PAYMENTS_ENV } from "@/lib/config";
import {
  computeIsActive,
  pickCurrentSubscription,
  type SubscriptionRow,
} from "@/lib/subscriptionAccess";
import { configurePurchases, hasStoreEntitlement, onCustomerInfo } from "@/lib/purchases";
import { useAuthContext } from "@/providers/AuthProvider";

/**
 * Acesso premium = mesma regra do web (linhas de public.subscriptions +
 * bypass de admin) OU direito ativo na loja (RevenueCat). O segundo cobre os
 * segundos entre a compra e a chegada do webhook no backend.
 */

type SubscriptionContextValue = {
  loading: boolean;
  isActive: boolean;
  subscription: (SubscriptionRow & { store?: string | null }) | null;
  storeActive: boolean;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

async function fetchAccess(userId: string) {
  const [{ data: rows }, { data: admin }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("environment", PAYMENTS_ENV)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("admin_users").select("paywall_bypass").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    subscription: pickCurrentSubscription((rows as SubscriptionRow[] | null) ?? []),
    adminBypass: !!admin?.paywall_bypass,
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    configurePurchases();
    return onCustomerInfo(setCustomerInfo);
  }, []);

  useEffect(() => {
    if (!userId) return;
    Purchases.isConfigured()
      .then((ok) => (ok ? Purchases.getCustomerInfo() : null))
      .then((info) => info && setCustomerInfo(info))
      .catch(() => {});
  }, [userId]);

  const query = useQuery({
    queryKey: ["access", userId],
    queryFn: () => fetchAccess(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  // Tempo real: webhook da loja/Stripe ou liberação do admin atualizam na hora.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`sub-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["access", userId] }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_users", filter: `user_id=eq.${userId}` },
        () => void queryClient.invalidateQueries({ queryKey: ["access", userId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["access", userId] });
  }, [queryClient, userId]);

  const storeActive = !!userId && hasStoreEntitlement(customerInfo);
  const value = useMemo<SubscriptionContextValue>(() => {
    const sub = query.data?.subscription ?? null;
    return {
      loading: !!userId && query.isLoading,
      isActive: storeActive || !!query.data?.adminBypass || computeIsActive(sub),
      subscription: sub,
      storeActive,
      refresh,
    };
  }, [query.data, query.isLoading, storeActive, refresh, userId]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription fora do SubscriptionProvider");
  return ctx;
}
