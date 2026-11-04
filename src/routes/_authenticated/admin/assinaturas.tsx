import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, todaySP } from "@/lib/dates";
import { formatBRL, parseBRLInput } from "@/lib/money";
import { SUB_STATUS_LABEL } from "@/lib/labels";
import { EmptyState, ErrorState, Loading, errorMessage } from "@/components/common";

export const Route = createFileRoute("/_authenticated/admin/assinaturas")({ component: Subs });

type Form = { id?: string; user_id: string; plan: string; status: string; start_date: string; end_date: string; amount: string; notes: string };

function Subs() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-subs"],
    queryFn: async () => {
      const [s, p] = await Promise.all([
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email, display_name").order("email"),
      ]);
      if (s.error) throw s.error;
      return { subs: s.data ?? [], users: p.data ?? [] };
    },
  });
  const userName = (id: string) => { const u = data?.users.find((x) => x.id === id); return u ? `${u.display_name ?? ""} ${u.email ?? ""}`.trim() : id; };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form?.user_id) return void toast.error("Escolha o cliente.");
    const amount = form.amount ? parseBRLInput(form.amount) : null;
    if (form.amount && !amount) return void toast.error("Valor inválido.");
    setBusy(true);
    const payload = { user_id: form.user_id, plan: form.plan || "Mensal", status: form.status, start_date: form.start_date, end_date: form.end_date || null, amount: amount ? Number(amount) : null, notes: form.notes.trim() || null };
    const { error } = form.id ? await supabase.from("subscriptions").update(payload).eq("id", form.id) : await supabase.from("subscriptions").insert(payload);
    setBusy(false);
    if (error) return void toast.error(errorMessage(error));
    toast.success("Assinatura salva.");
    setForm(null);
    qc.invalidateQueries();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Registro administrativo manual. Nenhuma cobrança é feita pelo sistema.</p>
        <Button onClick={() => setForm({ user_id: "", plan: "Mensal", status: "teste", start_date: todaySP(), end_date: "", amount: "15,00", notes: "" })}><Plus className="mr-1 h-4 w-4" />Nova assinatura</Button>
      </div>
      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : !data?.subs.length ? <EmptyState title="Nenhuma assinatura registrada" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Plano</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Início</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3 text-right">Valor</th><th /></tr></thead>
            <tbody className="divide-y">
              {data.subs.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3">{userName(s.user_id)}</td><td className="px-4 py-3">{s.plan}</td><td className="px-4 py-3">{SUB_STATUS_LABEL[s.status]}</td>
                  <td className="px-4 py-3">{formatDate(s.start_date)}</td><td className="px-4 py-3">{formatDate(s.end_date)}</td><td className="px-4 py-3 text-right tabular">{s.amount == null ? "—" : formatBRL(s.amount)}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => setForm({ id: s.id, user_id: s.user_id, plan: s.plan, status: s.status, start_date: s.start_date, end_date: s.end_date ?? "", amount: s.amount == null ? "" : String(s.amount).replace(".", ","), notes: s.notes ?? "" })}>Editar</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Editar assinatura" : "Nova assinatura"}</DialogTitle><DialogDescription>Atualização manual pelo administrador.</DialogDescription></DialogHeader>
          {form && (
            <form onSubmit={save} className="space-y-3">
              <div className="space-y-1.5"><Label>Cliente</Label>
                <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })} disabled={!!form.id}><SelectTrigger aria-label="Cliente"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{data?.users.map((u) => <SelectItem key={u.id} value={u.id}>{u.display_name ? `${u.display_name} · ` : ""}{u.email}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="pl">Plano</Label><Input id="pl" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(SUB_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label htmlFor="sd">Início</Label><Input id="sd" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="ed">Vencimento contratual</Label><Input id="ed" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="va">Valor acordado (R$)</Label><Input id="va" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="ob">Observações</Label><Textarea id="ob" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <DialogFooter><Button type="button" variant="outline" onClick={() => setForm(null)}>Cancelar</Button><Button disabled={busy}>Salvar</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
