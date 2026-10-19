import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Slider from "@react-native-community/slider";
import {
  Bell,
  Camera,
  Check,
  Coffee,
  GlassWater,
  Moon,
  PartyPopper,
  Utensils,
} from "lucide-react-native";
import { Button, IconCircle, Loading, ProgressBar, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { qk, useChecks, usePlan } from "@/hooks/queries";
import {
  addSelfie,
  fetchCheckIn,
  fetchCheckOut,
  listSelfieMeta,
  saveSleep,
  saveWater,
} from "@/lib/data";
import { todayKey } from "@/lib/dayKey";
import { FEATURES } from "@/lib/config";
import { compressImage } from "@/lib/image";
import { pickImage } from "@/lib/pickImage";
import { enablePush, getPushPermission } from "@/lib/push";
import { feedback } from "@/lib/haptics";
import { XP_CHECKIN_COMPLETE, XP_CHECKOUT_COMPLETE, XP_CLEANSING_STEP, XP_SELFIE } from "@/lib/xp";
import { colors, fonts } from "@/theme/tokens";

type StepDef = {
  key: string;
  done: boolean;
  icon: typeof Coffee;
  title: string;
  subtitle: string;
  render: (advance: () => void) => React.ReactNode;
};

/**
 * Check-in (manhã) / check-out (noite) passo a passo — o GuidedFlow do web
 * como uma folha nativa.
 */
export default function CheckFlowScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const morning = mode !== "night";
  const { profileId, userId } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const day = todayKey();
  const plan = usePlan(profileId);
  const { checks, toggle } = useChecks(profileId);
  const checkIn = useQuery({
    queryKey: qk.checkIn(profileId, day),
    queryFn: () => fetchCheckIn(profileId, day),
  });
  const checkOut = useQuery({
    queryKey: qk.checkOut(profileId, day),
    queryFn: () => fetchCheckOut(profileId, day),
  });
  const selfies = useQuery({
    queryKey: qk.selfieMeta(profileId),
    queryFn: () => listSelfieMeta(profileId),
    enabled: FEATURES.selfieJournal,
  });

  const [sleep, setSleep] = useState<number | null>(null);
  const [water, setWater] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [offerPush, setOfferPush] = useState(false);

  const steps = plan.data?.plan.daily_meal_structure ?? [];
  const anchor = steps.find((m) => m.meal === (morning ? "cafe_da_manha" : "jantar"));
  const anchorDone = anchor ? !!checks[`${anchor.meal}:${anchor.step}:${day}`] : false;
  const selfieDone = (selfies.data ?? []).some((s) => s.day === day);
  const sleepValue = sleep ?? checkIn.data?.sleepHours ?? 7;
  const waterValue = water ?? checkOut.data?.waterLiters ?? 2;

  const flow: StepDef[] = useMemo(() => {
    const markAnchor: StepDef = {
      key: "anchor",
      done: anchorDone,
      icon: morning ? Coffee : Utensils,
      title: anchor?.title ?? (morning ? "Café da manhã" : "Jantar"),
      subtitle: morning
        ? "Marque quando fizer a primeira refeição do seu plano."
        : "Marque quando fizer a última refeição do seu plano.",
      render: (advance) => (
        <Button
          title={anchorDone ? "Feito" : "Marcar como feito"}
          icon={Check}
          disabled={!anchor}
          onPress={() => {
            if (anchor && !anchorDone) {
              toggle(anchor.meal, anchor.step, day, true);
              feedback("achievement");
              toast.xp(XP_CLEANSING_STEP, morning ? "Café da manhã" : "Jantar");
            }
            advance();
          }}
        />
      ),
    };

    const selfieStep: StepDef = {
      key: "selfie",
      done: selfieDone,
      icon: Camera,
      title: "Foto de hoje",
      subtitle: "Tire em um lugar iluminado — ajuda a acompanhar sua evolução.",
      render: (advance) => (
        <Button
          title={selfieDone ? "Tirar outra foto" : "Tirar/enviar foto"}
          icon={Camera}
          loading={busy}
          onPress={async () => {
            const picked = await pickImage("Foto de hoje");
            if (!picked) return;
            setBusy(true);
            try {
              const img = await compressImage(picked, 1920, 0.9);
              await addSelfie(profileId, userId, img.base64);
              await queryClient.invalidateQueries({ queryKey: qk.selfieMeta(profileId) });
              feedback("achievement");
              toast.xp(XP_SELFIE, "Foto do dia");
              advance();
            } catch {
              toast.error("Não foi possível salvar a foto. Tente novamente.");
            } finally {
              setBusy(false);
            }
          }}
        />
      ),
    };

    const sleepStep: StepDef = {
      key: "sleep",
      done: !!checkIn.data,
      icon: Moon,
      title: "Quantas horas você dormiu?",
      subtitle: "Ajuste e salve — leva 2 segundos.",
      render: (advance) => (
        <View>
          <T style={{ fontFamily: fonts.display, fontSize: 40, textAlign: "center" }}>
            {sleepValue.toFixed(1).replace(".", ",")}h
          </T>
          <Slider
            accessibilityLabel="Horas de sono"
            minimumValue={0}
            maximumValue={12}
            step={0.5}
            value={sleepValue}
            onValueChange={(v) => setSleep(v)}
            onSlidingComplete={() => feedback("tap")}
            minimumTrackTintColor={colors.rose}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.rose}
            style={{ marginVertical: 12 }}
          />
          <Button
            title="Salvar sono"
            icon={Check}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              const firstEver = !checkIn.data;
              try {
                await saveSleep(profileId, day, sleepValue, checkIn.data?.id);
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: qk.checkIn(profileId, day) }),
                  queryClient.invalidateQueries({ queryKey: qk.checkIns(profileId) }),
                ]);
                feedback("success");
                if (firstEver && (await getPushPermission()) === "undetermined") setOfferPush(true);
                advance();
              } catch {
                toast.error("Não foi possível salvar o sono. Tente novamente.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      ),
    };

    const waterStep: StepDef = {
      key: "water",
      done: !!checkOut.data,
      icon: GlassWater,
      title: "Quantos litros de água você bebeu?",
      subtitle: "Uma estimativa já ajuda a acompanhar o hábito.",
      render: (advance) => (
        <View>
          <T style={{ fontFamily: fonts.display, fontSize: 40, textAlign: "center" }}>
            {waterValue.toFixed(2).replace(".", ",")}L
          </T>
          <Slider
            accessibilityLabel="Litros de água"
            minimumValue={0}
            maximumValue={6}
            step={0.25}
            value={waterValue}
            onValueChange={(v) => setWater(v)}
            onSlidingComplete={() => feedback("tap")}
            minimumTrackTintColor={colors.rose}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.rose}
            style={{ marginVertical: 12 }}
          />
          <Button
            title="Salvar água"
            icon={Check}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                await saveWater(profileId, day, waterValue, checkOut.data?.id);
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: qk.checkOut(profileId, day) }),
                  queryClient.invalidateQueries({ queryKey: qk.checkOutDays(profileId) }),
                ]);
                feedback("success");
                advance();
              } catch {
                toast.error("Não foi possível salvar a água. Tente novamente.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </View>
      ),
    };

    return morning
      ? [markAnchor, ...(FEATURES.selfieJournal ? [selfieStep] : []), sleepStep]
      : [markAnchor, waterStep];
  }, [
    morning,
    anchor,
    anchorDone,
    selfieDone,
    checkIn.data,
    checkOut.data,
    sleepValue,
    waterValue,
    busy,
    day,
    profileId,
    userId,
    toggle,
    toast,
    queryClient,
  ]);

  const loaded = !plan.isLoading && !checkIn.isLoading && !checkOut.isLoading;
  if (!loaded) return <Loading style={{ paddingTop: 60 }} />;

  const firstPending = flow.findIndex((s) => !s.done);
  return (
    <FlowBody
      flow={flow}
      morning={morning}
      initialIndex={firstPending > 0 ? firstPending : 0}
      initiallyComplete={flow.every((s) => s.done)}
      offerPush={offerPush}
      onPushHandled={() => setOfferPush(false)}
      profileId={profileId}
    />
  );
}

