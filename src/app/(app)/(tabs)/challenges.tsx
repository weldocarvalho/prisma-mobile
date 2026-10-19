import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Award, Trophy } from "lucide-react-native";
import { Disclaimer, PageHeader, Screen, Stack } from "@/components/Screen";
import { OnboardingGate, PaywallGate } from "@/components/Gates";
import { AchievementsCard, LevelCard } from "@/components/progress";
import { Card, Loading, ProgressBar, T } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { useGamification, useRefreshAll } from "@/hooks/queries";
import { getAchievedChallengeHistory, getCurrentWeeklyChallenge } from "@/lib/challenges";
import { startOfWeek } from "@/lib/streak";
import { nowMs, todayKey } from "@/lib/dayKey";
import { feedback } from "@/lib/haptics";
import { colors, fonts } from "@/theme/tokens";

type Tab = "challenges" | "achievements";

export default function ChallengesScreen() {
  const { profileId, onboarded } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const stats = useGamification(profileId);
  const refreshAll = useRefreshAll();
  const [tab, setTab] = useState<Tab>("challenges");

  const { challenge, achieved } = useMemo(() => {
    const since = todayKey(new Date(nowMs() - 60 * 86_400_000));
    const history = stats.checkIns.filter((c) => c.day >= since);
    const weekStart = todayKey(startOfWeek(new Date()));
    const week = history.filter((c) => c.day >= weekStart);
    return {
      challenge: getCurrentWeeklyChallenge({
        checks: stats.checks,
        totalPerDay: stats.totalPerDay,
        weekCheckIns: week,
      }),
      achieved: getAchievedChallengeHistory({
        checks: stats.checks,
        totalPerDay: stats.totalPerDay,
        checkInHistory: history,
      }),
    };
  }, [stats.checkIns, stats.checks, stats.totalPerDay]);

  if (!subLoading && !isActive) {
    return (
      <Screen>
        <PageHeader eyebrow="Desafios" title="Desafios da semana" />
        <PaywallGate feature="Desafios e conquistas" />
      </Screen>
    );
  }
  if (!onboarded) {
    return (
      <Screen>
        <PageHeader eyebrow="Desafios" title="Desafios da semana" />
        <OnboardingGate
          title="Sem desafios ainda"
          description="Monte seu plano alimentar personalizado para começarmos a registrar seus desafios e conquistas."
        />
      </Screen>
    );
  }

  const pct = Math.max(0, Math.min(100, (challenge.progress / challenge.target) * 100));

  return (
    <Screen onRefresh={refreshAll}>
      <PageHeader eyebrow="Desafios" title="Desafios da semana" />
      {stats.loading ? (
        <Loading />
      ) : (
        <Stack>
          <LevelCard xp={stats.xpTotal} />
          <View
            accessibilityRole="tablist"
            style={{
              flexDirection: "row",
              backgroundColor: colors.white,
              borderRadius: 999,
              padding: 4,
            }}
          >
            {(
              [
                { id: "challenges", label: "Desafio", icon: Trophy },
                { id: "achievements", label: "Conquistas", icon: Award },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    feedback("tap");
                    setTab(t.id);
                  }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    borderRadius: 999,
                    paddingVertical: 10,
                    backgroundColor: active ? colors.roseSoft : "transparent",
                  }}
                >
                  <t.icon size={15} color={active ? colors.roseInk : colors.inkFaint} />
                  <T
                    variant="label"
                    style={{ fontSize: 13, color: active ? colors.roseInk : colors.inkFaint }}
                  >
                    {t.label}
                  </T>
                </Pressable>
              );
            })}
          </View>

          {tab === "challenges" ? (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Trophy size={16} color={colors.roseInk} />
                <T variant="heading" style={{ fontSize: 18 }}>
                  Desafio da semana
                </T>
              </View>
              <T variant="caption" style={{ marginTop: 2 }}>
                Renovados toda semana — cumpra para ganhar XP extra.
              </T>
              <View
                style={{
                  backgroundColor: colors.ink,
                  borderRadius: 18,
                  padding: 16,
                  marginTop: 14,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <T
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 17,
                      color: colors.paper,
                      flex: 1,
                    }}
                  >
                    {challenge.title}
                  </T>
                  {challenge.completed && (
                    <T variant="caption" style={{ color: "rgba(247,246,242,0.7)" }}>
                      Concluído ✓
                    </T>
                  )}
                </View>
                <T variant="caption" style={{ color: "rgba(247,246,242,0.6)", marginTop: 4 }}>
                  {challenge.description}
                </T>
                <View style={{ marginTop: 12 }}>
                  <ProgressBar pct={pct} track="rgba(247,246,242,0.15)" />
                </View>
                <T variant="caption" style={{ color: "rgba(247,246,242,0.5)", marginTop: 6 }}>
                  {challenge.progress}/{challenge.target} {challenge.unit}
                </T>
              </View>
              {achieved.length === 0 ? (
                <T variant="caption" style={{ marginTop: 14 }}>
                  Os desafios que você cumprir aparecem aqui.
                </T>
              ) : (
                <View style={{ marginTop: 16 }}>
                  <T variant="eyebrow">Desafios já alcançados</T>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {achieved.map((a) => (
                      <View
                        key={a.key}
                        style={{
                          backgroundColor: colors.roseSoft,
                          borderRadius: 999,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                        }}
                      >
                        <T variant="label" style={{ color: colors.roseInk, fontSize: 12 }}>
                          {a.label}
                        </T>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          ) : (
            <AchievementsCard
              bestStreak={stats.bestStreak}
              checkInsCount={stats.checkInsCount}
              selfieCount={stats.selfieCount}
              selfieSpanDays={stats.selfieSpanDays}
              hasRoutine={onboarded}
              levelIndex={stats.level.index}
            />
          )}
        </Stack>
      )}
      <Disclaimer />
    </Screen>
  );
}
