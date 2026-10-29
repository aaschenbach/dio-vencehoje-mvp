
-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.sp_today() RETURNS date LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date
$$;

-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  usage_profile text CHECK (usage_profile IN ('pessoa_fisica','autonomo_mei','empresa')),
  business_name text,
  onboarded boolean NOT NULL DEFAULT false,
  deletion_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, usage_profile, business_name, onboarded, deletion_requested_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_days int NOT NULL DEFAULT 3 CHECK (reminder_days IN (1,3,7)),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs read" ON public.user_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own prefs update" ON public.user_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER prefs_updated BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Workspaces =====
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Meu espaço',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);
GRANT SELECT ON public.workspaces, public.workspace_members TO authenticated;
GRANT ALL ON public.workspaces, public.workspace_members TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_ws uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = _ws AND user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.my_workspace_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() ORDER BY created_at LIMIT 1
$$;
CREATE POLICY "member reads workspace" ON public.workspaces FOR SELECT TO authenticated USING (public.is_workspace_member(id));
CREATE POLICY "member reads membership" ON public.workspace_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ===== Categories & contacts =====
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('pagar','receber')),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX categories_unique_name ON public.categories (workspace_id, kind, lower(name));
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  kind text NOT NULL DEFAULT 'pessoa' CHECK (kind IN ('pessoa','empresa')),
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contacts_ws ON public.contacts (workspace_id);

-- ===== Recurrence =====
CREATE TABLE public.recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('semanal','mensal','anual')),
  anchor_date date NOT NULL,
  start_date date NOT NULL,
  end_date date,
  kind text NOT NULL CHECK (kind IN ('pagar','receber')),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 140),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  notes text,
  generated_until date,
  previous_rule_id uuid REFERENCES public.recurrence_rules(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_date >= anchor_date)
);
CREATE INDEX rules_ws ON public.recurrence_rules (workspace_id);

CREATE TABLE public.recurrence_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.recurrence_rules(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  original_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, original_date)
);

-- ===== Entries =====
CREATE TABLE public.financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('pagar','receber')),
  description text NOT NULL CHECK (length(trim(description)) BETWEEN 1 AND 140),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  notes text,
  rule_id uuid REFERENCES public.recurrence_rules(id) ON DELETE SET NULL,
  original_date date,
  detached boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rule_id, original_date)
);
CREATE INDEX entries_ws_due ON public.financial_entries (workspace_id, due_date);
CREATE INDEX entries_rule ON public.financial_entries (rule_id);

CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.financial_entries(id) ON DELETE RESTRICT,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX settlements_entry ON public.settlements (entry_id);
CREATE INDEX settlements_ws_date ON public.settlements (workspace_id, paid_on);

CREATE TABLE public.settlement_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL,
  entry_id uuid NOT NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('update','delete')),
  old_amount numeric(14,2),
  old_paid_on date,
  new_amount numeric(14,2),
  new_paid_on date,
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entry ON public.settlement_audit (entry_id);

-- grants + RLS for workspace tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories, public.contacts, public.recurrence_rules, public.recurrence_exceptions, public.financial_entries, public.settlements TO authenticated;
GRANT SELECT ON public.settlement_audit TO authenticated;
GRANT ALL ON public.categories, public.contacts, public.recurrence_rules, public.recurrence_exceptions, public.financial_entries, public.settlements, public.settlement_audit TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurrence_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlement_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws members" ON public.categories FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ws members" ON public.contacts FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ws members" ON public.recurrence_rules FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ws members" ON public.recurrence_exceptions FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ws members" ON public.financial_entries FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ws members" ON public.settlements FOR ALL TO authenticated USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ws members read" ON public.settlement_audit FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER contacts_updated BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rules_updated BEFORE UPDATE ON public.recurrence_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER entries_updated BEFORE UPDATE ON public.financial_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER settlements_updated BEFORE UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Integrity triggers =====
CREATE OR REPLACE FUNCTION public.check_entry_refs() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cat record; paid numeric(14,2);
BEGIN
  SELECT workspace_id, kind INTO cat FROM public.categories WHERE id = NEW.category_id;
  IF cat.workspace_id IS DISTINCT FROM NEW.workspace_id THEN RAISE EXCEPTION 'Categoria inválida.'; END IF;
  IF cat.kind <> NEW.kind THEN RAISE EXCEPTION 'A categoria não corresponde ao tipo do lançamento.'; END IF;
  IF NEW.contact_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = NEW.contact_id AND workspace_id = NEW.workspace_id) THEN
    RAISE EXCEPTION 'Contato inválido.'; END IF;
  IF TG_TABLE_NAME = 'financial_entries' THEN
    IF NEW.rule_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.recurrence_rules WHERE id = NEW.rule_id AND workspace_id = NEW.workspace_id) THEN
      RAISE EXCEPTION 'Recorrência inválida.'; END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.workspace_id <> OLD.workspace_id OR NEW.kind <> OLD.kind THEN RAISE EXCEPTION 'Não é possível alterar o tipo ou o espaço do lançamento.'; END IF;
      IF NEW.amount <> OLD.amount THEN
        SELECT coalesce(sum(amount),0) INTO paid FROM public.settlements WHERE entry_id = NEW.id;
        IF NEW.amount < paid THEN RAISE EXCEPTION 'O valor não pode ser menor que o total já baixado (%).', paid; END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER entries_check BEFORE INSERT OR UPDATE ON public.financial_entries FOR EACH ROW EXECUTE FUNCTION public.check_entry_refs();
