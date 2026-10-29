import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitLead } from "@/lib/leads.functions";
import { CONSENT_TEXT, PROFILE_LABEL } from "@/lib/labels";
import { supabase } from "@/integrations/supabase/client";

type Errors = Partial<Record<"name" | "email" | "whatsapp" | "profile" | "form", string>>;

export function LeadForm() {
  const send = useServerFn(submitLead);
  const [form, setForm] = useState({ name: "", email: "", whatsapp: "", profile: "", comment: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [shareOnWhatsapp, setShareOnWhatsapp] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const { data: whatsappNumber } = useQuery({
    queryKey: ["public-whatsapp"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      return data?.value?.replace(/\D/g, "") || null;
    },
  });

  function validate(): Errors {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Informe um e-mail válido.";
    if (form.whatsapp && !/^[\d\s()+-]{10,20}$/.test(form.whatsapp)) e.whatsapp = "Use DDD + número, ex.: (11) 91234-5678.";
    if (!form.profile) e.profile = "Escolha um perfil.";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const res = await send({ data: { ...form, consent } });
      if (res.ok) setDone(res.message);
      else setErrors({ form: res.message });
    } catch {
      setErrors({ form: "Não foi possível enviar. Verifique os campos e sua conexão." });
    } finally {
      setBusy(false);
    }
  }

  const whatsappLink = (() => {
    if (!whatsappNumber) return null;
    const msg = shareOnWhatsapp
      ? `Olá! Sou ${form.name.trim()} (${PROFILE_LABEL[form.profile] ?? ""}) e tenho interesse no VenceHoje.`
      : "Olá! Tenho interesse no VenceHoje.";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  })();

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-[var(--shadow-card)]" role="status">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden="true" />
        <p className="mt-3 text-lg font-bold">{done}</p>
        <p className="mt-1 text-sm text-muted-foreground">Vamos falar com você em breve.</p>
        {whatsappLink && (
          <div className="mt-5 space-y-3">
            <label className="flex items-center justify-center gap-2 text-sm">
              <Checkbox checked={shareOnWhatsapp} onCheckedChange={(v) => setShareOnWhatsapp(v === true)} />
              Incluir meu nome e perfil na mensagem
            </label>
            <Button asChild variant="outline">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1 h-4 w-4" /> Conversar pelo WhatsApp
              </a>
            </Button>
          </div>
        )}
      </div>
    );
  }

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-name">Nome</Label>
          <Input id="lead-name" autoComplete="name" {...field("name")} aria-invalid={!!errors.name} aria-describedby="lead-name-err" />
          {errors.name && <p id="lead-name-err" className="text-xs text-danger">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-email">E-mail</Label>
          <Input id="lead-email" type="email" autoComplete="email" {...field("email")} aria-invalid={!!errors.email} aria-describedby="lead-email-err" />
          {errors.email && <p id="lead-email-err" className="text-xs text-danger">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-wa">WhatsApp (opcional)</Label>
          <Input id="lead-wa" type="tel" autoComplete="tel" placeholder="(11) 91234-5678" {...field("whatsapp")} aria-invalid={!!errors.whatsapp} aria-describedby="lead-wa-err" />
          {errors.whatsapp && <p id="lead-wa-err" className="text-xs text-danger">{errors.whatsapp}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-profile">Perfil</Label>
          <Select value={form.profile} onValueChange={(v) => setForm((f) => ({ ...f, profile: v }))}>
            <SelectTrigger id="lead-profile" aria-invalid={!!errors.profile}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pessoa_fisica">Pessoa física</SelectItem>
              <SelectItem value="autonomo_mei">Autônomo / MEI</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
            </SelectContent>
          </Select>
          {errors.profile && <p className="text-xs text-danger">{errors.profile}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-comment">Interesse ou comentário (opcional)</Label>
        <Textarea id="lead-comment" rows={3} maxLength={1000} {...field("comment")} />
      </div>
      <div className="hidden" aria-hidden="true">
        <label>
          Site <input tabIndex={-1} autoComplete="off" {...field("website")} />
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span>{CONSENT_TEXT}</span>
      </label>
      {errors.form && <p role="alert" className="text-sm text-danger">{errors.form}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Tenho interesse
      </Button>
    </form>
  );
}
