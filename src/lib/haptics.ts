import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Feedback tátil — no app nativo substitui os sons curtos do web
 * (mesmos momentos: marcar refeição, salvar check-in, conquistas).
 */
const KEY = "prisma:haptics_enabled";
let enabled = true;

export async function loadHapticsPreference(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    enabled = v !== "0";
  } catch {
    enabled = true;
  }
  return enabled;
}

export async function setHapticsEnabled(next: boolean): Promise<void> {
  enabled = next;
  try {
    await AsyncStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* best-effort */
  }
}

export function hapticsEnabled(): boolean {
  return enabled;
}

export type FeedbackKind = "tap" | "check" | "success" | "achievement" | "error";

export function feedback(kind: FeedbackKind): void {
  if (!enabled) return;
  switch (kind) {
    case "tap":
      void Haptics.selectionAsync();
      break;
    case "check":
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case "success":
    case "achievement":
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case "error":
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
}
