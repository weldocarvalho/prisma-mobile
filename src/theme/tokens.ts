/**
 * Tokens do sistema visual "OneLine" (fio-*) do app web — papel claro, tinta
 * quase preta e um único acento rosé. Mundo deliberadamente claro: sem modo
 * escuro, igual ao web (ver src/routes/__root.tsx no nutri-app).
 */
export const colors = {
  paper: "#f7f6f2",
  paper2: "#fbfaf7",
  white: "#ffffff",
  ink: "#1b1a17",
  inkSoft: "#6e6a61",
  inkFaint: "#a9a399",
  line: "rgba(27,26,23,0.16)",
  lineSoft: "rgba(27,26,23,0.09)",
  rose: "#b3617a",
  roseSoft: "#f3e4e8",
  roseInk: "#7c3e52",
  danger: "#b42318",
  overlay: "rgba(27,26,23,0.4)",
} as const;

export const fonts = {
  display: "CormorantGaramond_500Medium_Italic",
  displayRegular: "CormorantGaramond_400Regular_Italic",
  displaySemi: "CormorantGaramond_600SemiBold_Italic",
  light: "Jost_300Light",
  body: "Jost_400Regular",
  medium: "Jost_500Medium",
  semibold: "Jost_600SemiBold",
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

/** Sombra "bento" do web, adaptada (iOS usa shadow*, Android usa elevation). */
export const shadow = {
  bento: {
    shadowColor: "#2b1d22",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  soft: {
    shadowColor: "#2b1d22",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;
