REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.app_settings TO anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid), public.my_workspace_id(), public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;