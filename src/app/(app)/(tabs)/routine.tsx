import { useState } from "react";
import { Share, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, RefreshCw, Share2 } from "lucide-react-native";
import { Disclaimer, PageHeader, Screen, Stack } from "@/components/Screen";
import { OnboardingGate, PaywallGate } from "@/components/Gates";
import { StepCard } from "@/components/meals";
import { Button, Card, ErrorText, Loading, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { qk, useChecks, usePlan, useProfile, useRefreshAll } from "@/hooks/queries";
import { api, ApiError } from "@/lib/api";
import { allergyLabels } from "@/lib/data";
import { todayKey } from "@/lib/dayKey";
import { MAX_ATTEMPTS_PER_CYCLE } from "@/lib/routineAttempts";
import { BRAND_DOMAIN, BRAND_NAME } from "@/lib/config";
import { feedback } from "@/lib/haptics";
import { colors } from "@/theme/tokens";

function Bullets({
  items,
  dot = colors.rose,
}: {
  items: { key: string; strong?: string; text: string }[];
  dot?: string;
}) {
  return (
    <View style={{ gap: 10, marginTop: 10 }}>
      {items.map((it) => (
        <View key={it.key} style={{ flexDirection: "row", gap: 10 }}>
          <View
            style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot, marginTop: 8 }}
          />
          <T variant="bodySmall" style={{ flex: 1, color: colors.ink }}>
            {it.strong ? (
              <T variant="label" style={{ fontSize: 13 }}>
                {it.strong} —{" "}
              </T>
            ) : null}
            {it.text}
          </T>
        </View>
      ))}
    </View>
  );
}

