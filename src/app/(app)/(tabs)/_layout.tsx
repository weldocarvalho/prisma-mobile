import { Tabs } from "expo-router";
import { Home, ListChecks, Target, TrendingUp, User } from "lucide-react-native";
import { colors, fonts } from "@/theme/tokens";
import { feedback } from "@/lib/haptics";

/** Mesma navegação inferior do web (BottomNav): Início, Plano, Evolução, Desafios, Perfil. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.roseInk,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.paper2,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
      screenListeners={{ tabPress: () => feedback("tap") }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          title: "Plano",
          tabBarIcon: ({ color, focused }) => (
            <ListChecks color={color} size={22} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Evolução",
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp color={color} size={22} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: "Desafios",
          tabBarIcon: ({ color, focused }) => (
            <Target color={color} size={22} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={22} strokeWidth={focused ? 2 : 1.6} />
          ),
        }}
      />
    </Tabs>
  );
}
