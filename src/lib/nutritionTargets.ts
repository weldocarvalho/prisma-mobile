/**
 * Metas diárias estimadas a partir das respostas do onboarding.
 * Fórmula de Mifflin-St Jeor + fator de atividade. São referências gerais (não prescrição).
 */
export type TargetsInput = {
  goal: string | null | undefined;
  biological_sex: string | null | undefined;
  birth_date: string | null | undefined;
  height_cm: number | null | undefined;
  current_weight_kg: number | null | undefined;
  activity_level: string | null | undefined;
  pregnancy_or_breastfeeding?: boolean | null;
};

export type DailyTargets = {
  daily_calorie_target: number;
  daily_protein_target_g: number;
  daily_carbs_target_g: number;
  daily_fat_target_g: number;
  daily_water_target_liters: number;
};

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
};

function ageFrom(birthDate: string, now: Date): number | null {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

export function computeDailyTargets(input: TargetsInput, now = new Date()): DailyTargets | null {
  const { height_cm: h, current_weight_kg: w, birth_date } = input;
  if (!h || !w || !birth_date) return null;
  const age = ageFrom(birth_date, now);
  if (age === null || age < 14 || age > 100) return null;
  if (h < 100 || h > 250 || w < 30 || w > 300) return null;

  const sexOffset =
    input.biological_sex === "masculino" ? 5 : input.biological_sex === "feminino" ? -161 : -78;
  const bmr = 10 * w + 6.25 * h - 5 * age + sexOffset;
  const tdee = bmr * (ACTIVITY_FACTOR[input.activity_level ?? ""] ?? 1.375);

  // Gestante/lactante: sem déficit calórico.
  const pregnant = !!input.pregnancy_or_breastfeeding;
  const goalFactor = pregnant
    ? 1
    : input.goal === "emagrecimento"
      ? 0.8
      : input.goal === "ganho_de_massa"
        ? 1.1
        : 1;
  const floor = input.biological_sex === "masculino" ? 1500 : 1200;
  const kcal = Math.round(Math.max(tdee * goalFactor, floor) / 10) * 10;

  const proteinPerKg =
    input.goal === "emagrecimento" ? 1.6 : input.goal === "ganho_de_massa" ? 1.8 : 1.2;
  const protein = Math.round(w * proteinPerKg);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.min(4, Math.max(1.5, Math.round(((w * 35) / 1000) * 10) / 10));

  return {
    daily_calorie_target: kcal,
    daily_protein_target_g: protein,
    daily_carbs_target_g: carbs,
    daily_fat_target_g: fat,
    daily_water_target_liters: water,
  };
}