export default function RoutineScreen() {
  const { profileId } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const toast = useToast();
  const queryClient = useQueryClient();
  const plan = usePlan(profileId);
  const profile = useProfile(profileId);
  const { checks, toggle } = useChecks(profileId);
  const refreshAll = useRefreshAll();
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const day = todayKey();

  if (!subLoading && !isActive) {
    return (
      <Screen>
        <PageHeader eyebrow="Meu plano alimentar" title="Seu plano" />
        <PaywallGate feature="O plano personalizado" />
      </Screen>
    );
  }

  if (plan.isLoading) {
    return (
      <Screen>
        <PageHeader eyebrow="Meu plano alimentar" title="Seu plano" />
        <Loading />
      </Screen>
    );
  }

  const current = plan.data;
  if (!current) {
    return (
      <Screen onRefresh={refreshAll}>
        <PageHeader
          eyebrow="Meu plano alimentar"
          title="Seu plano"
          subtitle="Sua sugestão de refeições personalizada, gerada pela IA."
        />
        <OnboardingGate
          title="Seu plano ainda não existe"
          description="Responda o questionário rápido para a IA gerar seu plano alimentar personalizado."
        />
      </Screen>
    );
  }

  const routine = current.plan;
  const allergies = allergyLabels(profile.data?.allergies);
  const attempt = current.attemptNumber ?? 1;

  async function confirm() {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await api.confirmPlan(profileId, current!.id);
      if (!res.ok) {
        if (res.error === "SUBSCRIPTION_REQUIRED") {
          router.push("/assinar");
          return;
        }
        throw new Error(res.error || "Não foi possível confirmar o plano.");
      }
      feedback("achievement");
      toast.success("Plano marcado como definitivo.");
      await queryClient.invalidateQueries({ queryKey: qk.plan(profileId) });
    } catch (e) {
      setConfirmError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Não foi possível confirmar o plano.",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function share() {
    const meals = routine.daily_meal_structure
      .map((s) => `• ${s.title}${s.calories_estimate ? ` (~${s.calories_estimate} kcal)` : ""}`)
      .join("\n");
    try {
      await Share.share({
        message: `Meu plano alimentar no ${BRAND_NAME}:\n${meals}\n\nCrie o seu grátis por 3 dias: https://${BRAND_DOMAIN}`,
      });
    } catch {
      /* usuário fechou */
    }
  }

  return (
    <Screen onRefresh={refreshAll}>
      <PageHeader
        eyebrow="Meu plano alimentar"
        title="Seu plano"
        subtitle="Sua sugestão de refeições personalizada, gerada pela IA."
      />
      <Stack>
        {!current.isConfirmed ? (
          <Card>
            <T variant="label">
              Tentativa {attempt} de {MAX_ATTEMPTS_PER_CYCLE}
            </T>
            <T variant="caption" style={{ marginTop: 2 }}>
              Curtiu esse plano? Marque como definitivo ou gere outra versão.
            </T>
            <ErrorText>{confirmError}</ErrorText>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              {attempt < MAX_ATTEMPTS_PER_CYCLE && (
                <Button
                  variant="secondary"
                  size="sm"
                  title="Gerar outra"
                  icon={RefreshCw}
                  style={{ flex: 1 }}
                  onPress={() => router.push("/onboarding")}
                />
              )}
              <Button
                size="sm"
                title="Definitivo"
                icon={Check}
                loading={confirming}
                style={{ flex: 1 }}
                onPress={confirm}
              />
            </View>
          </Card>
        ) : (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 }}>
            <Check size={15} color={colors.roseInk} />
            <T variant="caption" style={{ color: colors.inkSoft }}>
              Este é seu plano definitivo.
            </T>
          </Card>
        )}

        {routine.summary ? (
          <Card>
            <T variant="bodySmall" style={{ color: colors.ink }}>
              {routine.summary}
            </T>
          </Card>
        ) : null}

        {allergies.length > 0 && (
          <Card tone="rose" style={{ flexDirection: "row", gap: 8 }}>
            <AlertCircle size={16} color={colors.roseInk} style={{ marginTop: 2 }} />
            <T variant="bodySmall" style={{ flex: 1, color: colors.ink }}>
              <T variant="label" style={{ color: colors.roseInk, fontSize: 13 }}>
                Atenção às suas alergias:{" "}
              </T>
              {allergies.join(", ")}
            </T>
          </Card>
        )}

        {profile.data?.pregnancy_or_breastfeeding && (
          <Card tone="outline" style={{ flexDirection: "row", gap: 8 }}>
            <AlertCircle size={16} color={colors.inkFaint} style={{ marginTop: 2 }} />
            <T variant="bodySmall" style={{ flex: 1, color: colors.ink }}>
              <T variant="label" style={{ fontSize: 13 }}>
                Gravidez/amamentação:{" "}
              </T>
              sugestão sem álcool, peixe/carne crus e laticínios não pasteurizados.
            </T>
          </Card>
        )}

        <Button
          variant="secondary"
          size="sm"
          title="Compartilhar resumo"
          icon={Share2}
          onPress={share}
        />

        {routine.daily_meal_structure.map((s) => (
          <StepCard
            key={`${s.meal}-${s.step}`}
            step={s}
            done={!!checks[`${s.meal}:${s.step}:${day}`]}
            onToggle={(done) => toggle(s.meal, s.step, day, done)}
          />
        ))}

        {routine.recommended_foods.length > 0 && (
          <Card>
            <T variant="heading" style={{ fontSize: 18 }}>
              Alimentos recomendados
            </T>
            <Bullets
              items={routine.recommended_foods.map((f, i) => ({
                key: `r${i}`,
                strong: f.name,
                text: f.why,
              }))}
            />
          </Card>
        )}
        {routine.foods_to_moderate.length > 0 && (
          <Card tone="outline">
            <T variant="heading" style={{ fontSize: 18 }}>
              Alimentos para moderar
            </T>
            <Bullets
              dot={colors.inkFaint}
              items={routine.foods_to_moderate.map((f, i) => ({
                key: `m${i}`,
                strong: f.name,
                text: f.reason,
              }))}
            />
          </Card>
        )}
        {routine.adaptation_tips.length > 0 && (
          <Card tone="paper">
            <T variant="heading" style={{ fontSize: 18 }}>
              Dicas importantes
            </T>
            <Bullets
              dot={colors.inkFaint}
              items={routine.adaptation_tips.map((t, i) => ({ key: `t${i}`, text: t }))}
            />
          </Card>
        )}
      </Stack>
      <Disclaimer />
    </Screen>
  );
}
