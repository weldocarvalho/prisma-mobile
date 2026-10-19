import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Moon, Plus, Sun } from "lucide-react-native";
import { Disclaimer, Screen, Stack } from "@/components/Screen";
import { NutritionRing } from "@/components/NutritionRing";
import { MealLogList, StepCard } from "@/components/meals";
import { OnboardingGate, PaywallGate, SectionTitle } from "@/components/Gates";
import { Badge, Button, Card, IconCircle, Loading, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { qk, useChecks, useMealLogs, usePlan, useProfile, useRefreshAll } from "@/hooks/queries";
import { deleteMealLog, fetchCheckIn, fetchCheckOut, listSelfieMeta } from "@/lib/data";
import { todayKey } from "@/lib/dayKey";
import { FEATURES } from "@/lib/config";
import { colors } from "@/theme/tokens";
import type { MealLog } from "@/lib/mealLogTypes";

type Window = "morning" | "night";

function currentWindow(): Window {
  const h = new Date().getHours();
  return h >= 17 || h < 5 ? "night" : "morning";
}

export default function TodayScreen() {
  const { profileId, onboarded } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const params = useLocalSearchParams<{ markDone?: string }>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const day = todayKey();
  const [windowOverride, setWindowOverride] = useState<Window | null>(null);
  const [defaultWindow] = useState<Window>(currentWindow);
  const markParam =
    params.markDone === "morning" || params.markDone === "night" ? params.markDone : null;
  const dayWindow: Window = windowOverride ?? markParam ?? defaultWindow;

  const profile = useProfile(profileId);
  const plan = usePlan(profileId);
  const meals = useMealLogs(profileId, day);
  const { checks, toggle } = useChecks(profileId);
  const refreshAll = useRefreshAll();
  const checkIn = useQuery({
    queryKey: qk.checkIn(profileId, day),
    queryFn: () => fetchCheckIn(profileId, day),
  });
  const checkOut = useQuery({
    queryKey: qk.checkOut(profileId, day),
    queryFn: () => fetchCheckOut(profileId, day),
  });
  const selfies = useQuery({
    queryKey: qk.selfieMeta(profileId),
    queryFn: () => listSelfieMeta(profileId),
    enabled: FEATURES.selfieJournal,
  });

  const steps = plan.data?.plan.daily_meal_structure ?? [];
  const morningStep = steps.find((m) => m.meal === "cafe_da_manha");
  const nightStep = steps.find((m) => m.meal === "jantar");
  const isDone = (s?: { meal: string; step: number }) =>
    s ? !!checks[`${s.meal}:${s.step}:${day}`] : false;

  // Toque no lembrete "marcar como feito" (?markDone=morning|night), como no web.
  const markHandled = useRef(false);
  useEffect(() => {
    if (markHandled.current || !plan.data) return;
    const mark = params.markDone;
    if (mark !== "morning" && mark !== "night") return;
    markHandled.current = true;
    const anchor = mark === "morning" ? morningStep : nightStep;
    if (anchor && !isDone(anchor)) {
      toggle(anchor.meal, anchor.step, day, true);
      toast.success("Marcado como feito!");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.data, params.markDone]);

  async function handleDelete(id: string) {
    queryClient.setQueryData<MealLog[]>(qk.meals(profileId, day), (old) =>
      (old ?? []).filter((l) => l.id !== id),
    );
    try {
      await deleteMealLog(profileId, id);
    } catch {
      toast.error("Não foi possível excluir. Tente de novo.");
      void meals.refetch();
    }
  }

  if (!subLoading && !isActive) {
    return (
      <Screen edges={[]}>
        <PaywallGate feature="O acompanhamento diário" />
      </Screen>
    );
  }
  if (!onboarded) {
    return (
      <Screen edges={[]}>
        <OnboardingGate
          title="Antes do check-in diário"
          description="Monte seu plano alimentar personalizado para começarmos a acompanhar sua evolução."
        />
      </Screen>
    );
  }
  if (plan.isLoading || profile.isLoading) {
    return (
      <Screen edges={[]}>
        <Loading />
      </Screen>
    );
  }

  const logs = meals.data ?? [];
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.estimatedCalories ?? 0),
      protein: acc.protein + (l.estimatedProteinG ?? 0),
      carbs: acc.carbs + (l.estimatedCarbsG ?? 0),
      fat: acc.fat + (l.estimatedFatG ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
  const p = profile.data;

  const morning = dayWindow === "morning";
  const selfieDone = !FEATURES.selfieJournal || (selfies.data ?? []).some((s) => s.day === day);
  const morningParts = [
    isDone(morningStep),
    !!checkIn.data,
    ...(FEATURES.selfieJournal ? [selfieDone] : []),
  ];
  const nightParts = [isDone(nightStep), !!checkOut.data];
  const parts = morning ? morningParts : nightParts;
  const doneCount = parts.filter(Boolean).length;
  const complete = doneCount === parts.length;

  return (
    <Screen edges={[]} onRefresh={refreshAll}>
      <T variant="eyebrow">{morning ? "Check-in da manhã" : "Check-out da noite"}</T>
      <T variant="title" style={{ marginTop: 2, marginBottom: 16 }}>
        {morning ? "Check-in de hoje" : "Check-out de hoje"}
      </T>

      <Stack>
        <NutritionRing
          calories={totals.calories}
          calorieTarget={p?.daily_calorie_target ?? null}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
          proteinTarget={p?.daily_protein_target_g ?? null}
          carbsTarget={p?.daily_carbs_target_g ?? null}
          fatTarget={p?.daily_fat_target_g ?? null}
        />

        <View>
          <SectionTitle
            right={
              <Button
                size="sm"
                title="Registrar"
                icon={Plus}
                onPress={() => router.push("/meal-logger")}
              />
            }
          >
            Refeições de hoje
          </SectionTitle>
          {meals.isLoading ? <Loading /> : <MealLogList logs={logs} onDelete={handleDelete} />}
        </View>

        <View>
          <SectionTitle
            right={<Badge icon={Check} label={`${doneCount} de ${parts.length} feitos`} />}
          >
            {morning ? "Check-in de hoje" : "Check-out de hoje"}
          </SectionTitle>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/check-flow", params: { mode: dayWindow } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconCircle icon={complete ? Check : morning ? Sun : Moon} size={40} />
              <View style={{ flex: 1 }}>
                <T variant="label">
                  {complete
                    ? morning
                      ? "Check-in concluído"
                      : "Check-out concluído"
                    : morning
                      ? "Iniciar check-in"
                      : "Iniciar check-out"}
                </T>
                <T variant="caption">
                  {complete
                    ? "Toque para refazer, se quiser"
                    : morning
                      ? FEATURES.selfieJournal
                        ? "Café da manhã, foto e sono — passo a passo guiado"
                        : "Café da manhã e sono — passo a passo guiado"
                      : "Jantar e água — passo a passo guiado"}
                </T>
              </View>
              <ChevronRight size={18} color={colors.inkFaint} />
            </Card>
          </Pressable>
          <Button
            variant="ghost"
            size="sm"
            title={morning ? "Fazer o check-out da noite" : "Ver o check-in da manhã"}
            onPress={() => setWindowOverride(morning ? "night" : "morning")}
            style={{ alignSelf: "center", marginTop: 4 }}
          />
        </View>

        <View>
          <SectionTitle
            right={
              <T variant="caption">
                {steps.filter((s) => isDone(s)).length} de {steps.length}
              </T>
            }
          >
            Suas refeições do plano
          </SectionTitle>
          <View style={{ gap: 8 }}>
            {steps.map((s) => (
              <StepCard
                key={`${s.meal}-${s.step}`}
                step={s}
                compact
                done={isDone(s)}
                onToggle={(done) => toggle(s.meal, s.step, day, done)}
              />
            ))}
          </View>
          <Button
            variant="secondary"
            size="sm"
            title="Ver plano completo"
            style={{ marginTop: 12, alignSelf: "center" }}
            onPress={() => router.push("/routine")}
          />
        </View>
      </Stack>
      <Disclaimer />
    </Screen>
  );
}
