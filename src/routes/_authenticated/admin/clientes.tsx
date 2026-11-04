import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/dates";
import { PROFILE_LABEL, SUB_STATUS_LABEL } from "@/lib/labels";
import { EmptyState, ErrorState, Loading } from "@/components/common";

export const Route = createFileRoute("/_authenticated/admin/clientes")({ component: Clientes });

function Clientes() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const [p, s, l] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("user_id, status, updated_at").order("updated_at", { ascending: false }),
        supabase.from("leads").select("converted_user_id").not("converted_user_id", "is", null),
      ]);
      if (p.error) throw p.error;
      const sub = new Map<string, string>();
      (s.data ?? []).forEach((x) => !sub.has(x.user_id) && sub.set(x.user_id, x.status));
      const fromLead = new Set((l.data ?? []).map((x) => x.converted_user_id));
      return (p.data ?? []).map((x) => ({ ...x, sub: sub.get(x.id), fromLead: fromLead.has(x.id) }));
    },
  });
  if (isLoading) return <Loading />;
  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (!data?.length) return <EmptyState title="Nenhum cliente cadastrado" />;
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Cadastro</th><th className="px-4 py-3">Nome</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3">Negócio</th><th className="px-4 py-3">Situação comercial</th></tr></thead>
        <tbody className="divide-y">
          {data.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3">{formatDate(c.created_at)}</td>
              <td className="px-4 py-3 font-semibold">{c.display_name ?? "—"}{c.deletion_requested_at && <span className="ml-2 text-xs text-danger">exclusão solicitada</span>}</td>
              <td className="px-4 py-3">{c.email}</td>
              <td className="px-4 py-3">{PROFILE_LABEL[c.usage_profile ?? ""] ?? "—"}</td>
              <td className="px-4 py-3">{c.business_name ?? "—"}</td>
              <td className="px-4 py-3">{c.sub ? SUB_STATUS_LABEL[c.sub] : "Sem assinatura"}{c.fromLead && " · veio de lead"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
