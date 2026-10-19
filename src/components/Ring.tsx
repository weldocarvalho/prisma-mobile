import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/tokens";

/** Anel de progresso (mesmo desenho dos anéis SVG do web). */
export function Ring({
  size,
  stroke,
  pct,
  color = colors.rose,
  track = colors.roseSoft,
  children,
  label,
}: {
  size: number;
  stroke: number;
  pct: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityRole={label ? "progressbar" : undefined}
    >
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * clamped} ${circumference}`}
        />
      </Svg>
      <View
        style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
      >
        {children}
      </View>
    </View>
  );
}
