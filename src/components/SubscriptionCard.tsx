import { useState } from "react";
import { Platform, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, CreditCard, RotateCcw, Settings2 } from "lucide-react-native";
import { Button, Card, Loading, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useSubscription } from "@/providers/SubscriptionProvider";
import {
  openManageSubscriptions,
  purchasesAvailable,
  restorePurchases,
  hasStoreEntitlement,
} from "@/lib/purchases";
import { api } from "@/lib/api";
import { nowMs } from "@/lib/dayKey";
import { colors } from "@/theme/tokens";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  expired: "Expirada",
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View
      style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 }}
    >
      <T variant="bodySmall">{label}</T>
      <T variant="body" style={{ fontSize: 14, flexShrink: 1, textAlign: "right" }}>
        {value}
      </T>
    </View>
  );
}

/** Status da assinatura no Perfil (SubscriptionStatusCard do web, adaptado às lojas). */
export function SubscriptionCard() {
  const { subscription, isActive, loading, storeActive, refresh } = useSubscription();
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);

  async function restore() {
    setRestoring(true);
    try {
      const info = await restorePurchases();
      await api.revenueCatSync().catch(() => null);
      await refresh();
      toast[hasStoreEntitlement(info) ? "success" : "info"](
        hasStoreEntitlement(info)
          ? "Compra restaurada."
          : "Nenhuma assinatura encontrada nesta conta da loja.",
      );
    } catch {
      toast.error("Não foi possível restaurar agora.");
    } finally {
      setRestoring(false);
    }
  }

  if (loading) return <Loading />;

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <CreditCard size={16} color={isActive ? colors.roseInk : colors.inkFaint} />
      <T variant="heading" style={{ fontSize: 18 }}>
        Assinatura
      </T>
    </View>
  );

  const restoreButton = purchasesAvailable() ? (
    <Button
      variant="ghost"
      size="sm"
      title="Restaurar compras"
      icon={RotateCcw}
      loading={restoring}
      onPress={restore}
      style={{ alignSelf: "flex-start" }}
    />
  ) : null;

  if (!isActive || !subscription) {
    if (isActive && storeActive) {
      return (
        <Card>
          {header}
          <T variant="bodySmall">
            Assinatura ativa pela {Platform.OS === "ios" ? "App Store" : "Google Play"}.
          </T>
          <Button
            variant="secondary"
            size="sm"
            title="Gerenciar assinatura"
            icon={Settings2}
            style={{ marginTop: 12, alignSelf: "flex-start" }}
            onPress={() => openManageSubscriptions()}
          />
        </Card>
      );
    }
    return (
      <Card>
        {header}
        <T variant="bodySmall">Você não tem uma assinatura ativa no momento.</T>
        <Button
          size="sm"
          title="Ver o plano"
          iconRight={ArrowRight}
          style={{ marginTop: 12, alignSelf: "flex-start" }}
          onPress={() => router.push("/assinar")}
        />
        {restoreButton}
      </Card>
    );
  }

  const src = subscription.source;
  const periodEnd = formatDate(subscription.current_period_end);
  const bonusActive =
    !!subscription.bonus_period_end && new Date(subscription.bonus_period_end) > new Date();

  if (src === "trial" && !bonusActive) {
    const daysLeft = subscription.current_period_end
      ? Math.max(
          0,
          Math.ceil((new Date(subscription.current_period_end).getTime() - nowMs()) / 86_400_000),
        )
      : 0;
    return (
      <Card>
        {header}
        <Row label="Plano" value="Teste grátis" />
        <Row
          label="Termina em"
          value={
            periodEnd
              ? `${periodEnd}${daysLeft > 0 ? ` · ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}` : ""}`
              : null
          }
        />
        <Button
          size="sm"
          title="Ver o plano"
          iconRight={ArrowRight}
          style={{ marginTop: 12, alignSelf: "flex-start" }}
          onPress={() => router.push("/assinar")}
        />
        {restoreButton}
      </Card>
    );
  }

  const origin =
    src === "revenuecat"
      ? subscription.store === "play_store"
        ? "Google Play"
        : subscription.store === "app_store" || subscription.store === "mac_app_store"
          ? "App Store"
          : "Loja de apps"
      : src === "admin_grant" || src === "admin"
        ? "Acesso liberado"
        : src === "referral"
          ? "Bônus de indicação"
          : "Site";

  return (
    <Card>
      {header}
      <Row label="Status" value={STATUS_LABELS[subscription.status] ?? subscription.status} />
      <Row label="Origem" value={origin} />
      <Row
        label={subscription.cancel_at_period_end ? "Acesso até" : "Renova em"}
        value={periodEnd}
      />
      {bonusActive && <Row label="Bônus até" value={formatDate(subscription.bonus_period_end)} />}
      {src === "revenuecat" ? (
        <Button
          variant="secondary"
          size="sm"
          title="Gerenciar assinatura"
          icon={Settings2}
          style={{ marginTop: 12, alignSelf: "flex-start" }}
          onPress={() => openManageSubscriptions()}
        />
      ) : origin === "Site" ? (
        <T variant="caption" style={{ marginTop: 10 }}>
          Esta assinatura foi feita pelo site e é gerenciada por lá, na sua conta.
        </T>
      ) : null}
    </Card>
  );
}
