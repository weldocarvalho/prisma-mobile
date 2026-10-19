/**
 * "Hoje" no fuso do aparelho do usuário (YYYY-MM-DD).
 *
 * Antes o app usava `new Date().toISOString().slice(0, 10)`, que é a data em UTC:
 * no Brasil (UTC-3) o "dia" virava às 21h — as refeições marcadas sumiam e o
 * check-in da noite caía no dia seguinte. Toda chave de dia gravada/lida no
 * cliente deve passar por aqui.
 */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Meia-noite UTC do dia local — para os helpers que trabalham com chaves UTC. */
export function localToday(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Relógio atual em ms (fora do render — evita a regra de pureza do React Compiler). */
export function nowMs(): number {
  return Date.now();
}
