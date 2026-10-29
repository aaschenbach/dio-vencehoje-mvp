REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated, anon;
REVOKE ALL ON public.profiles, public.user_roles, public.workspaces, public.workspace_members, public.user_preferences, public.settlement_audit, public.leads, public.lead_submissions, public.commercial_notes, public.subscriptions FROM anon;
GRANT UPDATE (display_name, usage_profile, business_name, onboarded, deletion_requested_at) ON public.profiles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles, public.workspaces, public.workspace_members, public.settlement_audit FROM authenticated;
REVOKE INSERT, DELETE ON public.user_preferences FROM authenticated;