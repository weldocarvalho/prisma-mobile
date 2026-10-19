import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChecks,
  fetchCurrentPlan,
  fetchNotificationPrefs,
  fetchProfile,
  getProfilePhotoUrl,
  listCheckIns,
  listCheckOutDays,
  listMealLogsForDay,
  listSelfieMeta,
  listWeightLogs,
  setCheck,
  checkKey,
  updateProfile,
  type NotificationPrefs,
} from "@/lib/data";
import { todayKey } from "@/lib/dayKey";
import type { Checks } from "@/lib/streak";
import { computeStreakStats, startOfWeek } from "@/lib/streak";
import { computeXpSeries, levelForXp } from "@/lib/xp";
import { FEATURES } from "@/lib/config";

/** Chaves de cache — telas diferentes compartilham os mesmos dados. */
export const qk = {
  profile: (pid: string) => ["profile", pid] as const,
  plan: (pid: string) => ["plan", pid] as const,
  checks: (pid: string) => ["checks", pid] as const,
  meals: (pid: string, day: string) => ["meals", pid, day] as const,
  checkIn: (pid: string, day: string) => ["checkIn", pid, day] as const,
  checkOut: (pid: string, day: string) => ["checkOut", pid, day] as const,
  checkIns: (pid: string) => ["checkIns", pid] as const,
  checkOutDays: (pid: string) => ["checkOutDays", pid] as const,
  weights: (pid: string) => ["weights", pid] as const,
  selfieMeta: (pid: string) => ["selfieMeta", pid] as const,
  selfies: (pid: string) => ["selfies", pid] as const,
  photo: (uid: string) => ["photo", uid] as const,
  notif: (pid: string) => ["notif", pid] as const,
  referral: (uid: string) => ["referral", uid] as const,
};

export function useProfile(pid: string) {
  return useQuery({ queryKey: qk.profile(pid), queryFn: () => fetchProfile(pid) });
}

export function usePlan(pid: string) {
  return useQuery({ queryKey: qk.plan(pid), queryFn: () => fetchCurrentPlan(pid) });
}

export function useMealLogs(pid: string, day: string) {
  return useQuery({ queryKey: qk.meals(pid, day), queryFn: () => listMealLogsForDay(pid, day) });
}

export function useWeightLogs(pid: string) {
  return useQuery({ queryKey: qk.weights(pid), queryFn: () => listWeightLogs(pid) });
}

export function useProfilePhoto(uid: string) {
  return useQuery({
    queryKey: qk.photo(uid),
    queryFn: () => getProfilePhotoUrl(uid),
    staleTime: 30 * 60_000,
  });
}

/** Marcações do plano com atualização otimista (o check aparece na hora). */
export function useChecks(pid: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: qk.checks(pid), queryFn: () => fetchChecks(pid) });

  const mutation = useMutation({
    mutationFn: (v: { period: string; step: number; day: string; done: boolean }) =>
      setCheck(pid, v.period, v.step, v.day, v.done),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey: qk.checks(pid) });
      const previous = queryClient.getQueryData<Checks>(qk.checks(pid));
      queryClient.setQueryData<Checks>(qk.checks(pid), (old) => {
        const next = { ...(old ?? {}) };
        const key = checkKey(v.period, v.step, v.day);
        if (v.done) next[key] = true;
        else delete next[key];
        return next;
      });
      return { previous };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(qk.checks(pid), ctx.previous);
    },
  });

  const toggle = useCallback(
    (period: string, step: number, day: string, done: boolean) =>
      mutation.mutate({ period, step, day, done }),
    [mutation],
  );

  return { checks: query.data ?? {}, loading: query.isLoading, toggle, refetch: query.refetch };
}

export function useNotificationPrefs(pid: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: qk.notif(pid), queryFn: () => fetchNotificationPrefs(pid) });
  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => updateProfile(pid, patch),
    onMutate: async (patch) => {
      const previous = queryClient.getQueryData<NotificationPrefs>(qk.notif(pid));
      queryClient.setQueryData<NotificationPrefs | null>(qk.notif(pid), (old) =>
        old ? { ...old, ...patch } : old,
      );
      return { previous };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(qk.notif(pid), ctx.previous);
    },
  });
  return { prefs: query.data ?? null, loading: query.isLoading, update: mutation.mutate };
}

/**
 * Números de gamificação (XP, nível, sequência) — mesmo cálculo do web
 * (useHomeStats / progress / challenges), a partir das mesmas tabelas.
 */
export function useGamification(pid: string) {
  const plan = usePlan(pid);
  const { checks, loading: checksLoading } = useChecks(pid);
  const checkIns = useQuery({ queryKey: qk.checkIns(pid), queryFn: () => listCheckIns(pid) });
  const checkOutDays = useQuery({
    queryKey: qk.checkOutDays(pid),
    queryFn: () => listCheckOutDays(pid),
  });
  const selfieMeta = useQuery({
    queryKey: qk.selfieMeta(pid),
    queryFn: () => listSelfieMeta(pid),
    enabled: FEATURES.selfieJournal,
  });

  const totalPerDay = plan.data?.plan.daily_meal_structure.length ?? 0;

  return useMemo(() => {
    const checkInDays = new Set((checkIns.data ?? []).map((c) => c.day));
    const outDays = new Set(checkOutDays.data ?? []);
    const selfies = selfieMeta.data ?? [];
    const selfiesByDay: Record<string, number> = {};
    for (const s of selfies) selfiesByDay[s.day] = (selfiesByDay[s.day] ?? 0) + 1;

    const series = computeXpSeries({
      checks,
      totalPerDay,
      checkInDays,
      checkOutDays: outDays,
      selfiesByDay,
    });
    const today = todayKey();
    const last = series[series.length - 1];
    const xpTotal = last ? last.cumulative : 0;
    const weekStart = todayKey(startOfWeek(new Date()));
    const weekXp = series.filter((p) => p.day >= weekStart).reduce((sum, p) => sum + p.xp, 0);
    const streak = computeStreakStats(checks, totalPerDay);
    const selfieDays = selfies.map((s) => new Date(s.day).getTime());
    const selfieSpanDays =
      selfieDays.length >= 2
        ? Math.round((Math.max(...selfieDays) - Math.min(...selfieDays)) / 86_400_000)
        : 0;

    return {
      loading: plan.isLoading || checksLoading || checkIns.isLoading || checkOutDays.isLoading,
      checks,
      totalPerDay,
      xpTotal,
      todayXp: last && last.day === today ? last.xp : 0,
      weekXp,
      level: levelForXp(xpTotal),
      ...streak,
      checkIns: checkIns.data ?? [],
      checkInsCount: checkIns.data?.length ?? 0,
      selfieCount: selfies.length,
      selfieSpanDays,
      hasPlan: !!plan.data,
    };
  }, [
    checks,
    totalPerDay,
    checkIns.data,
    checkOutDays.data,
    selfieMeta.data,
    plan.isLoading,
    plan.data,
    checksLoading,
    checkIns.isLoading,
    checkOutDays.isLoading,
  ]);
}

/** Recarrega tudo que as telas principais mostram (puxar para atualizar). */
const REFRESH_KEYS = [
  "profile",
  "plan",
  "checks",
  "meals",
  "checkIn",
  "checkOut",
  "checkIns",
  "checkOutDays",
  "weights",
  "selfieMeta",
  "selfies",
  "access",
];

export function useRefreshAll() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await Promise.all(REFRESH_KEYS.map((k) => queryClient.invalidateQueries({ queryKey: [k] })));
  }, [queryClient]);
}
