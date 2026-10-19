# Prisma Nutri — app nativo (iOS e Android)

Versão para App Store e Google Play do **nutri-app** (pasta `../nutri-app`).
Mesma conta, mesmo banco (Supabase) e mesmo backend. Quem já usa o site entra
no app com o mesmo e-mail e encontra plano, refeições e sequência.

- **Stack:** Expo SDK 57 · React Native 0.86 · Expo Router · TypeScript ·
  Supabase · React Query · RevenueCat (assinaturas nas lojas) · Expo Notifications
- **Visual:** o mesmo sistema "OneLine" do web (papel claro, tinta, acento
  rosé, Cormorant Garamond itálico + Jost), com padrões nativos: abas
  inferiores, folhas deslizantes, feedback tátil, "puxar para atualizar",
  seletor de data nativo e código de login com preenchimento automático.

---

## 1. Rodar no seu computador

Pré-requisitos: Node 20+, conta gratuita em https://expo.dev e o app no celular
via *development build* (o Expo Go não carrega os módulos nativos de compras).

```bash
cd prisma-mobile
npm install
cp .env.example .env        # já existe um .env com as chaves públicas do Supabase
npx eas-cli@latest login
npx eas-cli@latest init     # cria o projeto na Expo → copie o id para EAS_PROJECT_ID no .env
npm run build:dev           # gera o app de desenvolvimento (iOS/Android) na nuvem
npm start                   # abre o servidor; leia o QR code com o app de desenvolvimento
```

Com Xcode/Android Studio instalados, dá para compilar local: `npm run ios` / `npm run android`.

Verificações: `npm run check` (TypeScript + ESLint).

## 2. O que mudou no backend (nutri-app)

O app nativo não consegue chamar as *server functions* do TanStack (os
endereços delas mudam a cada build). Então o nutri-app ganhou rotas HTTP
estáveis que **reaproveitam as mesmas funções** — nenhuma regra foi duplicada.

| Arquivo | O que faz |
|---|---|
| `src/routes/api/mobile/$action.ts` | `POST /api/mobile/<ação>` com `Authorization: Bearer <token do Supabase>`: gerar/confirmar plano, estimar refeição por foto/texto, indicação, notificação de teste, sync da assinatura, **exclusão de conta** |
| `src/routes/api/public/payments/webhook-revenuecat.ts` | Webhook do RevenueCat → grava a assinatura da loja em `subscriptions` (`source = 'revenuecat'`) |
| `src/routes/api/public/auth/review-login.ts` | Login da conta de demonstração da revisão Apple/Google (desligado sem as variáveis) |
| `src/lib/revenuecat.server.ts` (+ teste) | Busca o assinante no RevenueCat e converte em linha de `subscriptions` |
| `src/lib/expoPush.server.ts` | Envio de push para iPhone/Android pelo Expo; `sendPushToProfile` agora envia para web **e** app |
| `src/lib/accountDeletion.server.ts` | Exclusão de conta (exigida pelas lojas) |
| `src/lib/email.server.ts`, `check-login.ts`, `redeem-referral.ts` | Pedido vindo do app (`client: "app"`) recebe e-mail com **código de 6 dígitos** além do link |
| `supabase/migrations/20260924120000_mobile_app_support.sql` | Tabela `mobile_push_tokens`, função `register_mobile_push_token`, coluna `subscriptions.store` |
| `src/integrations/supabase/types.ts` | Tipos das novidades acima |

**Para ativar:**

1. Rodar a migration no Supabase (`supabase db push` ou colar o SQL no editor).
2. Adicionar ao `.env.production.gcp` (já listadas no `.example`) e fazer deploy:
   `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_ENTITLEMENT_ID=premium`,
   `MOBILE_AUTH_REDIRECT_URL=prismanutri://auth/callback`, `APP_REVIEW_EMAIL`, `APP_REVIEW_CODE`.
3. Supabase → Authentication → URL Configuration → *Redirect URLs*: adicionar `prismanutri://auth/callback`.
4. Supabase → Authentication → Email: confira o **OTP length** (padrão 6). Se for outro valor,
   ajuste `EXPO_PUBLIC_OTP_LENGTH` no app.

O web continua funcionando exatamente como antes (build, testes e typecheck do nutri-app passam).

## 3. Assinaturas (RevenueCat + lojas)

Apple e Google exigem que assinatura digital vendida **dentro do app** use a
cobrança deles. O preço exibido vem da loja (nunca fixo no código).

1. **App Store Connect:** criar o app (bundle `br.com.belteroracle.prismanutri`),
   um *Subscription Group* e a assinatura mensal (ex.: `prisma_monthly`, R$ 12,90 ou o
   preço que quiser). Preencher o contrato de apps pagos e dados bancários.
2. **Google Play Console:** criar o app (mesmo pacote), a assinatura `prisma_monthly`
   com plano base mensal. Subir um primeiro build (faixa interna) para liberar os produtos.
