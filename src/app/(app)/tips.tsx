import { useState } from "react";
import { LayoutAnimation, Pressable, View } from "react-native";
import { ChevronDown, Droplets, Lock, Moon, Shield, Sparkles, Sun } from "lucide-react-native";
import { Disclaimer, Screen, Stack } from "@/components/Screen";
import { Card, IconCircle, T } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useGamification } from "@/hooks/queries";
import { feedback } from "@/lib/haptics";
import { colors } from "@/theme/tokens";

const TIPS = [
  {
    icon: Droplets,
    title: "Hidratação primeiro",
    desc: "Beber água ao longo do dia ajuda na saciedade e na disposição. Tenha uma garrafa sempre por perto.",
  },
  {
    icon: Sun,
    title: "Monte o prato pela proporção",
    desc: "Metade de vegetais, um quarto de proteína e um quarto de carboidrato — uma referência simples para qualquer refeição.",
  },
  {
    icon: Moon,
    title: "Jantar mais leve",
    desc: "Um jantar mais leve que o almoço tende a favorecer melhor digestão e sono.",
  },
  {
    icon: Shield,
    title: "Vá com calma nas mudanças",
    desc: "Troque um hábito de cada vez. Mudanças pequenas e constantes rendem mais que uma reformulação radical.",
  },
  {
    icon: Sparkles,
    title: "Mastigue devagar",
    desc: "Comer com calma ajuda o corpo a perceber a saciedade — reduz a tendência de repetir o prato sem precisar.",
    unlockStreak: 3,
  },
  {
    icon: Shield,
    title: "Plano de reforço nos dias difíceis",
    desc: "Em dias corridos, simplifique: uma proteína, um carboidrato e um vegetal já sustentam uma refeição equilibrada.",
    unlockStreak: 7,
  },
];

const FAQ = [
  {
    q: "Quanto tempo até ver resultados?",
    a: "Disposição e digestão costumam melhorar em dias. Para mudança de peso, espere 4 a 12 semanas de constância.",
  },
  {
    q: "Preciso cortar carboidrato totalmente?",
    a: "Não é necessário para a maioria das pessoas. O que costuma funcionar melhor no longo prazo é ajustar porção, não eliminar um grupo inteiro.",
  },
  {
    q: "Posso comer fora da minha sugestão de vez em quando?",
    a: "Sim. Um plano sustentável tem espaço para flexibilidade — o que importa é a consistência na maior parte dos dias.",
  },
  {
    q: "Preciso registrar todas as refeições?",
    a: "Não é obrigatório, mas registrar ajuda a manter noção real do que você está comendo — mesmo uma estimativa rápida já ajuda bastante.",
  },
  {
    q: "As calorias e macros são exatas?",
    a: "Não. São estimativas gerais geradas por IA, priorizando praticidade. Para precisão clínica, procure um(a) nutricionista registrado.",
  },
  {
    q: "O app substitui um nutricionista?",
    a: "Não. O conteúdo é educacional e geral (Lei 8.234/1991) — não é prescrição nem diagnóstico. Se você tem uma condição de saúde específica, procure orientação profissional.",
  },
];

export default function TipsScreen() {
  const { profileId } = useAuth();
  const { currentStreak } = useGamification(profileId);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Screen edges={[]}>
      <T variant="title">Dicas e perguntas frequentes</T>
      <T variant="bodySmall" style={{ marginTop: 6, marginBottom: 18 }}>
        Boas práticas de alimentação e respostas rápidas para suas dúvidas.
      </T>
      <T variant="heading" style={{ marginBottom: 10 }}>
        Dicas gerais
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {TIPS.map((tip, i) => {
          const locked = !!tip.unlockStreak && currentStreak < tip.unlockStreak;
          return (
            <Card key={i} style={{ flexBasis: "47%", flexGrow: 1, opacity: locked ? 0.75 : 1 }}>
              <IconCircle
                icon={locked ? Lock : tip.icon}
                size={40}
                tone={locked ? "muted" : "rose"}
              />
              <T variant="label" style={{ marginTop: 10 }}>
                {tip.title}
                {tip.unlockStreak ? (
                  <T variant="eyebrow" style={{ fontSize: 9.5, color: colors.roseInk }}>
                    {" "}
                    Bônus
                  </T>
                ) : null}
              </T>
              <T variant="bodySmall" style={{ marginTop: 4 }}>
                {locked
                  ? `Desbloqueia com ${tip.unlockStreak} dias de sequência (você está em ${currentStreak}).`
                  : tip.desc}
              </T>
            </Card>
          );
        })}
      </View>

      <T variant="heading" style={{ marginTop: 26, marginBottom: 10 }}>
        Perguntas frequentes
      </T>
      <Card style={{ paddingVertical: 4 }}>
        <Stack gap={0}>
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <View
                key={i}
                style={{
                  borderBottomWidth: i < FAQ.length - 1 ? 0.5 : 0,
                  borderBottomColor: colors.line,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  onPress={() => {
                    feedback("tap");
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOpen(isOpen ? null : i);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 14,
                  }}
                >
                  <T variant="label" style={{ flex: 1 }}>
                    {item.q}
                  </T>
                  <ChevronDown
                    size={16}
                    color={colors.inkFaint}
                    style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                  />
                </Pressable>
                {isOpen && (
                  <T variant="bodySmall" style={{ paddingBottom: 14 }}>
                    {item.a}
                  </T>
                )}
              </View>
            );
          })}
        </Stack>
      </Card>
      <Disclaimer />
    </Screen>
  );
}
