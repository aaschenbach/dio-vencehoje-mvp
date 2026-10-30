import { createFileRoute, Link } from "@tanstack/react-router";
import { BellOff } from "lucide-react";
import { useEntries, useProfile } from "@/lib/data";
import { addDays, diffDays, formatDate, todaySP } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { EmptyState, ErrorState, KindBadge, Loading, PageHeader, StatusBadge } from "@/components/common";
import type { Entry } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/lembretes")({
  head: () => ({ meta: [{ title: "Lembretes — VenceHoje" }, { name: "description", content: "Contas próximas e vencidas." }] }),
  component: Lembretes,
});

function Item({ e, today }: { e: Entry; today: string }) {
  const d = diffDays(e.due_date, today);
  const when = d < 0 ? `Venceu há ${-d} dia(s)` : d === 0 ? "Vence hoje" : `Vence em ${d} dia(s)`;
  return (
    <li>
      <Link to="/lancamentos" search={{ id: e.id }} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 hover:bg-muted/50">
        <div>
          <p className="font-semibold">{e.description}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><KindBadge kind={e.kind} />{formatDate(e.due_date)} · {when}</p>
        </div>
        <div className="flex items-center gap-3"><span className="font-bold tabular">{formatBRL(e.remaining)}</span><StatusBadge status={e.status} /></div>
      </Link>
    </li>
  );
}

function Lembretes() {
  const today = todaySP();
  const { data: prof } = useProfile();
  const days = prof?.prefs?.reminder_days ?? 3;
  const { data, isLoading, error, refetch } = useEntries({ to: addDays(today, days), openOnly: true });
  const late = (data ?? []).filter((e) => e.status === "atrasado");
  const soon = (data ?? []).filter((e) => e.status !== "atrasado" && e.due_date >= today);

  return (
    <>
      <PageHeader
        title="Lembretes"
        description={`Mostrando contas que vencem nos próximos ${days} dia(s). Altere a antecedência em Configurações.`}
      />
      <p className="mb-6 rounded-xl bg-info-soft px-4 py-3 text-sm text-primary">
        Nesta versão os lembretes aparecem somente aqui no aplicativo. Não enviamos e-mail, push ou WhatsApp.
      </p>
      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : late.length + soon.length === 0 ? (
        <EmptyState icon={<BellOff className="h-8 w-8" />} title="Nenhum lembrete">Nada vencido nem vencendo em breve.</EmptyState>
      ) : (
        <div className="space-y-8">
          {late.length > 0 && <section><h2 className="mb-3 font-bold text-danger">Vencidas ({late.length})</h2><ul className="space-y-2">{late.map((e) => <Item key={e.id} e={e} today={today} />)}</ul></section>}
          {soon.length > 0 && <section><h2 className="mb-3 font-bold">Próximas do vencimento ({soon.length})</h2><ul className="space-y-2">{soon.map((e) => <Item key={e.id} e={e} today={today} />)}</ul></section>}
        </div>
      )}
    </>
  );
}
