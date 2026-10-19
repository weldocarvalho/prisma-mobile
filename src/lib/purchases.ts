import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesPackage,
} from "react-native-purchases";
import { REVENUECAT_ANDROID_KEY, REVENUECAT_ENTITLEMENT, REVENUECAT_IOS_KEY } from "@/lib/config";

/**
 * Compras nas lojas (App Store / Google Play) via RevenueCat.
 * O usuário do RevenueCat é o mesmo id do Supabase (Purchases.logIn), e o
 * backend recebe o webhook e grava a assinatura em public.subscriptions.
 */

let configured = false;

function apiKey(): string {
  return Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
}

export function purchasesAvailable(): boolean {
  return !!apiKey() && (Platform.OS === "ios" || Platform.OS === "android");
}

export function configurePurchases(): void {
  if (configured || !purchasesAvailable()) return;
  if (__DEV__) void Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: apiKey() });
  configured = true;
}

export async function identifyPurchaser(userId: string): Promise<CustomerInfo | null> {
  if (!configured) return null;
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    return customerInfo;
  } catch (err) {
    console.warn("[purchases] logIn falhou:", err);
    return null;
  }
}

export async function resetPurchaser(): Promise<void> {
  if (!configured) return;
  try {
    if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  } catch (err) {
    console.warn("[purchases] logOut falhou:", err);
  }
}

export function hasStoreEntitlement(info: CustomerInfo | null | undefined): boolean {
  return !!info?.entitlements.active[REVENUECAT_ENTITLEMENT];
}

export function onCustomerInfo(listener: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

export async function getCurrentOffering() {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export type PurchaseOutcome = { status: "success"; info: CustomerInfo } | { status: "cancelled" };

export async function buyPackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: "success", info: customerInfo };
  } catch (err) {
    const e = err as PurchasesError & { userCancelled?: boolean };
    if (e.userCancelled || e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { status: "cancelled" };
    }
    throw new Error(purchaseErrorMessage(e));
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function openManageSubscriptions(): Promise<void> {
  if (!configured) return;
  await Purchases.showManageSubscriptions();
}

function purchaseErrorMessage(e: PurchasesError): string {
  switch (e.code) {
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return "Sem conexão. Verifique a internet e tente de novo.";
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return "Compras não estão permitidas neste aparelho.";
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return "Pagamento pendente. Assim que a loja confirmar, o acesso é liberado.";
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return "Você já tem esta assinatura. Toque em “Restaurar compras”.";
    default:
      return "Não foi possível concluir a compra agora. Tente novamente.";
  }
}
