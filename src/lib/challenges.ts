import { addDays, computeDayStat, startOfWeek, type Checks, type DayStat } from "@/lib/streak";

export type WeeklyCheckInLike = {
  day: string;
  sleep_hours: number;
};

export type ChallengeProgress = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  unit: string;
  completed: boolean;
};

type EvalContext = {
  stats: DayStat[];
  weekCheckIns: WeeklyCheckInLike[];
  totalPerDay: number;
};

type ChallengeTemplate = {
  id: string;
  title: string;
  description: string;
  target: number;
  unit: string;
  evaluate: (ctx: EvalContext) => number;
};

const CHALLENGE_LIBRARY: ChallengeTemplate[] = [
  {
    id: "week_checkin",
    title: "Check-in todo dia",
    description: "Registre seu check-in diário nos 7 dias desta semana.",
    target: 7,
    unit: "dias",
    evaluate: ({ weekCheckIns }) => new Set(weekCheckIns.map((c) => c.day)).size,
  },
  {
    id: "perfect_days_3",
    title: "Rotina completa 3x",
    description: "Marque todas as refeições do plano em 3 dias desta semana.",
    target: 3,
    unit: "dias",
    evaluate: ({ stats }) => stats.filter((s) => s.ratio >= 1).length,
  },
  {
    id: "sleep_ok",
    title: "Sono em dia",
    description: "Durma 7h ou mais em pelo menos 5 dias desta semana.",
    target: 5,
    unit: "dias",
    evaluate: ({ weekCheckIns }) => weekCheckIns.filter((c) => c.sleep_hours >= 7).length,
  },
  {
    id: "perfect_days_5",
    title: "Rotina completa 5x",
    description: "Marque todas as refeições do plano em 5 dias desta semana.",
    target: 5,
    unit: "dias",
    evaluate: ({ stats }) => stats.filter((s) => s.ratio >= 1).length,
  },
  {
    id: "consistency_80",
    title: "Constância de 80%+",
    description: "Mantenha 80% ou mais das refeições do plano marcadas nesta semana.",
    target: 80,
    unit: "%",
    evaluate: ({ stats, totalPerDay }) => {
      const totalDone = stats.reduce((sum, d) => sum + d.done, 0);
      const totalPossible = totalPerDay * stats.length;
      return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
    },
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const EPOCH_WEEK_START = startOfWeek(new Date(Date.UTC(2024, 0, 1)));

function weekIndexFor(weekStart: Date): number {
  return Math.round((weekStart.getTime() - EPOCH_WEEK_START.getTime()) / WEEK_MS);
}

function challengeForWeek(weekStart: Date): ChallengeTemplate {
  const idx = weekIndexFor(weekStart) % CHALLENGE_LIBRARY.length;
  const safeIdx =
    ((idx % CHALLENGE_LIBRARY.length) + CHALLENGE_LIBRARY.length) % CHALLENGE_LIBRARY.length;
  return CHALLENGE_LIBRARY[safeIdx];
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function evalTemplate(
  template: ChallengeTemplate,
  weekStart: Date,
  today: Date,
  {
    checks,
    totalPerDay,
    checkIns,
  }: { checks: Checks; totalPerDay: number; checkIns: WeeklyCheckInLike[] },
): ChallengeProgress {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (d) => d.getTime() <= today.getTime(),
  );
  const stats = days.map((d) => computeDayStat(checks, d, totalPerDay));
  const weekEndKey = dayKey(addDays(weekStart, 6));
  const startKey = dayKey(weekStart);
  const weekCheckIns = checkIns.filter((c) => c.day >= startKey && c.day <= weekEndKey);

  const raw = template.evaluate({ stats, weekCheckIns, totalPerDay });
  const progress = Math.min(raw, template.target);
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    progress,
    target: template.target,
    unit: template.unit,
    completed: raw >= template.target,
  };
}

export function getCurrentWeeklyChallenge({
  checks,
  totalPerDay,
  weekCheckIns,
}: {
  checks: Checks;
  totalPerDay: number;
  weekCheckIns: WeeklyCheckInLike[];
}): ChallengeProgress {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = startOfWeek(today);
  const template = challengeForWeek(weekStart);
  return evalTemplate(template, weekStart, today, { checks, totalPerDay, checkIns: weekCheckIns });
}

export type AchievedChallenge = { key: string; label: string };

export function getAchievedChallengeHistory({
  checks,
  totalPerDay,
  checkInHistory,
  weeksBack = 8,
}: {
  checks: Checks;
  totalPerDay: number;
  checkInHistory: WeeklyCheckInLike[];
  weeksBack?: number;
}): AchievedChallenge[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentWeekStart = startOfWeek(today);

  const achieved: AchievedChallenge[] = [];
  for (let i = 1; i <= weeksBack; i++) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const template = challengeForWeek(weekStart);
    const weekEnd = addDays(weekStart, 6);
    const result = evalTemplate(template, weekStart, weekEnd, {
      checks,
      totalPerDay,
      checkIns: checkInHistory,
    });
    if (result.completed) {
      achieved.push({ key: `${dayKey(weekStart)}:${template.id}`, label: template.title });
    }
  }
  return achieved;
}
