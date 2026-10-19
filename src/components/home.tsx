import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Camera, Clock, Flame, Lock, Zap } from "lucide-react-native";
import { Button, Card, IconCircle, T, Tag } from "@/components/ui";
import { Ring } from "@/components/Ring";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { GOAL_LABELS } from "@/lib/copy";
import { nowMs } from "@/lib/dayKey";
import { colors, fonts, radius, shadow } from "@/theme/tokens";

function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function Hero({
  name,
  streak,
  goal,
  levelLabel,
}: {
  name: string | null;
  streak: number;
  goal: string | null;
  levelLabel: string;
}) {
  const goalLabel = goal ? (GOAL_LABELS[goal] ?? goal) : null;
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <T variant="eyebrow" style={{ color: colors.inkSoft }}>
            {greetingFor(new Date().getHours())}
          </T>
          <T
            variant="display"
            numberOfLines={1}
            accessibilityRole="header"
            style={{ marginTop: 4 }}
          >
            {name ? titleCase(name) : "por aqui"}
          </T>
        </View>
        <View
          style={styles.streak}
          accessible
          accessibilityLabel={`${streak} ${streak === 1 ? "dia seguido" : "dias seguidos"}`}
        >
          <IconCircle icon={Flame} size={36} />
          <View>
            <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 26 }}>{streak}</T>
            <T variant="caption" style={{ color: colors.inkSoft, fontSize: 11 }}>
              {streak === 1 ? "dia seguido" : "dias seguidos"}
            </T>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {goalLabel ? <Tag label={goalLabel} /> : null}
        <Tag label={`Nível ${levelLabel}`} />
      </View>
    </View>
  );
}

/** Aviso do teste grátis / convite para assinar (TrialBanner do web). */
export function TrialBanner() {
  const { subscription, loading, isActive } = useSubscription();
  if (loading) return null;

  if (!isActive) {
    const wasTrial = !subscription || subscription.source === "trial";
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/assinar")}
        style={[
          styles.banner,
          { borderColor: "rgba(179,97,122,0.4)", backgroundColor: colors.roseSoft },
        ]}
      >
        <Lock size={16} color={colors.roseInk} />
        <T variant="label" style={{ flex: 1, color: colors.roseInk, fontSize: 13.5 }}>
          {wasTrial
            ? "Seu teste grátis terminou. Assine para continuar com seu plano, check-ins e desafios."
            : "Sua assinatura está inativa. Reative para continuar com seu plano, check-ins e desafios."}
        </T>
        <ArrowRight size={16} color={colors.roseInk} />
      </Pressable>
    );
  }

  if (!subscription || subscription.source !== "trial" || !subscription.current_period_end)
    return null;
  const msLeft = new Date(subscription.current_period_end).getTime() - nowMs();
  if (msLeft <= 0) return null;
  const hoursLeft = Math.ceil(msLeft / 3_600_000);
  const label =
    hoursLeft > 24
      ? `Teste grátis: restam ${Math.ceil(hoursLeft / 24)} dias`
      : hoursLeft > 1
        ? `Teste grátis: restam ${hoursLeft} horas`
        : "Teste grátis: termina em breve";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push("/assinar")}
      style={[
        styles.banner,
        { borderColor: "rgba(179,97,122,0.25)", backgroundColor: "rgba(243,228,232,0.7)" },
      ]}
    >
      <Clock size={16} color={colors.roseInk} />
      <T variant="label" style={{ flex: 1, color: colors.roseInk, fontSize: 13.5 }}>
        {label}
      </T>
      <T variant="label" style={{ color: colors.roseInk, fontSize: 13 }}>
        Ver plano
      </T>
    </Pressable>
  );
}

export function RitualCard({
  doneCount,
  totalCount,
  statusText,
}: {
  doneCount: number;
  totalCount: number;
  statusText: string;
}) {
  const complete = totalCount > 0 && doneCount >= totalCount;
  const cta =
    totalCount === 0
      ? "Montar meu plano"
      : complete
        ? "Ver o dia"
        : doneCount > 0
          ? "Continuar ritual"
          : "Começar ritual";
  return (
    <Card
      tone="paper"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        padding: 18,
        borderRadius: radius.xl,
      }}
    >
      <Ring
        size={96}
        stroke={7}
        pct={totalCount > 0 ? doneCount / totalCount : 0}
        label={`${doneCount} de ${totalCount} refeições feitas`}
      >
        <T style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 26 }}>
          {doneCount}/{totalCount}
        </T>
        <T variant="eyebrow" style={{ fontSize: 9.5, color: colors.inkSoft }}>
          feitas
        </T>
      </Ring>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T variant="eyebrow" style={{ color: colors.roseInk }}>
          Ritual de hoje
        </T>
        <T variant="body" style={{ marginTop: 6, fontSize: 14.5 }}>
          {statusText}
        </T>
        <Button
          size="sm"
          title={cta}
          iconRight={ArrowRight}
          style={{ alignSelf: "flex-start", marginTop: 12 }}
          onPress={() => router.push(totalCount === 0 ? "/onboarding" : "/today")}
        />
      </View>
    </Card>
  );
}

export function StatLine({
  weekXp,
  caloriesToday,
  calorieTarget,
  selfieCount,
  showSelfies,
}: {
  weekXp: number;
  caloriesToday?: number;
  calorieTarget?: number | null;
  selfieCount: number;
  showSelfies: boolean;
}) {
  const stats: {
    key: string;
    value: string;
    label: string;
    hint?: string;
    icon: typeof Zap;
    onPress?: () => void;
  }[] = [
    {
      key: "xp",
      value: String(weekXp),
      label: "XP na semana",
      icon: Zap,
      onPress: () => router.push("/challenges"),
    },
  ];
  if (caloriesToday != null) {
    stats.push({
      key: "kcal",
      value: caloriesToday.toLocaleString("pt-BR"),
      label: "kcal hoje",
      hint: calorieTarget ? `meta ${calorieTarget.toLocaleString("pt-BR")}` : undefined,
      icon: Flame,
      onPress: () => router.push("/today"),
    });
  }
  if (showSelfies) {
    stats.push({
      key: "photos",
      value: String(selfieCount),
      label: "fotos",
      icon: Camera,
      onPress: () => router.push("/journal"),
    });
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {stats.map((s) => (
        <Pressable
          key={s.key}
          accessibilityRole="button"
          accessibilityLabel={`${s.value} ${s.label}${s.hint ? `, ${s.hint}` : ""}`}
          onPress={s.onPress}
          style={({ pressed }) => [styles.stat, pressed && { opacity: 0.85 }]}
        >
          <IconCircle icon={s.icon} size={36} />
          <T style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 32, marginTop: 12 }}>
            {s.value}
          </T>
          <T variant="caption" style={{ color: colors.inkSoft, fontSize: 12, marginTop: 4 }}>
            {s.label}
            {s.hint ? ` · ${s.hint}` : ""}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.paper2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadow.soft,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  stat: {
    flexGrow: 1,
    flexBasis: "40%",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.paper2,
    padding: 16,
    ...shadow.soft,
  },
});
