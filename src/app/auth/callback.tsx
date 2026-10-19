import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { Button, Loading, T } from "@/components/ui";
import { colors } from "@/theme/tokens";

/**
 * Destino do link do e-mail quando aberto no celular
 * (prismanutri://auth/callback — MOBILE_AUTH_REDIRECT_URL no backend).
 * Aceita tokens no fragmento (#access_token=...&refresh_token=...) ou token_hash.
 */
function parseParams(url: string | null): Record<string, string> {
  if (!url) return {};
  const out: Record<string, string> = {};
  const [beforeHash, hash = ""] = url.split("#");
  const query = beforeHash.split("?")[1] ?? "";
  for (const part of [query, hash]) {
    for (const pair of part.split("&")) {
      if (!pair) continue;
      const [k, v = ""] = pair.split("=");
      out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
    }
  }
  return out;
}

export default function AuthCallback() {
  const url = Linking.useLinkingURL();
  const search = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = { ...parseParams(url), ...(search as Record<string, string>) };
      try {
        if (p.access_token && p.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: p.access_token,
            refresh_token: p.refresh_token,
          });
          if (error) throw error;
        } else if (p.token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: p.token_hash,
            type: (p.type as "magiclink" | "email") || "magiclink",
          });
          if (error) throw error;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error("sem tokens");
        }
        if (!cancelled) router.replace("/");
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, search]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.paper,
        padding: 24,
      }}
    >
      {failed ? (
        <>
          <T variant="heading" style={{ textAlign: "center" }}>
            Link inválido ou expirado
          </T>
          <T variant="bodySmall" style={{ textAlign: "center", marginTop: 8 }}>
            Peça um novo código na tela de entrada.
          </T>
          <Button
            title="Voltar para a entrada"
            style={{ marginTop: 18 }}
            onPress={() => router.replace("/login")}
          />
        </>
      ) : (
        <Loading />
      )}
    </View>
  );
}
