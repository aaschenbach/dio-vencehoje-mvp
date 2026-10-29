import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function useHasSession() {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHas(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setHas(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  return has;
}

export function SiteHeader() {
  const hasSession = useHasSession();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="VenceHoje, início">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="/#beneficios" className="hover:text-foreground">Benefícios</a>
          <a href="/#como-funciona" className="hover:text-foreground">Como funciona</a>
          <a href="/#planos" className="hover:text-foreground">Planos</a>
        </nav>
        <div className="flex items-center gap-2">
          {hasSession ? (
            <Button asChild>
              <Link to="/painel">Ir para o painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">Suas contas. Seus prazos. Tudo sob controle.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Sobre o produto</p>
          <p className="mt-2 text-muted-foreground">
            O VenceHoje organiza contas a pagar e a receber para pessoas, autônomos, MEIs e pequenos negócios. Não é um sistema contábil.
          </p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-2 text-sm">
          <Link to="/privacidade" className="text-muted-foreground hover:text-foreground">Política de Privacidade</Link>
          <Link to="/termos" className="text-muted-foreground hover:text-foreground">Termos de Uso</Link>
          <a href="/#contato" className="text-muted-foreground hover:text-foreground">Contato</a>
        </nav>
      </div>
      <p className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} VenceHoje</p>
    </footer>
  );
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div role="note" className="mb-6 rounded-xl border border-warning/50 bg-warning-soft px-4 py-3 text-sm text-warning-foreground">
          Texto provisório, sujeito a revisão jurídica antes da publicação comercial.
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
