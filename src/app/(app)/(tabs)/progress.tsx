import { Share, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Share2, Sparkles } from "lucide-react-native";
import { Disclaimer, PageHeader, Screen, Stack } from "@/components/Screen";
import { OnboardingGate, PaywallGate } from "@/components/Gates";
import { LevelCard, StreakCard, WeightChart } from "@/components/progress";
import { Button, Card, Loading, T } from "@/components/ui";
import { Ring } from "@/components/Ring";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { qk, useGamification, useProfile, useRefreshAll, useWeightLogs } from "@/hooks/queries";
import { logWeight } from "@/lib/data";
import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/config";
import { feedback } from "@/lib/haptics";
import { colors, fonts } from "@/theme/tokens";

export default function ProgressScreen() {
  const { profileId, onboarded } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const toast = useToast();
  const queryClient = useQueryClient();
  const stats = useGamification(profileId);
  const weights = useWeightLogs(profileId);
  const profile = useProfile(profileId);
  const refreshAll = useRefreshAll();

  if (!subLoading && !isActive) {
    return (
      <Screen>
        <PageHeader eyebrow="Seu progresso" title="Sua evolução" />
        <PaywallGate feature="O acompanhamento de progresso" />
      </Screen>
    );
  }
  if (!onboarded) {
    return (
      <Screen>
        <PageHeader eyebrow="Seu progresso" title="Sua evolução" />
        <OnboardingGate
          title="Sem dados de progresso ainda"
          description="Monte seu plano alimentar personalizado para começarmos a registrar sua evolução."
        />
      </Screen>
    );
  }

  async function share() {
    try {
      await Share.share({
        message:
          `Minha evolução no ${BRAND_NAME}: ${stats.currentStreak} dias seguidos, ` +
          `${stats.xpTotal} XP (nível ${stats.level.level.label}) e ${stats.consistency}% de consistência. ` +
          `Comece grátis: https://${BRAND_DOMAIN}`,
      });
    } catch {
      /* fechou */
    }
  }

  return (
    <Screen onRefresh={refreshAll}>
      <PageHeader
        eyebrow="Seu progresso"
        title="Sua evolução"
        right={
          <Button
            variant="secondary"
            size="sm"
            title="Compartilhar"
            icon={Share2}
            onPress={share}
          />
        }
      />
      {stats.loading ? (
        <Loading />
      ) : (
        <Stack>
          <LevelCard xp={stats.xpTotal} compact />
          <Card style={{ alignItems: "center" }}>
            <Ring
              size={140}
              stroke={3}
              pct={stats.level.progressPct / 100}
              track={colors.lineSoft}
              label={`Total de ${stats.xpTotal} XP`}
            >
              <Sparkles size={16} color={colors.roseInk} />
              <T style={{ fontFamily: fonts.display, fontSize: 28, marginTop: 2 }}>
                {stats.xpTotal}
              </T>
              <T variant="eyebrow" style={{ fontSize: 9.5 }}>
                Total de XP
              </T>
            </Ring>
          </Card>
          <WeightChart
            logs={weights.data ?? []}
            targetWeightKg={profile.data?.target_weight_kg ?? null}
            onSave={async (kg) => {
              try {
                await logWeight(profileId, kg);
                feedback("success");
                toast.success("Peso registrado");
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: qk.weights(profileId) }),
                  queryClient.invalidateQueries({ queryKey: qk.profile(profileId) }),
                ]);
              } catch {
                toast.error("Não foi possível salvar o peso. Tente novamente.");
              }
            }}
          />
          <StreakCard checks={stats.checks} totalPerDay={stats.totalPerDay} />
          <View />
        </Stack>
      )}
      <Disclaimer />
    </Screen>
  );
}
