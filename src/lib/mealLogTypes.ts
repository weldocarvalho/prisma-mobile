export type MealType = "cafe_da_manha" | "almoco" | "lanche" | "jantar" | "outro";
export type LoggedVia = "manual" | "foto_ia" | "busca";
export type AiConfidence = "alta" | "media" | "baixa";

export type MealLog = {
  id: string;
  profileId: string;
  day: string;
  mealType: MealType;
  description: string | null;
  loggedVia: LoggedVia;
  estimatedCalories: number | null;
  estimatedProteinG: number | null;
  estimatedCarbsG: number | null;
  estimatedFatG: number | null;
  aiConfidence: AiConfidence | null;
  createdAt: string;
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe_da_manha: "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  outro: "Outro",
};
