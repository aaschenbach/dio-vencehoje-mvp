import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { PROFILE_LABEL } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/boas-vindas")({
  head: () => ({ meta: [{ title: "Boas-vindas — VenceHoje" }] }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [profile, setProfile] = useState("pessoa_fisica");
  const [business, setBusiness] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Informe como quer ser chamado.");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({
      display_name: name.trim(), usage_profile: profile, business_name: profile === "pessoa_fisica" ? null : business.trim() || null, onboarded: true,
    }).eq("id", u.user!.id);
    setBusy(false);
    if (error) return setError("Não foi possível salvar. Tente novamente.");
    toast.success("Tudo pronto!");
    await qc.invalidateQueries();
    navigate({ to: "/painel" });
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 shadow-[var(--shadow-card)]">
      <h1 className="text-2xl font-extrabold">Boas-vindas ao VenceHoje</h1>
      <p className="mt-1 text-sm text-muted-foreground">Só três informações para começar.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="n">Nome de exibição</Label>
          <Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Como você vai usar?</legend>
          <RadioGroup value={profile} onValueChange={setProfile} className="space-y-2">
            {Object.entries(PROFILE_LABEL).map(([k, l]) => (
              <Label key={k} className="flex items-center gap-2 rounded-xl border p-3 font-normal"><RadioGroupItem value={k} />{l}</Label>
            ))}
          </RadioGroup>
        </fieldset>
        {profile !== "pessoa_fisica" && (
          <div className="space-y-1.5">
            <Label htmlFor="b">Nome do negócio (opcional)</Label>
            <Input id="b" value={business} onChange={(e) => setBusiness(e.target.value)} maxLength={120} />
          </div>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button className="w-full" size="lg" disabled={busy}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Começar</Button>
      </form>
    </div>
  );
}
