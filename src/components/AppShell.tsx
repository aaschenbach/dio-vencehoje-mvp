import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell, CalendarDays, FolderTree, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Shield, Users, X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/painel", label: "Painel", Icon: LayoutDashboard },
  { to: "/lancamentos", label: "Lançamentos", Icon: ListChecks },
  { to: "/agenda", label: "Agenda", Icon: CalendarDays },
  { to: "/lembretes", label: "Lembretes", Icon: Bell },
  { to: "/contatos", label: "Contatos", Icon: Users },
  { to: "/categorias", label: "Categorias", Icon: FolderTree },
  { to: "/configuracoes", label: "Configurações", Icon: Settings },
] as const;

function NavLinks({ onNavigate, isAdmin }: { onNavigate?: () => void; isAdmin: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const item = (to: string, label: string, Icon: typeof Bell) => {
    const active = path === to || path.startsWith(to + "/");
    return (
      <Link
        key={to}
        to={to}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        )}
      >
        <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} aria-hidden="true" />
        {label}
      </Link>
    );
  };
  return (
    <nav aria-label="Menu do aplicativo" className="flex flex-col gap-1">
      {NAV.map((n) => item(n.to, n.label, n.Icon))}
      {isAdmin && <div className="mt-4 border-t border-sidebar-border pt-4">{item("/admin", "Administração", Shield)}</div>}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isAdmin = !!data?.isAdmin;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const footer = (
    <div className="mt-auto border-t border-sidebar-border pt-4">
      <p className="truncate px-3 text-xs text-sidebar-foreground/80">{data?.profile?.display_name ?? data?.user.email}</p>
      <button
        onClick={signOut}
        className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent/60"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
      </button>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-4 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <Link to="/painel" className="mb-8 px-2 pt-2"><Logo inverted /></Link>
        <NavLinks isAdmin={isAdmin} />
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Link to="/painel"><Logo /></Link>
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="rounded-lg p-2 hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-primary/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4">
            <div className="mb-6 flex items-center justify-between px-2">
              <Logo inverted />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="rounded-lg p-2 text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)} />
            {footer}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
