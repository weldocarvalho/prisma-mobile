import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radius, shadow } from "@/theme/tokens";
import { feedback } from "@/lib/haptics";

type ToastKind = "success" | "error" | "info" | "xp";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
  xp: (amount: number, label: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Avisos curtos no topo (substitui o sonner do web + os "XP toasts"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const insets = useSafeAreaInsets();

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setItems((prev) => [...prev.slice(-2), { id, kind, message }]);
    if (kind === "error") feedback("error");
    setTimeout(
      () => setItems((prev) => prev.filter((t) => t.id !== id)),
      kind === "error" ? 4200 : 2800,
    );
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
      xp: (amount, label) => push("xp", `+${amount} XP · ${label}`),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
        {items.map((t) => (
          <ToastView key={t.id} item={t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ item }: { item: ToastItem }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [opacity]);
  const bg = item.kind === "error" ? colors.roseInk : item.kind === "xp" ? colors.rose : colors.ink;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.toast,
        {
          backgroundColor: bg,
          opacity,
          transform: [
            { translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
          ],
        },
      ]}
    >
      <Text style={styles.text}>{item.message}</Text>
    </Animated.View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast fora do ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 16, right: 16, alignItems: "center", gap: 8, zIndex: 1000 },
  toast: {
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxWidth: 420,
    ...shadow.bento,
  },
  text: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.white, textAlign: "center" },
});
