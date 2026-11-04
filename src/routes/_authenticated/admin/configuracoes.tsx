import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/components/common";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({ component: Settings });

function Settings() {
  const qc = useQueryClient();
  const [wa, setWa] = useState("");
  const { data } = useQuery({
    queryKey: ["public-whatsapp-raw"],
    queryFn: async () => (await supabase.from("app_settings").select("value").eq("key", "whatsapp_number").maybeSingle()).data?.value ?? "",
  });
  useEffect(() => setWa(data ?? ""), [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const digits = wa.replace(/\D/g, "");
    if (digits && (digits.length < 12 || digits.length > 13)) return toast.error("Use o formato internacional: 55 + DDD + número.");
    const { error } = await supabase.from("app_settings").update({ value: digits || null }).eq("key", "whatsapp_number");
    if (error) return toast.error(errorMessage(error));
    toast.success(digits ? "WhatsApp comercial salvo." : "WhatsApp desativado.");
    qc.invalidateQueries();
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-4 rounded-2xl border bg-card p-6">
      <h2 className="font-bold">WhatsApp comercial</h2>
      <p className="text-sm text-muted-foreground">Quando preenchido, a landing page mostra o botão de conversa após o envio do formulário. Deixe vazio para ocultar.</p>
      <div className="space-y-1.5"><Label htmlFor="wa">Número (com 55 e DDD)</Label><Input id="wa" placeholder="5511912345678" value={wa} onChange={(e) => setWa(e.target.value)} /></div>
      <Button>Salvar</Button>
    </form>
  );
}