CREATE TRIGGER rules_check BEFORE INSERT OR UPDATE ON public.recurrence_rules FOR EACH ROW EXECUTE FUNCTION public.check_entry_refs();

CREATE OR REPLACE FUNCTION public.check_settlement() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE e record; others numeric(14,2);
BEGIN
  -- lock the entry row: concurrent settlements on the same entry are serialized
  SELECT id, workspace_id, amount INTO e FROM public.financial_entries WHERE id = NEW.entry_id FOR UPDATE;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Lançamento não encontrado.'; END IF;
  IF TG_OP = 'UPDATE' AND NEW.entry_id <> OLD.entry_id THEN RAISE EXCEPTION 'Não é possível mover uma baixa.'; END IF;
  NEW.workspace_id := e.workspace_id;
  IF NEW.amount <= 0 THEN RAISE EXCEPTION 'O valor da baixa deve ser maior que zero.'; END IF;
  SELECT coalesce(sum(amount),0) INTO others FROM public.settlements WHERE entry_id = NEW.entry_id AND id <> NEW.id;
  IF others + NEW.amount > e.amount THEN
    RAISE EXCEPTION 'A baixa ultrapassa o saldo pendente (saldo: %).', e.amount - others;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER settlements_check BEFORE INSERT OR UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.check_settlement();

CREATE OR REPLACE FUNCTION public.audit_settlement() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.settlement_audit (settlement_id, entry_id, workspace_id, action, old_amount, old_paid_on, new_amount, new_paid_on, actor)
    VALUES (OLD.id, OLD.entry_id, OLD.workspace_id, 'update', OLD.amount, OLD.paid_on, NEW.amount, NEW.paid_on, auth.uid());
    RETURN NEW;
  ELSE
    INSERT INTO public.settlement_audit (settlement_id, entry_id, workspace_id, action, old_amount, old_paid_on, actor)
    VALUES (OLD.id, OLD.entry_id, OLD.workspace_id, 'delete', OLD.amount, OLD.paid_on, auth.uid());
    RETURN OLD;
  END IF;
END $$;
CREATE TRIGGER settlements_audit AFTER UPDATE OR DELETE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.audit_settlement();

-- ===== Status view =====
CREATE VIEW public.entries_with_status WITH (security_invoker = on) AS
SELECT e.*,
  coalesce(s.paid, 0)::numeric(14,2) AS paid_total,
  (e.amount - coalesce(s.paid, 0))::numeric(14,2) AS remaining,
  CASE
    WHEN e.amount - coalesce(s.paid,0) <= 0 THEN 'quitado'
    WHEN e.due_date < public.sp_today() THEN 'atrasado'
    WHEN coalesce(s.paid,0) > 0 THEN 'parcial'
    ELSE 'pendente'
  END AS status,
  (coalesce(s.paid,0) > 0) AS has_settlements
FROM public.financial_entries e
LEFT JOIN (SELECT entry_id, sum(amount) AS paid FROM public.settlements GROUP BY entry_id) s ON s.entry_id = e.id;
GRANT SELECT ON public.entries_with_status TO authenticated;

-- ===== Recurrence functions =====
CREATE OR REPLACE FUNCTION public.occurrence_date(_anchor date, _freq text, _n int) RETURNS date
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _freq
    WHEN 'semanal' THEN _anchor + (_n * 7)
    WHEN 'mensal' THEN (_anchor + make_interval(months => _n))::date
    ELSE (_anchor + make_interval(years => _n))::date END
$$;

