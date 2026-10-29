import { describe, expect, it } from "vitest";
import { addMonthsClamped, formatDate, periodRange, todaySP } from "./dates";
import { canSettle, computeStatus, formatBRL, parseBRLInput, toCents } from "./money";
import { occurrenceDates } from "./recurrence";

describe("status", () => {
  const today = "2027-05-15";
  it("pendente sem baixas e no prazo", () => expect(computeStatus("100.00", 0, "2027-05-20", today)).toBe("pendente"));
  it("parcial com baixa e no prazo", () => expect(computeStatus("100.00", "40.00", "2027-05-20", today)).toBe("parcial"));
  it("atrasado quando venceu com saldo", () => expect(computeStatus("100.00", 0, "2027-05-14", today)).toBe("atrasado"));
  it("parcial vencido é atrasado", () => expect(computeStatus("100.00", "40.00", "2027-05-01", today)).toBe("atrasado"));
  it("quitado quando saldo zera, mesmo vencido", () => expect(computeStatus("100.00", "100.00", "2027-05-01", today)).toBe("quitado"));
  it("vence hoje não é atrasado", () => expect(computeStatus("100.00", 0, today, today)).toBe("pendente"));
});

describe("baixas", () => {
  it("rejeita zero e negativo", () => {
    expect(canSettle("100", "0", "0")).toBe(false);
    expect(canSettle("100", "0", "-1")).toBe(false);
  });
  it("rejeita soma acima do valor", () => expect(canSettle("100.00", "60.00", "40.01")).toBe(false));
  it("aceita quitação exata sem erro de ponto flutuante", () => expect(canSettle("0.30", "0.10", "0.20")).toBe(true));
});

describe("dinheiro", () => {
  it("converte para centavos exatos", () => expect(toCents("1500.10")).toBe(150010));
  it("formata em BRL", () => expect(formatBRL("1234.5").replace(/\s/g, " ")).toBe("R$ 1.234,50"));
  it("aceita vírgula decimal", () => expect(parseBRLInput("1.234,56")).toBe("1234.56"));
  it("rejeita texto inválido", () => expect(parseBRLInput("12,345")).toBeNull());
});

describe("datas", () => {
  it("formata DD/MM/AAAA sem deslocamento de fuso", () => expect(formatDate("2027-01-01")).toBe("01/01/2027"));
  it("hoje em São Paulo às 01h UTC ainda é o dia anterior", () =>
    expect(todaySP(new Date("2027-03-10T01:00:00Z"))).toBe("2027-03-09"));
  it("31/jan + 1 mês = 28/fev", () => expect(addMonthsClamped("2027-01-31", 1)).toBe("2027-02-28"));
  it("período próximos 7 dias", () => expect(periodRange("7d", "2027-12-28")).toEqual({ from: "2027-12-28", to: "2028-01-04" }));
});

describe("recorrência", () => {
  it("mensal no dia 31 usa último dia válido e volta ao 31", () =>
    expect(occurrenceDates({ anchor: "2027-01-31", freq: "mensal", until: "2027-04-30" })).toEqual([
      "2027-01-31", "2027-02-28", "2027-03-31", "2027-04-30",
    ]));
  it("fevereiro bissexto e virada de ano", () =>
    expect(occurrenceDates({ anchor: "2027-11-30", freq: "mensal", until: "2028-03-31" })).toEqual([
      "2027-11-30", "2027-12-30", "2028-01-30", "2028-02-29", "2028-03-30",
    ]));
  it("respeita data final", () =>
    expect(occurrenceDates({ anchor: "2027-01-10", freq: "mensal", until: "2030-01-01", end: "2027-03-10" })).toHaveLength(3));
  it("exceção não reaparece", () =>
    expect(occurrenceDates({ anchor: "2027-01-10", freq: "mensal", until: "2027-03-10", exceptions: ["2027-02-10"] })).toEqual([
      "2027-01-10", "2027-03-10",
    ]));
  it("série dividida mantém âncora original (31 → 30/abr → 31/mai)", () =>
    expect(occurrenceDates({ anchor: "2027-01-31", start: "2027-04-30", freq: "mensal", until: "2027-05-31" })).toEqual([
      "2027-04-30", "2027-05-31",
    ]));
  it("semanal", () =>
    expect(occurrenceDates({ anchor: "2027-12-27", freq: "semanal", until: "2028-01-10" })).toEqual([
      "2027-12-27", "2028-01-03", "2028-01-10",
    ]));
  it("anual em 29/fev cai em 28/fev", () =>
    expect(occurrenceDates({ anchor: "2028-02-29", freq: "anual", until: "2029-12-31" })).toEqual(["2028-02-29", "2029-02-28"]));
});
