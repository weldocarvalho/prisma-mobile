import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react-native";
import {
  Button,
  Card,
  Choice,
  FieldLabel,
  IconCircle,
  Input,
  Loading,
  ProgressBar,
  T,
} from "@/components/ui";
import { PaywallGate } from "@/components/Gates";
import { useAuth } from "@/providers/AuthProvider";
import { qk } from "@/hooks/queries";
import { api, ApiError, friendlyError } from "@/lib/api";
import { fetchProfile, updateProfile, type ProfileUpdate } from "@/lib/data";
import { computeDailyTargets } from "@/lib/nutritionTargets";
import {
  computeAttemptState,
  formatDateBR,
  formatDaysUntil,
  MAX_ATTEMPTS_PER_CYCLE,
} from "@/lib/routineAttempts";
import { nowMs, todayKey } from "@/lib/dayKey";
import { feedback } from "@/lib/haptics";
import { colors, fonts } from "@/theme/tokens";

// ---------------------------------------------------------------- opções (iguais ao web)
const GOALS = [
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "manutencao", label: "Manutenção do peso" },
  { value: "ganho_de_massa", label: "Ganho de massa" },
];
// O banco aceita 'feminino' | 'masculino' | 'prefiro_nao_informar'.
const BIOLOGICAL_SEX = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "prefiro_nao_informar", label: "Outro" },
];
const ACTIVITY_LEVELS = [
  { value: "sedentario", label: "Sedentário", helper: "Pouco ou nenhum exercício" },
  { value: "leve", label: "Leve", helper: "Exercício leve, 1 a 3x por semana" },
  { value: "moderado", label: "Moderado", helper: "Exercício moderado, 3 a 5x por semana" },
  { value: "intenso", label: "Intenso", helper: "Exercício intenso quase todo dia" },
];
const DIETARY_STYLES = [
  { value: "onivoro", label: "Onívoro" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "low_carb", label: "Low carb" },
  { value: "flexitariano", label: "Flexitariano" },
];
const ALLERGIES = [
  { value: "lactose", label: "Lactose" },
  { value: "gluten", label: "Glúten" },
  { value: "amendoim", label: "Amendoim" },
  { value: "frutos_do_mar", label: "Frutos do mar" },
  { value: "ovo", label: "Ovo" },
  { value: "soja", label: "Soja" },
];
const FOODS_TO_AVOID = [
  "Carne vermelha",
  "Frituras",
  "Doces e açúcar",
  "Refrigerante",
  "Laticínios",
  "Álcool",
];
const EXPERIENCE = [
  { value: "beginner", label: "Iniciante", helper: "Primeira vez seguindo um plano alimentar" },
  { value: "intermediate", label: "Intermediário", helper: "Já tentei outras dietas antes" },
  { value: "advanced", label: "Avançado", helper: "Já tenho bastante experiência com nutrição" },
];
const TIME = [
  { value: "short", label: "Curto", helper: "< 15 min/dia" },
  { value: "medium", label: "Médio", helper: "15-30 min/dia" },
  { value: "long", label: "Longo", helper: "> 30 min/dia" },
];
const BUDGET = [
  { value: "low", label: "Baixo", helper: "Custo-benefício" },
  { value: "medium", label: "Médio", helper: "Equilíbrio" },
  { value: "high", label: "Alto", helper: "Sem restrição" },
];

type Form = {
  goal: string;
  biological_sex: string;
  birth_date: string;
  height_cm: string;
  current_weight_kg: string;
  target_weight_kg: string;
  activity_level: string;
  dietary_style: string;
  experience_level: string;
  pregnancy_or_breastfeeding: boolean | null;
  allergies: string[];
  foods_to_avoid: string[];
  time_availability: string;
  budget_level: string;
};

const EMPTY: Form = {
  goal: "",
  biological_sex: "",
  birth_date: "",
  height_cm: "",
  current_weight_kg: "",
  target_weight_kg: "",
  activity_level: "",
  dietary_style: "",
  experience_level: "",
  pregnancy_or_breastfeeding: null,
  allergies: [],
  foods_to_avoid: [],
  time_availability: "",
  budget_level: "",
};

const num = (v: string) => Number(v.replace(",", "."));
const validNumber = (v: string, min: number, max: number) => !!v && num(v) >= min && num(v) <= max;

type StepDef = {
  id: string;
  valid: (f: Form) => boolean;
  autoAdvance?: boolean;
  title: string;
  helper: string;
};

