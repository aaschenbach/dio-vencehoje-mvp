import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useEntries } from "@/lib/data";
import { addDays, endOfMonth, startOfMonth, todaySP } from "@/lib/dates";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/common";
import { EntryList } from "@/components/EntryList";
import { EntryFormDialog } from "@/components/EntryFormDialog";
import { EntryDetailSheet } from "@/components/EntryDetailSheet";

export const Route = createFileRoute("/_authenticated/lancamentos")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [{ title: "Lançamentos — VenceHoje" }, { name: "description", content: "Suas contas a pagar e a receber." }] }),
  component: Lancamentos,
});

function Lancamentos() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const today = todaySP();
  const [from, setFrom] = useState(startOfMonth(addDays(today, -60)));
  const [to, setTo] = useState(endOfMonth(addDays(today, 60)));
  const [kind, setKind] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [category, setCategory] = useState("todas");
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const { data, isLoading, error, refetch } = useEntries({ from, to, kind });

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter(
      (e) => (status === "todos" || e.status === status) && (category === "todas" || e.category_id === category) &&
        (!term || e.description.toLowerCase().includes(term) || (e.notes ?? "").toLowerCase().includes(term)),
    );
  }, [data, status, category, q]);

  const setOpen = (v: string | null) => navigate({ to: "/lancamentos", search: v ? { id: v } : {}, replace: true });

  return (
    <>
      <PageHeader title="Lançamentos" description="Pagamentos e recebimentos" actions={<Button onClick={() => setNewOpen(true)}><Plus className="mr-1 h-4 w-4" />Novo lançamento</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Pesquisar" placeholder="Pesquisar descrição" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Tipo"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os tipos</SelectItem><SelectItem value="pagar">A pagar</SelectItem><SelectItem value="receber">A receber</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Situação"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="parcial">Parcial</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem><SelectItem value="quitado">Quitado</SelectItem></SelectContent></Select>
        <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Categoria"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as categorias</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.kind === "pagar" ? "pagar" : "receber"})</SelectItem>)}</SelectContent></Select>
        <div className="flex gap-1">
          <Input type="date" aria-label="De" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" aria-label="Até" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : list.length === 0 ? (
        <EmptyState icon={<Inbox className="h-8 w-8" />} title="Nenhum lançamento encontrado" action={<Button onClick={() => setNewOpen(true)}>Novo lançamento</Button>}>
          Ajuste os filtros ou cadastre uma conta.
        </EmptyState>
      ) : <EntryList entries={list} categories={categories} onOpen={setOpen} />}
      <EntryFormDialog open={newOpen} onOpenChange={setNewOpen} />
      <EntryDetailSheet entryId={id ?? null} onClose={() => setOpen(null)} />
    </>
  );
}
