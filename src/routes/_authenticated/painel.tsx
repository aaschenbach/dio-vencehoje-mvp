import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ensureOccurrences, qk, useCategories, useEntries } from "@/lib/data";
import { formatDate, periodRange, todaySP, type PeriodKey } from "@/lib/dates";
import { formatBRL, toCents } from "@/lib/money";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/common";
import { EntryList } from "@/components/EntryList";
import { EntryFormDialog } from "@/components/EntryFormDialog";
import { EntryDetailSheet } from "@/components/EntryDetailSheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Painel — VenceHoje" }, { name: "description", content: "Resumo das suas contas." }] }),
  component: Painel,
});

const PERIODS: { k: PeriodKey; l: string }[] = [
  { k: "mes", l: "Este mês" }, { k: "7d", l: "Próximos 7 dias" }, { k: "30d", l: "Próximos 30 dias" }, { k: "custom", l: "Personalizado" },
];

function Kpi({ label, value, tone, hint }: { label: string; value: number; tone: string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <p className={cn("text-xs font-bold uppercase tracking-wide", tone)}>{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular">{formatBRL(value)}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Painel() {
  const today = todaySP();
  const [period, setPeriod] = useState<PeriodKey>("mes");
  const [custom, setCustom] = useState({ from: today, to: today });
  const range = periodRange(period, today, custom);
  const [newOpen, setNewOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: categories } = useCategories();

  const totals = useQuery({
    queryKey: qk.dashboard(range.from, range.to),
    queryFn: async () => {
      await ensureOccurrences(range.to);
      const { data, error } = await supabase.rpc("dashboard_totals", { _from: range.from, _to: range.to });
      if (error) throw error;
      return data as Record<string, number>;
    },
  });
  const upcoming = useEntries({ from: range.from, to: range.to, openOnly: true });
  const late = useEntries({ to: today, openOnly: true });
  const lateList = (late.data ?? []).filter((e) => e.status === "atrasado");
  const upcomingList = (upcoming.data ?? []).filter((e) => e.status !== "atrasado").slice(0, 8);

  const t = totals.data;
  const forecast = t ? (toCents(t.open_rec) - toCents(t.open_pay)) / 100 : 0;

  return (
    <>
      <PageHeader
        title="Painel"
        description={`${formatDate(range.from)} a ${formatDate(range.to)}`}
        actions={
          <>
            <Button variant="outline" asChild><Link to="/agenda"><CalendarDays className="mr-1 h-4 w-4" />Agenda</Link></Button>
            <Button onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" />Novo lançamento</Button>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-center gap-2" role="group" aria-label="Período">
        {PERIODS.map((p) => (
          <Button key={p.k} size="sm" variant={period === p.k ? "default" : "outline"} aria-pressed={period === p.k} onClick={() => setPeriod(p.k)}>{p.l}</Button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" aria-label="De" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="h-9 w-40" />
            <span className="text-sm">até</span>
            <Input type="date" aria-label="Até" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="h-9 w-40" />
          </div>
        )}
      </div>

      {totals.isLoading ? <Loading /> : totals.error ? <ErrorState onRetry={() => totals.refetch()} /> : t && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="A pagar em aberto" value={t.open_pay} tone="text-danger" hint="Vencimentos no período" />
            <Kpi label="A receber em aberto" value={t.open_rec} tone="text-accent-foreground" hint="Vencimentos no período" />
            <Kpi label="Vencido a pagar" value={t.late_pay} tone="text-danger" hint="Atrasados até hoje" />
            <Kpi label="Vencido a receber" value={t.late_rec} tone="text-warning-foreground" hint="Atrasados até hoje" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-primary p-5 text-primary-foreground md:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">Saldo previsto do período</p>
              <p className="mt-2 text-2xl font-extrabold tabular">{formatBRL(forecast)}</p>
              <p className="mt-1 text-xs opacity-80">A receber menos a pagar em aberto. Não é saldo bancário nem dinheiro disponível.</p>
            </div>
            <Kpi label="Pago no período" value={t.settled_pay} tone="text-muted-foreground" />
            <Kpi label="Recebido no período" value={t.settled_rec} tone="text-muted-foreground" />
          </div>
        </>
      )}

      <div className="mt-8 grid gap-8">
        <section>
          <h2 className="mb-3 text-lg font-bold">Atrasados</h2>
          {late.isLoading ? <Loading /> : lateList.length === 0 ? (
            <EmptyState title="Nada atrasado">Tudo em dia por aqui.</EmptyState>
          ) : <EntryList entries={lateList} categories={categories} onOpen={setOpenId} />}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Próximos vencimentos</h2>
          {upcoming.isLoading ? <Loading /> : upcomingList.length === 0 ? (
            <EmptyState icon={<Inbox className="h-8 w-8" />} title="Nenhum vencimento no período" action={<Button onClick={() => setNewOpen(true)}>Cadastrar conta</Button>}>
              Cadastre suas contas a pagar e a receber para acompanhar os prazos.
            </EmptyState>
          ) : <EntryList entries={upcomingList} categories={categories} onOpen={setOpenId} />}
        </section>
      </div>
      <EntryFormDialog open={newOpen} onOpenChange={setNewOpen} />
      <EntryDetailSheet entryId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
