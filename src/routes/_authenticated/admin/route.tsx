import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
    if (!isAdmin) throw redirect({ to: "/painel" });
  },
  head: () => ({ meta: [{ title: "Administração — VenceHoje" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Visão geral" },
  { to: "/admin/leads", label: "Leads" },
  { to: "/admin/clientes", label: "Clientes" },
  { to: "/admin/assinaturas", label: "Assinaturas" },
  { to: "/admin/configuracoes", label: "Configurações comerciais" },
] as const;

function AdminLayout() {
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight">Administração</h1>
      <p className="mt-1 text-sm text-muted-foreground">Dados cadastrais e comerciais. Lançamentos financeiros dos clientes não são acessíveis aqui.</p>
      <nav aria-label="Administração" className="my-6 flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <Link key={t.to} to={t.to} activeOptions={{ exact: true }} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted" activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}>
            {t.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </>
  );
}
