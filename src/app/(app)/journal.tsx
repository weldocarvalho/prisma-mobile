import { useState } from "react";
import { Alert, Dimensions, FlatList, Pressable, View } from "react-native";
import { Redirect } from "expo-router";
import { Image } from "expo-image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react-native";
import { PaywallGate } from "@/components/Gates";
import { Screen } from "@/components/Screen";
import { Button, Card, IconButton, Loading, T } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { qk } from "@/hooks/queries";
import { addSelfie, deleteSelfie, listSelfies } from "@/lib/data";
import { FEATURES } from "@/lib/config";
import { compressImage } from "@/lib/image";
import { pickImage } from "@/lib/pickImage";
import { feedback } from "@/lib/haptics";
import { XP_SELFIE } from "@/lib/xp";
import { colors } from "@/theme/tokens";

const GAP = 10;

/** Diário de fotos (linha do tempo) — só aparece com EXPO_PUBLIC_FEATURE_SELFIE_JOURNAL=true. */
export default function JournalScreen() {
  const { profileId, userId } = useAuth();
  const { isActive, loading } = useSubscription();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const selfies = useQuery({
    queryKey: qk.selfies(profileId),
    queryFn: () => listSelfies(profileId, userId),
    enabled: FEATURES.selfieJournal,
  });

  if (!FEATURES.selfieJournal) return <Redirect href="/" />;
  if (!loading && !isActive) {
    return (
      <Screen edges={[]}>
        <PaywallGate feature="O diário visual" />
      </Screen>
    );
  }

  const size = (Dimensions.get("window").width - 40 - GAP) / 2;

  async function add() {
    const picked = await pickImage("Foto de progresso");
    if (!picked) return;
    setBusy(true);
    try {
      const img = await compressImage(picked, 1920, 0.9);
      await addSelfie(profileId, userId, img.base64);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.selfies(profileId) }),
        queryClient.invalidateQueries({ queryKey: qk.selfieMeta(profileId) }),
      ]);
      feedback("achievement");
      toast.xp(XP_SELFIE, "Foto do dia");
    } catch {
      toast.error("Não foi possível salvar a foto. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function remove(id: string) {
    Alert.alert("Excluir foto?", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSelfie(profileId, userId, id);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: qk.selfies(profileId) }),
              queryClient.invalidateQueries({ queryKey: qk.selfieMeta(profileId) }),
            ]);
          } catch {
            toast.error("Não foi possível excluir.");
          }
        },
      },
    ]);
  }

  return (
    <Screen edges={[]} scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <FlatList
        data={selfies.data ?? []}
        keyExtractor={(s) => s.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 14 }}>
            <T variant="title">Diário visual</T>
            <T variant="bodySmall" style={{ marginTop: 6 }}>
              Sua linha do tempo de fotos. Só você vê.
            </T>
            <Button
              title="Adicionar foto"
              icon={Camera}
              loading={busy}
              onPress={add}
              style={{ marginTop: 14 }}
            />
          </View>
        }
        ListEmptyComponent={
          selfies.isLoading ? (
            <Loading />
          ) : (
            <Card style={{ alignItems: "center" }}>
              <T variant="caption">Adicione sua primeira foto para acompanhar a evolução.</T>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => remove(item.id)}
            accessibilityHint="Toque longo para excluir"
          >
            <Image
              source={{ uri: item.url }}
              style={{
                width: size,
                height: size * 1.3,
                borderRadius: 16,
                backgroundColor: colors.lineSoft,
              }}
              contentFit="cover"
              transition={150}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <T variant="caption">
                {new Date(item.day + "T12:00:00").toLocaleDateString("pt-BR")}
              </T>
              <IconButton
                icon={Trash2}
                tone="plain"
                size={28}
                label="Excluir foto"
                onPress={() => remove(item.id)}
              />
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
