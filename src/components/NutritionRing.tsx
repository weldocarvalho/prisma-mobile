import { View } from "react-native";
import { Card, ProgressBar, T } from "@/components/ui";
import { Ring } from "@/components/Ring";
import { colors, fonts } from "@/theme/tokens";

function MacroBar({
  label,
  consumed,
  target,
}: {
  label: string;
  consumed: number;
  target: number | null;
}) {
  const pct = target && target > 0 ? Math.min(1, consumed / target) * 100 : 0;
  return (
    <View style={{ flex: 1 }}>
      <T variant="eyebrow" style={{ fontSize: 10, letterSpacing: 0.8 }}>
        {label}
      </T>
      <T variant="caption" style={{ color: colors.inkSoft, marginTop: 2 }}>
        {Math.round(consumed)}
        {target ? `/${Math.round(target)}g` : "g"}
      </T>
      <View style={{ marginTop: 6 }}>
        <ProgressBar pct={pct} />
      </View>
    </View>
  );
}

/** Anel de calorias + barras de macros (DailyNutritionRing do web). */
export function NutritionRing({
  calories,
  calorieTarget,
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
}: {
  calories: number;
  calorieTarget: number | null;
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;
}) {
  const pct = calorieTarget && calorieTarget > 0 ? calories / calorieTarget : 0;
  const remaining =
    calorieTarget != null ? Math.max(0, Math.round(calorieTarget - calories)) : null;
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Ring
          size={96}
          stroke={6}
          pct={pct}
          track={colors.line}
          label={`${Math.round(calories)} quilocalorias hoje`}
        >
          <T style={{ fontFamily: fonts.display, fontSize: 21, lineHeight: 22 }}>
            {Math.round(calories)}
          </T>
          <T variant="eyebrow" style={{ fontSize: 8.5 }}>
            kcal hoje
          </T>
        </Ring>
        <View style={{ flex: 1 }}>
          <T variant="eyebrow" style={{ color: colors.roseInk, fontSize: 10 }}>
            Calorias de hoje
          </T>
          <T variant="bodySmall" style={{ marginTop: 4 }}>
            {calorieTarget
              ? `${remaining} kcal restantes de ${Math.round(calorieTarget)} kcal.`
              : "Complete o questionário do plano para ver sua meta calórica do dia."}
          </T>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
        <MacroBar label="Proteína" consumed={protein} target={proteinTarget} />
        <MacroBar label="Carbo" consumed={carbs} target={carbsTarget} />
        <MacroBar label="Gordura" consumed={fat} target={fatTarget} />
      </View>
    </Card>
  );
}
