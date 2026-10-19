export type SubscriptionRow = {
  id: string;
  status: string;
  plan: string;
  source: string;
  current_period_end: string | null;
  bonus_period_end: string | null;
  cancel_at_period_end: boolean;
  paddle_customer_id: string | null;
  paddle_subscription_id: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  payment_method?: string | null;
  environment: string;
};

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function computeIsActive(row: SubscriptionRow | null): boolean {
  if (!row) return false;
  const bonusOk = !!row.bonus_period_end && new Date(row.bonus_period_end) > new Date();
  if (bonusOk) return true;
  const periodOk = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (ACTIVE_STATUSES.has(row.status) && periodOk) return true;
  // Cancelada só vale até o fim do período já pago. Sem data de fim (NULL) NÃO é acesso:
  // antes, "canceled" + NULL era tratado como ativo e o cliente que cancelou ficava com
  // acesso pra sempre.
  if (row.status === "canceled" && !!row.current_period_end && periodOk) return true;
  return false;
}

/**
 * Pix (avulso) e cartão (recorrente) podem coexistir. Prefere a linha que
 * concede acesso hoje — e, entre várias, a que vale por mais tempo; sem
 * nenhuma ativa, mostra a mais recente.
 */
export function pickCurrentSubscription(rows: SubscriptionRow[]): SubscriptionRow | null {
  if (rows.length === 0) return null;
  const active = rows.filter((row) => computeIsActive(row));
  if (active.length === 0) return rows[0];
  const endOf = (row: SubscriptionRow) => {
    const end = row.current_period_end ? new Date(row.current_period_end).getTime() : Infinity;
    const bonus = row.bonus_period_end ? new Date(row.bonus_period_end).getTime() : 0;
    return Math.max(end, bonus);
  };
  return active.reduce((best, row) => (endOf(row) > endOf(best) ? row : best));
}
