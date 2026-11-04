import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ErrorState, Loading } from "@/components/common";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function Overview() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_overview");
      if (error) throw error;
      return data as Record<string, number>;
    },
  });
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState onRetry={() => refetch()} />;
  const items = [
    ["Leads", data.leads], ["Cadastros", data.signups], ["Usuários ativos (30 dias)", data.active_users],
    ["Clientes com assinatura (teste/ativa)", data.subscribers], ["Leads convertidos", data.converted],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(([l, v]) => (
        <div key={l} className="rounded-2xl border bg-card p-5"><p className="text-xs font-bold text-muted-foreground">{l}</p><p className="mt-2 text-3xl font-extrabold tabular">{v}</p></div>
      ))}
    </div>
  );
}
