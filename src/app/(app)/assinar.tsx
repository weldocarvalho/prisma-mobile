import { useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { PACKAGE_TYPE, type PurchasesPackage } from "react-native-purchases";
import { Check, X } from "lucide-react-native";
import { Button, Card, ErrorText, Loading, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { api } from "@/lib/api";
import {
  buyPackage,
  getCurrentOffering,
  hasStoreEntitlement,
  purchasesAvailable,
  restorePurchases,
} from "@/lib/purchases";
import { BRAND_NAME, PRIVACY_URL, TERMS_URL } from "@/lib/config";
import { feedback } from "@/lib/haptics";
import { colors, fonts, radius } from "@/theme/tokens";

const BULLETS = [
  "Plano alimentar personalizado com IA",
  "Registro de refeições por foto e texto",
  "Metas diárias de calorias, macros e água",
  "Check-in diário, sequência e desafios da semana",
  "Gráfico de evolução do peso",
];

// Apple exige a EULA padrão (ou uma própria) visível na tela de compra.
const APPLE_EULA = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

function periodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.MONTHLY:
      return "por mês";
    case PACKAGE_TYPE.TWO_MONTH:
      return "a cada 2 meses";
    case PACKAGE_TYPE.THREE_MONTH:
      return "a cada 3 meses";
    case PACKAGE_TYPE.SIX_MONTH:
      return "a cada 6 meses";
    case PACKAGE_TYPE.ANNUAL:
      return "por ano";
    case PACKAGE_TYPE.WEEKLY:
      return "por semana";
    default:
      return "";
  }
}

function trialLabel(pkg: PurchasesPackage): string | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const n = intro.periodNumberOfUnits;
  const unit =
    intro.periodUnit === "DAY"
      ? n === 1
        ? "dia"
        : "dias"
      : intro.periodUnit === "WEEK"
        ? n === 1
          ? "semana"
          : "semanas"
        : n === 1
          ? "mês"
          : "meses";
  return `${n} ${unit} grátis`;
}

/**
 * Tela de assinatura do app (compra pela App Store / Google Play via RevenueCat).
 * Preço e período vêm da loja — nunca fixos no código.
 */
