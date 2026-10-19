import { useState } from "react";
import { Alert, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button, Card, ErrorText, FieldLabel, IconCircle, Input, T } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { api, ApiError } from "@/lib/api";
import { openManageSubscriptions } from "@/lib/purchases";
import { colors } from "@/theme/tokens";

/** Exclusão de conta dentro do app (exigência da App Store e do Google Play). */
export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const { subscription, storeActive } = useSubscription();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storeSub =
    storeActive || (subscription?.source === "revenuecat" && subscription.status !== "expired");

  function run() {
    Alert.alert(
      "Excluir conta definitivamente?",
      "Todos os seus dados serão apagados. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            setError(null);
            try {
              const res = await api.deleteAccount();
              if (!res.ok) throw new Error("Não foi possível excluir agora.");
              await signOut("local");
            } catch (err) {
              setError(
                err instanceof ApiError || err instanceof Error
                  ? err.message
                  : "Não foi possível excluir agora.",
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <Screen edges={[]} keyboard>
      <Card>
        <View style={{ alignItems: "center" }}>
          <IconCircle icon={AlertTriangle} size={52} />
        </View>
        <T variant="heading" style={{ textAlign: "center", marginTop: 12 }}>
          Excluir sua conta
        </T>
        <T variant="bodySmall" style={{ marginTop: 12 }}>
          Ao excluir, apagamos seu perfil, plano alimentar, refeições registradas, check-ins, peso,
          fotos e preferências. Registros de pagamento exigidos por lei são mantidos sem seus dados
          de perfil. Assinaturas feitas pelo site são canceladas automaticamente.
        </T>
        {storeSub && (
          <View
            style={{
              backgroundColor: colors.roseSoft,
              borderRadius: 14,
              padding: 12,
              marginTop: 14,
            }}
          >
            <T variant="label" style={{ color: colors.roseInk }}>
              Assinatura da loja ativa
            </T>
            <T variant="bodySmall" style={{ marginTop: 4, color: colors.ink }}>
              Assinaturas da App Store / Google Play só podem ser canceladas por você na loja.
              Cancele antes de excluir a conta para não ser cobrado de novo.
            </T>
            <Button
              variant="secondary"
              size="sm"
              title="Gerenciar assinatura na loja"
              style={{ marginTop: 10, alignSelf: "flex-start" }}
              onPress={() => openManageSubscriptions()}
            />
          </View>
        )}
        <FieldLabel style={{ marginTop: 18 }}>Para confirmar, digite EXCLUIR</FieldLabel>
        <Input
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="EXCLUIR"
        />
        <ErrorText>{error}</ErrorText>
        <Button
          variant="danger"
          title="Excluir minha conta"
          loading={busy}
          disabled={confirm.trim().toUpperCase() !== "EXCLUIR"}
          style={{ marginTop: 16 }}
          onPress={run}
        />
      </Card>
    </Screen>
  );
}
