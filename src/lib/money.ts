// Money is converted to integer cents for any arithmetic in the browser.
// The database stores numeric(14,2) and is the source of truth.

export function toCents(v: number | string | null | undefined): number {
  if (v === null || v === undefined || v === "") return 0;
  const s = typeof v === "number" ? v.toFixed(2) : String(v);
  const neg = s.trim().startsWith("-");
  const [int, frac = ""] = s.replace("-", "").split(".");
  const cents = Number(int || "0") * 100 + Number((frac + "00").slice(0, 2));
  return neg ? -cents : cents;
}

export function centsToDecimal(c: number): string {
  const neg = c < 0;
  const abs = Math.abs(c);
  return `${neg ? "-" : ""}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function formatBRL(v: number | string | null | undefined): string {
  return fmt.format(toCents(v) / 100);
}

/** Parses user input like "1.234,56", "1234,5" or "1234.56" into a decimal string, or null. */
export function parseBRLInput(input: string): string | null {
  const s = input.replace(/[R$\s]/g, "");
  if (!s) return null;
  let normalized = s;
  if (s.includes(",")) normalized = s.replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return centsToDecimal(toCents(normalized));
}

export type EntryStatus = "pendente" | "parcial" | "quitado" | "atrasado";

export function computeStatus(amount: number | string, paid: number | string, due: string, today: string): EntryStatus {
  const remaining = toCents(amount) - toCents(paid);
  if (remaining <= 0) return "quitado";
  if (due < today) return "atrasado";
  if (toCents(paid) > 0) return "parcial";
  return "pendente";
}

export function canSettle(amount: number | string, paidSoFar: number | string, value: number | string): boolean {
  const v = toCents(value);
  return v > 0 && toCents(paidSoFar) + v <= toCents(amount);
}