CREATE OR REPLACE FUNCTION public.generate_rule_occurrences(_rule_id uuid, _until date) RETURNS int
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record; lim date; d date; n int := 0; created int := 0; cnt int;
BEGIN
  SELECT * INTO r FROM public.recurrence_rules WHERE id = _rule_id FOR UPDATE;
  IF r.id IS NULL THEN RETURN 0; END IF;
  lim := least(_until, public.sp_today() + 731);
  IF r.end_date IS NOT NULL THEN lim := least(lim, r.end_date); END IF;
  IF r.generated_until IS NOT NULL AND r.generated_until >= lim THEN RETURN 0; END IF;
  LOOP
    d := public.occurrence_date(r.anchor_date, r.frequency, n);
    EXIT WHEN d > lim OR n > 5000;
    IF d >= r.start_date AND (r.generated_until IS NULL OR d > r.generated_until)
       AND NOT EXISTS (SELECT 1 FROM public.recurrence_exceptions x WHERE x.rule_id = r.id AND x.original_date = d) THEN
      INSERT INTO public.financial_entries (workspace_id, kind, description, amount, due_date, category_id, contact_id, notes, rule_id, original_date)
      VALUES (r.workspace_id, r.kind, r.description, r.amount, d, r.category_id, r.contact_id, r.notes, r.id, d)
      ON CONFLICT (rule_id, original_date) DO NOTHING;
      GET DIAGNOSTICS cnt = ROW_COUNT; created := created + cnt;
    END IF;
    n := n + 1;
  END LOOP;
  UPDATE public.recurrence_rules SET generated_until = greatest(coalesce(generated_until, lim), lim) WHERE id = r.id;
  RETURN created;
END $$;

CREATE OR REPLACE FUNCTION public.ensure_occurrences(_until date DEFAULT NULL) RETURNS int
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record; total int := 0; target date;
BEGIN
  target := least(coalesce(_until, public.sp_today() + 366), public.sp_today() + 731);
  IF target < public.sp_today() + 366 THEN target := public.sp_today() + 366; END IF;
  FOR r IN SELECT id FROM public.recurrence_rules
           WHERE public.is_workspace_member(workspace_id)
             AND (generated_until IS NULL OR generated_until < least(target, coalesce(end_date, target))) LOOP
    total := total + public.generate_rule_occurrences(r.id, target);
  END LOOP;
  RETURN total;
END $$;

CREATE OR REPLACE FUNCTION public.create_recurring_entry(
  _kind text, _description text, _amount numeric, _start date, _frequency text, _end date,
  _category_id uuid, _contact_id uuid, _notes text) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE ws uuid := public.my_workspace_id(); rid uuid;
BEGIN
  IF ws IS NULL THEN RAISE EXCEPTION 'Espaço de trabalho não encontrado.'; END IF;
  IF _end IS NOT NULL AND _end < _start THEN RAISE EXCEPTION 'A data final deve ser posterior à data inicial.'; END IF;
  INSERT INTO public.recurrence_rules (workspace_id, frequency, anchor_date, start_date, end_date, kind, description, amount, category_id, contact_id, notes)
  VALUES (ws, _frequency, _start, _start, _end, _kind, _description, _amount, _category_id, _contact_id, _notes) RETURNING id INTO rid;
  PERFORM public.generate_rule_occurrences(rid, public.sp_today() + 366);
  RETURN rid;
END $$;

-- edit this and future occurrences: split the series, keep identity of every occurrence
CREATE OR REPLACE FUNCTION public.update_series_from(
  _entry_id uuid, _description text, _amount numeric, _category_id uuid, _contact_id uuid, _notes text) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE e record; r record; new_id uuid; d date;
BEGIN
  SELECT * INTO e FROM public.financial_entries WHERE id = _entry_id;
  IF e.id IS NULL OR e.rule_id IS NULL THEN RAISE EXCEPTION 'Lançamento não pertence a uma série.'; END IF;
  SELECT * INTO r FROM public.recurrence_rules WHERE id = e.rule_id FOR UPDATE;
  d := e.original_date;
  IF d <= r.start_date THEN
    UPDATE public.recurrence_rules SET description=_description, amount=_amount, category_id=_category_id, contact_id=_contact_id, notes=_notes WHERE id = r.id;
    new_id := r.id;
  ELSE
    INSERT INTO public.recurrence_rules (workspace_id, frequency, anchor_date, start_date, end_date, kind, description, amount, category_id, contact_id, notes, generated_until, previous_rule_id)
    VALUES (r.workspace_id, r.frequency, r.anchor_date, d, r.end_date, r.kind, _description, _amount, _category_id, _contact_id, _notes, r.generated_until, r.id)
    RETURNING id INTO new_id;
    UPDATE public.recurrence_rules SET end_date = d - 1, generated_until = least(coalesce(generated_until, d - 1), d - 1) WHERE id = r.id;
    -- move every occurrence (preserved or not) on/after d to the new rule, same id and original_date
    UPDATE public.financial_entries SET rule_id = new_id WHERE rule_id = r.id AND original_date >= d;
    INSERT INTO public.recurrence_exceptions (rule_id, workspace_id, original_date)
      SELECT new_id, workspace_id, original_date FROM public.recurrence_exceptions WHERE rule_id = r.id AND original_date >= d
      ON CONFLICT DO NOTHING;
  END IF;
  -- update only eligible occurrences: not detached and without settlements
  UPDATE public.financial_entries f SET description=_description, amount=_amount, category_id=_category_id, contact_id=_contact_id, notes=_notes
   WHERE f.rule_id = new_id AND f.original_date >= d AND NOT f.detached
     AND NOT EXISTS (SELECT 1 FROM public.settlements s WHERE s.entry_id = f.id);
  RETURN new_id;
