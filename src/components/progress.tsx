import { useMemo, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import {
  Award,
  CalendarCheck,
  Camera,
  Check,
  ClipboardCheck,
  Crown,
  Flame,
  Images,
  Lock,
  Percent,
  Scale,
  Snowflake,
  Sparkles,
  Trophy,
} from "lucide-react-native";
import { Button, Card, IconCircle, Input, ProgressBar, T } from "@/components/ui";
import { LEVELS, levelForXp } from "@/lib/xp";
import {
  addDays,
  computeDayStat,
  computeStreakStats,
  startOfWeek,
  type Checks,
} from "@/lib/streak";
import { computeAchievements, type AchievementKey } from "@/lib/achievements";
import type { WeightLog } from "@/lib/data";
import { colors, fonts, radius } from "@/theme/tokens";

// ------------------------------------------------------------------ nível
export function LevelCard({ xp, compact }: { xp: number; compact?: boolean }) {
  const { level, next, xpIntoLevel, xpForNextLevel, progressPct } = levelForXp(xp);
  return (
    <Card style={{ padding: compact ? 12 : 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <IconCircle icon={Sparkles} size={compact ? 32 : 42} />
        <View style={{ flex: 1 }}>
          <T variant="eyebrow" style={{ fontSize: 9.5 }}>
            Seu nível
          </T>
          <T
            variant={compact ? "label" : "heading"}
            style={compact ? { fontSize: 14 } : { fontSize: 18 }}
          >
            {level.label}
          </T>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <T variant="eyebrow" style={{ fontSize: 9.5 }}>
            XP
          </T>
          <T variant="label" style={{ fontSize: 15 }}>
            {xp}
          </T>
        </View>
      </View>
      <View style={{ marginTop: 10 }}>
        <ProgressBar pct={progressPct} height={compact ? 6 : 8} />
      </View>
      <T variant="caption" style={{ marginTop: 6, fontSize: 11 }}>
        {next
          ? `${xpIntoLevel}/${xpForNextLevel} XP para o nível ${next.label}`
          : "Nível máximo alcançado — continue mantendo a constância!"}
      </T>
    </Card>
  );
}

export function LevelsLegend() {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {LEVELS.map((l) => (
        <T key={l.key} variant="caption">
          {l.label} · {l.minXp}+
        </T>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ peso
function formatDayShort(day: string) {
  const [, m, d] = day.split("-");
  return `${d}/${m}`;
}

export function WeightChart({
  logs,
  targetWeightKg,
  onSave,
}: {
  logs: WeightLog[];
  targetWeightKg: number | null;
  onSave: (kg: number) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const latest = logs[logs.length - 1]?.weightKg ?? null;
  const recent = logs.slice(-30);

  const chartW = Math.max(200, width - 40 - 32);
  const chartH = 150;
  const pad = { l: 30, r: 8, t: 8, b: 18 };

  const path = useMemo(() => {
    if (recent.length < 2) return null;
    const values = recent
      .map((l) => l.weightKg)
      .concat(targetWeightKg != null ? [targetWeightKg] : []);
    const min = Math.min(...values) - 1;
    const max = Math.max(...values) + 1;
    const x = (i: number) => pad.l + (i * (chartW - pad.l - pad.r)) / (recent.length - 1);
    const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (chartH - pad.t - pad.b);
    const d = recent
      .map((l, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(l.weightKg).toFixed(1)}`)
      .join(" ");
    return {
      d,
      points: recent.map((l, i) => ({ x: x(i), y: y(l.weightKg), key: l.day })),
      targetY: targetWeightKg != null ? y(targetWeightKg) : null,
      min,
      max,
      first: recent[0].day,
      last: recent[recent.length - 1].day,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recent, targetWeightKg, chartW]);

  async function save() {
    const kg = Number(value.replace(",", "."));
    if (!kg || kg <= 0 || kg > 400) return;
    setSaving(true);
    try {
      await onSave(kg);
      setValue("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Scale size={16} color={colors.roseInk} />
        <T variant="heading" style={{ fontSize: 18 }}>
          Seu peso
        </T>
      </View>
      {path ? (
        <View
          style={{ marginTop: 12 }}
          accessible
          accessibilityLabel={`Gráfico de peso: último registro ${latest} quilos`}
        >
          <Svg width={chartW} height={chartH}>
            {path.targetY != null && (
              <Line
                x1={pad.l}
                x2={chartW - pad.r}
                y1={path.targetY}
                y2={path.targetY}
                stroke={colors.line}
                strokeDasharray="4 4"
              />
            )}
            <Path
              d={path.d}
              stroke={colors.rose}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
            />
            {path.points.map((p) => (
              <Circle key={p.key} cx={p.x} cy={p.y} r={2.5} fill={colors.rose} />
            ))}
            <SvgText x={0} y={pad.t + 8} fontSize={9} fill={colors.inkFaint}>
              {path.max.toFixed(0)}
            </SvgText>
            <SvgText x={0} y={chartH - pad.b} fontSize={9} fill={colors.inkFaint}>
              {path.min.toFixed(0)}
            </SvgText>
            <SvgText x={pad.l} y={chartH - 2} fontSize={9} fill={colors.inkFaint}>
              {formatDayShort(path.first)}
            </SvgText>
            <SvgText
              x={chartW - pad.r}
              y={chartH - 2}
              fontSize={9}
              fill={colors.inkFaint}
              textAnchor="end"
            >
              {formatDayShort(path.last)}
            </SvgText>
          </Svg>
          <T variant="caption" style={{ marginTop: 4 }}>
            Último: {latest?.toLocaleString("pt-BR")} kg
            {targetWeightKg != null
              ? ` · meta ${targetWeightKg.toLocaleString("pt-BR")} kg (linha tracejada)`
              : ""}
          </T>
        </View>
      ) : (
        <T variant="caption" style={{ marginTop: 8 }}>
          {latest != null
            ? `Último registro: ${latest.toLocaleString("pt-BR")} kg${
                targetWeightKg != null ? ` · meta ${targetWeightKg.toLocaleString("pt-BR")} kg` : ""
              }. Registre em mais um dia para ver o gráfico de evolução.`
            : "Registre seu peso por alguns dias para ver o gráfico de evolução."}
        </T>
      )}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Input
          value={value}
          onChangeText={(v) => setValue(v.replace(/[^\d,.]/g, ""))}
          placeholder={latest != null ? `${latest} kg` : "Seu peso hoje (kg)"}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          accessibilityLabel="Peso de hoje em quilos"
          returnKeyType="done"
          onSubmitEditing={save}
        />
        <Button title="Salvar" icon={Check} loading={saving} disabled={!value} onPress={save} />
      </View>
    </Card>
  );
}

// ------------------------------------------------------------------ sequência
const WEEKDAY = ["D", "S", "T", "Q", "Q", "S", "S"];

function tierFor(ratio: number): "none" | "partial" | "full" {
  if (ratio >= 1) return "full";
  if (ratio > 0) return "partial";
  return "none";
}

function StatTile({ icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <IconCircle icon={icon} size={28} />
      <T variant="eyebrow" style={{ fontSize: 9.5, marginTop: 8, letterSpacing: 0.8 }}>
        {label}
      </T>
      <T style={{ fontFamily: fonts.display, fontSize: 18, marginTop: 2 }}>{value}</T>
    </View>
  );
}

export function StreakCard({ checks, totalPerDay }: { checks: Checks; totalPerDay: number }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const week = useMemo(() => {
    const start = startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) =>
      computeDayStat(checks, addDays(start, i), totalPerDay),
    );
  }, [checks, today, totalPerDay]);
  const month = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) =>
        computeDayStat(checks, addDays(today, -(29 - i)), totalPerDay),
      ),
    [checks, today, totalPerDay],
  );
  const todayStat = computeDayStat(checks, today, totalPerDay);
  const s = useMemo(() => computeStreakStats(checks, totalPerDay), [checks, totalPerDay]);
  const days = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Flame size={16} color={colors.roseInk} />
        <T variant="heading" style={{ fontSize: 18, flex: 1 }}>
          Sequência
        </T>
        <T variant="caption">
          {todayStat.done}/{todayStat.total} hoje
        </T>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <StatTile icon={Flame} label="Sequência atual" value={days(s.currentStreak)} />
        <StatTile icon={Trophy} label="Melhor sequência" value={days(s.bestStreak)} />
        <StatTile icon={CalendarCheck} label="Dias completos" value={`${s.perfectDays}`} />
        <StatTile icon={Percent} label="Consistência" value={`${s.consistency}%`} />
      </View>
      {totalPerDay > 0 && (
        <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
          <Snowflake size={14} color={colors.roseInk} style={{ marginTop: 2 }} />
          <T variant="caption" style={{ flex: 1 }}>
            {s.freezeUsedThisWeek
              ? "Você já usou seu dia de proteção da sequência nesta semana."
              : s.freezeAvailable
                ? "Você tem 1 dia de proteção disponível esta semana — perder um dia não zera sua sequência."
                : "Confirme seu plano para começar a acumular dias de proteção da sequência."}
          </T>
        </View>
      )}

      <T variant="eyebrow" style={{ marginTop: 18 }}>
        Esta semana
      </T>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
        {week.map((d) => {
          const isToday = d.key === todayStat.key;
          const future = d.date.getTime() > today.getTime();
          const tier = future ? "none" : tierFor(d.ratio);
          return (
            <View
              key={d.key}
              style={{ alignItems: "center", gap: 6 }}
              accessible
              accessibilityLabel={`${d.key}: ${d.done} de ${d.total}`}
            >
              <View
                style={[
                  styles.dayDot,
                  tier === "full" && { backgroundColor: colors.rose },
                  tier === "partial" && { backgroundColor: colors.roseSoft },
                  isToday && { borderWidth: 1.5, borderColor: colors.rose },
                ]}
              >
                {tier === "full" ? (
                  <Check size={14} color={colors.white} strokeWidth={3} />
                ) : tier === "partial" ? (
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.roseInk,
                    }}
                  />
                ) : (
                  <T variant="caption">–</T>
                )}
              </View>
              <T variant="caption" style={{ fontSize: 10.5 }}>
                {WEEKDAY[d.date.getDay()]}
              </T>
            </View>
          );
        })}
      </View>

      <T variant="eyebrow" style={{ marginTop: 18 }}>
        Este mês
      </T>
      <View style={{ gap: 4, marginTop: 10 }}>
        {[month.slice(0, 15), month.slice(15)].map((row, r) => (
          <View key={r} style={{ flexDirection: "row", gap: 4 }}>
            {row.map((d) => {
              const tier = tierFor(d.ratio);
              return (
                <View
                  key={d.key}
                  style={[
                    styles.monthCell,
                    tier === "full" && { backgroundColor: colors.rose },
                    tier === "partial" && { backgroundColor: colors.roseSoft },
                    d.key === todayStat.key && { borderWidth: 1.5, borderColor: colors.rose },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 14, marginTop: 10 }}>
        {[
          { c: colors.lineSoft, l: "Sem registro" },
          { c: colors.roseSoft, l: "Parcial" },
          { c: colors.rose, l: "Completo" },
        ].map((x) => (
          <View key={x.l} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: x.c }} />
            <T variant="caption" style={{ fontSize: 10.5 }}>
              {x.l}
            </T>
          </View>
        ))}
      </View>
      {!month.some((d) => d.done > 0) && (
        <T variant="caption" style={{ marginTop: 10 }}>
          Marque suas refeições para começar a acompanhar sua evolução.
        </T>
      )}
    </Card>
  );
}

// ------------------------------------------------------------------ conquistas
const BADGE_ICONS: Record<AchievementKey, typeof Flame> = {
  streak7: Flame,
  streak30: Trophy,
  checkins10: ClipboardCheck,
  checkins50: ClipboardCheck,
  firstSelfie: Camera,
  selfies10: Camera,
  selfieCompare: Images,
  firstRoutine: Sparkles,
  levelConsistente: Award,
  levelMestre: Crown,
};

export function AchievementsCard(props: {
  bestStreak: number;
  checkInsCount: number;
  selfieCount: number;
  selfieSpanDays: number;
  hasRoutine: boolean;
  levelIndex: number;
}) {
  const badges = computeAchievements(props).sort((a, b) => Number(b.achieved) - Number(a.achieved));
  const achieved = badges.filter((b) => b.achieved).length;
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Award size={14} color={colors.roseInk} />
        <T variant="eyebrow">Suas conquistas</T>
      </View>
      <T variant="heading" style={{ marginTop: 4 }}>
        {achieved} de {badges.length} desbloqueadas.
      </T>
      <View style={{ marginTop: 10 }}>
        <ProgressBar pct={badges.length ? (achieved / badges.length) * 100 : 0} height={5} />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {badges.map((b) => {
          const Icon = BADGE_ICONS[b.key] ?? Award;
          return (
            <View
              key={b.key}
              style={[styles.badge, !b.achieved && { opacity: 0.6 }]}
              accessible
              accessibilityLabel={`${b.label}${b.achieved ? ", desbloqueada" : ", bloqueada"}`}
            >
              <IconCircle
                icon={b.achieved ? Icon : Lock}
                size={36}
                tone={b.achieved ? "rose" : "muted"}
              />
              <T
                variant="caption"
                style={{
                  textAlign: "center",
                  color: b.achieved ? colors.ink : colors.inkFaint,
                  fontSize: 11,
                }}
              >
                {b.label}
              </T>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: radius.md,
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCell: { flex: 1, aspectRatio: 1, borderRadius: 3, backgroundColor: colors.lineSoft },
  badge: {
    flexBasis: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
});
