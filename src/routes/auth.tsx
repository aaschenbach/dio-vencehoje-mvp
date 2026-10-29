import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — VenceHoje" },
      { name: "description", content: "Acesse sua conta VenceHoje ou crie uma gratuitamente." },
      { property: "og:title", content: "Entrar — VenceHoje" },
      { property: "og:description", content: "Acesse ou crie sua conta VenceHoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function translate(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(msg)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (/already registered/i.test(msg)) return "Este e-mail já tem cadastro. Tente entrar.";
  if (/Password should be/i.test(msg)) return "A senha deve ter pelo menos 8 caracteres.";
  if (/weak|pwned|leaked/i.test(msg)) return "Esta senha é fraca ou apareceu em vazamentos. Escolha outra.";
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde alguns minutos.";
  return "Não foi possível concluir. Tente novamente.";
}

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Informe um e-mail válido.");
    if (password.length < 8) return setError("A senha deve ter pelo menos 8 caracteres.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/painel" },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/painel" });
        else setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel" });
      }
    } catch (err) {
      setError(translate(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hero-grid flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8" aria-label="Início">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-[var(--shadow-lift)]">
        {sent ? (
          <div className="text-center" role="status">
            <MailCheck className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
            <h1 className="mt-3 text-xl font-extrabold">Confirme seu e-mail</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enviamos um link para <strong>{email}</strong>. Abra o e-mail para ativar sua conta (verifique também o spam).
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("signin"); }}>
              Voltar para entrar
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">{mode === "signin" ? "Entrar" : "Criar conta gratuita"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signin" ? "Bem-vindo de volta." : "Só precisamos do seu e-mail e de uma senha."}
            </p>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === "signin" && (
                    <Link to="/esqueci-senha" className="text-xs font-semibold text-accent-foreground hover:underline">
                      Esqueci minha senha
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Entrar" : "Criar conta"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Ainda não tem conta? " : "Já tem conta? "}
              <button
                type="button"
                className="font-semibold text-accent-foreground hover:underline"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              >
                {mode === "signin" ? "Criar conta" : "Entrar"}
              </button>
            </p>
            {mode === "signup" && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Ao criar a conta você concorda com os <Link to="/termos" className="underline">Termos de Uso</Link> e a{" "}
                <Link to="/privacidade" className="underline">Política de Privacidade</Link>.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
