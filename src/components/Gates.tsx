import { View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Lock, Sparkles } from "lucide-react-native";
import { Button, Card, IconCircle, T } from "@/components/ui";
import { colors } from "@/theme/tokens";

/** Equivalente ao InactivePlanPaywall do web. */
export function PaywallGate({ feature }: { feature: string }) {
  return (
    <Card
      style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }}
      tone="outline"
    >
      <IconCircle icon={Lock} size={48} />
      <T variant="heading" style={{ marginTop: 14, textAlign: "center" }}>
        {feature} faz parte do plano completo
      </T>
      <T variant="bodySmall" style={{ marginTop: 8, textAlign: "center" }}>
        Seu período gratuito terminou (ou sua assinatura está inativa). Assine para continuar
        acompanhando sua rotina, progresso e desafios.
      </T>
      <Button
        title="Ver o plano"
        iconRight={ArrowRight}
        style={{ marginTop: 18 }}
        onPress={() => router.push("/assinar")}
      />
      <T variant="caption" style={{ marginTop: 12, textAlign: "center" }}>
        Você continua tendo acesso ao Início, ao perfil e às dicas.
      </T>
    </Card>
  );
}

/** Equivalente ao OnboardingPrompt do web. */
export function OnboardingGate({ title, description }: { title: string; description: string }) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 28, paddingHorizontal: 20 }}>
      <IconCircle icon={Sparkles} size={48} />
      <T variant="heading" style={{ marginTop: 14, textAlign: "center" }}>
        {title}
      </T>
      <T variant="bodySmall" style={{ marginTop: 8, textAlign: "center" }}>
        {description}
      </T>
      <Button
        title="Montar meu plano"
        iconRight={ArrowRight}
        style={{ marginTop: 18 }}
        onPress={() => router.push("/onboarding")}
      />
    </Card>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <T variant="label" style={{ fontSize: 13.5, color: colors.ink }}>
        {children}
      </T>
      {right}
    </View>
  );
}
