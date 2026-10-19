/**
 * Configuração pública do app (EXPO_PUBLIC_*), lida em tempo de build.
 * Precisa ser acessada com o nome literal (process.env.EXPO_PUBLIC_X) para o
 * bundler do Expo substituir o valor.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    console.warn(`[config] ${name} não configurada — veja .env.example`);
    return "";
  }
  return value;
}

export const BRAND_NAME = process.env.EXPO_PUBLIC_BRAND_NAME || "Prisma Nutri";
export const BRAND_DOMAIN =
  process.env.EXPO_PUBLIC_BRAND_DOMAIN || "prismanutri.belter-oracle.com.br";
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "belter.oracle@gmail.com";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || `https://${BRAND_DOMAIN}`).replace(
  /\/$/,
  "",
);

export const SUPABASE_URL = required(
  "EXPO_PUBLIC_SUPABASE_URL",
  process.env.EXPO_PUBLIC_SUPABASE_URL,
);
export const SUPABASE_PUBLISHABLE_KEY = required(
  "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
export const PROFILE_IMAGE_BUCKET = process.env.EXPO_PUBLIC_PROFILE_IMAGE_BUCKET || "";

export const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "";
export const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";
export const REVENUECAT_ENTITLEMENT = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT || "premium";

export const FEATURES = {
  selfieJournal: (process.env.EXPO_PUBLIC_FEATURE_SELFIE_JOURNAL || "").toLowerCase() === "true",
} as const;

export const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || `https://${BRAND_DOMAIN}/termos`;
export const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL || `https://${BRAND_DOMAIN}/privacidade`;

/** Link público de indicação (abre a página de login do site com o código). */
export function referralLink(code: string): string {
  return `https://${BRAND_DOMAIN}/login?code=${encodeURIComponent(code)}`;
}

/** Ambiente das linhas de assinatura (igual ao do backend: "live" em produção). */
export const PAYMENTS_ENV: "live" | "sandbox" =
  process.env.EXPO_PUBLIC_PAYMENTS_ENV === "sandbox" ? "sandbox" : "live";

/** Tamanho do código do e-mail (Supabase → Auth → Email OTP Length; padrão 6). */
export const OTP_LENGTH = Number(process.env.EXPO_PUBLIC_OTP_LENGTH) || 6;
