export type MealSlot = {
  step: number;
  meal: "cafe_da_manha" | "almoco" | "lanche" | "jantar";
  title: string;
  foods?: string[];
  calories_estimate?: number;
  how_to: string;
  why: string;
};

export type RecommendedFood = { name: string; why: string };
export type FoodToModerate = { name: string; reason: string };

export type NutritionPlan = {
  summary: string | null;
  daily_meal_structure: MealSlot[];
  recommended_foods: RecommendedFood[];
  foods_to_moderate: FoodToModerate[];
  adaptation_tips: string[];
  weekly_plan?: Record<string, string[]> | null;
};

export type Routine = NutritionPlan;
export type RoutineStep = MealSlot;
export type RecommendedIngredient = RecommendedFood;
export type AvoidIngredient = FoodToModerate;

export type Profile = {
  id: string;
  name: string | null;
  goal: string;
  biological_sex: string | null;
  birth_date: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  activity_level: string | null;
  dietary_style: string | null;
  experience_level: string | null;
  pregnancy_or_breastfeeding: boolean;
  allergies: { category: string; value: string }[] | unknown;
  foods_to_avoid: string[];
  budget_level: string | null;
  time_availability: string | null;
  daily_calorie_target: number | null;
  daily_protein_target_g: number | null;
  daily_carbs_target_g: number | null;
  daily_fat_target_g: number | null;
  daily_water_target_liters: number | null;
};
