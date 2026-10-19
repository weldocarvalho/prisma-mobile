import { Alert, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { PickedImage } from "@/lib/image";

/** Pergunta câmera ou galeria e devolve a imagem escolhida (ou null se cancelou). */
export function pickImage(title: string): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      undefined,
      [
        { text: "Tirar foto", onPress: () => void fromCamera().then(resolve) },
        { text: "Escolher da galeria", onPress: () => void fromLibrary().then(resolve) },
        { text: "Cancelar", style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

function deniedAlert(what: string) {
  Alert.alert(
    `Sem acesso à ${what}`,
    `Libere o acesso à ${what} nos Ajustes do aparelho para continuar.`,
    [
      { text: "Agora não", style: "cancel" },
      { text: "Abrir Ajustes", onPress: () => void Linking.openSettings() },
    ],
  );
}

export async function fromCamera(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    deniedAlert("câmera");
    return null;
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, width: a.width, height: a.height };
}

export async function fromLibrary(): Promise<PickedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
  if (res.canceled || !res.assets?.[0]) return null;
  const a = res.assets[0];
  return { uri: a.uri, width: a.width, height: a.height };
}
