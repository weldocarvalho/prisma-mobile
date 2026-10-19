import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { BookOpen, Camera, ChevronRight, Gift } from "lucide-react-native";
import { Disclaimer, Screen, Stack } from "@/components/Screen";
import { Hero, RitualCard, StatLine, TrialBanner } from "@/components/home";
import { RoutineList } from "@/components/meals";
import { Card, IconCircle, Loading, T } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import {
  useChecks,
  useGamification,
  useMealLogs,
  usePlan,
  useProfile,
  useRefreshAll,
} from "@/hooks/queries";
import { todayKey } from "@/lib/dayKey";
import { FEATURES } from "@/lib/config";
import type { MealSlot } from "@/lib/routineTypes";
import { colors } from "@/theme/tokens";

function routineStatusText(steps: MealSlot[], doneSteps: Set<number>): string {
  if (steps.length === 0) return "Complete o questionário para gerar seu plano personalizado.";
  const doneCount = steps.filter((s) => doneSteps.has(s.step)).length;
  if (doneCount === steps.length)
    return "Refeições de hoje completas. Continue amanhã para manter sua sequência.";
  const next = steps.find((s) => !doneSteps.has(s.step));
  if (doneCount === 0) return `Nada feito ainda. Comece com "${next?.title ?? steps[0].title}".`;
  const lastDone = [...steps].reverse().find((s) => doneSteps.has(s.step));
  return `${lastDone?.title ?? "Primeira refeição"} já feita. Continue com ${next?.title ?? "a próxima"}.`;
}

function Shortcut({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: typeof Gift;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <Card style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }}>
        <IconCircle icon={icon} size={36} />
        <View style={{ flex: 1 }}>
          <T variant="label">{title}</T>
          <T variant="caption">{subtitle}</T>
        </View>
        <ChevronRight size={18} color={colors.inkFaint} />
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { profileId, onboarded } = useAuth();
  const day = todayKey();
  const profile = useProfile(profileId);
  const plan = usePlan(profileId);
  const { checks, toggle } = useChecks(profileId);
  const stats = useGamification(profileId);
  const meals = useMealLogs(profileId, day);
  const refreshAll = useRefreshAll();

  // Conta nova: leva direto ao questionário uma vez (como o web faz ao criar o perfil).
  const redirected = useRef(false);
  useEffect(() => {
    if (!onboarded && !redirected.current) {
      redirected.current = true;
      router.push("/onboarding");
    }
  }, [onboarded]);

  const steps = plan.data?.plan.daily_meal_structure ?? [];
  const doneSteps = new Set(
    steps.filter((s) => !!checks[`${s.meal}:${s.step}:${day}`]).map((s) => s.step),
  );
  const calorieTarget = profile.data?.daily_calorie_target ?? null;
  const caloriesToday = (meals.data ?? []).reduce((sum, m) => sum + (m.estimatedCalories ?? 0), 0);

  return (
    <Screen onRefresh={refreshAll}>
      <Hero
        name={profile.data?.name ?? null}
        streak={stats.currentStreak}
        goal={profile.data?.goal ?? null}
        levelLabel={stats.level.level.label}
      />
      <Stack style={{ marginTop: 18 }}>
        <TrialBanner />
        {plan.isLoading ? (
          <Loading />
        ) : (
          <RitualCard
            doneCount={doneSteps.size}
            totalCount={steps.length}
            statusText={routineStatusText(steps, doneSteps)}
          />
        )}
        <StatLine
          weekXp={stats.weekXp}
          caloriesToday={calorieTarget != null ? caloriesToday : undefined}
          calorieTarget={calorieTarget}
          selfieCount={stats.selfieCount}
          showSelfies={FEATURES.selfieJournal}
        />
        <RoutineList
          steps={steps}
          doneSteps={doneSteps}
          onToggle={(s, done) => toggle(s.meal, s.step, day, done)}
        />
        <View style={{ gap: 10 }}>
          {FEATURES.selfieJournal && (
            <Shortcut
              icon={Camera}
              title="Diário de fotos"
              subtitle="Sua linha do tempo de evolução"
              onPress={() => router.push("/journal")}
            />
          )}
          <Shortcut
            icon={BookOpen}
            title="Dicas e FAQ"
            subtitle="Boas práticas e respostas rápidas"
            onPress={() => router.push("/tips")}
          />
          <Shortcut
            icon={Gift}
            title="Indique um amigo"
            subtitle="Vocês dois ganham +7 dias grátis"
            onPress={() => router.push("/profile")}
          />
        </View>
      </Stack>
      <Disclaimer />
    </Screen>
  );
}
