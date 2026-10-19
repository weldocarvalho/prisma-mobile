import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as Application from "expo-application";
import { supabase } from "@/lib/supabase";

/**
 * Notificações push nativas (Expo Push → APNs/FCM). O token do aparelho fica
 * em public.mobile_push_tokens e o backend envia pelo mesmo
 * sendPushToProfile() que já atende o web-push.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushPermission = "granted" | "denied" | "undetermined";

export async function getPushPermission(): Promise<PushPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PushPermission;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Lembretes",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#b3617a",
  });
}

function projectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

/** Pede permissão (se preciso), obtém o token e registra no perfil. */
export async function enablePush(profileId: string): Promise<{ ok: boolean; reason?: string }> {
  if (!Device.isDevice) return { ok: false, reason: "Push só funciona em aparelho físico." };
  await ensureAndroidChannel();

  let status = await getPushPermission();
  if (status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status as PushPermission;
  }
  if (status !== "granted") return { ok: false, reason: "denied" };

  const id = projectId();
  if (!id) return { ok: false, reason: "EAS projectId ausente (configure EAS_PROJECT_ID)." };

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
  const { error } = await supabase.rpc("register_mobile_push_token", {
    _profile_id: profileId,
    _token: token,
    _platform: Platform.OS === "ios" ? "ios" : "android",
    _device_name: Device.modelName ?? undefined,
    _app_version: Application.nativeApplicationVersion ?? undefined,
  });
  if (error) return { ok: false, reason: error.message };

  await supabase
    .from("nutrition_profiles")
    .update({ notify_push_enabled: true })
    .eq("id", profileId);
  return { ok: true };
}

/** Atualiza o token silenciosamente (sem pedir permissão) — chamado ao abrir o app. */
export async function refreshPushToken(profileId: string): Promise<void> {
  try {
    if (!Device.isDevice || (await getPushPermission()) !== "granted") return;
    const id = projectId();
    if (!id) return;
    await ensureAndroidChannel();
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await supabase.rpc("register_mobile_push_token", {
      _profile_id: profileId,
      _token: token,
      _platform: Platform.OS === "ios" ? "ios" : "android",
      _device_name: Device.modelName ?? undefined,
      _app_version: Application.nativeApplicationVersion ?? undefined,
    });
  } catch (err) {
    console.warn("[push] refresh do token falhou:", err);
  }
}

export async function disablePush(profileId: string): Promise<void> {
  try {
    const id = projectId();
    if (id && Device.isDevice) {
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
      await supabase.from("mobile_push_tokens").delete().eq("token", token);
    }
  } catch (err) {
    console.warn("[push] remoção do token falhou:", err);
  } finally {
    await supabase
      .from("nutrition_profiles")
      .update({ notify_push_enabled: false })
      .eq("id", profileId);
  }
}

/** Remove o token deste aparelho ao sair da conta (para não receber avisos de outra pessoa). */
export async function forgetDeviceToken(): Promise<void> {
  try {
    const id = projectId();
    if (!id || !Device.isDevice || (await getPushPermission()) !== "granted") return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await supabase.from("mobile_push_tokens").delete().eq("token", token);
  } catch {
    /* best-effort */
  }
}

/** Converte a URL do aviso (mesmos caminhos do web: /today, /routine...) numa rota do app. */
export function routeFromNotification(data: unknown): string | null {
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || !url.startsWith("/")) return null;
  let path = url;
  try {
    const u = new URL(url, "https://app.local");
    path = u.pathname + u.search;
  } catch {
    /* mantém */
  }
  const known = [
    "/",
    "/today",
    "/routine",
    "/progress",
    "/challenges",
    "/profile",
    "/tips",
    "/journal",
    "/assinar",
    "/onboarding",
  ];
  const base = path.split("?")[0];
  return known.includes(base) ? path : "/";
}
