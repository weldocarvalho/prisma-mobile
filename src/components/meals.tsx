import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Camera,
  Check,
  ChevronDown,
  Coffee,
  Cookie,
  Moon,
  PenLine,
  Trash2,
  Type,
  Utensils,
  UtensilsCrossed,
} from "lucide-react-native";
import type { MealSlot } from "@/lib/routineTypes";
import type { MealLog, MealType } from "@/lib/mealLogTypes";
import { MEAL_TYPE_LABELS } from "@/lib/mealLogTypes";
import { Card, IconCircle, T } from "@/components/ui";
import { colors, fonts, radius } from "@/theme/tokens";
import { feedback } from "@/lib/haptics";

export const MEAL_ICONS: Record<MealType, typeof Coffee> = {
  cafe_da_manha: Coffee,
  almoco: Utensils,
  lanche: Cookie,
  jantar: Moon,
  outro: UtensilsCrossed,
};

const MEAL_LABELS: Record<MealSlot["meal"], string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
};

function CheckCircle({ done, size = 28 }: { done: boolean; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: done ? 0 : 2,
        borderColor: colors.line,
        backgroundColor: done ? colors.rose : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {done && <Check size={size * 0.55} color={colors.white} strokeWidth={3} />}
    </View>
  );
}

/** Lista compacta da Home (FioRoutineList). */
export function RoutineList({
  steps,
  doneSteps,
  onToggle,
}: {
  steps: MealSlot[];
  doneSteps: Set<number>;
  onToggle: (step: MealSlot, done: boolean) => void;
}) {
  if (steps.length === 0) return null;
  return (
    <Card tone="paper" style={{ padding: 6 }}>
      <T
        variant="eyebrow"
        style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, color: colors.inkSoft }}
      >
        Refeições de hoje
      </T>
      {steps.map((step) => {
        const done = doneSteps.has(step.step);
        const Icon = MEAL_ICONS[step.meal] ?? Utensils;
        const subtitle = step.foods && step.foods.length > 0 ? step.foods.join(" · ") : undefined;
        return (
          <Pressable
            key={step.step}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={`${done ? "Desmarcar" : "Marcar"} ${step.title}`}
            onPress={() => {
              feedback(done ? "tap" : "check");
              onToggle(step, !done);
            }}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.paper }]}
          >
            <IconCircle icon={Icon} size={44} tone={done ? "muted" : "rose"} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T
                variant="heading"
                numberOfLines={2}
                style={[
                  { fontSize: 19, lineHeight: 22 },
                  done && { color: colors.inkSoft, textDecorationLine: "line-through" },
                ]}
              >
                {step.title}
              </T>
              {subtitle ? (
                <T variant="bodySmall" numberOfLines={1} style={{ marginTop: 2 }}>
                  {subtitle}
                </T>
              ) : null}
            </View>
            <CheckCircle done={done} />
          </Pressable>
        );
      })}
    </Card>
  );
}

