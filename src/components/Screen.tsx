import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { T } from "@/components/ui";
import { DISCLAIMER } from "@/lib/copy";

/** Tela padrão: fundo papel, área segura, rolagem e "puxar para atualizar". */
export function Screen({
  children,
  onRefresh,
  edges = ["top"],
  contentStyle,
  scroll = true,
  keyboard = false,
}: {
  children: ReactNode;
  onRefresh?: () => Promise<unknown>;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  keyboard?: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.rose}
            colors={[colors.rose]}
            onRefresh={async () => {
              setRefreshing(true);
              try {
                await onRefresh();
              } finally {
                setRefreshing(false);
              }
            }}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <T variant="eyebrow">{eyebrow}</T> : null}
        <T variant="title" accessibilityRole="header" style={{ marginTop: 2 }}>
          {title}
        </T>
        {subtitle ? (
          <T variant="bodySmall" style={{ marginTop: 6 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Disclaimer({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.disclaimer, style]}>
      <T variant="caption" style={{ color: colors.inkSoft, lineHeight: 18 }}>
        {DISCLAIMER}
      </T>
    </View>
  );
}

export function Stack({
  gap = 14,
  children,
  style,
}: {
  gap?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 18 },
  disclaimer: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
