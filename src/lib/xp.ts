import { localToday } from "./dayKey";
import type { Checks } from "@/lib/streak";
import { FEATURES } from "@/lib/config";

export const XP_SELFIE = 5;
export const XP_CLEANSING_STEP = 5;
export const XP_CHECKIN_COMPLETE = 10;
export const XP_CHECKOUT_COMPLETE = 10;
export const XP_PERFECT_DAY = 12;

export const XP_WEEKLY_TARGET = 80;

export type StreakMilestone = { days: number; bonus: number };

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, bonus: 30 },
  { days: 14, bonus: 40 },
  { days: 30, bonus: 60 },
  { days: 60, bonus: 80 },
];

export function streakBonusFor(bestStreak: number): number {
  return STREAK_MILESTONES.reduce((sum, m) => sum + (bestStreak >= m.days ? m.bonus : 0), 0);
}

export type XpInputs = {
  cleansingMorningDays: number;
  cleansingNightDays: number;
  checkinCompleteDays: number;
  checkoutCompleteDays: number;
  perfectDays: number;
  selfieCount: number;
  bestStreak: number;
};

export function computeXp({
  cleansingMorningDays,
  cleansingNightDays,
  checkinCompleteDays,
  checkoutCompleteDays,
  perfectDays,
  selfieCount,
  bestStreak,
}: XpInputs): number {
  return (
    cleansingMorningDays * XP_CLEANSING_STEP +
    cleansingNightDays * XP_CLEANSING_STEP +
    checkinCompleteDays * XP_CHECKIN_COMPLETE +
    checkoutCompleteDays * XP_CHECKOUT_COMPLETE +
    perfectDays * XP_PERFECT_DAY +
    selfieCount * XP_SELFIE +
    streakBonusFor(bestStreak)
  );
}

export type LevelKey = "iniciante" | "consistente" | "disciplinada" | "mestre";

export type LevelDef = {
  key: LevelKey;
  label: string;
  minXp: number;
};

export const LEVELS: LevelDef[] = [
  { key: "iniciante", label: "Iniciante", minXp: 0 },
  { key: "consistente", label: "Consistente", minXp: 120 },
  { key: "disciplinada", label: "Disciplinada", minXp: 350 },
  { key: "mestre", label: "Mestre da Nutrição", minXp: 800 },
];

export type LevelProgress = {
  xp: number;
  level: LevelDef;
  index: number;
  next: LevelDef | null;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPct: number;
};

export function levelForXp(xp: number): LevelProgress {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) index = i;
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const xpIntoLevel = xp - level.minXp;
  const xpForNextLevel = next ? next.minXp - level.minXp : null;
  const progressPct = next
    ? Math.max(0, Math.min(100, Math.round((xpIntoLevel / xpForNextLevel!) * 100)))
    : 100;

  return { xp, level, index, next, xpIntoLevel, xpForNextLevel, progressPct };
}

export type XpSeriesInput = {
  checks: Checks;
  totalPerDay: number;
  checkInDays: Set<string>;
  checkOutDays: Set<string>;
  selfiesByDay: Record<string, number>;
  /** Se a selfie faz parte do check-in da manhã. Padrão: segue a feature flag. */
  selfieRequired?: boolean;
};

export type XpDayPoint = {
  day: string;
  xp: number;
  cumulative: number;
};

function utcKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dateToUtcKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekKeyOf(day: string): string {
  const x = utcKeyToDate(day);
  x.setUTCDate(x.getUTCDate() - x.getUTCDay());
  return dateToUtcKey(x);
}

/** Marca de refeição do dia: chaves no formato `${refeição}:${passo}:${dia}`. */
function mealDoneOn(checks: Checks, meal: string, day: string): boolean {
  const prefix = `${meal}:`;
  const suffix = `:${day}`;
  for (const key of Object.keys(checks)) {
    if (checks[key] && key.startsWith(prefix) && key.endsWith(suffix)) return true;
  }
  return false;
}

function perDayDoneFromChecks(checks: Checks): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(checks)) {
    if (!checks[key]) continue;
    const parts = key.split(":");
    const day = parts[parts.length - 1];
    out[day] = (out[day] ?? 0) + 1;
  }
  return out;
}

export function computeXpSeries(input: XpSeriesInput): XpDayPoint[] {
  const { checks, totalPerDay, checkInDays, checkOutDays, selfiesByDay } = input;
  const selfieRequired = input.selfieRequired ?? FEATURES.selfieJournal;

  const perDayDone = perDayDoneFromChecks(checks);

  const allDays = new Set([
    ...Object.keys(perDayDone),
    ...checkInDays,
    ...checkOutDays,
    ...Object.keys(selfiesByDay),
  ]);
  if (allDays.size === 0) return [];

  const minKey = [...allDays].sort()[0];
  const end = localToday();

  const MIN_WINDOW_DAYS = 90;
  const minWindowStart = new Date(end);
  minWindowStart.setUTCDate(minWindowStart.getUTCDate() - (MIN_WINDOW_DAYS - 1));
  const firstActivity = utcKeyToDate(minKey);
  const start = firstActivity < minWindowStart ? firstActivity : minWindowStart;

  let cumulative = 0;
  let best = 0;
  let run = 0;
  const freezeWeeks = new Set<string>();
  const points: XpDayPoint[] = [];

  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    const day = dateToUtcKey(cur);

    // Âncoras do dia: café da manhã (check-in) e jantar (check-out).
    const morningCleanDone = mealDoneOn(checks, "cafe_da_manha", day);
    const nightCleanDone = mealDoneOn(checks, "jantar", day);
    const selfieN = selfiesByDay[day] ?? 0;
    const sleepDone = checkInDays.has(day);
    const waterDone = checkOutDays.has(day);

    let xp = 0;
    if (morningCleanDone) xp += XP_CLEANSING_STEP;
    if (nightCleanDone) xp += XP_CLEANSING_STEP;
    xp += selfieN * XP_SELFIE;
    if (morningCleanDone && (!selfieRequired || selfieN > 0) && sleepDone)
      xp += XP_CHECKIN_COMPLETE;
    if (nightCleanDone && waterDone) xp += XP_CHECKOUT_COMPLETE;

    const done = perDayDone[day] ?? 0;
    const perfect = totalPerDay > 0 && done >= totalPerDay;
    if (perfect) xp += XP_PERFECT_DAY;

    if (perfect) {
      run++;
    } else if (totalPerDay > 0) {
      const wk = weekKeyOf(day);
      if (!freezeWeeks.has(wk)) {
        freezeWeeks.add(wk);
      } else {
        run = 0;
      }
    } else {
      run = 0;
    }
    if (run > best) {
      best = run;
      const gained = streakBonusFor(best) - streakBonusFor(best - 1);
      if (gained > 0) xp += gained;
    }

    cumulative += xp;
    points.push({ day, xp, cumulative });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return points;
}
