import { useState } from "react";
import { Alert, Linking, Pressable, Share, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  Camera,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Gift,
  LifeBuoy,
  LogOut,
  Pencil,
  RefreshCw,
  Shield,
  Smartphone,
  Trash2,
  Vibrate,
  X,
} from "lucide-react-native";
import { Disclaimer, Screen, Stack } from "@/components/Screen";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { Button, Card, Divider, IconButton, Input, Switch, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { qk, useProfile, useProfilePhoto } from "@/hooks/queries";
import { allergyLabels, updateProfile, uploadProfilePhoto } from "@/lib/data";
import { api } from "@/lib/api";
import { capitalize, label } from "@/lib/copy";
import { compressImage } from "@/lib/image";
import { pickImage } from "@/lib/pickImage";
import { feedback, hapticsEnabled, setHapticsEnabled } from "@/lib/haptics";
import { BRAND_NAME, PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL, referralLink } from "@/lib/config";
import * as Application from "expo-application";
import { colors, fonts } from "@/theme/tokens";

function LinkRow({
  icon: Icon,
  title,
  onPress,
  danger,
}: {
  icon: typeof Bell;
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        feedback("tap");
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 13,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon size={18} color={danger ? colors.danger : colors.roseInk} />
      <T
        variant="body"
        style={{ flex: 1, fontSize: 14.5, color: danger ? colors.danger : colors.ink }}
      >
        {title}
      </T>
      <ChevronRight size={16} color={colors.inkFaint} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { profileId, userId, email, onboarded, signOut } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = useProfile(profileId);
  const photo = useProfilePhoto(userId);
  const referral = useQuery({ queryKey: qk.referral(userId), queryFn: () => api.referralInfo() });
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [haptics, setHaptics] = useState(hapticsEnabled());
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const p = profile.data;
  const allergies = allergyLabels(p?.allergies).map(capitalize);
  const initial = (p?.name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
  const ref = referral.data && referral.data.ok ? referral.data : null;

  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed.length > 60) {
      toast.error("Nome inválido. Use de 1 a 60 caracteres.");
      return;
    }
    const firstName = trimmed.split(/\s+/)[0];
    setSavingName(true);
    try {
      await updateProfile(profileId, { name: firstName });
      await queryClient.invalidateQueries({ queryKey: qk.profile(profileId) });
      setEditing(false);
      toast.success("Nome atualizado.");
    } catch {
      toast.error("Não foi possível salvar o nome.");
    } finally {
      setSavingName(false);
    }
  }

  async function changePhoto() {
    const picked = await pickImage("Foto de perfil");
    if (!picked) return;
    setUploading(true);
    try {
      const img = await compressImage(picked, 800, 0.85);
      await uploadProfilePhoto(userId, img.base64);
      await queryClient.invalidateQueries({ queryKey: qk.photo(userId) });
      toast.success("Foto de perfil atualizada.");
    } catch {
      toast.error("Não foi possível atualizar a foto.");
    } finally {
      setUploading(false);
    }
  }

  async function shareReferral() {
    if (!ref) return;
    try {
      await Share.share({
        message: `Estou usando o ${BRAND_NAME} para organizar minha alimentação. Use meu código ${ref.referralCode} e ganhe 7 dias grátis: ${referralLink(ref.referralCode)}`,
      });
    } catch {
      /* fechou */
    }
  }

  async function redeem() {
    const code = redeemCode.trim();
    if (!code) return;
    setRedeeming(true);
    try {
      const res = await api.redeemReferral(code);
      if (!res.ok) {
        const msg =
          res.error === "ALREADY_REDEEMED"
            ? "Você já usou um código de indicação antes."
            : res.error === "CANNOT_USE_OWN_CODE"
              ? "Esse é o seu próprio código."
              : res.error === "CODE_NOT_FOUND"
                ? "Código não encontrado. Confira se digitou certo."
                : "Não foi possível resgatar o código agora.";
        toast.error(msg);
        return;
      }
      feedback("achievement");
      toast.success(
        res.referredDaysGranted > 0
          ? `Pronto! Você ganhou ${res.referredDaysGranted} dias de acesso.`
          : "Código aplicado — você já tinha assinatura ativa.",
      );
      setRedeemCode("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.referral(userId) }),
        queryClient.invalidateQueries({ queryKey: ["access"] }),
      ]);
    } catch {
      toast.error("Não foi possível resgatar o código agora.");
    } finally {
      setRedeeming(false);
    }
  }

  function confirmSignOut(scope: "local" | "global") {
    Alert.alert(
      scope === "global" ? "Sair de todos os dispositivos?" : "Sair desta conta?",
      scope === "global"
        ? "Você precisará entrar de novo em todos os aparelhos e no site."
        : undefined,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: () => void signOut(scope) },
      ],
    );
  }

  const summary: [string, string | null][] = p
    ? [
        ["Objetivo", label("goal", p.goal)],
        ["Sexo biológico", label("biological_sex", p.biological_sex)],
        ["Nível de atividade", label("activity_level", p.activity_level)],
        ["Estilo alimentar", label("dietary_style", p.dietary_style)],
        ["Experiência", label("experience_level", p.experience_level)],
        ["Orçamento", label("budget_level", p.budget_level)],
        ["Tempo disponível", label("time_availability", p.time_availability)],
        ["Peso atual", p.current_weight_kg != null ? `${p.current_weight_kg} kg` : null],
        ["Peso alvo", p.target_weight_kg != null ? `${p.target_weight_kg} kg` : null],
        ["Meta diária", p.daily_calorie_target != null ? `${p.daily_calorie_target} kcal` : null],
        [
          "Alimentos a evitar",
          p.foods_to_avoid?.length ? p.foods_to_avoid.map(capitalize).join(", ") : null,
        ],
        ["Alergias", allergies.length ? allergies.join(", ") : null],
        ["Restrição", p.pregnancy_or_breastfeeding ? "Gravidez / amamentação" : null],
      ]
    : [];

  return (
    <Screen keyboard>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Alterar foto de perfil"
          onPress={changePhoto}
          disabled={uploading}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: "rgba(179,97,122,0.3)",
              overflow: "hidden",
              backgroundColor: colors.roseSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photo.data ? (
              <Image
                source={{ uri: photo.data }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <T style={{ fontFamily: fonts.semibold, fontSize: 28, color: colors.roseInk }}>
                {initial}
              </T>
            )}
          </View>
          <View
            style={{
              position: "absolute",
              right: -2,
              bottom: -2,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.rose,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Camera size={14} color={colors.white} />
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <T variant="eyebrow">Perfil</T>
          {editing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Input
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                maxLength={60}
                style={{ flex: 1, fontFamily: fonts.display, fontSize: 22 }}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <IconButton
                icon={Check}
                tone="rose"
                label="Salvar nome"
                onPress={saveName}
                disabled={savingName}
              />
              <IconButton icon={X} label="Cancelar" onPress={() => setEditing(false)} />
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <T variant="title" numberOfLines={1} style={{ flexShrink: 1 }}>
                {p?.name ?? "—"}
              </T>
              <IconButton
                icon={Pencil}
                tone="plain"
                size={32}
                label="Editar nome"
                onPress={() => {
                  setNameDraft(p?.name ?? "");
                  setEditing(true);
                }}
              />
            </View>
          )}
          {email ? (
            <T variant="caption" numberOfLines={1}>
              {email}
            </T>
          ) : null}
        </View>
      </View>

      <Stack gap={16}>
        {p && (
          <Card>
            <T variant="heading" style={{ fontSize: 18, marginBottom: 8 }}>
              Resumo do perfil
            </T>
            {!onboarded && <T variant="caption">Aparece assim que você gerar o primeiro plano.</T>}
            {summary
              .filter(([, v]) => !!v)
              .map(([k, v]) => (
                <View
                  key={k}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 12,
                    paddingVertical: 5,
                  }}
                >
                  <T variant="bodySmall">{k}</T>
                  <T variant="body" style={{ fontSize: 14, flexShrink: 1, textAlign: "right" }}>
                    {v}
                  </T>
                </View>
              ))}
            <Button
              variant="secondary"
              size="sm"
              title={onboarded ? "Refazer questionário do plano" : "Montar meu plano"}
              icon={RefreshCw}
              style={{ marginTop: 12 }}
              onPress={() => router.push("/onboarding")}
            />
          </Card>
        )}

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Gift size={16} color={colors.roseInk} />
            <T variant="heading" style={{ fontSize: 18 }}>
              Indique e ganhe
            </T>
          </View>
          <T variant="bodySmall" style={{ marginTop: 4 }}>
            Compartilhe seu código — você e sua amiga ganham 7 dias de acesso quando ela usar.
          </T>
          {ref && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.roseSoft,
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <T
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 18,
                      letterSpacing: 3,
                      color: colors.ink,
                    }}
                  >
                    {ref.referralCode.toUpperCase()}
                  </T>
                </View>
                <IconButton
                  icon={Copy}
                  label="Copiar link de indicação"
                  size={44}
                  onPress={async () => {
                    await Clipboard.setStringAsync(referralLink(ref.referralCode));
                    toast.success("Link copiado!");
                  }}
                />
              </View>
              <Button
                title="Compartilhar convite"
                size="sm"
                icon={Gift}
                style={{ marginTop: 10 }}
                onPress={shareReferral}
              />
              {ref.successfulReferrals > 0 && (
                <T variant="caption" style={{ marginTop: 8 }}>
                  Você já indicou {ref.successfulReferrals}{" "}
                  {ref.successfulReferrals === 1 ? "pessoa" : "pessoas"}.
                </T>
              )}
            </>
          )}
          {ref && !ref.alreadyRedeemed && (
            <View style={{ marginTop: 14 }}>
              <Divider style={{ marginBottom: 14 }} />
              <T variant="label" style={{ marginBottom: 8 }}>
                Recebeu um código de alguém?
              </T>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Input
                  value={redeemCode}
                  onChangeText={setRedeemCode}
                  placeholder="Digite o código"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Resgatar"
                  loading={redeeming}
                  disabled={!redeemCode.trim()}
                  onPress={redeem}
                />
              </View>
            </View>
          )}
        </Card>

        <SubscriptionCard />

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Vibrate size={18} color={colors.roseInk} />
            <View style={{ flex: 1 }}>
              <T variant="label">Vibração</T>
              <T variant="caption">
                Feedback tátil ao marcar refeições, salvar o check-in e desbloquear conquistas.
              </T>
            </View>
            <Switch
              label="Vibração"
              value={haptics}
              onValueChange={(v) => {
                setHaptics(v);
                void setHapticsEnabled(v);
                if (v) feedback("success");
              }}
            />
          </View>
          <Divider style={{ marginVertical: 6 }} />
          <LinkRow icon={Bell} title="Notificações" onPress={() => router.push("/notifications")} />
          <Divider />
          <LinkRow
            icon={BookOpen}
            title="Dicas e perguntas frequentes"
            onPress={() => router.push("/tips")}
          />
        </Card>

        <Card>
          <LinkRow
            icon={FileText}
            title="Termos de uso"
            onPress={() => Linking.openURL(TERMS_URL)}
          />
          <Divider />
          <LinkRow
            icon={Shield}
            title="Política de privacidade"
            onPress={() => Linking.openURL(PRIVACY_URL)}
          />
          <Divider />
          <LinkRow
            icon={LifeBuoy}
            title="Falar com o suporte"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </Card>

        <Card>
          <LinkRow icon={LogOut} title="Sair desta conta" onPress={() => confirmSignOut("local")} />
          <Divider />
          <LinkRow
            icon={Smartphone}
            title="Sair de todos os dispositivos"
            onPress={() => confirmSignOut("global")}
          />
          <Divider />
          <LinkRow
            icon={Trash2}
            title="Excluir minha conta"
            danger
            onPress={() => router.push("/delete-account")}
          />
        </Card>

        <T variant="caption" style={{ textAlign: "center" }}>
          {BRAND_NAME} · versão {Application.nativeApplicationVersion ?? "dev"} (
          {Application.nativeBuildVersion ?? "-"})
        </T>
      </Stack>
      <Disclaimer />
    </Screen>
  );
}
