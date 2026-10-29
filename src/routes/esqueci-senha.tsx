import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — VenceHoje" },
      { name: "description", content: "Receba um link para redefinir sua senha do VenceHoje." },
      { property: "og:title", content: "Recuperar senha — VenceHoje" },
      { property: "og:description", content: "Redefina sua senha do VenceHoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Informe um e-mail válido.");
    setBusy(true);
    setError(null);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    // Same message whether or not the e-mail exists.
    setDone(true);
    setBusy(false);
  }

  return (
    <div className="hero-grid flex min-h-screen flex-col items-center justify-center px-4">
      <Link to="/" className="mb-8"><Logo /></Link>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-[var(--shadow-lift)]">
        <h1 className="text-2xl font-extrabold">Recuperar senha</h1>
        {done ? (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha.
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <Button className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Enviar link
            </Button>
          </form>
        )}
        <Link to="/auth" className="mt-6 block text-center text-sm font-semibold text-accent-foreground hover:underline">
          Voltar para entrar
        </Link>
      </div>
    </div>
  );
}
