import { API_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/supabase";
import type { MealLogRow } from "@/lib/data";

/**
 * Cliente das rotas HTTP do backend (nutri-app).
 *  - /api/mobile/<ação>       → autenticadas (Bearer do Supabase)
 *  - /api/public/auth/...     → login / cadastro (sem sessão)
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 60_000;

async function request<T>(
  path: string,
  body: unknown,
  token?: string,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new ApiError(
      aborted ? "A resposta demorou demais. Tente de novo." : "Sem conexão com o servidor.",
      0,
      aborted ? "TIMEOUT" : "NETWORK",
    );
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const code = typeof data.error === "string" ? data.error : undefined;
    throw new ApiError(friendlyError(code, res.status), res.status, code);
  }
  return data as T;
}

function mobile<T>(action: string, body: Record<string, unknown> = {}, timeoutMs?: number) {
  return getAccessToken().then((token) =>
    request<T>(`/api/mobile/${action}`, body, token, timeoutMs),
  );
}

export function friendlyError(code: string | undefined, status?: number): string {
  switch (code) {
    case "RATE_LIMIT":
      return "Estamos com muitas requisições no momento. Tente em alguns instantes.";
    case "CREDITS_EXHAUSTED":
      return "Créditos da IA esgotados. Avise o suporte.";
    case "AI_UNAVAILABLE":
      return "Nossa IA está temporariamente indisponível. Tente novamente em alguns minutos.";
    case "UNAUTHENTICATED":
      return "Sua sessão expirou. Entre novamente.";
    case "SUBSCRIPTION_REQUIRED":
      return "Esse recurso faz parte do plano completo.";
    case "INVALID_INPUT":
      return "Confira os dados e tente de novo.";
    default:
      if (code && !/^[A-Z_]+$/.test(code)) return code; // mensagem amigável vinda do servidor
      if (status === 429) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
      return "Não foi possível concluir agora. Tente novamente.";
  }
}

type Fail = { ok: false; error: string; availableAt?: string };

export type GeneratePlanResult =
  | {
      ok: true;
      routineId: string;
      version: number;
      attemptNumber: number;
      attemptsRemaining: number;
      isConfirmed: boolean;
    }
  | Fail;

export const api = {
  // ---- Login (público) ----
  checkLogin: (email: string) =>
    request<{ status?: string; linkSent?: boolean; error?: string }>(
      "/api/public/auth/check-login",
      {
        email,
        client: "app",
        noTrack: true,
      },
    ),
  redeemReferralPublic: (email: string, code: string) =>
    request<{ status?: string; error?: string }>("/api/public/auth/redeem-referral", {
      email,
      code,
      client: "app",
    }),
  reviewLogin: (email: string, code: string) =>
    request<{ tokenHash: string }>("/api/public/auth/review-login", { email, code }),

  // ---- Plano (IA) ----
  generatePlan: (profileId: string) =>
    mobile<GeneratePlanResult>("generate-plan", { profileId }, 150_000),
  checkLatestPlan: (profileId: string) =>
    mobile<{ ok: true; routine: { id: string; version: number; createdAt: string } | null } | Fail>(
      "check-latest-plan",
      { profileId },
    ),
  confirmPlan: (profileId: string, routineId: string) =>
    mobile<{ ok: true; confirmedAt: string } | Fail>("confirm-plan", { profileId, routineId }),
  reportWait: (profileId: string, routineId: string, waitMs: number) =>
    mobile<{ ok: boolean }>("report-wait", { profileId, routineId, waitMs }),

  // ---- Refeições (IA) ----
  mealFromPhoto: (p: { profileId: string; day: string; mealType: string; imageDataUrl: string }) =>
    mobile<{ ok: true; log: MealLogRow } | Fail>("meal-photo", p, 90_000),
  mealFromText: (p: { profileId: string; day: string; mealType: string; description: string }) =>
    mobile<{ ok: true; log: MealLogRow } | Fail>("meal-text", p, 90_000),

  // ---- Indicação ----
  referralInfo: () =>
    mobile<
      | { ok: true; referralCode: string; alreadyRedeemed: boolean; successfulReferrals: number }
      | Fail
    >("referral-info"),
  redeemReferral: (code: string) =>
    mobile<{ ok: true; referredDaysGranted: number } | Fail>("referral-redeem", { code }),

  // ---- Diversos ----
  testNotification: () =>
    mobile<
      | {
          ok: true;
          emailEnabled: boolean;
          pushEnabled: boolean;
          emailSent: boolean;
          pushAttempted: boolean;
          pushSent: boolean;
        }
      | Fail
    >("test-notification"),
  revenueCatSync: () =>
    mobile<{ ok: true; status: string | null; periodEnd: string | null }>("revenuecat-sync"),
  deleteAccount: () => mobile<{ ok: true } | Fail>("delete-account", { confirm: "EXCLUIR" }),
};
