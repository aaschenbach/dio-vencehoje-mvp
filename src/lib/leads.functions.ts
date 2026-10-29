import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { CONSENT_VERSION } from "./labels";

const LeadInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^[\d\s()+-]{10,20}$/.test(v), "WhatsApp inválido"),
  profile: z.enum(["pessoa_fisica", "autonomo_mei", "empresa"]),
  comment: z.string().trim().max(1000).optional().default(""),
  consent: z.boolean(),
  website: z.string().max(0).optional().default(""), // honeypot: must stay empty
});

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const OK = { ok: true as const, message: "Recebemos seu interesse. Obrigado!" };

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadInput.parse(input))
  .handler(async ({ data }) => {
    // Bots fill the hidden field: pretend success, store nothing.
    if (data.website) return OK;

    const req = getRequest();
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const ipHash = await sha256(`vencehoje:${ip}`);
    const emailNorm = data.email.toLowerCase();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limits: 5 per IP per hour.
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { count: ipCount } = await supabaseAdmin
      .from("lead_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo);
    if ((ipCount ?? 0) >= 5) {
      return { ok: false as const, message: "Muitas tentativas. Tente novamente mais tarde." };
    }

    const { data: existing } = await supabaseAdmin
      .from("leads")
      .select("id, submission_count")
      .eq("email_normalized", emailNorm)
      .maybeSingle();

    let leadId: string;
    if (existing) {
      // Repeated e-mail: never overwrite the original lead data or consent.
      // The new submission is kept separately in the history for the admin to review.
      const dayAgo = new Date(Date.now() - 86400_000).toISOString();
      const { count: emailCount } = await supabaseAdmin
        .from("lead_submissions")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", existing.id)
        .gte("created_at", dayAgo);
      if ((emailCount ?? 0) >= 3) return OK;
      leadId = existing.id;
      await supabaseAdmin
        .from("leads")
        .update({ submission_count: existing.submission_count + 1, last_submitted_at: new Date().toISOString() })
        .eq("id", leadId);
    } else {
      const now = new Date().toISOString();
      const { data: created, error } = await supabaseAdmin
        .from("leads")
        .insert({
          name: data.name,
          email: data.email,
          email_normalized: emailNorm,
          whatsapp: data.whatsapp || null,
          profile: data.profile,
          comment: data.comment || null,
          origin: "landing",
          marketing_consent: data.consent,
          consent_at: data.consent ? now : null,
          consent_version: data.consent ? CONSENT_VERSION : null,
        })
        .select("id")
        .single();
      if (error || !created) {
        console.error("lead insert failed", error?.code);
        return { ok: false as const, message: "Não foi possível enviar agora. Tente novamente." };
      }
      leadId = created.id;
    }

    await supabaseAdmin.from("lead_submissions").insert({
      lead_id: leadId,
      name: data.name,
      whatsapp: data.whatsapp || null,
      profile: data.profile,
      comment: data.comment || null,
      marketing_consent: data.consent,
      consent_version: data.consent ? CONSENT_VERSION : null,
      ip_hash: ipHash,
    });

    return OK;
  });
