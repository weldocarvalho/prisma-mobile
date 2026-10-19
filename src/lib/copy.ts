import { BRAND_NAME } from "@/lib/config";

/** Textos compartilhados com o web (mesma redação, exigência regulatória). */
export const DISCLAIMER =
  "Este app oferece sugestões gerais de alimentação geradas por IA — não é orientação de nutricionista, não prescreve dieta nem faz diagnóstico nutricional, e não substitui o acompanhamento de um nutricionista registrado (Lei 8.234/1991). Se você tem uma condição de saúde específica, está grávida/amamentando ou tem restrições alimentares importantes, procure orientação profissional.";

export const TAGLINE = "Acompanhe sua rotina alimentar de forma simples e prática";

export const GOAL_LABELS: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  manutencao: "Manutenção do peso",
  ganho_de_massa: "Ganho de massa",
};

export const LABELS: Record<string, Record<string, string>> = {
  goal: GOAL_LABELS,
  activity_level: {
    sedentario: "Sedentário",
    leve: "Leve",
    moderado: "Moderado",
    intenso: "Intenso",
  },
  biological_sex: {
    masculino: "Masculino",
    feminino: "Feminino",
    outro: "Outro",
    prefiro_nao_informar: "Prefiro não informar",
  },
  experience_level: { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" },
  budget_level: { low: "Econômico", medium: "Médio", high: "Premium" },
  time_availability: { short: "Rápido", medium: "Médio", long: "Completo" },
  dietary_style: {
    onivoro: "Onívoro",
    vegetariano: "Vegetariano",
    vegano: "Vegano",
    low_carb: "Low carb",
    flexitariano: "Flexitariano",
  },
};

export function label(field: string, value: string | null | undefined): string | null {
  if (!value) return null;
  return LABELS[field]?.[value] ?? capitalize(value);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

export function shareText(): string {
  return `Estou usando o ${BRAND_NAME} para acompanhar minha alimentação.`;
}
