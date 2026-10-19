import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Image as ImageIcon, PenLine, Type } from "lucide-react-native";
import { Button, ErrorText, Input, Pill, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { qk } from "@/hooks/queries";
import { api, ApiError, friendlyError } from "@/lib/api";
import { logMealManual, mealLogFromRow } from "@/lib/data";
import { todayKey } from "@/lib/dayKey";
import { compressImage } from "@/lib/image";
import { fromCamera, fromLibrary } from "@/lib/pickImage";
import { MEAL_TYPE_LABELS, type MealLog, type MealType } from "@/lib/mealLogTypes";
import { feedback } from "@/lib/haptics";
import { colors, radius } from "@/theme/tokens";

const ORDER: MealType[] = ["cafe_da_manha", "almoco", "lanche", "jantar"];
type Tab = "foto" | "texto" | "manual";

function defaultMealType(): MealType {
  const h = new Date().getHours();
  if (h < 10) return "cafe_da_manha";
  if (h < 15) return "almoco";
  if (h < 18) return "lanche";
  return "jantar";
}

/** Registrar refeição por foto (IA), descrição (IA) ou manual — MealLogger do web. */
export default function MealLoggerScreen() {
  const { profileId } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const day = todayKey();
  const [tab, setTab] = useState<Tab>("foto");
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [text, setText] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function done(log: MealLog) {
    queryClient.setQueryData<MealLog[]>(qk.meals(profileId, day), (old) => [...(old ?? []), log]);
    void queryClient.invalidateQueries({ queryKey: qk.meals(profileId, day) });
    feedback("success");
    toast.success(
      log.estimatedCalories != null
        ? `Registrado: ~${log.estimatedCalories} kcal`
        : "Refeição registrada",
    );
    router.back();
  }

  function handleFail(res: { ok: false; error: string }) {
    if (res.error === "SUBSCRIPTION_REQUIRED") {
      router.replace("/assinar");
      return;
    }
    setError(friendlyError(res.error));
  }

  async function fromPhoto(source: "camera" | "library") {
    setError(null);
    const picked = source === "camera" ? await fromCamera() : await fromLibrary();
    if (!picked) return;
    setBusy(true);
    try {
      const img = await compressImage(picked, 1280, 0.85);
      const res = await api.mealFromPhoto({ profileId, day, mealType, imageDataUrl: img.dataUrl });
      if (res.ok) done(mealLogFromRow(res.log));
      else handleFail(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível estimar essa refeição.");
    } finally {
      setBusy(false);
    }
  }

  async function fromText() {
    if (text.trim().length < 2) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.mealFromText({ profileId, day, mealType, description: text.trim() });
      if (res.ok) done(mealLogFromRow(res.log));
      else handleFail(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível estimar essa refeição.");
    } finally {
      setBusy(false);
    }
  }

  async function manual() {
    const kcal = Number(manualKcal.replace(",", "."));
    if (manualDesc.trim().length < 2 || !kcal || kcal <= 0) return;
    setError(null);
    setBusy(true);
    try {
      done(
        await logMealManual({
          profileId,
          day,
          mealType,
          description: manualDesc.trim(),
          estimatedCalories: kcal,
        }),
      );
    } catch {
      setError("Não foi possível salvar essa refeição.");
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Camera }[] = [
    { key: "foto", label: "Foto", icon: Camera },
    { key: "texto", label: "Descrever", icon: Type },
    { key: "manual", label: "Manual", icon: PenLine },
  ];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <T variant="title">Registrar refeição</T>
      <T variant="caption" style={{ marginTop: 4 }}>
        Estimativa rápida e aproximada — não é cálculo clínico.
      </T>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 16 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {ORDER.map((mt) => (
          <Pill
            key={mt}
            label={MEAL_TYPE_LABELS[mt]}
            active={mealType === mt}
            onPress={() => setMealType(mt)}
          />
        ))}
      </ScrollView>

      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                feedback("tap");
                setTab(key);
                setError(null);
              }}
              style={[styles.tab, active && { backgroundColor: colors.roseSoft }]}
            >
              <Icon size={15} color={active ? colors.roseInk : colors.inkFaint} />
              <T
                variant="label"
                style={{ fontSize: 12.5, color: active ? colors.roseInk : colors.inkFaint }}
              >
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 16 }}>
        {tab === "foto" && (
          <View style={{ gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => fromPhoto("camera")}
              style={({ pressed }) => [styles.drop, (pressed || busy) && { opacity: 0.7 }]}
            >
              <Camera size={28} color={colors.roseInk} />
              <T variant="label" style={{ color: colors.ink }}>
                {busy ? "Estimando calorias…" : "Fotografar a refeição"}
              </T>
              <T variant="caption">A IA identifica o prato e estima calorias e macros.</T>
            </Pressable>
            <Button
              variant="secondary"
              title="Escolher da galeria"
              icon={ImageIcon}
              disabled={busy}
              onPress={() => fromPhoto("library")}
            />
          </View>
        )}

        {tab === "texto" && (
          <View>
            <Input
              value={text}
              onChangeText={setText}
              placeholder="Ex.: prato de arroz, feijão, frango grelhado e salada"
              multiline
              maxLength={300}
              style={{ minHeight: 96, textAlignVertical: "top" }}
            />
            <Button
              title="Estimar e registrar"
              icon={Check}
              loading={busy}
              disabled={text.trim().length < 2}
              onPress={fromText}
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {tab === "manual" && (
          <View style={{ gap: 10 }}>
            <Input
              value={manualDesc}
              onChangeText={setManualDesc}
              placeholder="O que você comeu?"
              maxLength={200}
            />
            <Input
              value={manualKcal}
              onChangeText={(v) => setManualKcal(v.replace(/[^\d,.]/g, ""))}
              placeholder="Calorias (kcal)"
              keyboardType="decimal-pad"
            />
            <Button
              title="Registrar"
              icon={Check}
              loading={busy}
              disabled={manualDesc.trim().length < 2 || !manualKcal}
              onPress={manual}
            />
          </View>
        )}
        <ErrorText>{error}</ErrorText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", gap: 6, marginTop: 14 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 11,
    backgroundColor: colors.white,
  },
  drop: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
});
