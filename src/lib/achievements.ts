export type AchievementKey =
  | "streak7"
  | "streak30"
  | "checkins10"
  | "checkins50"
  | "firstSelfie"
  | "selfies10"
  | "selfieCompare"
  | "firstRoutine"
  | "levelConsistente"
  | "levelMestre";

export type AchievementDef = {
  key: AchievementKey;
  label: string;
  achieved: boolean;
};

export type AchievementInputs = {
  bestStreak: number;
  checkInsCount: number;
  selfieCount: number;
  selfieSpanDays: number;
  hasRoutine: boolean;
  levelIndex: number;
};

export function computeAchievements({
  bestStreak,
  checkInsCount,
  selfieCount,
  selfieSpanDays,
  hasRoutine,
  levelIndex,
}: AchievementInputs): AchievementDef[] {
  return [
    { key: "streak7", label: "7 dias seguidos", achieved: bestStreak >= 7 },
    { key: "streak30", label: "30 dias seguidos", achieved: bestStreak >= 30 },
    { key: "checkins10", label: "10 check-ins registrados", achieved: checkInsCount >= 10 },
    { key: "checkins50", label: "50 check-ins registrados", achieved: checkInsCount >= 50 },
    { key: "firstSelfie", label: "Primeira foto no diário", achieved: selfieCount >= 1 },
    { key: "selfies10", label: "10 fotos no diário", achieved: selfieCount >= 10 },
    {
      key: "selfieCompare",
      label: "30 dias de fotos pra comparar",
      achieved: selfieSpanDays >= 30,
    },
    {
      key: "firstRoutine",
      label: "Você acabou de gerar a sua primeira rotina",
      achieved: hasRoutine,
    },
    { key: "levelConsistente", label: "Nível Consistente alcançado", achieved: levelIndex >= 1 },
    { key: "levelMestre", label: "Nível Mestre da Nutrição alcançado", achieved: levelIndex >= 3 },
  ];
}

export function computeStreakMilestones(bestStreak: number): { id: string; label: string }[] {
  return [7, 14, 30]
    .filter((n) => bestStreak >= n)
    .map((n) => ({ id: `streak${n}`, label: `Sequência de ${n} dias` }));
}