3. **RevenueCat** (https://app.revenuecat.com): criar o projeto, adicionar os apps iOS
   e Android, importar os produtos, criar o *entitlement* `premium` com os dois produtos e
   uma *offering* `default` com o pacote mensal.
4. Chaves: as **públicas** de cada app vão em `EXPO_PUBLIC_REVENUECAT_IOS_KEY` /
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`; a **secreta** (`sk_…`) vai no backend
   (`REVENUECAT_SECRET_API_KEY`).
5. Webhook: RevenueCat → Integrations → Webhooks → URL
   `https://prismanutri.belter-oracle.com.br/api/public/payments/webhook-revenuecat`,
   header Authorization = valor de `REVENUECAT_WEBHOOK_AUTH`.

Como o acesso é decidido: mesma regra do web (`has_access` / `computeIsActive`) **ou**
direito ativo na loja. Quem assina pelo site entra no app com acesso; quem assina no
app ganha acesso no site também. Compras de teste (sandbox/TestFlight) também liberam
acesso — é o que permite a revisão da Apple testar a compra; o registro indica "sandbox".

## 4. Notificações push

- iOS: `npx eas-cli@latest credentials` → o EAS cria a chave APNs sozinho.
- Android: criar projeto no Firebase, baixar a *service account* e enviar em
  `eas credentials` (FCM v1).
- O token do aparelho é registrado quando a pessoa ativa as notificações (Perfil →
  Notificações ou ao concluir o primeiro check-in). Os lembretes, resumo semanal e
  marcos que o backend já dispara passam a chegar no celular sem nenhuma mudança nos crons.
- Tocar na notificação abre a tela certa (`/today`, `/routine`… — mesmos caminhos do web).

## 5. Publicar

```bash
npm run build:prod          # gera .ipa e .aab assinados na nuvem (versão incrementa sozinha)
npm run submit:ios          # envia para o App Store Connect (preencha ascAppId no eas.json)
npm run submit:android      # envia para a faixa interna do Google Play
```

Atualizações só de JavaScript (textos, telas) podem ir por `eas update` sem nova revisão.

**Checklist das lojas**

- [ ] Conta de demonstração: defina `APP_REVIEW_EMAIL` e `APP_REVIEW_CODE` (com o mesmo
      número de dígitos do OTP) no backend, entre uma vez com esse e-mail, libere o acesso
      pelo painel admin e informe e-mail + código nas notas de revisão.
- [ ] Exclusão de conta: Perfil → Excluir minha conta (já implementado). No Google Play,
      informe também a URL pública de exclusão (pode ser o e-mail de suporte).
- [ ] Privacidade: declarar e-mail, fotos de refeições/progresso, peso, dados de saúde
      e fitness (objetivo, atividade, sono, água), identificadores de compra. Sem rastreamento
      para anúncios no app.
- [ ] Classificação etária e categoria "Saúde e fitness". O texto de aviso regulatório
      (Lei 8.234/1991 — não é prescrição) aparece nas telas, como no web.
- [ ] Screenshots (6,7" e 6,5" no iOS; telefone no Android) e ícone 1024 px
      (`assets/icon.png`).
- [ ] Termos e Privacidade publicados em `/termos` e `/privacidade` (links já no app).

## 6. Estrutura

```
src/
  app/                     rotas (Expo Router) — mesmos caminhos do web
    login.tsx              e-mail → código de 6 dígitos
    auth/callback.tsx      link do e-mail aberto no celular
    (app)/(tabs)/          Início · Plano · Evolução · Desafios · Perfil
    (app)/today.tsx        check-in do dia, anel de calorias, refeições
    (app)/meal-logger.tsx  registrar refeição (foto IA, texto IA, manual) — folha
    (app)/check-flow.tsx   check-in / check-out guiado — folha
    (app)/onboarding.tsx   questionário + geração do plano pela IA
    (app)/assinar.tsx      tela de assinatura (lojas)
    (app)/notifications.tsx, tips.tsx, journal.tsx, delete-account.tsx
  components/              UI (tokens do web), anéis, cartões, gráficos
  hooks/queries.ts         dados com cache (React Query) compartilhado entre telas
  lib/                     supabase, api do backend, compras, push, e as regras
                           copiadas do web (xp, streak, desafios, metas…)
  providers/               sessão/perfil e acesso premium
```

As regras de gamificação e metas (`xp.ts`, `streak.ts`, `challenges.ts`,
`achievements.ts`, `nutritionTargets.ts`, `routineAttempts.ts`,
`subscriptionAccess.ts`) são cópias exatas do web. Se mudar lá, copie para cá.

## 7. Observações

- O diário de fotos segue a mesma chave do web: fica escondido enquanto
  `EXPO_PUBLIC_FEATURE_SELFIE_JOURNAL=false`.
- A área de admin e as páginas de venda ficam só no web.
- No app, os sons do web viraram vibração (Perfil → Vibração).
