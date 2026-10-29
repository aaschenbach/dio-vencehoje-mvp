import { addDays, addMonthsClamped } from "./dates";

export type Frequency = "semanal" | "mensal" | "anual";

export const FREQUENCY_LABEL: Record<Frequency | "nenhuma", string> = {
  nenhuma: "Não repetir",
  semanal: "Semanal",
  mensal: "Mensal",
  anual: "Anual",
};

/** n-th occurrence always computed from the anchor, so day 31 never drifts to 28. Mirrors public.occurrence_date. */
export function occurrenceDate(anchor: string, freq: Frequency, n: number): string {
  if (freq === "semanal") return addDays(anchor, n * 7);
  if (freq === "mensal") return addMonthsClamped(anchor, n);
  return addMonthsClamped(anchor, n * 12);
}

/** Mirrors public.generate_rule_occurrences for previews and tests. */
export function occurrenceDates(opts: {
  anchor: string;
  freq: Frequency;
  start?: string;
  until: string;
  end?: string | null;
  exceptions?: string[];
}): string[] {
  const start = opts.start ?? opts.anchor;
  const lim = opts.end && opts.end < opts.until ? opts.end : opts.until;
  const skip = new Set(opts.exceptions ?? []);
  const out: string[] = [];
  for (let n = 0; n <= 5000; n++) {
    const d = occurrenceDate(opts.anchor, opts.freq, n);
    if (d > lim) break;
    if (d >= start && !skip.has(d)) out.push(d);
  }
  return out;
}
