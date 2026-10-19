export const MAX_ATTEMPTS_PER_CYCLE = 3;
export const ROUTINE_COOLDOWN_DAYS = 30;
const COOLDOWN_MS = ROUTINE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type AttemptState = {
  blocked: boolean;
  availableAt: Date | null;
  attemptCountForCycle: number;
};

export function computeAttemptState(
  routineAttemptCount: number | null | undefined,
  routineConfirmedAt: string | null | undefined,
): AttemptState {
  const confirmedAt = routineConfirmedAt ? new Date(routineConfirmedAt) : null;

  if (confirmedAt) {
    const availableAt = new Date(confirmedAt.getTime() + COOLDOWN_MS);
    if (Date.now() < availableAt.getTime()) {
      return { blocked: true, availableAt, attemptCountForCycle: routineAttemptCount ?? 0 };
    }
    return { blocked: false, availableAt: null, attemptCountForCycle: 0 };
  }

  return { blocked: false, availableAt: null, attemptCountForCycle: routineAttemptCount ?? 0 };
}

export function formatDaysUntil(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  if (days <= 0) return "hoje";
  if (days === 1) return "em 1 dia";
  return `em ${days} dias`;
}

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
