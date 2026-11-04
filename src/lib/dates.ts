// Calendar dates are handled as ISO strings (YYYY-MM-DD), never as JS Date in local time,
// so no UTC shift can move a due date.

export function todaySP(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: "year" | "month" | "day") => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error("Componente de data não encontrado: " + type);
    return value;
  };
  return [get("year"), get("month"), get("day")].join("-");
}

function toUTC(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fromUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = toUTC(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function lastDayOfMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Adds months, clamping to the last valid day (Jan 31 + 1 → Feb 28/29). */
export function addMonthsClamped(iso: string, months: number): string {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, lastDayOfMonth(ny, nm));
  return `${ny}-${String(nm).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

export function startOfMonth(iso: string): string {
  return iso.slice(0, 8) + "01";
}
export function endOfMonth(iso: string): string {
  const [y = 0, m = 1] = iso.split("-").map(Number);
  return `${iso.slice(0, 8)}${String(lastDayOfMonth(y, m)).padStart(2, "0")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y = "", m = "", d = ""] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(a).getTime() - toUTC(b).getTime()) / 86400000);
}

export type PeriodKey = "mes" | "7d" | "30d" | "custom";

export function periodRange(key: PeriodKey, today: string, custom?: { from: string; to: string }) {
  switch (key) {
    case "mes":
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case "7d":
      return { from: today, to: addDays(today, 7) };
    case "30d":
      return { from: today, to: addDays(today, 30) };
    case "custom":
      return custom ?? { from: today, to: addDays(today, 30) };
  }
}

export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
