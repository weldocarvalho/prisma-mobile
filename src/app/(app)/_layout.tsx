import { useEffect } from "react";
import { View } from "react-native";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthContext } from "@/providers/AuthProvider";
import { Button, Loading, T } from "@/components/ui";
import { routeFromNotification } from "@/lib/push";
import { colors, fonts } from "@/theme/tokens";

/** Área logada: espera o perfil e trata o toque em notificações. */
export default function AppLayout() {
  const { status, signOut } = useAuthContext();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (status !== "ready" || !lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const route = routeFromNotification(lastResponse.notification.request.content.data);
    if (route && route !== "/") router.push(route as never);
    void Notifications.clearLastNotificationResponseAsync();
  }, [status, lastResponse]);

  if (status === "error") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: colors.paper,
        }}
      >
        <T variant="heading" style={{ textAlign: "center" }}>
          Não conseguimos carregar seu perfil
        </T>
        <T variant="bodySmall" style={{ textAlign: "center", marginTop: 8 }}>
          Verifique sua conexão e entre novamente.
        </T>
        <Button title="Entrar novamente" style={{ marginTop: 18 }} onPress={() => signOut()} />
      </View>
    );
  }

  if (status !== "ready") {
    return (
      <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.paper }}>
        <Loading />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.roseInk,
        headerStyle: { backgroundColor: colors.paper },
        headerTitleStyle: { fontFamily: fonts.medium, color: colors.ink },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="today" options={{ headerShown: true, title: "Hoje" }} />
      <Stack.Screen name="tips" options={{ headerShown: true, title: "Dicas e FAQ" }} />
      <Stack.Screen name="journal" options={{ headerShown: true, title: "Diário de fotos" }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notificações" }} />
      <Stack.Screen name="delete-account" options={{ headerShown: true, title: "Excluir conta" }} />
      <Stack.Screen
        name="onboarding"
        options={{ gestureEnabled: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="assinar" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="meal-logger"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.75, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
      <Stack.Screen
        name="check-flow"
        options={{
          presentation: "formSheet",
          sheetAllowedDetents: [0.7, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
    </Stack>
  );
}
