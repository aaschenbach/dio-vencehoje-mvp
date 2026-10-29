-- Runs inside one transaction and always ends with an exception so nothing persists.
-- Success = error message 'ALL_TESTS_PASSED'. Any other message names the failing test.
DO $$
DECLARE
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  wa uuid; wb uuid; cat_pay uuid; cat_rec uuid; e1 uuid; rid uuid; occ uuid; occ2 uuid; paid_occ uuid;
  n int; v record; ok boolean; t json; dates date[];
BEGIN
  INSERT INTO auth.users (id, email, aud, role, instance_id) VALUES
    (ua, 'test-a-'||ua||'@example.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (ub, 'test-b-'||ub||'@example.test', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');
  SELECT id INTO wa FROM workspaces WHERE owner_id = ua;
  SELECT id INTO wb FROM workspaces WHERE owner_id = ub;
  IF wa IS NULL OR wb IS NULL THEN RAISE EXCEPTION 'T00 signup bootstrap did not create workspace'; END IF;
  SELECT count(*) INTO n FROM categories WHERE workspace_id = wa;
  IF n < 10 THEN RAISE EXCEPTION 'T00 default categories missing'; END IF;

  -- act as user A
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT id INTO cat_pay FROM categories WHERE workspace_id = wa AND kind='pagar' LIMIT 1;
  SELECT id INTO cat_rec FROM categories WHERE workspace_id = wa AND kind='receber' LIMIT 1;

  -- T01 payable + receivable + dashboard
  INSERT INTO financial_entries (workspace_id, kind, description, amount, due_date, category_id)
    VALUES (wa,'pagar','Aluguel',1500.10, sp_today()+3, cat_pay) RETURNING id INTO e1;
  INSERT INTO financial_entries (workspace_id, kind, description, amount, due_date, category_id)
    VALUES (wa,'receber','Cliente X',2000.00, sp_today()+5, cat_rec);
  INSERT INTO financial_entries (workspace_id, kind, description, amount, due_date, category_id)
    VALUES (wa,'pagar','Luz atrasada',100.00, sp_today()-2, cat_pay);
  t := dashboard_totals(sp_today(), sp_today()+7);
  IF (t->>'open_pay')::numeric <> 1500.10 OR (t->>'open_rec')::numeric <> 2000 OR (t->>'late_pay')::numeric <> 100 THEN
    RAISE EXCEPTION 'T01 dashboard totals wrong: %', t; END IF;

  -- T02 overdue status
  SELECT status INTO v FROM entries_with_status WHERE description = 'Luz atrasada';
  IF v.status <> 'atrasado' THEN RAISE EXCEPTION 'T02 overdue status wrong: %', v.status; END IF;

  -- T03 partial settlement
  INSERT INTO settlements (entry_id, workspace_id, amount, paid_on) VALUES (e1, wa, 500.05, sp_today());
  SELECT * INTO v FROM entries_with_status WHERE id = e1;
  IF v.status <> 'parcial' OR v.remaining <> 1000.05 THEN RAISE EXCEPTION 'T03 partial wrong: % %', v.status, v.remaining; END IF;

  -- T04 over-settlement rejected
  ok := false;
  BEGIN INSERT INTO settlements (entry_id, workspace_id, amount, paid_on) VALUES (e1, wa, 1000.06, sp_today());
  EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T04 over-settlement accepted'; END IF;

  -- T05 zero settlement rejected
  ok := false;
  BEGIN INSERT INTO settlements (entry_id, workspace_id, amount, paid_on) VALUES (e1, wa, 0, sp_today());
  EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T05 zero settlement accepted'; END IF;

  -- T06 cannot reduce amount below paid
  ok := false;
  BEGIN UPDATE financial_entries SET amount = 400 WHERE id = e1;
  EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T06 amount reduced below paid'; END IF;

  -- T07 cannot delete entry with settlements
  ok := false;
  BEGIN DELETE FROM financial_entries WHERE id = e1;
  EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T07 entry with settlements deleted'; END IF;

  -- T08 full settlement -> quitado, and settlement edits are audited
  INSERT INTO settlements (entry_id, workspace_id, amount, paid_on) VALUES (e1, wa, 1000.05, sp_today());
  SELECT * INTO v FROM entries_with_status WHERE id = e1;
  IF v.status <> 'quitado' OR v.remaining <> 0 THEN RAISE EXCEPTION 'T08 settled wrong: %', v.status; END IF;
  UPDATE settlements SET amount = 1000.00 WHERE entry_id = e1 AND amount = 1000.05;
  SELECT count(*) INTO n FROM settlement_audit WHERE entry_id = e1 AND action = 'update';
  IF n <> 1 THEN RAISE EXCEPTION 'T08 audit missing'; END IF;

  -- T09 monthly recurrence from Jan 31: end-of-month + leap year + year change
  rid := create_recurring_entry('pagar','Assinatura',49.90,'2027-11-30','mensal','2028-04-30',cat_pay,NULL,NULL);
  PERFORM generate_rule_occurrences(rid, '2028-12-31');
  SELECT array_agg(due_date ORDER BY due_date) INTO dates FROM financial_entries WHERE rule_id = rid;
  IF dates IS DISTINCT FROM ARRAY['2027-11-30','2027-12-30','2028-01-30','2028-02-29','2028-03-30','2028-04-30']::date[] THEN
    RAISE EXCEPTION 'T09 monthly dates wrong: %', dates; END IF;
  rid := create_recurring_entry('pagar','Dia 31',10,'2027-01-31','mensal','2027-04-30',cat_pay,NULL,NULL);
  PERFORM generate_rule_occurrences(rid, '2027-12-31');
  SELECT array_agg(due_date ORDER BY due_date) INTO dates FROM financial_entries WHERE rule_id = rid;
  IF dates IS DISTINCT FROM ARRAY['2027-01-31','2027-02-28','2027-03-31','2027-04-30']::date[] THEN
    RAISE EXCEPTION 'T09b day-31 dates wrong: %', dates; END IF;

  -- T10 regeneration is idempotent
  UPDATE recurrence_rules SET generated_until = NULL WHERE id = rid;
  PERFORM generate_rule_occurrences(rid, '2027-12-31');
  SELECT count(*) INTO n FROM financial_entries WHERE rule_id = rid;
  IF n <> 4 THEN RAISE EXCEPTION 'T10 duplicates after regeneration: %', n; END IF;

  -- T11 deleting one occurrence records exception; it does not come back
  SELECT id INTO occ FROM financial_entries WHERE rule_id = rid AND due_date = '2027-02-28';
  PERFORM delete_occurrence(occ);
  UPDATE recurrence_rules SET generated_until = NULL WHERE id = rid;
  PERFORM generate_rule_occurrences(rid, '2027-12-31');
  SELECT count(*) INTO n FROM financial_entries WHERE rule_id = rid;
  IF n <> 3 THEN RAISE EXCEPTION 'T11 deleted occurrence reappeared: %', n; END IF;

  -- T12 edit single occurrence does not change the series
  SELECT id INTO occ FROM financial_entries WHERE rule_id = rid AND due_date = '2027-03-31';
  UPDATE financial_entries SET amount = 99, detached = true WHERE id = occ;
  SELECT count(*) INTO n FROM financial_entries WHERE rule_id = rid AND amount = 10;
  IF n <> 2 THEN RAISE EXCEPTION 'T12 single edit leaked to series'; END IF;

  -- T13 series edit: preserved (paid / detached) keep values and identity, no duplicates
  rid := create_recurring_entry('receber','Mensalidade',100,'2027-01-10','mensal','2027-06-10',cat_rec,NULL,NULL);
  PERFORM generate_rule_occurrences(rid, '2027-12-31');
  SELECT id INTO paid_occ FROM financial_entries WHERE rule_id = rid AND due_date = '2027-04-10';
  INSERT INTO settlements (entry_id, workspace_id, amount, paid_on) VALUES (paid_occ, wa, 30, '2027-04-01');
  SELECT id INTO occ2 FROM financial_entries WHERE rule_id = rid AND due_date = '2027-05-10';
  UPDATE financial_entries SET description = 'Editada', detached = true WHERE id = occ2;
  SELECT id INTO occ FROM financial_entries WHERE rule_id = rid AND due_date = '2027-03-10';
  rid := update_series_from(occ, 'Mensalidade nova', 150, cat_rec, NULL, NULL);
  PERFORM generate_rule_occurrences(rid, '2027-12-31');
  UPDATE recurrence_rules SET generated_until = NULL WHERE id = rid;
  PERFORM generate_rule_occurrences(rid, '2027-12-31');
  SELECT count(*) INTO n FROM financial_entries WHERE description LIKE 'Mensalidade%' OR description = 'Editada';
  IF n <> 6 THEN RAISE EXCEPTION 'T13 occurrence count after split: %', n; END IF;
  SELECT * INTO v FROM financial_entries WHERE id = paid_occ;
  IF v.amount <> 100 OR v.rule_id <> rid THEN RAISE EXCEPTION 'T13 paid occurrence changed'; END IF;
  SELECT * INTO v FROM financial_entries WHERE id = occ2;
  IF v.description <> 'Editada' THEN RAISE EXCEPTION 'T13 detached occurrence changed'; END IF;
  SELECT count(*) INTO n FROM financial_entries WHERE rule_id = rid AND amount = 150;
  IF n <> 2 THEN RAISE EXCEPTION 'T13 eligible updated count: %', n; END IF;
  SELECT count(*) INTO n FROM financial_entries WHERE description = 'Mensalidade' AND amount = 100 AND due_date < '2027-03-10';
  IF n <> 2 THEN RAISE EXCEPTION 'T13 past occurrences changed'; END IF;

  -- T14 delete future keeps paid occurrence
  n := delete_series_from(occ);
  IF n <> 2 THEN RAISE EXCEPTION 'T14 preserved count: %', n; END IF;

  -- T15 user B isolation
  PERFORM set_config('request.jwt.claims', json_build_object('sub', ub, 'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM financial_entries; IF n <> 0 THEN RAISE EXCEPTION 'T15 B sees A entries'; END IF;
  SELECT count(*) INTO n FROM settlements; IF n <> 0 THEN RAISE EXCEPTION 'T15 B sees A settlements'; END IF;
  SELECT count(*) INTO n FROM categories WHERE workspace_id = wa; IF n <> 0 THEN RAISE EXCEPTION 'T15 B sees A categories'; END IF;
  UPDATE financial_entries SET amount = 1 WHERE workspace_id = wa; GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'T15 B updated A entries'; END IF;
  ok := false;
  BEGIN INSERT INTO financial_entries (workspace_id, kind, description, amount, due_date, category_id) VALUES (wa,'pagar','x',1,sp_today(),cat_pay);
  EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T15 B inserted into A workspace'; END IF;
  t := dashboard_totals('2000-01-01','2100-01-01');
  IF (t->>'open_pay')::numeric <> 0 THEN RAISE EXCEPTION 'T15 B dashboard leaks'; END IF;

  -- T16 B cannot self-grant admin nor call admin functions
  ok := false;
  BEGIN INSERT INTO user_roles (user_id, role) VALUES (ub, 'admin'); EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T16 self-granted admin'; END IF;
  ok := false;
  BEGIN PERFORM admin_overview(); EXCEPTION WHEN OTHERS THEN ok := true; END;
  IF NOT ok THEN RAISE EXCEPTION 'T16 admin_overview allowed'; END IF;
  SELECT count(*) INTO n FROM leads; IF n <> 0 THEN RAISE EXCEPTION 'T16 B reads leads'; END IF;
  SELECT count(*) INTO n FROM profiles WHERE id <> ub; IF n <> 0 THEN RAISE EXCEPTION 'T16 B reads other profiles'; END IF;

  -- T17 admin (B promoted by service) cannot read A financial data
  RESET ROLE;
  INSERT INTO user_roles (user_id, role) VALUES (ub, 'admin');
  INSERT INTO leads (name, email, email_normalized) VALUES ('Lead', 'lead@example.test', 'lead@example.test');
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM financial_entries; IF n <> 0 THEN RAISE EXCEPTION 'T17 admin reads entries'; END IF;
  SELECT count(*) INTO n FROM settlements; IF n <> 0 THEN RAISE EXCEPTION 'T17 admin reads settlements'; END IF;
  SELECT count(*) INTO n FROM contacts WHERE workspace_id = wa; IF n <> 0 THEN RAISE EXCEPTION 'T17 admin reads contacts'; END IF;
  SELECT count(*) INTO n FROM leads; IF n < 1 THEN RAISE EXCEPTION 'T17 admin cannot read leads'; END IF;
  INSERT INTO subscriptions (user_id, status, amount) VALUES (ua, 'ativa', 15.00);
  t := admin_overview();

  RAISE EXCEPTION 'ALL_TESTS_PASSED';
END $$;
