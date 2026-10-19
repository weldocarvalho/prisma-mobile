import { forwardRef, useState, type ComponentType, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch as RNSwitch,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { colors, fonts, radius, shadow } from "@/theme/tokens";
import { feedback } from "@/lib/haptics";

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

// ------------------------------------------------------------------ texto
type Variant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodySmall"
  | "caption"
  | "eyebrow"
  | "label"
  | "number";

const textStyles = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  bodySmall: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.inkSoft },
  caption: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: colors.inkFaint },
  eyebrow: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.inkFaint,
  },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  number: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
});

export function T({
  variant = "body",
  style,
  ...props
}: TextProps & { variant?: Variant; style?: StyleProp<TextStyle> }) {
  return <Text maxFontSizeMultiplier={1.6} {...props} style={[textStyles[variant], style]} />;
}

// ------------------------------------------------------------------ superfícies
export function Card({
  children,
  style,
  tone = "white",
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "white" | "paper" | "rose" | "ink" | "outline";
}) {
  return <View style={[styles.card, cardTones[tone], style]}>{children}</View>;
}

const cardTones = StyleSheet.create({
  white: { backgroundColor: colors.white, ...shadow.bento },
  paper: {
    backgroundColor: colors.paper2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    ...shadow.soft,
  },
  rose: { backgroundColor: colors.roseSoft },
  ink: { backgroundColor: colors.ink },
  outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
});

export function IconCircle({
  icon: Icon,
  size = 36,
  tone = "rose",
}: {
  icon: IconType;
  size?: number;
  tone?: "rose" | "muted" | "solid";
}) {
  const bg = tone === "rose" ? colors.roseSoft : tone === "solid" ? colors.rose : colors.lineSoft;
  const fg = tone === "rose" ? colors.roseInk : tone === "solid" ? colors.white : colors.inkFaint;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={Math.round(size * 0.48)} color={fg} strokeWidth={1.8} />
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line }, style]} />
  );
}

// ------------------------------------------------------------------ botões
type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  icon?: IconType;
  iconRight?: IconType;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
};

export function Button({
  title,
  icon: Icon,
  iconRight: IconRight,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  style,
  full,
  onPress,
  ...rest
}: ButtonProps) {
  const v = buttonVariants[variant];
  const isDisabled = disabled || loading;
  const iconSize = size === "sm" ? 14 : 16;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={(e) => {
        feedback("tap");
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.button,
        size === "sm" ? styles.buttonSm : styles.buttonMd,
        v.container,
        full && { alignSelf: "stretch" },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        Icon && <Icon size={iconSize} color={v.fg} strokeWidth={2} />
      )}
      <Text
        style={[styles.buttonText, size === "sm" && { fontSize: 13 }, { color: v.fg }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {IconRight && !loading && <IconRight size={iconSize} color={v.fg} strokeWidth={2} />}
    </Pressable>
  );
}

const buttonVariants = {
  primary: { container: { backgroundColor: colors.rose }, fg: colors.white },
  dark: { container: { backgroundColor: colors.ink }, fg: colors.paper2 },
  secondary: {
    container: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line },
    fg: colors.ink,
  },
  ghost: { container: { backgroundColor: "transparent" }, fg: colors.roseInk },
  danger: { container: { backgroundColor: colors.danger }, fg: colors.white },
} as const;

export function IconButton({
  icon: Icon,
  onPress,
  label,
  tone = "muted",
  size = 36,
  disabled,
}: {
  icon: IconType;
  onPress: () => void;
  label: string;
  tone?: "muted" | "rose" | "plain";
  size?: number;
  disabled?: boolean;
}) {
  const bg = tone === "rose" ? colors.rose : tone === "plain" ? "transparent" : colors.lineSoft;
  const fg = tone === "rose" ? colors.white : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      disabled={disabled}
      onPress={() => {
        feedback("tap");
        onPress();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed || disabled ? 0.6 : 1,
      })}
    >
      <Icon size={Math.round(size * 0.46)} color={fg} strokeWidth={1.9} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ escolha / chips
export function Choice({
  selected,
  onPress,
  children,
  style,
  disabled,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        feedback("tap");
        onPress();
      }}
      style={({ pressed }) => [
        styles.choice,
        selected ? styles.choiceSelected : null,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => {
        feedback("tap");
        onPress();
      }}
      style={[
        styles.pill,
        active ? { backgroundColor: colors.rose } : { backgroundColor: colors.lineSoft },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? colors.white : colors.inkSoft }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ label, icon: Icon }: { label: string; icon?: IconType }) {
  return (
    <View style={styles.badge}>
      {Icon && <Icon size={11} color={colors.roseInk} strokeWidth={2.4} />}
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ campos
export const Input = forwardRef<TextInput, TextInputProps & { invalid?: boolean }>(function Input(
  { style, invalid, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.inkFaint}
      selectionColor={colors.rose}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      style={[
        styles.input,
        focused && { borderColor: colors.rose },
        invalid && { borderColor: colors.danger },
        style,
      ]}
      maxFontSizeMultiplier={1.5}
      {...props}
    />
  );
});

export function FieldLabel({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <T variant="label" style={[{ marginBottom: 6 }, style]}>
      {children}
    </T>
  );
}

export function Switch({
  value,
  onValueChange,
  disabled,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <RNSwitch
      accessibilityLabel={label}
      value={value}
      disabled={disabled}
      onValueChange={(v) => {
        feedback("tap");
        onValueChange(v);
      }}
      trackColor={{ false: colors.line, true: colors.rose }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.line}
    />
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.switchRow, disabled && { opacity: 0.45 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <T variant="body" style={{ fontSize: 14 }}>
          {label}
        </T>
        {description ? <T variant="caption">{description}</T> : null}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} label={label} />
    </View>
  );
}

// ------------------------------------------------------------------ progresso
export function ProgressBar({
  pct,
  height = 6,
  color = colors.rose,
  track = colors.lineSoft,
}: {
  pct: number;
  height?: number;
  color?: string;
  track?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      style={{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: "100%",
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function Loading({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingVertical: 28, alignItems: "center" }, style]}>
      <ActivityIndicator color={colors.rose} />
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <View accessibilityRole="alert" style={styles.errorBox}>
      <T variant="bodySmall" style={{ color: colors.roseInk }}>
        {children}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.pill,
  },
  buttonMd: { minHeight: 48, paddingHorizontal: 20 },
  buttonSm: { minHeight: 38, paddingHorizontal: 14 },
  buttonText: { fontFamily: fonts.medium, fontSize: 15 },
  choice: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  choiceSelected: { borderColor: colors.rose, backgroundColor: colors.roseSoft },
  pill: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontFamily: fonts.medium, fontSize: 12.5 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.roseSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.roseInk },
  tag: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper2,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  switchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  errorBox: {
    borderLeftWidth: 2,
    borderLeftColor: colors.rose,
    paddingLeft: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
});
