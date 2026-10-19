import type { ExpoConfig } from "expo/config";

/**
 * Configuração do app nativo. Valores que mudam por ambiente vêm do .env
 * (EXPO_PUBLIC_*) — veja .env.example.
 */
const APP_NAME = process.env.EXPO_PUBLIC_BRAND_NAME || "Prisma Nutri";
const BUNDLE_ID = process.env.APP_BUNDLE_ID || "br.com.belteroracle.prismanutri";
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: APP_NAME,
  slug: "prisma-mobile",
  scheme: "prismanutri",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  backgroundColor: "#f7f6f2",
  primaryColor: "#b3617a",
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    buildNumber: "1",
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      NSCameraUsageDescription:
        "Usamos a câmera para você fotografar a refeição e receber a estimativa de calorias.",
      NSPhotoLibraryUsageDescription:
        "Usamos suas fotos para você escolher a imagem da refeição, da foto de progresso ou do perfil.",
    },
  },
  android: {
    package: BUNDLE_ID,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: "#b4617a",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    permissions: ["android.permission.CAMERA", "com.android.vending.BILLING"],
    blockedPermissions: ["android.permission.RECORD_AUDIO"],
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#f7f6f2",
      },
    ],
    "expo-font",
    "expo-image",
    "expo-web-browser",
    "@react-native-community/datetimepicker",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Usamos suas fotos para você escolher a imagem da refeição, da foto de progresso ou do perfil.",
        cameraPermission:
          "Usamos a câmera para você fotografar a refeição e receber a estimativa de calorias.",
        microphonePermission: false,
      },
    ],
    [
      "expo-notifications",
      {
        color: "#b3617a",
        defaultChannel: "default",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
  },
  ...(EAS_PROJECT_ID
    ? {
        updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
        runtimeVersion: { policy: "appVersion" as const },
      }
    : {}),
};

export default config;
