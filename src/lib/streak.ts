import { localToday } from "./dayKey";
export type Checks = Record<string, boolean>;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function perDayDoneFromChecks(checks: Checks): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(checks)) {
    if (!checks[key]) continue;
    const parts = key.split(":");
    const day = parts[parts.length - 1];
    out[day] = (out[day] ?? 0) + 1;
  }
  return out;
}

function utcKeyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dateToUtcKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeLifetimeStreakStats(
  checks: Checks,
  totalPerDay: number,
): { bestStreak: number; perfectDays: number } {
  const perDay = perDayDoneFromChecks(checks);
  const days = Object.keys(perDay);
  if (days.length === 0 || totalPerDay <= 0) {
    return { bestStreak: 0, perfectDays: 0 };
  }

  const start = utcKeyToDate(days.sort()[0]);
  const end = localToday();

  let best = 0;
  let perfectDays = 0;
  let run = 0;
  const freezeWeeks = new Set<string>();

  const cur = new Date(start);
  while (cur.getTime() <= end.getTime()) {
    const day = dateToUtcKey(cur);
    const done = perDay[day] ?? 0;
    const perfect = done >= totalPerDay;
    if (perfect) {
      perfectDays++;
      run++;
    } else {
      const x = new Date(cur);
      x.setUTCDate(x.getUTCDate() - x.getUTCDay());
      const wk = dateToUtcKey(x);
      if (!freezeWeeks.has(wk)) {
        freezeWeeks.add(wk);
      } else {
        run = 0;
      }
    }
    if (run > best) best = run;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return { bestStreak: best, perfectDays };
}

export function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

export type DayStat = {
  date: Date;
  key: string;
  done: number;
  total: number;
  ratio: number;
};

export function computeDayStat(checks: Checks, date: Date, totalPerDay: number): DayStat {
  const key = dayKey(date);
  let done = 0;
  for (const k of Object.keys(checks)) {
    if (!checks[k]) continue;
    const parts = k.split(":");
    if (parts[parts.length - 1] === key) done++;
  }
  const total = totalPerDay;
  return { date, key, done, total, ratio: total > 0 ? Math.min(1, done / total) : 0 };
}

export type StreakStats = {
  currentStreak: number;
  bestStreak: number;
  perfectDays: number;
  consistency: number;
  freezeUsedThisWeek: boolean;
  freezeAvailable: boolean;
};

export function computeStreakStats(checks: Checks, totalPerDay: number, span = 60): StreakStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dayKey(today);

  const days = Array.from({ length: span }, (_, i) =>
    computeDayStat(checks, addDays(today, -(span - 1 - i)), totalPerDay),
  );

  // Dias anteriores à primeira marcação não contam como falha (nem gastam o dia de proteção).
  const firstDay = Object.keys(checks)
    .filter((k) => checks[k])
    .map((k) => k.split(":").pop() as string)
    .sort()[0] as string | undefined;

  let best = 0;
  let run = 0;
  const bestFreezeWeeks = new Set<string>();
  for (const d of days) {
    if (!firstDay || d.key < firstDay) continue;
    if (d.ratio >= 1) {
      run++;
    } else if (totalPerDay > 0) {
      const wk = dayKey(startOfWeek(d.date));
      if (!bestFreezeWeeks.has(wk)) {
        bestFreezeWeeks.add(wk);
      } else {
        run = 0;
      }
    } else {
      run = 0;
    }
    if (run > best) best = run;
  }

  let cur = 0;
  const curFreezeWeeks = new Set<string>();
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.ratio >= 1) {
      cur++;
      continue;
    }
    if (d.key === todayKey) continue;
    if (totalPerDay === 0) break;
    if (!firstDay || d.key < firstDay) break;
    const wk = dayKey(startOfWeek(d.date));
    if (!curFreezeWeeks.has(wk)) {
      curFreezeWeeks.add(wk);
      continue;
    }
    break;
  }

  const last30 = days.slice(-30);
  const perfectDays = last30.filter((d) => d.ratio >= 1).length;
  const totalDone = last30.reduce((s, d) => s + d.done, 0);
  const activeDays = last30.filter((d) => !!firstDay && d.key >= firstDay);
  const totalPossible = totalPerDay * activeDays.length;
  const consistency = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  const thisWeekKey = dayKey(startOfWeek(today));
  const freezeUsedThisWeek = curFreezeWeeks.has(thisWeekKey);
  const freezeAvailable = totalPerDay > 0 && !freezeUsedThisWeek;

  return {
    currentStreak: cur,
    bestStreak: best,
    perfectDays,
    consistency,
    freezeUsedThisWeek,
    freezeAvailable,
  };
}
