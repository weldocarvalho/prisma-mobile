import { useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Gift, MailCheck, MailWarning } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button, ErrorText, FieldLabel, IconCircle, Input, T } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { BRAND_NAME, OTP_LENGTH, PRIVACY_URL, TERMS_URL } from "@/lib/config";
import { colors, fonts } from "@/theme/tokens";
import { feedback } from "@/lib/haptics";

type Step = "email" | "code";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Entrada única (login e cadastro grátis), como a /login do web — mas em vez
 * do link mágico o app usa o código de 6 dígitos que vai no mesmo e-mail.
 */
export default function LoginScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRedeem, setShowRedeem] = useState(!!params.code);
  const [referral, setReferral] = useState(params.code ?? "");
  const codeRef = useRef<TextInput>(null);

  const normalized = email.trim().toLowerCase();

  async function requestCode() {
    setError(null);
    if (!EMAIL_RE.test(normalized)) {
      setError("Informe um e-mail válido.");
      return;
    }
    setBusy(true);
    try {
      if (showRedeem && referral.trim()) {
        await api.redeemReferralPublic(normalized, referral.trim());
      } else {
        const res = await api.checkLogin(normalized);
        if (res.status !== "ALLOWED" && res.status !== "SIGNUP_CREATED") {
          throw new Error("Ocorreu um erro ao enviar o código. Tente novamente em instantes.");
        }
      }
      feedback("success");
      setStep("code");
      setCode("");
      setTimeout(() => codeRef.current?.focus(), 250);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Erro de conexão.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(value = code) {
    const token = value.replace(/\D/g, "");
    if (token.length < OTP_LENGTH) return;
    setError(null);
    setBusy(true);
    try {
      // "email" cobre o código de login; "magiclink" fica de reserva para versões antigas do Auth.
      for (const type of ["email", "magiclink"] as const) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: normalized,
          token,
          type,
        });
        if (!otpError) {
          feedback("success");
          return; // o AuthProvider leva para dentro do app
        }
      }
      // Conta de demonstração da revisão das lojas (só existe se configurada no backend).
      try {
        const { tokenHash } = await api.reviewLogin(normalized, token);
        const { error: hashError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "magiclink",
        });
        if (!hashError) return;
      } catch {
        /* não é a conta de revisão */
      }
      throw new Error(
        "Código inválido ou expirado. Confira o e-mail mais recente ou peça outro código.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      feedback("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={["top", "bottom"]} keyboard contentStyle={{ paddingTop: 48 }}>
      <T variant="eyebrow">{BRAND_NAME}</T>
      <T variant="display" accessibilityRole="header" style={{ marginTop: 6 }}>
        {step === "email" ? "Entre ou comece grátis." : "Confira seu e-mail."}
      </T>
      <T variant="bodySmall" style={{ marginTop: 8 }}>
        {step === "email"
          ? "Sem senha e sem cartão — 3 dias grátis para quem está chegando."
          : `Digite o código de ${OTP_LENGTH} dígitos que enviamos.`}
      </T>

      {step === "email" ? (
        <View style={{ marginTop: 28 }}>
          <FieldLabel>Seu e-mail</FieldLabel>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={requestCode}
            editable={!busy}
          />
          <ErrorText>{error}</ErrorText>
          <Button
            title="Receber código de acesso"
            loading={busy}
            onPress={requestCode}
            style={{ marginTop: 16 }}
          />

          <View style={styles.redeem}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowRedeem((v) => !v)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              hitSlop={8}
            >
              <Gift size={15} color={colors.roseInk} />
              <T variant="label" style={{ color: colors.roseInk, fontSize: 13 }}>
                {showRedeem ? "Fechar" : "Tem um código de indicação? Ganhe 7 dias grátis"}
              </T>
            </Pressable>
            {showRedeem && (
              <View style={{ marginTop: 12 }}>
                <T variant="caption" style={{ marginBottom: 8 }}>
                  Recebeu um código de uma amiga? Informe seu e-mail acima e o código abaixo — vocês
                  duas ganham 7 dias de acesso.
                </T>
                <Input
                  value={referral}
                  onChangeText={setReferral}
                  placeholder="Código de indicação"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
          </View>

          <T variant="caption" style={{ marginTop: 28, textAlign: "center" }}>
            Ao continuar, você concorda com os{" "}
            <T variant="caption" style={styles.link} onPress={() => Linking.openURL(TERMS_URL)}>
              Termos de uso
            </T>{" "}
            e a{" "}
            <T variant="caption" style={styles.link} onPress={() => Linking.openURL(PRIVACY_URL)}>
              Política de privacidade
            </T>
            .
          </T>
        </View>
      ) : (
        <View style={{ marginTop: 28, alignItems: "stretch" }}>
          <View style={{ alignItems: "center" }}>
            <IconCircle icon={MailCheck} size={56} />
            <T variant="bodySmall" style={{ textAlign: "center", marginTop: 12 }}>
              Enviamos para <T variant="label">{normalized}</T>. O código vale por pouco tempo e é
              de uso único.
            </T>
          </View>
          <Input
            ref={codeRef}
            value={code}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, "").slice(0, OTP_LENGTH);
              setCode(digits);
              if (digits.length === OTP_LENGTH) void verify(digits);
            }}
            placeholder={"0".repeat(OTP_LENGTH)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            style={styles.code}
            accessibilityLabel="Código de acesso"
            editable={!busy}
          />
          <ErrorText>{error}</ErrorText>
          <Button
            title="Entrar"
            loading={busy}
            disabled={code.length < OTP_LENGTH}
            onPress={() => verify()}
            style={{ marginTop: 16 }}
          />
          <View style={styles.hint}>
            <MailWarning size={14} color={colors.inkFaint} />
            <T variant="caption">Não chegou? Veja a caixa de spam ou promoções.</T>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              title="Reenviar código"
              onPress={requestCode}
              disabled={busy}
            />
            <Button
              variant="ghost"
              size="sm"
              title="Usar outro e-mail"
              onPress={() => {
                setStep("email");
                setError(null);
              }}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  redeem: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  link: { color: colors.roseInk, textDecorationLine: "underline" },
  code: {
    marginTop: 24,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 30,
    letterSpacing: 10,
    minHeight: 64,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
  },
});
