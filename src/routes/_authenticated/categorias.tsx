import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { getMyWorkspaceId, useCategories, type Category } from "@/lib/data";
import { ErrorState, Loading, PageHeader, errorMessage } from "@/components/common";

export const Route = createFileRoute("/_authenticated/categorias")({
  head: () => ({ meta: [{ title: "Categorias — VenceHoje" }] }),
  component: Categorias,
});

function Column({ kind, items }: { kind: "pagar" | "receber"; items: Category[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ workspace_id: await getMyWorkspaceId(), kind, name: name.trim() });
    if (error) return toast.error(errorMessage(error));
    setName("");
    qc.invalidateQueries();
  }
  async function rename() {
    if (!editing?.name.trim()) return;
    const { error } = await supabase.from("categories").update({ name: editing.name.trim() }).eq("id", editing.id);
    if (error) return toast.error(errorMessage(error));
    toast.success("Categoria renomeada. Os lançamentos continuam ligados a ela.");
    setEditing(null);
    qc.invalidateQueries();
  }
  async function toggle(c: Category) {
    const { error } = await supabase.from("categories").update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(errorMessage(error));
    qc.invalidateQueries();
  }

  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-bold">{kind === "pagar" ? "A pagar" : "A receber"}</h2>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <Input aria-label="Nova categoria" placeholder="Nova categoria" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <Button size="icon" aria-label="Adicionar"><Plus className="h-4 w-4" /></Button>
      </form>
      <ul className="mt-4 divide-y">
        {items.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2">
            {editing?.id === c.id ? (
              <form onSubmit={(e) => { e.preventDefault(); rename(); }} className="flex flex-1 gap-2">
                <Input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Nome da categoria" />
                <Button size="sm">Salvar</Button>
              </form>
            ) : (
              <span className={c.active ? "" : "text-muted-foreground line-through"}>{c.name}</span>
            )}
            <div className="flex items-center gap-2">
              {editing?.id !== c.id && <Button size="icon" variant="ghost" aria-label={`Renomear ${c.name}`} onClick={() => setEditing({ id: c.id, name: c.name })}><Pencil className="h-4 w-4" /></Button>}
              <Switch checked={c.active} onCheckedChange={() => toggle(c)} aria-label={`${c.active ? "Desativar" : "Ativar"} ${c.name}`} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Categorias() {
  const { data, isLoading, error, refetch } = useCategories();
  return (
    <>
      <PageHeader title="Categorias" description="Categorias desativadas deixam de aparecer em novos lançamentos, mas o histórico é preservado." />
      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Column kind="pagar" items={(data ?? []).filter((c) => c.kind === "pagar")} />
          <Column kind="receber" items={(data ?? []).filter((c) => c.kind === "receber")} />
        </div>
      )}
    </>
  );
}
