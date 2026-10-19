import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabase";
import { todayKey } from "@/lib/dayKey";
import { PROFILE_IMAGE_BUCKET } from "@/lib/config";
import { base64ToArrayBuffer } from "@/lib/image";
import type { Checks } from "@/lib/streak";
import type { MealLog, MealType } from "@/lib/mealLogTypes";
import type { MealSlot, NutritionPlan, Profile } from "@/lib/routineTypes";
import type { Database } from "@/lib/database.types";

/**
 * Leituras e escritas diretas no Supabase (RLS garante que cada pessoa só
 * mexe nos próprios dados) — as mesmas consultas dos hooks do app web.
 */

export type ProfileRow = Database["public"]["Tables"]["nutrition_profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["nutrition_profiles"]["Update"];

// ---------------------------------------------------------------- perfil
export async function fetchProfile(profileId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("nutrition_profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(profileId: string, patch: ProfileUpdate): Promise<void> {
  const { error } = await supabase.from("nutrition_profiles").update(patch).eq("id", profileId);
  if (error) throw error;
}

export function asProfile(row: ProfileRow): Profile {
  return row as unknown as Profile;
}

export function allergyLabels(allergies: unknown): string[] {
  if (!Array.isArray(allergies)) return [];
  return (allergies as { category?: string; value?: string }[])
    .map((a) => a.value || a.category || "")
    .filter(Boolean);
}

// ---------------------------------------------------------------- plano
export type CurrentPlan = {
  id: string;
  plan: NutritionPlan;
  isConfirmed: boolean;
  attemptNumber: number | null;
};

export async function fetchCurrentPlan(profileId: string): Promise<CurrentPlan | null> {
  const { data, error } = await supabase
    .from("nutrition_plans")
    .select(
      "id, daily_meal_structure, summary, recommended_foods, foods_to_moderate, adaptation_tips, weekly_plan, is_confirmed, attempt_number",
    )
    .eq("profile_id", profileId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    isConfirmed: !!data.is_confirmed,
    attemptNumber: (data.attempt_number as number | null) ?? null,
    plan: {
      daily_meal_structure: Array.isArray(data.daily_meal_structure)
        ? (data.daily_meal_structure as unknown as MealSlot[])
        : [],
      summary: (data.summary as string | null) ?? null,
      recommended_foods:
        (data.recommended_foods as unknown as NutritionPlan["recommended_foods"]) ?? [],
      foods_to_moderate:
        (data.foods_to_moderate as unknown as NutritionPlan["foods_to_moderate"]) ?? [],
      adaptation_tips: (data.adaptation_tips as unknown as string[]) ?? [],
      weekly_plan: (data.weekly_plan as unknown as NutritionPlan["weekly_plan"]) ?? null,
    },
  };
}

// ---------------------------------------------------------------- marcações do plano
export function checkKey(period: string, step: number, day: string) {
  return `${period}:${step}:${day}`;
}

export async function fetchChecks(profileId: string): Promise<Checks> {
  const { data, error } = await supabase
    .from("plan_adherence_checks")
    .select("period, step, day")
    .eq("profile_id", profileId);
  if (error) throw error;
  const checks: Checks = {};
  for (const row of data ?? []) checks[checkKey(row.period, row.step, row.day)] = true;
  return checks;
}

export async function setCheck(
  profileId: string,
  period: string,
  step: number,
  day: string,
  done: boolean,
): Promise<void> {
  if (done) {
    const { error } = await supabase
      .from("plan_adherence_checks")
      .upsert(
        { profile_id: profileId, period, step, day },
        { onConflict: "profile_id,day,period,step", ignoreDuplicates: true },
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("plan_adherence_checks")
      .delete()
      .eq("profile_id", profileId)
      .eq("period", period)
      .eq("step", step)
      .eq("day", day);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------- refeições registradas
export type MealLogRow = {
  id: string;
  profile_id: string;
  day: string;
  meal_type: string;
  description: string | null;
  logged_via: string;
  estimated_calories: number | null;
  estimated_protein_g: number | null;
  estimated_carbs_g: number | null;
  estimated_fat_g: number | null;
  ai_confidence: string | null;
  created_at: string;
};

export function mealLogFromRow(row: MealLogRow): MealLog {
  return {
    id: row.id,
    profileId: row.profile_id,
    day: row.day,
    mealType: row.meal_type as MealType,
    description: row.description,
    loggedVia: row.logged_via as MealLog["loggedVia"],
    estimatedCalories: row.estimated_calories,
    estimatedProteinG: row.estimated_protein_g,
    estimatedCarbsG: row.estimated_carbs_g,
    estimatedFatG: row.estimated_fat_g,
    aiConfidence: row.ai_confidence as MealLog["aiConfidence"],
    createdAt: row.created_at,
  };
}

export async function listMealLogsForDay(profileId: string, day: string): Promise<MealLog[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("*")
    .eq("profile_id", profileId)
    .eq("day", day)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mealLogFromRow(row as MealLogRow));
}

export async function logMealManual(p: {
  profileId: string;
  day: string;
  mealType: MealType;
  description: string;
  estimatedCalories: number;
}): Promise<MealLog> {
  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      profile_id: p.profileId,
      day: p.day,
      meal_type: p.mealType,
      description: p.description,
      logged_via: "manual",
      estimated_calories: Math.round(p.estimatedCalories),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mealLogFromRow(data as MealLogRow);
}

export async function deleteMealLog(profileId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from("meal_logs")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);
  if (error) throw error;
}

// ---------------------------------------------------------------- check-in / check-out
export async function fetchCheckIn(profileId: string, day: string) {
  const { data, error } = await supabase
    .from("check_ins")
    .select("id, sleep_hours")
    .eq("profile_id", profileId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, sleepHours: Number(data.sleep_hours) } : null;
}

export async function saveSleep(profileId: string, day: string, hours: number, id?: string | null) {
  if (id) {
    const { error } = await supabase.from("check_ins").update({ sleep_hours: hours }).eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase
    .from("check_ins")
    .insert({ profile_id: profileId, day, sleep_hours: hours })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchCheckOut(profileId: string, day: string) {
  const { data, error } = await supabase
    .from("check_outs")
    .select("id, water_liters")
    .eq("profile_id", profileId)
    .eq("day", day)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, waterLiters: Number(data.water_liters) } : null;
}

export async function saveWater(
  profileId: string,
  day: string,
  liters: number,
  id?: string | null,
) {
  if (id) {
    const { error } = await supabase
      .from("check_outs")
      .update({ water_liters: liters })
      .eq("id", id);
    if (error) throw error;
    return id;
  }
  const { data, error } = await supabase
    .from("check_outs")
    .insert({ profile_id: profileId, day, water_liters: liters })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function listCheckIns(profileId: string) {
  const { data, error } = await supabase
    .from("check_ins")
    .select("day, sleep_hours")
    .eq("profile_id", profileId)
    .order("day", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({ day: c.day, sleep_hours: Number(c.sleep_hours) }));
}

export async function listCheckOutDays(profileId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("check_outs")
    .select("day")
    .eq("profile_id", profileId);
  if (error) throw error;
  return (data ?? []).map((c) => c.day);
}

// ---------------------------------------------------------------- peso
export type WeightLog = { id: string; day: string; weightKg: number };

export async function listWeightLogs(profileId: string): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, day, weight_kg")
    .eq("profile_id", profileId)
    .order("day", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, day: r.day, weightKg: Number(r.weight_kg) }));
}

export async function logWeight(profileId: string, weightKg: number, day = todayKey()) {
  const { error } = await supabase
    .from("weight_logs")
    .upsert({ profile_id: profileId, day, weight_kg: weightKg }, { onConflict: "profile_id,day" });
  if (error) throw error;
}

// ---------------------------------------------------------------- fotos (storage)
const SELFIES_PREFIX = "nutriapp/selfies";
const PROFILE_PHOTO_PREFIX = "nutriapp/profile-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function bucket(): string {
  if (!PROFILE_IMAGE_BUCKET) throw new Error("EXPO_PUBLIC_PROFILE_IMAGE_BUCKET não configurado.");
  return PROFILE_IMAGE_BUCKET;
}

export type SelfieMeta = { id: string; day: string; createdAt: string };
export type Selfie = SelfieMeta & { url: string };

export async function listSelfieMeta(profileId: string): Promise<SelfieMeta[]> {
  const { data, error } = await supabase
    .from("progress_photos")
    .select("id, day, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, day: r.day, createdAt: r.created_at }));
}

export async function listSelfies(profileId: string, userId: string): Promise<Selfie[]> {
  const meta = await listSelfieMeta(profileId);
  if (meta.length === 0) return [];
  const paths = meta.map((m) => `${SELFIES_PREFIX}/${userId}/${m.id}`);
  const { data, error } = await supabase.storage
    .from(bucket())
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return meta.map((m, i) => ({ ...m, url: data?.[i]?.signedUrl ?? "" })).filter((s) => s.url);
}

export async function addSelfie(
  profileId: string,
  userId: string,
  jpegBase64: string,
): Promise<SelfieMeta> {
  const id = Crypto.randomUUID();
  const day = todayKey();
  const path = `${SELFIES_PREFIX}/${userId}/${id}`;
  const { error: uploadErr } = await supabase.storage
    .from(bucket())
    .upload(path, base64ToArrayBuffer(jpegBase64), {
      contentType: "image/jpeg",
      cacheControl: "3600",
    });
  if (uploadErr) throw uploadErr;
  const { error: insertErr } = await supabase
    .from("progress_photos")
    .insert({ id, profile_id: profileId, day });
  if (insertErr) {
    await supabase.storage.from(bucket()).remove([path]);
    throw insertErr;
  }
  return { id, day, createdAt: new Date().toISOString() };
}

export async function deleteSelfie(profileId: string, userId: string, id: string): Promise<void> {
  await supabase.storage.from(bucket()).remove([`${SELFIES_PREFIX}/${userId}/${id}`]);
  const { error } = await supabase
    .from("progress_photos")
    .delete()
    .eq("id", id)
    .eq("profile_id", profileId);
  if (error) throw error;
}

export async function getProfilePhotoUrl(userId: string): Promise<string | null> {
  if (!PROFILE_IMAGE_BUCKET) return null;
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .createSignedUrl(`${PROFILE_PHOTO_PREFIX}/${userId}/avatar`, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function uploadProfilePhoto(userId: string, jpegBase64: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket())
    .upload(`${PROFILE_PHOTO_PREFIX}/${userId}/avatar`, base64ToArrayBuffer(jpegBase64), {
      upsert: true,
      contentType: "image/jpeg",
      cacheControl: "0",
    });
  if (error) throw error;
}

// ---------------------------------------------------------------- notificações
export type NotificationPrefs = {
  notify_reminder_slot: "morning" | "evening";
  notify_email_reminder: boolean;
  notify_email_weekly_digest: boolean;
  notify_email_milestone: boolean;
  notify_email_reengagement: boolean;
  notify_push_enabled: boolean;
  notify_push_reminder: boolean;
  notify_push_weekly_digest: boolean;
  notify_push_milestone: boolean;
  notify_push_reengagement: boolean;
};

export const NOTIFICATION_COLUMNS =
  "notify_reminder_slot, notify_email_reminder, notify_email_weekly_digest, notify_email_milestone, notify_email_reengagement, notify_push_enabled, notify_push_reminder, notify_push_weekly_digest, notify_push_milestone, notify_push_reengagement";

export async function fetchNotificationPrefs(profileId: string): Promise<NotificationPrefs | null> {
  const { data, error } = await supabase
    .from("nutrition_profiles")
    .select(NOTIFICATION_COLUMNS)
    .eq("id", profileId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as NotificationPrefs) ?? null;
}