export default function PaywallScreen() {
  const { isActive, refresh } = useSubscription();
  const toast = useToast();
  const offering = useQuery({
    queryKey: ["offering"],
    queryFn: getCurrentOffering,
    enabled: purchasesAvailable(),
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packages = offering.data?.availablePackages ?? [];
  const defaultId =
    (packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? packages[0])?.identifier ??
    null;
  const selectedId = selected ?? defaultId;

  async function afterPurchase() {
    await api.revenueCatSync().catch(() => null);
    await refresh();
    feedback("achievement");
    toast.success("Assinatura ativa! Bom proveito.");
    router.back();
  }

  async function buy() {
    const pkg = packages.find((p) => p.identifier === selectedId);
    if (!pkg) return;
    setError(null);
    setBuying(true);
    try {
      const res = await buyPackage(pkg);
      if (res.status === "success" && hasStoreEntitlement(res.info)) await afterPurchase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a compra.");
    } finally {
      setBuying(false);
    }
  }

  async function restore() {
    setError(null);
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (hasStoreEntitlement(info)) await afterPurchase();
      else toast.info("Nenhuma assinatura encontrada nesta conta da loja.");
    } catch {
      setError("Não foi possível restaurar agora.");
    } finally {
      setRestoring(false);
    }
  }

  const store = Platform.OS === "ios" ? "App Store" : "Google Play";
  const chosen = packages.find((p) => p.identifier === selectedId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }} edges={["top", "bottom"]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          hitSlop={12}
          onPress={() => router.back()}
        >
          <X size={24} color={colors.inkSoft} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
        <T variant="eyebrow">{BRAND_NAME}</T>
        <T variant="display" style={{ marginTop: 6 }}>
          Plano completo
        </T>
        <T variant="bodySmall" style={{ marginTop: 8 }}>
          Acesso completo à plataforma. Cancele quando quiser.
        </T>

        <View style={{ gap: 10, marginTop: 20 }}>
          {BULLETS.map((b) => (
            <View key={b} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <View style={styles.check}>
                <Check size={13} color={colors.white} strokeWidth={3} />
              </View>
              <T variant="body" style={{ flex: 1, fontSize: 14.5 }}>
                {b}
              </T>
            </View>
          ))}
        </View>

        {isActive ? (
          <Card tone="rose" style={{ marginTop: 24 }}>
            <T variant="label" style={{ color: colors.roseInk }}>
              Você já tem acesso completo.
            </T>
            <Button title="Voltar ao app" style={{ marginTop: 12 }} onPress={() => router.back()} />
          </Card>
        ) : !purchasesAvailable() ? (
          <Card tone="outline" style={{ marginTop: 24 }}>
            <T variant="bodySmall">
              As compras ainda não estão configuradas neste build (chave do RevenueCat ausente).
            </T>
          </Card>
        ) : offering.isLoading ? (
          <Loading />
        ) : packages.length === 0 ? (
          <Card tone="outline" style={{ marginTop: 24 }}>
            <T variant="bodySmall">
              Não foi possível carregar os planos da {store}. Verifique a conexão e tente de novo.
            </T>
            <Button
              variant="secondary"
              size="sm"
              title="Tentar de novo"
              style={{ marginTop: 10, alignSelf: "flex-start" }}
              onPress={() => offering.refetch()}
            />
          </Card>
        ) : (
          <View style={{ gap: 10, marginTop: 24 }}>
            {packages.map((pkg) => {
              const active = pkg.identifier === selectedId;
              const trial = trialLabel(pkg);
              return (
                <Pressable
                  key={pkg.identifier}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    feedback("tap");
                    setSelected(pkg.identifier);
                  }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <View style={{ flex: 1 }}>
                    <T variant="label">{pkg.product.title.replace(/\s*\(.*\)$/, "")}</T>
                    {trial ? (
                      <T variant="caption" style={{ color: colors.roseInk }}>
                        {trial}, depois cobrança automática
                      </T>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <T style={{ fontFamily: fonts.display, fontSize: 24 }}>
                      {pkg.product.priceString}
                    </T>
                    <T variant="caption">{periodLabel(pkg)}</T>
                  </View>
                </Pressable>
              );
            })}
            <ErrorText>{error}</ErrorText>
            <Button
              title={
                chosen
                  ? `Assinar por ${chosen.product.priceString}${periodLabel(chosen) ? ` ${periodLabel(chosen)}` : ""}`
                  : "Assinar"
              }
              loading={buying}
              disabled={!chosen}
              onPress={buy}
              style={{ marginTop: 6 }}
            />
          </View>
        )}

        {!isActive && purchasesAvailable() && (
          <Button
            variant="ghost"
            size="sm"
            title="Restaurar compras"
            loading={restoring}
            onPress={restore}
            style={{ marginTop: 8, alignSelf: "center" }}
          />
        )}

        <T variant="caption" style={{ marginTop: 18, textAlign: "center", lineHeight: 17 }}>
          A assinatura é cobrada na sua conta da {store} e renova automaticamente pelo mesmo valor e
          período, a menos que seja cancelada pelo menos 24 horas antes do fim do período atual.
          Você pode gerenciar ou cancelar nos ajustes da sua conta da {store}.
        </T>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 12 }}>
          <T variant="caption" style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
            Termos de uso
          </T>
          <T variant="caption" style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacidade
          </T>
          {Platform.OS === "ios" && (
            <T variant="caption" style={styles.link} onPress={() => Linking.openURL(APPLE_EULA)}>
              EULA
            </T>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.rose,
    alignItems: "center",
    justifyContent: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: 16,
  },
  optionActive: { borderColor: colors.rose, backgroundColor: colors.roseSoft },
  link: { color: colors.roseInk, textDecorationLine: "underline" },
});
