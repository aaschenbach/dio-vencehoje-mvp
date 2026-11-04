import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getMyWorkspaceId, useContacts, type Contact } from "@/lib/data";
import { ConfirmDialog, EmptyState, ErrorState, Loading, PageHeader, errorMessage } from "@/components/common";

export const Route = createFileRoute("/_authenticated/contatos")({
  head: () => ({ meta: [{ title: "Contatos — VenceHoje" }] }),
  component: Contatos,
});

function Contatos() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useContacts();
  const [edit, setEdit] = useState<Partial<Contact> | null>(null);
  const [del, setDel] = useState<Contact | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!edit?.name?.trim()) return void toast.error("Informe o nome.");
    setBusy(true);
    try {
      const payload = { name: edit.name.trim(), kind: edit.kind ?? "pessoa", email: edit.email?.trim() || null, phone: edit.phone?.trim() || null, notes: edit.notes?.trim() || null };
      const { error } = edit.id
        ? await supabase.from("contacts").update(payload).eq("id", edit.id)
        : await supabase.from("contacts").insert({ ...payload, workspace_id: await getMyWorkspaceId() });
      if (error) throw error;
      toast.success("Contato salvo.");
      setEdit(null);
      qc.invalidateQueries();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    const { error } = await supabase.from("contacts").delete().eq("id", del!.id);
    setBusy(false);
    if (error) return void toast.error(errorMessage(error));
    toast.success("Contato excluído. Os lançamentos ligados a ele foram mantidos.");
    setDel(null);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Contatos" description="Pessoas e empresas com quem você tem contas (opcional)." actions={<Button onClick={() => setEdit({ kind: "pessoa" })}><Plus className="mr-1 h-4 w-4" />Novo contato</Button>} />
      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : !data?.length ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Nenhum contato">Cadastre para associar a lançamentos.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((c) => (
            <li key={c.id} className="flex items-start justify-between rounded-2xl border bg-card p-4">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.kind === "pessoa" ? "Pessoa" : "Empresa"}{c.email ? ` · ${c.email}` : ""}{c.phone ? ` · ${c.phone}` : ""}</p>
              </div>
              <div className="flex">
                <Button size="icon" variant="ghost" aria-label={`Editar ${c.name}`} onClick={() => setEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label={`Excluir ${c.name}`} onClick={() => setDel(c)}><Trash2 className="h-4 w-4 text-danger" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar contato" : "Novo contato"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="cn">Nome</Label><Input id="cn" value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="ck">Tipo</Label>
              <Select value={edit?.kind ?? "pessoa"} onValueChange={(v) => setEdit({ ...edit, kind: v })}><SelectTrigger id="ck"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pessoa">Pessoa</SelectItem><SelectItem value="empresa">Empresa</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="ce">E-mail (opcional)</Label><Input id="ce" type="email" value={edit?.email ?? ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cp">Telefone/WhatsApp (opcional)</Label><Input id="cp" value={edit?.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="co">Observações</Label><Textarea id="co" rows={2} value={edit?.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button disabled={busy}>Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir contato?" description="Os lançamentos continuam existindo, apenas sem o contato." destructive confirmLabel="Excluir" busy={busy} onConfirm={remove} />
    </>
  );
}
