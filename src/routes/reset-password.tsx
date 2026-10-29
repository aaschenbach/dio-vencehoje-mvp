import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — VenceHoje" },
      { name: "description", content: "Defina uma nova senha para sua conta VenceHoje." },
      { property: "og:title", content: "Nova senha — VenceHoje" },
      { property: "og:description", content: "Defina uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    if (window.location.hash.includes("type=recovery")) setReady(true);
    supabase.auth.getSession().then(({ data: s }) => s.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
    if (pw !== pw2) return setError("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError("Não foi possível alterar a senha. Solicite um novo link.");
    toast.success("Senha alterada.");
    navigate({ to: "/painel" });
  }

  return (
    <div className="hero-grid flex min-h-screen flex-col items-center justify-center px-4">
      <Link to="/" className="mb-8"><Logo /></Link>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-[var(--shadow-lift)]">
        <h1 className="text-2xl font-extrabold">Criar nova senha</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Abra esta página pelo link enviado ao seu e-mail. <Link to="/esqueci-senha" className="underline">Pedir novo link</Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">Nova senha</Label>
              <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Repita a senha</Label>
              <Input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <Button className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