const STEPS: StepDef[] = [
  {
    id: "goal",
    valid: (f) => !!f.goal,
    autoAdvance: true,
    title: "Qual é seu objetivo?",
    helper: "Isso guia todo o resto do seu plano.",
  },
  {
    id: "sex",
    valid: (f) => !!f.biological_sex,
    autoAdvance: true,
    title: "Qual seu sexo biológico?",
    helper: "Usamos isso para calcular suas metas nutricionais.",
  },
  {
    id: "body",
    valid: (f) =>
      !!f.birth_date &&
      validNumber(f.height_cm, 100, 250) &&
      validNumber(f.current_weight_kg, 30, 300) &&
      validNumber(f.target_weight_kg, 30, 300),
    title: "Um pouco sobre seu corpo",
    helper: "Essencial para calcular suas metas com precisão.",
  },
  {
    id: "activity",
    valid: (f) => !!f.activity_level,
    autoAdvance: true,
    title: "Qual seu nível de atividade física?",
    helper: "Ajuda a calcular quanto você precisa comer.",
  },
  {
    id: "diet",
    valid: (f) => !!f.dietary_style,
    autoAdvance: true,
    title: "Qual seu estilo alimentar?",
    helper: "A IA monta o cardápio em cima disso.",
  },
  {
    id: "experience",
    valid: (f) => !!f.experience_level,
    autoAdvance: true,
    title: "Qual sua experiência com planos alimentares?",
    helper: "A IA calibra o nível de detalhe com base nisso.",
  },
  {
    id: "restrictions",
    valid: (f) => (f.biological_sex === "feminino" ? f.pregnancy_or_breastfeeding !== null : true),
    title: "Restrições importantes",
    helper: "Crucial para o plano ser seguro.",
  },
  {
    id: "context",
    valid: (f) => !!f.time_availability && !!f.budget_level,
    title: "Seu contexto de vida",
    helper: "Tempo disponível e orçamento.",
  },
];

type Stage = "loading" | "blocked" | "wizard" | "generating" | "error" | "locked";

function Row({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 8 }}>{children}</View>;
}

function OptionText({
  label,
  helper,
  selected,
}: {
  label: string;
  helper?: string;
  selected?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1 }}>
        <T variant="label" style={{ fontSize: 14.5 }}>
          {label}
        </T>
        {helper ? <T variant="caption">{helper}</T> : null}
      </View>
      {selected ? <Check size={16} color={colors.roseInk} /> : null}
    </View>
  );
}

function birthDateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function OnboardingScreen() {
  const { profileId, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<Stage>("loading");
  const [form, setForm] = useState<Form>(EMPTY);
  const [index, setIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [availableAt, setAvailableAt] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDate, setShowDate] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [slide] = useState(() => new Animated.Value(0));

  // Estado de tentativas e respostas anteriores (para refazer sem digitar tudo de novo).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await fetchProfile(profileId).catch(() => null);
      if (cancelled) return;
      const state = computeAttemptState(p?.plan_attempt_count ?? 0, p?.plan_confirmed_at ?? null);
      if (p?.onboarded_at) {
        setForm({
          goal: p.goal ?? "",
          biological_sex: p.biological_sex ?? "",
          birth_date: p.birth_date ?? "",
          height_cm: p.height_cm != null ? String(p.height_cm) : "",
          current_weight_kg: p.current_weight_kg != null ? String(p.current_weight_kg) : "",
          target_weight_kg: p.target_weight_kg != null ? String(p.target_weight_kg) : "",
          activity_level: p.activity_level ?? "",
          dietary_style: p.dietary_style ?? "",
          experience_level: p.experience_level ?? "",
          pregnancy_or_breastfeeding:
            p.biological_sex === "feminino" ? !!p.pregnancy_or_breastfeeding : null,
          allergies: Array.isArray(p.allergies)
            ? (p.allergies as { category?: string; value?: string }[])
                .map((a) => a.value || a.category || "")
                .filter(Boolean)
            : [],
          foods_to_avoid: p.foods_to_avoid ?? [],
          time_availability: p.time_availability ?? "",
          budget_level: p.budget_level ?? "",
        });
      }
      if (state.blocked) {
        setAvailableAt(state.availableAt);
        setStage("blocked");
      } else {
        setAttemptNumber(state.attemptCountForCycle + 1);
        setStage("wizard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const valid = step?.valid(form) ?? false;

  function animateIn(direction: 1 | -1) {
    slide.setValue(direction * 24);
    Animated.timing(slide, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function goForward(next: Form) {
    if (!STEPS[index].valid(next)) return;
    if (index >= STEPS.length - 1) {
      void generate(next);
      return;
    }
    setIndex((i) => i + 1);
    animateIn(1);
  }

  function set(patch: Partial<Form>) {
    const next = { ...form, ...patch };
    setForm(next);
    if (step.autoAdvance && step.valid(next)) setTimeout(() => goForward(next), 160);
  }

  function back() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    animateIn(-1);
  }

  async function generate(f: Form) {
    setStage("generating");
    setErrorMsg("");
    const t0 = nowMs();
    try {
      const payload: ProfileUpdate = {
        goal: f.goal,
        biological_sex: f.biological_sex,
        birth_date: f.birth_date || null,
        height_cm: f.height_cm ? num(f.height_cm) : null,
        current_weight_kg: f.current_weight_kg ? num(f.current_weight_kg) : null,
        target_weight_kg: f.target_weight_kg ? num(f.target_weight_kg) : null,
        activity_level: f.activity_level,
        dietary_style: f.dietary_style,
        experience_level: f.experience_level,
        pregnancy_or_breastfeeding: !!f.pregnancy_or_breastfeeding,
        allergies: f.allergies.map((value) => ({ category: value, value })),
        foods_to_avoid: f.foods_to_avoid,
        time_availability: f.time_availability,
        budget_level: f.budget_level,
      };
      const targets = computeDailyTargets({
        goal: f.goal,
        biological_sex: f.biological_sex,
        birth_date: f.birth_date || null,
        height_cm: payload.height_cm,
        current_weight_kg: payload.current_weight_kg,
        activity_level: f.activity_level,
        pregnancy_or_breastfeeding: !!f.pregnancy_or_breastfeeding,
      });
      if (targets) Object.assign(payload, targets);
      await updateProfile(profileId, payload);

      const startedAt = new Date().toISOString();
      let routineId: string | null = null;
      try {
        const res = await api.generatePlan(profileId);
        if (res.ok) {
          routineId = res.routineId;
        } else if (res.error === "SUBSCRIPTION_REQUIRED") {
          setStage("locked");
          return;
        } else if (res.error === "COOLDOWN_ACTIVE") {
          const at = res.availableAt ? new Date(res.availableAt) : null;
          throw new Error(
            at
              ? `Seu plano definitivo ainda está no período de 30 dias. Você poderá gerar um novo ${formatDaysUntil(at)} (${formatDateBR(at)}).`
              : "Seu plano definitivo ainda está no período de 30 dias.",
          );
        } else if (res.error === "ATTEMPTS_EXHAUSTED") {
          throw new Error("Você já utilizou suas tentativas disponíveis neste ciclo.");
        } else {
          throw new Error(friendlyError(res.error));
        }
      } catch (err) {
        // Conexão caiu/demorou: a geração continua no servidor — acompanha até o plano aparecer.
        if (
          !(err instanceof ApiError) ||
          (err.code !== "TIMEOUT" && err.code !== "NETWORK" && err.status < 500)
        )
          throw err;
        const deadline = nowMs() + 90_000;
        while (nowMs() < deadline && !routineId) {
          await new Promise((r) => setTimeout(r, 3000));
          const check = await api.checkLatestPlan(profileId).catch(() => null);
          if (check?.ok && check.routine && check.routine.createdAt > startedAt)
            routineId = check.routine.id;
          if (check && !check.ok && check.error === "SUBSCRIPTION_REQUIRED") {
            setStage("locked");
            return;
          }
        }
        if (!routineId) throw new Error("Demorou mais do que o esperado. Tente novamente.");
      }

      void api.reportWait(profileId, routineId, nowMs() - t0).catch(() => {});
      feedback("achievement");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.plan(profileId) }),
        queryClient.invalidateQueries({ queryKey: qk.profile(profileId) }),
        refreshProfile(),
      ]);
      router.replace("/routine");
    } catch (e) {
      feedback("error");
      setErrorMsg(e instanceof Error ? e.message : "Erro ao gerar seu plano.");
      setStage("error");
    }
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  if (stage === "loading") {
    return (
      <SafeAreaView style={styles.safe}>
        <Loading style={{ flex: 1, justifyContent: "center" }} />
      </SafeAreaView>
    );
  }

  if (stage === "locked") {
    return (
      <SafeAreaView style={[styles.safe, { padding: 20, justifyContent: "center" }]}>
        <PaywallGate feature="A geração do plano personalizado" />
        <Button variant="ghost" title="Voltar" onPress={close} style={{ marginTop: 12 }} />
      </SafeAreaView>
    );
  }

  if (stage === "blocked") {
    return (
      <SafeAreaView style={[styles.safe, { padding: 20, justifyContent: "center" }]}>
        <Card style={{ alignItems: "center", padding: 24 }}>
          <IconCircle icon={Sparkles} size={52} />
          <T variant="title" style={{ textAlign: "center", marginTop: 14 }}>
            Seu plano definitivo ainda está valendo
          </T>
          <T variant="bodySmall" style={{ textAlign: "center", marginTop: 8 }}>
            {availableAt
              ? `Você poderá gerar um novo plano ${formatDaysUntil(availableAt)}, em ${formatDateBR(availableAt)}.`
              : "Você poderá gerar um novo plano em breve."}
          </T>
          <Button
            title="Ver meu plano"
            style={{ marginTop: 18 }}
            onPress={() => router.replace("/routine")}
          />
        </Card>
      </SafeAreaView>
    );
  }

  if (stage === "generating") return <Generating />;

  if (stage === "error") {
    return (
      <SafeAreaView style={[styles.safe, { padding: 20, justifyContent: "center" }]}>
        <Card style={{ alignItems: "center", padding: 24 }}>
          <T variant="title" style={{ textAlign: "center" }}>
            Algo deu errado
          </T>
          <T variant="bodySmall" style={{ textAlign: "center", marginTop: 8 }}>
            {errorMsg}
          </T>
          <Button title="Tentar de novo" style={{ marginTop: 18 }} onPress={() => generate(form)} />
          <Button variant="ghost" title="Revisar respostas" onPress={() => setStage("wizard")} />
        </Card>
      </SafeAreaView>
    );
  }

  const progress = ((index + 1) / STEPS.length) * 100;
  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            hitSlop={10}
            onPress={close}
          >
            <X size={22} color={colors.inkSoft} />
          </Pressable>
          <T variant="eyebrow">
            {attemptNumber > 1
              ? `Tentativa ${attemptNumber} de ${MAX_ATTEMPTS_PER_CYCLE}`
              : "Personalização"}
          </T>
        </View>
        <T variant="title" style={{ marginTop: 12 }}>
          Conta pra gente sobre você
        </T>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          <T variant="caption">
            Passo {index + 1} de {STEPS.length}
          </T>
          <T variant="caption">{Math.round(progress)}%</T>
        </View>
        <ProgressBar pct={progress} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Animated.View style={{ transform: [{ translateX: slide }] }}>
          <Card style={{ padding: 20 }}>
            <T variant="heading" accessibilityRole="header">
              {step.title}
            </T>
            <T variant="bodySmall" style={{ marginTop: 4, marginBottom: 18 }}>
              {step.helper}
            </T>

            {step.id === "goal" && (
              <View style={{ gap: 8 }}>
                {GOALS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={form.goal === o.value}
                    onPress={() => set({ goal: o.value })}
                  >
                    <OptionText label={o.label} selected={form.goal === o.value} />
                  </Choice>
                ))}
              </View>
            )}

            {step.id === "sex" && (
              <Row>
                {BIOLOGICAL_SEX.map((o) => (
                  <Choice
                    key={o.value}
                    style={{ flex: 1, alignItems: "center" }}
                    selected={form.biological_sex === o.value}
                    onPress={() =>
                      set({
                        biological_sex: o.value,
                        pregnancy_or_breastfeeding:
                          o.value === "feminino" ? form.pregnancy_or_breastfeeding : null,
                      })
                    }
                  >
                    <T variant="label">{o.label}</T>
                  </Choice>
                ))}
              </Row>
            )}

            {step.id === "body" && (
              <View>
                <FieldLabel>Data de nascimento</FieldLabel>
                <Pressable accessibilityRole="button" onPress={() => setShowDate(true)}>
                  <View pointerEvents="none">
                    <Input
                      value={
                        form.birth_date
                          ? birthDateFromKey(form.birth_date).toLocaleDateString("pt-BR")
                          : ""
                      }
                      placeholder="Toque para escolher"
                      editable={false}
                    />
                  </View>
                </Pressable>
                {showDate && (
                  <View>
                    <DateTimePicker
                      value={
                        form.birth_date ? birthDateFromKey(form.birth_date) : new Date(1995, 0, 1)
                      }
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      maximumDate={new Date()}
                      minimumDate={new Date(1920, 0, 1)}
                      locale="pt-BR"
                      onChange={(e: DateTimePickerEvent, d?: Date) => {
                        if (Platform.OS === "android") setShowDate(false);
                        if (e.type === "set" && d)
                          setForm((f) => ({ ...f, birth_date: todayKey(d) }));
                      }}
                    />
                    {Platform.OS === "ios" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        title="Pronto"
                        onPress={() => setShowDate(false)}
                      />
                    )}
                  </View>
                )}
                <FieldLabel style={{ marginTop: 16 }}>Altura (cm)</FieldLabel>
                <Input
                  value={form.height_cm}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, height_cm: v.replace(/[^\d]/g, "") }))
                  }
                  keyboardType="number-pad"
                  placeholder="Ex.: 170"
                  maxLength={3}
                />
                <FieldLabel style={{ marginTop: 16 }}>Peso atual (kg)</FieldLabel>
                <Input
                  value={form.current_weight_kg}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, current_weight_kg: v.replace(/[^\d,.]/g, "") }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Ex.: 75"
                  maxLength={5}
                />
                <FieldLabel style={{ marginTop: 16 }}>Peso alvo (kg)</FieldLabel>
                <Input
                  value={form.target_weight_kg}
                  onChangeText={(v) =>
                    setForm((f) => ({ ...f, target_weight_kg: v.replace(/[^\d,.]/g, "") }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Ex.: 68"
                  maxLength={5}
                />
              </View>
            )}

            {step.id === "activity" && (
              <View style={{ gap: 8 }}>
                {ACTIVITY_LEVELS.map((o) => (
                  <Choice
                    key={o.value}
                    selected={form.activity_level === o.value}
                    onPress={() => set({ activity_level: o.value })}
                  >
                    <OptionText
                      label={o.label}
                      helper={o.helper}
                      selected={form.activity_level === o.value}
                    />
                  </Choice>
                ))}
              </View>
            )}

            {step.id === "diet" && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {DIETARY_STYLES.map((o) => (
                  <Choice
                    key={o.value}
                    style={{ flexBasis: "47%", flexGrow: 1 }}
                    selected={form.dietary_style === o.value}
                    onPress={() => set({ dietary_style: o.value })}
                  >
                    <T variant="label">{o.label}</T>
                  </Choice>
                ))}
              </View>
            )}

            {step.id === "experience" && (
              <View style={{ gap: 8 }}>
                {EXPERIENCE.map((o) => (
                  <Choice
                    key={o.value}
                    selected={form.experience_level === o.value}
                    onPress={() => set({ experience_level: o.value })}
                  >
                    <OptionText
                      label={o.label}
                      helper={o.helper}
                      selected={form.experience_level === o.value}
                    />
                  </Choice>
                ))}
              </View>
            )}

            {step.id === "restrictions" && (
              <View>
                {form.biological_sex === "feminino" && (
                  <View style={{ marginBottom: 20 }}>
                    <FieldLabel>Está grávida ou amamentando?</FieldLabel>
                    <Row>
                      <Choice
                        style={{ flex: 1, alignItems: "center" }}
                        selected={form.pregnancy_or_breastfeeding === true}
                        onPress={() => setForm((f) => ({ ...f, pregnancy_or_breastfeeding: true }))}
                      >
                        <T variant="label">Sim</T>
                      </Choice>
                      <Choice
                        style={{ flex: 1, alignItems: "center" }}
                        selected={form.pregnancy_or_breastfeeding === false}
                        onPress={() =>
                          setForm((f) => ({ ...f, pregnancy_or_breastfeeding: false }))
                        }
                      >
                        <T variant="label">Não</T>
                      </Choice>
                    </Row>
                  </View>
                )}
                <FieldLabel>
                  Tem alguma alergia alimentar? <T variant="caption">(opcional)</T>
                </FieldLabel>
                <View style={{ gap: 6 }}>
                  {ALLERGIES.map((o) => {
                    const active = form.allergies.includes(o.value);
                    return (
                      <Choice
                        key={o.value}
                        selected={active}
                        onPress={() =>
                          setForm((f) => ({ ...f, allergies: toggleIn(f.allergies, o.value) }))
                        }
                        style={{ paddingVertical: 12 }}
                      >
                        <OptionText label={o.label} selected={active} />
                      </Choice>
                    );
                  })}
                </View>
                <FieldLabel style={{ marginTop: 20 }}>
                  Algum alimento que prefere evitar? <T variant="caption">(opcional)</T>
                </FieldLabel>
                <View style={{ gap: 6 }}>
                  {FOODS_TO_AVOID.map((v) => {
                    const active = form.foods_to_avoid.includes(v);
                    return (
                      <Choice
                        key={v}
                        selected={active}
                        onPress={() =>
                          setForm((f) => ({ ...f, foods_to_avoid: toggleIn(f.foods_to_avoid, v) }))
                        }
                        style={{ paddingVertical: 12 }}
                      >
                        <OptionText label={v} selected={active} />
                      </Choice>
                    );
                  })}
                </View>
              </View>
            )}

            {step.id === "context" && (
              <View>
                <FieldLabel>Quanto tempo você tem por dia para preparar refeições?</FieldLabel>
                <Row>
                  {TIME.map((o) => (
                    <Choice
                      key={o.value}
                      style={{ flex: 1, alignItems: "center", paddingHorizontal: 6 }}
                      selected={form.time_availability === o.value}
                      onPress={() => setForm((f) => ({ ...f, time_availability: o.value }))}
                    >
                      <T variant="label">{o.label}</T>
                      <T variant="caption" style={{ fontSize: 10.5, textAlign: "center" }}>
                        {o.helper}
                      </T>
                    </Choice>
                  ))}
                </Row>
                <FieldLabel style={{ marginTop: 20 }}>Orçamento para alimentação?</FieldLabel>
                <Row>
                  {BUDGET.map((o) => (
                    <Choice
                      key={o.value}
                      style={{ flex: 1, alignItems: "center", paddingHorizontal: 6 }}
                      selected={form.budget_level === o.value}
                      onPress={() => setForm((f) => ({ ...f, budget_level: o.value }))}
                    >
                      <T variant="label">{o.label}</T>
                      <T variant="caption" style={{ fontSize: 10.5, textAlign: "center" }}>
                        {o.helper}
                      </T>
                    </Choice>
                  ))}
                </Row>
              </View>
            )}
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="secondary"
          title="Voltar"
          icon={ArrowLeft}
          disabled={index === 0}
          onPress={back}
        />
        <Button
          title={isLast ? "Gerar meu plano" : "Continuar"}
          icon={isLast ? Sparkles : undefined}
          iconRight={isLast ? undefined : ArrowRight}
          disabled={!valid}
          onPress={() => goForward(form)}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const PHASES = [
  {
    icon: ScanFace,
    title: "Analisando seu perfil…",
    description: "Suas respostas, seu objetivo e seus hábitos alimentares.",
  },
  {
    icon: ShieldCheck,
    title: "Verificando restrições e alergias…",
    description: "Nada fora das suas alergias e restrições alimentares.",
  },
  {
    icon: Brain,
    title: "Cruzando com o seu contexto",
    description: "Tempo disponível, orçamento e estilo de vida.",
  },
  { icon: Wand2, title: "Montando o seu plano…", description: "Refeições, porções e horários." },
  {
    icon: CheckCircle2,
    title: "Finalizando os detalhes",
    description: "Revisando tudo para você. Quase lá!",
  },
];

function Generating() {
  const [phase, setPhase] = useState(0);
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const timer = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 3000);
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      clearInterval(timer);
      loop.stop();
    };
  }, [spin]);
  const current = PHASES[phase];
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <SafeAreaView style={[styles.safe, { padding: 20, justifyContent: "center" }]}>
      <Card style={{ alignItems: "center", padding: 28 }}>
        <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
          <View
            style={{
              position: "absolute",
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: colors.roseSoft,
            }}
          />
          <current.icon size={30} color={colors.roseInk} />
        </View>
        <T
          variant="title"
          accessibilityLiveRegion="polite"
          style={{ textAlign: "center", marginTop: 22, fontFamily: fonts.display }}
        >
          {current.title}
        </T>
        <T variant="bodySmall" style={{ textAlign: "center", marginTop: 6 }}>
          {current.description}
        </T>
        <T variant="caption" style={{ textAlign: "center", marginTop: 16 }}>
          Pode levar até 1 minuto. Não feche o app.
        </T>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.paper,
  },
  spinner: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "rgba(179,97,122,0.25)",
    borderTopColor: colors.rose,
  },
});
