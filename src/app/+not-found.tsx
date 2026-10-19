import { View } from "react-native";
import { router } from "expo-router";
import { Button, T } from "@/components/ui";
import { colors } from "@/theme/tokens";

export default function NotFound() {
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
      <T variant="title" style={{ textAlign: "center" }}>
        Página não encontrada
      </T>
      <T variant="bodySmall" style={{ textAlign: "center", marginTop: 8 }}>
        Esse link não existe no app.
      </T>
      <Button
        title="Ir para o início"
        style={{ marginTop: 18 }}
        onPress={() => router.replace("/")}
      />
    </View>
  );
}