END $$;

CREATE OR REPLACE FUNCTION public.delete_occurrence(_entry_id uuid) RETURNS void
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE e record;
BEGIN
  SELECT * INTO e FROM public.financial_entries WHERE id = _entry_id;
  IF e.id IS NULL THEN RAISE EXCEPTION 'Lançamento não encontrado.'; END IF;
  IF EXISTS (SELECT 1 FROM public.settlements WHERE entry_id = e.id) THEN
    RAISE EXCEPTION 'Este lançamento possui baixas registradas. Exclua as baixas antes.'; END IF;
  IF e.rule_id IS NOT NULL THEN
    INSERT INTO public.recurrence_exceptions (rule_id, workspace_id, original_date) VALUES (e.rule_id, e.workspace_id, e.original_date) ON CONFLICT DO NOTHING;
  END IF;
  DELETE FROM public.financial_entries WHERE id = e.id;
END $$;

CREATE OR REPLACE FUNCTION public.delete_series_from(_entry_id uuid) RETURNS int
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE e record; d date; preserved int;
BEGIN
  SELECT * INTO e FROM public.financial_entries WHERE id = _entry_id;
  IF e.id IS NULL OR e.rule_id IS NULL THEN RAISE EXCEPTION 'Lançamento não pertence a uma série.'; END IF;
  d := e.original_date;
  UPDATE public.recurrence_rules SET end_date = d - 1 WHERE id = e.rule_id;
  DELETE FROM public.financial_entries f WHERE f.rule_id = e.rule_id AND f.original_date >= d AND NOT f.detached
    AND NOT EXISTS (SELECT 1 FROM public.settlements s WHERE s.entry_id = f.id);
  SELECT count(*) INTO preserved FROM public.financial_entries WHERE rule_id = e.rule_id AND original_date >= d;
  RETURN preserved;
END $$;

-- ===== Dashboard =====
CREATE OR REPLACE FUNCTION public.dashboard_totals(_from date, _to date) RETURNS json
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH v AS (SELECT * FROM public.entries_with_status WHERE public.is_workspace_member(workspace_id))
  SELECT json_build_object(
    'open_pay',  coalesce((SELECT sum(remaining) FROM v WHERE kind='pagar'   AND status<>'quitado' AND due_date BETWEEN _from AND _to),0),
    'open_rec',  coalesce((SELECT sum(remaining) FROM v WHERE kind='receber' AND status<>'quitado' AND due_date BETWEEN _from AND _to),0),
    'late_pay',  coalesce((SELECT sum(remaining) FROM v WHERE kind='pagar'   AND status='atrasado' AND due_date <= _to),0),
    'late_rec',  coalesce((SELECT sum(remaining) FROM v WHERE kind='receber' AND status='atrasado' AND due_date <= _to),0),
    'settled_pay', coalesce((SELECT sum(s.amount) FROM public.settlements s JOIN public.financial_entries f ON f.id=s.entry_id WHERE public.is_workspace_member(s.workspace_id) AND f.kind='pagar' AND s.paid_on BETWEEN _from AND _to),0),
    'settled_rec', coalesce((SELECT sum(s.amount) FROM public.settlements s JOIN public.financial_entries f ON f.id=s.entry_id WHERE public.is_workspace_member(s.workspace_id) AND f.kind='receber' AND s.paid_on BETWEEN _from AND _to),0)
  )
$$;

-- ===== Commercial =====
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  email_normalized text UNIQUE,
  whatsapp text,
  profile text CHECK (profile IN ('pessoa_fisica','autonomo_mei','empresa')),
  comment text,
  origin text NOT NULL DEFAULT 'landing',
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo','em_contato','interessado','convertido','perdido')),
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  consent_version text,
  submission_count int NOT NULL DEFAULT 1,
  last_submitted_at timestamptz NOT NULL DEFAULT now(),
  converted_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  anonymized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name text, whatsapp text, profile text, comment text,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_version text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_sub_ip ON public.lead_submissions (ip_hash, created_at);
