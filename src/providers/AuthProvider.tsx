import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { computeDailyTargets } from "@/lib/nutritionTargets";
import { identifyPurchaser, resetPurchaser } from "@/lib/purchases";
import { forgetDeviceToken, refreshPushToken } from "@/lib/push";

/**
 * Sessão + perfil nutricional. Mesma lógica do layout autenticado do web
 * (src/routes/_authenticated.tsx): garante que o perfil exista, preenche metas
 * antigas e, no primeiro login, valida o e-mail e inicia o teste grátis.
 */

export type AuthStatus = "loading" | "signedOut" | "loadingProfile" | "ready" | "error";

type ProfileLite = { id: string; onboarded_at: string | null };

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: ProfileLite | null;
  refreshProfile: () => Promise<void>;
  signOut: (scope?: "local" | "global") => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function firstNameFrom(user: User): string | null {
  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
  const raw = meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? null;
  const token = typeof raw === "string" && raw.trim() ? raw.trim().split(/\s+/)[0] : null;
  return token ? token.charAt(0).toLocaleUpperCase("pt-BR") + token.slice(1) : null;
}

async function loadOrCreateProfile(user: User): Promise<ProfileLite> {
  const { data: existing, error } = await supabase
    .from("nutrition_profiles")
    .select("id, onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: createErr } = await supabase
    .from("nutrition_profiles")
    .insert({ user_id: user.id, locale: "pt", name: firstNameFrom(user), goal: "manutencao" })
    .select("id, onboarded_at")
    .single();
  if (createErr || !created) throw createErr ?? new Error("Falha ao criar perfil");
  return created;
}

// Perfis que concluíram o onboarding antes das metas existirem ganham as metas aqui.
async function backfillTargets(profileId: string) {
  try {
    const { data: p } = await supabase
      .from("nutrition_profiles")
      .select(
        "goal, biological_sex, birth_date, height_cm, current_weight_kg, activity_level, pregnancy_or_breastfeeding, daily_calorie_target",
      )
      .eq("id", profileId)
      .maybeSingle();
    if (!p || p.daily_calorie_target != null) return;
    const targets = computeDailyTargets(p);
    if (targets) await supabase.from("nutrition_profiles").update(targets).eq("id", profileId);
  } catch {
    /* best-effort */
  }
}

// Primeiro login: marca o e-mail como validado e inicia o teste grátis (idempotente no banco).
async function firstLoginEffects(userId: string) {
  try {
    await supabase
      .from("nutrition_profiles")
      .update({ email_validated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("email_validated_at", null);
  } catch {
    /* best-effort */
  }
  try {
    await supabase.rpc("claim_free_trial");
  } catch {
    /* best-effort */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (!data.session) setStatus("signedOut");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (cancelled) return;
      setSession(next);
      if (!next) {
        setStatus("signedOut");
        setProfile(null);
        loadedFor.current = null;
        queryClient.clear();
      }
      if (event === "SIGNED_IN" && next?.user) void firstLoginEffects(next.user.id);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const user = session?.user ?? null;

  const loadProfile = useCallback(async (u: User) => {
    setStatus((s) => (s === "ready" ? s : "loadingProfile"));
    try {
      const p = await loadOrCreateProfile(u);
      setProfile(p);
      setStatus("ready");
      void backfillTargets(p.id);
      void refreshPushToken(p.id);
    } catch (err) {
      console.error("[auth] perfil não carregou:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (loadedFor.current === user.id) return;
    loadedFor.current = user.id;
    void identifyPurchaser(user.id);
    void loadProfile(user);
  }, [user, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("nutrition_profiles")
      .select("id, onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setProfile(data);
  }, [user]);

  const signOut = useCallback(async (scope: "local" | "global" = "local") => {
    await forgetDeviceToken();
    await resetPurchaser();
    try {
      await supabase.auth.signOut({ scope });
    } catch (err) {
      console.error("[auth] signOut falhou:", err);
      await supabase.auth.signOut({ scope: "local" });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, user, profile, refreshProfile, signOut }),
    [status, session, user, profile, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext fora do AuthProvider");
  return ctx;
}

/** Para telas autenticadas: ids garantidos (o layout só renderiza com status "ready"). */
export function useAuth() {
  const ctx = useAuthContext();
  if (!ctx.user || !ctx.profile) throw new Error("useAuth() usado fora da área logada");
  return {
    userId: ctx.user.id,
    email: ctx.user.email ?? null,
    profileId: ctx.profile.id,
    onboarded: !!ctx.profile.onboarded_at,
    refreshProfile: ctx.refreshProfile,
    signOut: ctx.signOut,
  };
}
