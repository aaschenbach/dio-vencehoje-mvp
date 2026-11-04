import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/dates";
import { LEAD_STATUS_LABEL, PROFILE_LABEL } from "@/lib/labels";
import { ConfirmDialog, EmptyState, ErrorState, Loading, errorMessage } from "@/components/common";

export const Route = createFileRoute("/_authenticated/admin/leads")({ component: Leads });

function Leads() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [profile, setProfile] = useState("todos");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((l) => (status === "todos" || l.status === status) && (profile === "todos" || l.profile === profile) &&
      (!t || (l.name ?? "").toLowerCase().includes(t) || (l.email ?? "").toLowerCase().includes(t)));
  }, [data, q, status, profile]);
  const lead = data?.find((l) => l.id === openId);

  return (
    <>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Buscar" className="pl-9" placeholder="Nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Situação"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{Object.entries(LEAD_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
        <Select value={profile} onValueChange={setProfile}><SelectTrigger aria-label="Perfil"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os perfis</SelectItem>{Object.entries(PROFILE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
      </div>
      {isLoading ? <Loading /> : error ? <ErrorState onRetry={() => refetch()} /> : list.length === 0 ? <EmptyState title="Nenhum lead" /> : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Entrada</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Envios</th><th className="px-4 py-3">Situação</th></tr></thead>
            <tbody className="divide-y">
              {list.map((l) => (
                <tr key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setOpenId(l.id)}>
                  <td className="px-4 py-3">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3 font-semibold"><button className="hover:underline">{l.name}</button></td>
                  <td className="px-4 py-3">{l.email ?? "—"}</td>
                  <td className="px-4 py-3">{PROFILE_LABEL[l.profile ?? ""] ?? "—"}</td>
                  <td className="px-4 py-3">{l.origin}</td>
                  <td className="px-4 py-3">{l.submission_count}</td>
                  <td className="px-4 py-3">{LEAD_STATUS_LABEL[l.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Sheet open={!!lead} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {lead && <LeadDetail key={lead.id} lead={lead} onDone={() => { setOpenId(null); qc.invalidateQueries(); }} onChange={() => qc.invalidateQueries()} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

type Lead = NonNullable<Awaited<ReturnType<typeof fetchLeadType>>>;
async function fetchLeadType() { return (await supabase.from("leads").select("*").single()).data; }

function LeadDetail({ lead, onDone, onChange }: { lead: Lead; onDone: () => void; onChange: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<"anon" | "del" | null>(null);
  const [busy, setBusy] = useState(false);
  const extra = useQuery({
    queryKey: ["lead-extra", lead.id],
    queryFn: async () => {
      const [s, n] = await Promise.all([
        supabase.from("lead_submissions").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false }),
        supabase.from("commercial_notes").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false }),
      ]);
      return { subs: s.data ?? [], notes: n.data ?? [] };
    },
  });

  async function setStatus(v: string) {
    const { error } = await supabase.from("leads").update({ status: v }).eq("id", lead.id);
    if (error) return void toast.error(errorMessage(error));
    onChange();
  }
  async function addNote() {
    if (!note.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("commercial_notes").insert({ lead_id: lead.id, body: note.trim(), author_id: u.user?.id ?? null });
    if (error) return void toast.error(errorMessage(error));
    setNote("");
    qc.invalidateQueries({ queryKey: ["lead-extra", lead.id] });
  }
  async function convert() {
    const { error } = await supabase.rpc("admin_convert_lead", { _lead_id: lead.id });
    if (error) return void toast.error(errorMessage(error));
    toast.success("Lead vinculado à conta cadastrada com o mesmo e-mail.");
    onChange();
  }
  async function act() {
    setBusy(true);
    const { error } = confirm === "anon"
      ? await supabase.rpc("admin_anonymize_lead", { _lead_id: lead.id })
      : await supabase.from("leads").delete().eq("id", lead.id);
    setBusy(false);
    setConfirm(null);
    if (error) return void toast.error(errorMessage(error));
    toast.success(confirm === "anon" ? "Lead anonimizado." : "Lead excluído.");
    onDone();
  }

  return (
    <>
      <SheetHeader><SheetTitle>{lead.name}</SheetTitle></SheetHeader>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">E-mail</dt><dd>{lead.email ?? "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">WhatsApp</dt><dd>{lead.whatsapp ?? "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Perfil</dt><dd>{PROFILE_LABEL[lead.profile ?? ""] ?? "—"}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Consentimento comercial</dt><dd>{lead.marketing_consent ? `Sim · ${formatDate(lead.consent_at)} · v${lead.consent_version}` : "Não"}</dd></div>
        {lead.comment && <div><dt className="text-muted-foreground">Comentário</dt><dd className="mt-1 whitespace-pre-wrap">{lead.comment}</dd></div>}
        {lead.anonymized_at && <p className="text-xs text-warning-foreground">Anonimizado em {formatDate(lead.anonymized_at)}</p>}
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={lead.status} onValueChange={setStatus}><SelectTrigger className="w-44" aria-label="Situação"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(LEAD_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
        {!lead.converted_user_id && !lead.anonymized_at && <Button variant="outline" onClick={convert}>Converter em cliente</Button>}
      </div>
      <section className="mt-6">
        <h3 className="text-sm font-bold">Observações comerciais</h3>
        <div className="mt-2 flex gap-2"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Nova observação" /><Button onClick={addNote}>Adicionar</Button></div>
        <ul className="mt-2 space-y-2 text-sm">{extra.data?.notes.map((n) => <li key={n.id} className="rounded-lg bg-muted p-2"><span className="text-xs text-muted-foreground">{formatDate(n.created_at)}</span><p>{n.body}</p></li>)}</ul>
      </section>
      <section className="mt-6">
        <h3 className="text-sm font-bold">Histórico de envios ({extra.data?.subs.length ?? 0})</h3>
        <p className="text-xs text-muted-foreground">Envios repetidos com o mesmo e-mail não alteram os dados originais do lead.</p>
        <ul className="mt-2 space-y-2 text-xs">{extra.data?.subs.map((s) => (
          <li key={s.id} className="rounded-lg border p-2">{formatDate(s.created_at)} · {s.name ?? "—"} · consentimento: {s.marketing_consent ? `sim (v${s.consent_version})` : "não"}{s.comment ? ` · “${s.comment}”` : ""}</li>
        ))}</ul>
      </section>
      <div className="mt-8 flex gap-2 border-t pt-4">
        {!lead.anonymized_at && <Button variant="outline" onClick={() => setConfirm("anon")}>Anonimizar</Button>}
        <Button variant="outline" className="text-danger" onClick={() => setConfirm("del")}>Excluir</Button>
      </div>
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} destructive busy={busy}
        title={confirm === "anon" ? "Anonimizar lead?" : "Excluir lead?"}
        description={confirm === "anon" ? "Nome, contato, comentários e observações serão apagados. Ficam apenas dados agregados." : "O lead e todo o histórico serão apagados definitivamente."}
        confirmLabel={confirm === "anon" ? "Anonimizar" : "Excluir"} onConfirm={act} />
    </>
  );
}