/** Cartão completo de refeição do plano (StepCard do web). */
export function StepCard({
  step,
  done,
  onToggle,
  compact,
}: {
  step: MealSlot;
  done: boolean;
  onToggle: (done: boolean) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = MEAL_ICONS[step.meal] ?? Utensils;
  const toggle = () => {
    feedback(done ? "tap" : "check");
    onToggle(!done);
  };

  if (compact) {
    return (
      <Card style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <IconCircle icon={Icon} size={32} />
          <View style={{ flex: 1 }}>
            <T variant="label" numberOfLines={2} style={{ fontSize: 13.5 }}>
              {step.title}
            </T>
            {step.foods?.length ? (
              <T variant="caption" numberOfLines={1}>
                {step.foods.join(", ")}
              </T>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={`Concluído: ${step.title}`}
            hitSlop={10}
            onPress={toggle}
          >
            <CheckCircle done={done} size={26} />
          </Pressable>
        </View>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={styles.howToggle}
          hitSlop={6}
          accessibilityRole="button"
        >
          <T variant="label" style={{ fontSize: 12, color: colors.roseInk }}>
            Como fazer
          </T>
          <ChevronDown
            size={12}
            color={colors.roseInk}
            style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
          />
        </Pressable>
        {open && (
          <View style={styles.howBody}>
            <T variant="bodySmall" style={{ color: colors.ink }}>
              {step.how_to}
            </T>
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <IconCircle icon={Icon} size={38} />
        <View style={{ flex: 1 }}>
          <T variant="eyebrow" style={{ fontSize: 10 }}>
            {MEAL_LABELS[step.meal] ?? step.meal}
          </T>
          <T variant="label" style={{ fontSize: 15.5, marginTop: 2 }}>
            {step.title}
          </T>
          {typeof step.calories_estimate === "number" && (
            <T variant="caption" style={{ marginTop: 2 }}>
              ~{step.calories_estimate} kcal
            </T>
          )}
        </View>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Concluído hoje: ${step.title}`}
          hitSlop={10}
          onPress={toggle}
        >
          <CheckCircle done={done} />
        </Pressable>
      </View>
      <View style={styles.details}>
        {step.foods && step.foods.length > 0 && (
          <View>
            <T variant="eyebrow" style={{ fontSize: 9.5 }}>
              Alimentos sugeridos
            </T>
            <T variant="bodySmall" style={{ color: colors.ink, marginTop: 2 }}>
              {step.foods.join(", ")}
            </T>
          </View>
        )}
        <View>
          <T variant="eyebrow" style={{ fontSize: 9.5 }}>
            Como fazer
          </T>
          <T variant="bodySmall" style={{ color: colors.ink, marginTop: 2 }}>
            {step.how_to}
          </T>
        </View>
        <View>
          <T variant="eyebrow" style={{ fontSize: 9.5 }}>
            Por que isso importa
          </T>
          <T variant="bodySmall" style={{ marginTop: 2 }}>
            {step.why}
          </T>
        </View>
      </View>
    </Card>
  );
}

const VIA_ICONS: Record<MealLog["loggedVia"], typeof Camera> = {
  foto_ia: Camera,
  busca: Type,
  manual: PenLine,
};

/** Refeições registradas no dia (MealLogList do web) — exclusão em dois toques. */
export function MealLogList({
  logs,
  onDelete,
}: {
  logs: MealLog[];
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <Card style={{ alignItems: "center", paddingVertical: 22 }}>
        <T variant="caption">Nenhuma refeição registrada hoje ainda.</T>
      </Card>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {logs.map((log) => {
        const Icon = MEAL_ICONS[log.mealType] ?? UtensilsCrossed;
        const ViaIcon = VIA_ICONS[log.loggedVia] ?? PenLine;
        const confirming = confirmId === log.id;
        return (
          <Card
            key={log.id}
            style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }}
          >
            <IconCircle icon={Icon} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T variant="label" numberOfLines={1} style={{ fontSize: 13.5 }}>
                {log.description || MEAL_TYPE_LABELS[log.mealType]}
              </T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ViaIcon size={10} color={colors.inkFaint} />
                <T variant="caption" style={{ fontSize: 11 }}>
                  {MEAL_TYPE_LABELS[log.mealType]}
                  {log.aiConfidence === "baixa" ? " · estimativa aproximada" : ""}
                </T>
              </View>
            </View>
            {confirming ? (
              <View style={{ flexDirection: "row", gap: 6 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setConfirmId(null);
                    feedback("success");
                    onDelete(log.id);
                  }}
                  style={[styles.smallPill, { backgroundColor: colors.rose }]}
                >
                  <T variant="label" style={{ color: colors.white, fontSize: 12 }}>
                    Excluir
                  </T>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setConfirmId(null)}
                  style={[styles.smallPill, { backgroundColor: colors.lineSoft }]}
                >
                  <T variant="label" style={{ fontSize: 12 }}>
                    Não
                  </T>
                </Pressable>
              </View>
            ) : (
              <>
                {log.estimatedCalories != null && (
                  <T style={{ fontFamily: fonts.display, fontSize: 16 }}>
                    {log.estimatedCalories} kcal
                  </T>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Excluir refeição"
                  hitSlop={10}
                  onPress={() => {
                    setConfirmId(log.id);
                    setTimeout(() => setConfirmId((c) => (c === log.id ? null : c)), 5000);
                  }}
                  style={{ padding: 4 }}
                >
                  <Trash2 size={16} color={colors.inkFaint} />
                </Pressable>
              </>
            )}
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  howToggle: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 42, marginTop: 8 },
  howBody: {
    marginLeft: 42,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  smallPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
