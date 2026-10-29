import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: p } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).maybeSingle();
    if (!p?.onboarded && location.pathname !== "/boas-vindas") throw redirect({ to: "/boas-vindas" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