function FlowBody({
  flow,
  morning,
  initialIndex,
  initiallyComplete,
  offerPush,
  onPushHandled,
  profileId,
}: {
  flow: StepDef[];
  morning: boolean;
  initialIndex: number;
  initiallyComplete: boolean;
  offerPush: boolean;
  onPushHandled: () => void;
  profileId: string;
}) {
  const toast = useToast();
  // Abre no primeiro passo que falta (ou no início, para refazer).
  const [index, setIndex] = useState(initialIndex);
  const [finished, setFinished] = useState(false);
  const celebrated = useRef(false);
  const allDone = flow.every((s) => s.done);

  // Só comemora (XP de conclusão) se o check-in não estava completo ao abrir a folha.
  useEffect(() => {
    if (!finished || !allDone || celebrated.current || initiallyComplete) return;
    celebrated.current = true;
    feedback("achievement");
    toast.xp(
      morning ? XP_CHECKIN_COMPLETE : XP_CHECKOUT_COMPLETE,
      morning ? "Check-in completo!" : "Check-out completo!",
    );
  }, [finished, allDone, morning, toast, initiallyComplete]);

  function advance() {
    if (index >= flow.length - 1) setFinished(true);
    else setIndex((i) => i + 1);
  }

  if (finished) {
    return (
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 36, alignItems: "center" }}>
        <IconCircle icon={PartyPopper} size={64} />
        <T variant="title" style={{ marginTop: 16, textAlign: "center" }}>
          {allDone
            ? morning
              ? "Check-in completo!"
              : "Check-out completo!"
            : "Tudo salvo por agora"}
        </T>
        <T variant="bodySmall" style={{ textAlign: "center", marginTop: 6 }}>
          {allDone
            ? morning
              ? `Bom dia — seus ${flow.length} passos de hoje estão registrados.`
              : "Boa noite — seus 2 passos de hoje estão registrados."
            : "Você pode voltar e completar os passos que faltam quando quiser."}
        </T>
        {offerPush && (
          <View
            style={{
              marginTop: 22,
              alignSelf: "stretch",
              backgroundColor: colors.roseSoft,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <T variant="label">Quer um lembrete diário?</T>
            <T variant="bodySmall" style={{ marginTop: 4 }}>
              Avisamos quando faltar algo do dia e quando sua sequência estiver em risco.
            </T>
            <Button
              size="sm"
              title="Ativar lembretes"
              icon={Bell}
              style={{ alignSelf: "flex-start", marginTop: 12 }}
              onPress={async () => {
                const res = await enablePush(profileId);
                onPushHandled();
                if (res.ok) toast.success("Lembretes ativados.");
              }}
            />
          </View>
        )}
        <Button
          title="Concluir"
          style={{ marginTop: 24, alignSelf: "stretch" }}
          onPress={() => router.back()}
        />
      </ScrollView>
    );
  }

  const current = flow[Math.min(index, flow.length - 1)];
  const Icon = current.icon;
  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingTop: 28 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <T variant="eyebrow">{morning ? "Check-in da manhã" : "Check-out da noite"}</T>
        <T variant="caption">
          Passo {index + 1} de {flow.length}
        </T>
      </View>
      <ProgressBar pct={((index + 1) / flow.length) * 100} />
      <View style={{ alignItems: "center", marginTop: 28 }}>
        <IconCircle icon={Icon} size={64} />
        <T variant="title" style={{ textAlign: "center", marginTop: 16 }}>
          {current.title}
        </T>
        <T variant="bodySmall" style={{ textAlign: "center", marginTop: 6 }}>
          {current.subtitle}
        </T>
        {current.done && (
          <T variant="label" style={{ color: colors.roseInk, marginTop: 8, fontSize: 12.5 }}>
            Já registrado hoje ✓
          </T>
        )}
      </View>
      <View style={{ marginTop: 24 }}>{current.render(advance)}</View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18 }}>
        <Button
          variant="ghost"
          size="sm"
          title="Voltar"
          disabled={index === 0}
          onPress={() => setIndex((i) => Math.max(0, i - 1))}
        />
        <Button
          variant="ghost"
          size="sm"
          title={index >= flow.length - 1 ? "Fechar" : "Pular"}
          onPress={advance}
        />
      </View>
    </ScrollView>
  );
}
