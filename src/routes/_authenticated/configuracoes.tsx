import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { PROFILE_LABEL } from "@/lib/labels";
import { ConfirmDialog, Loading, PageHeader, errorMessage } from "@/components/common";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — VenceHoje" }] }),
  component: Config,
});

function Config() {
  const qc = useQueryClient();
  const { data, isLoading } = useProfile();
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("pessoa_fisica");
  const [business, setBusiness] = useState("");
  const [days, setDays] = useState("3");
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [delOpen, setDelOpen] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.profile?.display_name ?? "");
    setProfile(data.profile?.usage_profile ?? "pessoa_fisica");
    setBusiness(data.profile?.business_name ?? "");
    setDays(String(data.prefs?.reminder_days ?? 3));
  }, [data]);

  if (isLoading || !data) return <Loading />;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const [a, b] = await Promise.all([
      supabase.from("profiles").update({ display_name: name.trim() || null, usage_profile: profile, business_name: business.trim() || null }).eq("id", data!.user.id),
      supabase.from("user_preferences").update({ reminder_days: Number(days) }).eq("user_id", data!.user.id),
    ]);
    setBusy(false);
    if (a.error || b.error) return toast.error(errorMessage(a.error ?? b.error));
    toast.success("Configurações salvas.");
    qc.invalidateQueries();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("A nova senha deve ter pelo menos 8 caracteres.");
    // Re-authenticate with the current password before changing it.
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: data!.user.email!, password: pw.current });
    if (authErr) return toast.error("Senha atual incorreta.");
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) return toast.error("Não foi possível alterar a senha.");
    setPw({ current: "", next: "" });
    toast.success("Senha alterada.");
  }

  async function requestDeletion() {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", data!.user.id);
    setBusy(false);
    setDelOpen(false);
    if (error) return toast.error(errorMessage(error));
    toast.success("Solicitação registrada. A equipe fará a exclusão e confirmará por e-mail.");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="font-bold">Perfil e lembretes</h2>
          <div className="space-y-1.5"><Label>E-mail</Label><Input value={data.user.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label htmlFor="nm">Nome</Label><Input id="nm" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="pf">Perfil</Label>
            <Select value={profile} onValueChange={setProfile}><SelectTrigger id="pf"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(PROFILE_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label htmlFor="bn">Nome do negócio</Label><Input id="bn" value={business} onChange={(e) => setBusiness(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="rd">Antecedência dos lembretes</Label>
            <Select value={days} onValueChange={setDays}><SelectTrigger id="rd"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="1">1 dia</SelectItem><SelectItem value="3">3 dias</SelectItem><SelectItem value="7">7 dias</SelectItem></SelectContent></Select></div>
          <Button disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Salvar</Button>
        </form>
        <div className="space-y-6">
          <form onSubmit={changePassword} className="space-y-4 rounded-2xl border bg-card p-6">
            <h2 className="font-bold">Alterar senha</h2>
            <div className="space-y-1.5"><Label htmlFor="cur">Senha atual</Label><Input id="cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="nw">Nova senha</Label><Input id="nw" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
            <Button variant="outline">Alterar senha</Button>
          </form>
          <div className="rounded-2xl border border-danger/30 bg-card p-6">
            <h2 className="font-bold text-danger">Excluir conta</h2>
            {data.profile?.deletion_requested_at ? (
              <p className="mt-2 text-sm text-muted-foreground">Exclusão solicitada em {formatDate(data.profile.deletion_requested_at)}. Aguarde a confirmação.</p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">Envia um pedido para a equipe apagar sua conta e seus dados.</p>
                <Button variant="outline" className="mt-4 text-danger" onClick={() => setDelOpen(true)}>Solicitar exclusão</Button>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog open={delOpen} onOpenChange={setDelOpen} title="Solicitar exclusão da conta?" description="Seus dados serão apagados após a confirmação da equipe." destructive confirmLabel="Solicitar" busy={busy} onConfirm={requestDeletion} />
    </>
  );
}
