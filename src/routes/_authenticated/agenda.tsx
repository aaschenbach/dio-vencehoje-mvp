import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useEntries, type Entry } from "@/lib/data";
import { MONTHS_PT, addMonthsClamped, endOfMonth, formatDate, startOfMonth, todaySP, addDays } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/common";
import { EntryList } from "@/components/EntryList";
import { EntryFormDialog } from "@/components/EntryFormDialog";
import { EntryDetailSheet } from "@/components/EntryDetailSheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({ meta: [{ title: "Agenda — VenceHoje" }, { name: "description", content: "Agenda de vencimentos." }] }),
  component: Agenda,
});

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Agenda() {
  const today = todaySP();
  const [month, setMonth] = useState(startOfMonth(today));
  const [selected, setSelected] = useState<string | null>(null);
  const [kind, setKind] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [view, setView] = useState<"mes" | "lista">("mes");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const { data: categories } = useCategories();
  const from = month, to = endOfMonth(month);
  const { data, isLoading, error, refetch } = useEntries({ from, to, kind });

  const entries = useMemo(() => (data ?? []).filter((e) => status === "todos" || e.status === status), [data, status]);
  const byDay = useMemo(() => {
    const m = new Map<string, Entry[]>();
    entries.forEach((e) => m.set(e.due_date, [...(m.get(e.due_date) ?? []), e]));
    return m;
  }, [entries]);

  const [y, mo] = month.split("-").map(Number);
  const firstDow = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const days: (string | null)[] = [...Array(firstDow).fill(null)];
  for (let d = month; d <= to; d = addDays(d, 1)) days.push(d);
  const shown = selected ? byDay.get(selected) ?? [] : entries;

  return (
    <>
      <PageHeader title="Agenda" actions={<Button onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" />Novo lançamento</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" aria-label="Mês anterior" onClick={() => { setMonth(addMonthsClamped(month, -1)); setSelected(null); }}><ChevronLeft className="h-4 w-4" /></Button>
        <p className="min-w-40 text-center font-bold" aria-live="polite">{MONTHS_PT[mo - 1]} {y}</p>
        <Button size="icon" variant="outline" aria-label="Próximo mês" onClick={() => { setMonth(addMonthsClamped(month, 1)); setSelected(null); }}><ChevronRight className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" onClick={() => { setMonth(startOfMonth(today)); setSelected(today); }}>Hoje</Button>
        <div className="ml-auto flex flex-wrap gap-2">
          <Select value={kind} onValueChange={setKind}><SelectTrigger className="w-36" aria-label="Tipo"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="pagar">A pagar</SelectItem><SelectItem value="receber">A receber</SelectItem></SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40" aria-label="Situação"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todas situações</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="parcial">Parcial</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem><SelectItem value="quitado">Quitado</SelectItem></SelectContent></Select>
          <div className="flex rounded-lg border p-0.5">
            {(["mes", "lista"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={cn("rounded-md px-3 py-1 text-sm font-semibold", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {v === "mes" ? "Mês" : "Lista"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : (
        <>
          {view === "mes" && (
            <div className="mb-6 rounded-2xl border bg-card p-2 sm:p-4">
              <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground">{WEEK.map((w) => <div key={w} className="py-2">{w}</div>)}</div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />;
                  const list = byDay.get(d) ?? [];
                  const late = list.some((e) => e.status === "atrasado");
                  const soon = !late && list.some((e) => e.status !== "quitado" && d >= today && d <= addDays(today, 3));
                  return (
                    <button
                      key={d}
                      onClick={() => setSelected(selected === d ? null : d)}
                      aria-pressed={selected === d}
                      aria-label={`${formatDate(d)}: ${list.length} lançamento(s)${late ? ", com atraso" : ""}`}
                      className={cn(
                        "flex min-h-14 flex-col items-center rounded-lg border p-1 text-sm sm:min-h-20 sm:items-start sm:p-2",
                        selected === d ? "border-primary bg-secondary" : "border-transparent hover:bg-muted",
                        d === today && "ring-2 ring-success",
                      )}
                    >
                      <span className="font-semibold">{Number(d.slice(8))}</span>
                      {list.length > 0 && (
                        <span className={cn("mt-1 rounded-full px-1.5 text-[10px] font-bold", late ? "bg-danger-soft text-danger" : soon ? "bg-warning-soft text-warning-foreground" : "bg-info-soft text-primary")}>
                          {list.length}<span className="hidden sm:inline"> · {late ? "atraso" : soon ? "próximo" : formatBRL(list.reduce((s, e) => s + Number(e.remaining), 0))}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <h2 className="mb-3 font-bold">{selected ? `Vencimentos em ${formatDate(selected)}` : "Todos os vencimentos do mês"}</h2>
          {shown.length === 0 ? <EmptyState title="Nenhum vencimento">Nada para esta seleção.</EmptyState> : <EntryList entries={shown} categories={categories} onOpen={setOpenId} />}
        </>
      )}
      <EntryFormDialog open={newOpen} onOpenChange={setNewOpen} defaultDate={selected ?? undefined} />
      <EntryDetailSheet entryId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
