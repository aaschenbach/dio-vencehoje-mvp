import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { EntryStatus } from "./money";
import { addDays, todaySP } from "./dates";

export type Category = Tables<"categories">;
export type Contact = Tables<"contacts">;
export type Settlement = Tables<"settlements">;

export type Entry = {
  id: string;
  workspace_id: string;
  kind: "pagar" | "receber";
  description: string;
  amount: number;
  due_date: string;
  category_id: string;
  contact_id: string | null;
  notes: string | null;
  rule_id: string | null;
  original_date: string | null;
  detached: boolean;
  created_at: string;
  updated_at: string;
  paid_total: number;
  remaining: number;
  status: EntryStatus;
  has_settlements: boolean;
};

export const qk = {
  entries: (k: object) => ["entries", k] as const,
  entry: (id: string) => ["entry", id] as const,
  categories: ["categories"] as const,
  contacts: ["contacts"] as const,
  profile: ["profile"] as const,
  prefs: ["prefs"] as const,
  dashboard: (from: string, to: string) => ["dashboard", from, to] as const,
};

export async function getMyWorkspaceId(): Promise<string> {
  const { data, error } = await supabase.rpc("my_workspace_id");
  if (error || !data) throw error ?? new Error("Espaço de trabalho não encontrado.");
  return data;
}

/** Makes sure recurring occurrences exist up to `until` (bounded server-side to 24 months ahead). */
export async function ensureOccurrences(until?: string) {
  await supabase.rpc("ensure_occurrences", { _until: until ?? addDays(todaySP(), 366) });
}

export function useEntries(filter: { from?: string; to?: string; kind?: string; openOnly?: boolean } = {}) {
  return useQuery({
    queryKey: qk.entries(filter),
    queryFn: async () => {
      await ensureOccurrences(filter.to);
      let q = supabase.from("entries_with_status").select("*").order("due_date", { ascending: true }).limit(1000);
      if (filter.from) q = q.gte("due_date", filter.from);
      if (filter.to) q = q.lte("due_date", filter.to);
      if (filter.kind && filter.kind !== "todos") q = q.eq("kind", filter.kind);
      if (filter.openOnly) q = q.neq("status", "quitado");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Entry[];
    },
  });
}

export function useEntry(id: string | null) {
  return useQuery({
    queryKey: qk.entry(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const [{ data: e, error }, { data: s }, { data: audit }] = await Promise.all([
        supabase.from("entries_with_status").select("*").eq("id", id!).maybeSingle(),
        supabase.from("settlements").select("*").eq("entry_id", id!).order("paid_on"),
        supabase.from("settlement_audit").select("*").eq("entry_id", id!).order("created_at", { ascending: false }),
      ]);
      if (error) throw error;
      let rule: Tables<"recurrence_rules"> | null = null;
      if (e?.rule_id) {
        const { data: r } = await supabase.from("recurrence_rules").select("*").eq("id", e.rule_id).maybeSingle();
        rule = r;
      }
      return { entry: e as unknown as Entry | null, settlements: s ?? [], audit: audit ?? [], rule };
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("kind").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: qk.contacts,
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada.");
      const [{ data: p }, { data: prefs }, { data: isAdmin }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_preferences").select("*").eq("user_id", u.user.id).maybeSingle(),
        supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" }),
      ]);
      return { user: u.user, profile: p, prefs, isAdmin: !!isAdmin };
    },
  });
}
