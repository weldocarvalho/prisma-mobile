import { useCallback, useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Bell, Mail, Moon, Send, Sunrise } from "lucide-react-native";
import { Screen, Stack } from "@/components/Screen";
import { Button, Card, Choice, Divider, Loading, SwitchRow, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { useNotificationPrefs } from "@/hooks/queries";
import { disablePush, enablePush, getPushPermission, type PushPermission } from "@/lib/push";
import { api } from "@/lib/api";
import { BRAND_NAME } from "@/lib/config";
import { colors } from "@/theme/tokens";

export default function NotificationsScreen() {
  const { profileId } = useAuth();
  const toast = useToast();
  const { prefs, loading, update } = useNotificationPrefs(profileId);
  const [permission, setPermission] = useState<PushPermission>("undetermined");
  const [pushBusy, setPushBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void getPushPermission().then(setPermission);
    }, []),
  );
  useEffect(() => {
    void getPushPermission().then(setPermission);
  }, []);

  if (loading || !prefs) {
    return (
      <Screen edges={[]}>
        <Loading />
      </Screen>
    );
  }

  async function togglePush(next: boolean) {
    setPushBusy(true);
    try {
      if (next) {
        const res = await enablePush(profileId);
        setPermission(await getPushPermission());
        if (!res.ok) {
          if (res.reason === "denied") {
            toast.error("Notificações bloqueadas. Libere nos Ajustes do aparelho.");
          } else {
            toast.error(res.reason ?? "Não foi possível ativar as notificações agora.");
          }
          return;
        }
        update({ notify_push_enabled: true });
        toast.success("Notificações ativadas.");
      } else {
        await disablePush(profileId);
        update({ notify_push_enabled: false });
        toast.success("Notificações desativadas.");
      }
    } finally {
      setPushBusy(false);
    }
  }

  async function sendTest() {
    setTestBusy(true);
    try {
      const r = await api.testNotification();
      if (!r.ok) throw new Error();
      if (!r.emailEnabled && !r.pushEnabled) {
        toast.info("Ative pelo menos um canal (e-mail ou push) para testar.");
        return;
      }
      const parts: string[] = [];
      if (r.emailEnabled) parts.push(r.emailSent ? "e-mail enviado" : "e-mail falhou");
      if (r.pushAttempted) parts.push(r.pushSent ? "push enviado" : "push falhou");
      toast.success(`Teste: ${parts.join(" · ")}.`);
    } catch {
      toast.error("Não foi possível enviar o teste.");
    } finally {
      setTestBusy(false);
    }
  }

  const pushOn = prefs.notify_push_enabled && permission === "granted";

  return (
    <Screen edges={[]}>
      <T variant="bodySmall" style={{ marginBottom: 16 }}>
        Escolha como e quando o {BRAND_NAME} entra em contato.
      </T>
      <Stack>
        <Card>
          <T variant="eyebrow">Horário do lembrete diário</T>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            {(
              [
                { v: "morning", l: "Manhã", icon: Sunrise },
                { v: "evening", l: "Noite", icon: Moon },
              ] as const
            ).map((o) => (
              <Choice
                key={o.v}
                selected={prefs.notify_reminder_slot === o.v}
                onPress={() => update({ notify_reminder_slot: o.v })}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                }}
              >
                <o.icon
                  size={15}
                  color={prefs.notify_reminder_slot === o.v ? colors.roseInk : colors.inkFaint}
                />
                <T variant="label">{o.l}</T>
              </Choice>
            ))}
          </View>
          <T variant="caption" style={{ marginTop: 8 }}>
            Se tiver uma sequência ativa em risco, o lembrete vira aviso para não perdê-la.
          </T>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Bell size={14} color={colors.roseInk} />
            <T variant="eyebrow">Notificações no celular</T>
          </View>
          <SwitchRow
            label="Ativar notificações"
            description={
              permission === "denied"
                ? "Bloqueadas nos Ajustes do aparelho."
                : "Pede permissão do sistema na primeira vez."
            }
            value={pushOn}
            onValueChange={togglePush}
            disabled={pushBusy || permission === "denied"}
          />
          {permission === "denied" && (
            <Button
              variant="ghost"
              size="sm"
              title="Abrir Ajustes"
              onPress={() => Linking.openSettings()}
              style={{ alignSelf: "flex-start" }}
            />
          )}
          <Divider />
          <SwitchRow
            label="Lembrete de refeições pendentes"
            value={prefs.notify_push_reminder}
            disabled={!pushOn}
            onValueChange={(v) => update({ notify_push_reminder: v })}
          />
          <SwitchRow
            label="Resumo semanal"
            value={prefs.notify_push_weekly_digest}
            disabled={!pushOn}
            onValueChange={(v) => update({ notify_push_weekly_digest: v })}
          />
          <SwitchRow
            label="Conquistas e marcos"
            value={prefs.notify_push_milestone}
            disabled={!pushOn}
            onValueChange={(v) => update({ notify_push_milestone: v })}
          />
          <SwitchRow
            label="Reengajamento (quando eu sumir)"
            value={prefs.notify_push_reengagement}
            disabled={!pushOn}
            onValueChange={(v) => update({ notify_push_reengagement: v })}
          />
        </Card>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Mail size={14} color={colors.roseInk} />
            <T variant="eyebrow">E-mail</T>
          </View>
          <SwitchRow
            label="Lembrete de refeições pendentes"
            value={prefs.notify_email_reminder}
            onValueChange={(v) => update({ notify_email_reminder: v })}
          />
          <SwitchRow
            label="Resumo semanal"
            value={prefs.notify_email_weekly_digest}
            onValueChange={(v) => update({ notify_email_weekly_digest: v })}
          />
          <SwitchRow
            label="Conquistas e marcos"
            value={prefs.notify_email_milestone}
            onValueChange={(v) => update({ notify_email_milestone: v })}
          />
          <SwitchRow
            label="Reengajamento (quando eu sumir)"
            value={prefs.notify_email_reengagement}
            onValueChange={(v) => update({ notify_email_reengagement: v })}
          />
        </Card>

        <Button
          variant="secondary"
          title="Enviar notificação de teste"
          icon={Send}
          loading={testBusy}
          onPress={sendTest}
        />
      </Stack>
    </Screen>
  );
}