CREATE INDEX lead_sub_lead ON public.lead_submissions (lead_id, created_at);
CREATE TABLE public.commercial_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 2000),
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (lead_id IS NOT NULL OR user_id IS NOT NULL)
);
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'Mensal',
  status text NOT NULL DEFAULT 'teste' CHECK (status IN ('teste','ativa','pendente','cancelada')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  amount numeric(14,2) CHECK (amount IS NULL OR amount >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subs_user ON public.subscriptions (user_id);
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (key, value) VALUES ('whatsapp_number', NULL);

GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, DELETE ON public.lead_submissions TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.commercial_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.app_settings TO authenticated;
GRANT SELECT ON public.app_settings TO anon;
GRANT ALL ON public.leads, public.lead_submissions, public.commercial_notes, public.subscriptions, public.app_settings TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin leads" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin lead subs" ON public.lead_submissions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin notes" ON public.commercial_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin subs" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "own subs read" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "public whatsapp read" ON public.app_settings FOR SELECT TO anon, authenticated USING (key = 'whatsapp_number' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin settings update" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- admin helpers (role checked inside)
CREATE OR REPLACE FUNCTION public.admin_overview() RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso negado.'; END IF;
  RETURN json_build_object(
    'leads', (SELECT count(*) FROM public.leads WHERE anonymized_at IS NULL),
    'signups', (SELECT count(*) FROM public.profiles),
    'active_users', (SELECT count(*) FROM auth.users WHERE last_sign_in_at > now() - interval '30 days'),
    'subscribers', (SELECT count(DISTINCT user_id) FROM public.subscriptions WHERE status IN ('ativa','teste')),
    'converted', (SELECT count(*) FROM public.leads WHERE status = 'convertido')
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_convert_lead(_lead_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l record; uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso negado.'; END IF;
  SELECT * INTO l FROM public.leads WHERE id = _lead_id;
  IF l.id IS NULL OR l.email_normalized IS NULL THEN RAISE EXCEPTION 'Lead não encontrado ou anonimizado.'; END IF;
  SELECT id INTO uid FROM public.profiles WHERE lower(email) = l.email_normalized LIMIT 1;
  IF uid IS NULL THEN RAISE EXCEPTION 'Nenhuma conta cadastrada com o e-mail deste lead.'; END IF;
  UPDATE public.leads SET converted_user_id = uid, status = 'convertido' WHERE id = l.id;
  RETURN uid;
END $$;

CREATE OR REPLACE FUNCTION public.admin_anonymize_lead(_lead_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Acesso negado.'; END IF;
  UPDATE public.leads SET name = 'Anonimizado', email = NULL, email_normalized = NULL, whatsapp = NULL, comment = NULL, anonymized_at = now() WHERE id = _lead_id;
  UPDATE public.lead_submissions SET name = NULL, whatsapp = NULL, comment = NULL, ip_hash = NULL WHERE lead_id = _lead_id;
  DELETE FROM public.commercial_notes WHERE lead_id = _lead_id;
END $$;

-- ===== New user bootstrap =====
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ws uuid;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, nullif(left(coalesce(NEW.raw_user_meta_data->>'display_name',''), 80), ''));
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  INSERT INTO public.workspaces (owner_id) VALUES (NEW.id) RETURNING id INTO ws;
  INSERT INTO public.workspace_members (workspace_id, user_id) VALUES (ws, NEW.id);
  INSERT INTO public.categories (workspace_id, kind, name, is_default)
  SELECT ws, k, n, true FROM (VALUES
    ('pagar','Moradia'),('pagar','Contas de consumo'),('pagar','Alimentação'),('pagar','Transporte'),
    ('pagar','Saúde'),('pagar','Educação'),('pagar','Impostos e taxas'),('pagar','Fornecedores'),('pagar','Outros'),
    ('receber','Vendas'),('receber','Serviços prestados'),('receber','Salário'),('receber','Aluguéis'),('receber','Outros')
  ) AS t(k, n);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.sync_profile_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_email AFTER UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- lock down function execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_settlement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_overview() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_convert_lead(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_anonymize_lead(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_occurrences(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_rule_occurrences(uuid, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_recurring_entry(text,text,numeric,date,text,date,uuid,uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_series_from(uuid,text,numeric,uuid,uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_occurrence(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_series_from(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dashboard_totals(date, date) FROM PUBLIC, anon;
