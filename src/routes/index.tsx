import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, CalendarClock, Layers, Repeat, Scale, Briefcase, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LeadForm } from "@/components/LeadForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VenceHoje — Nunca mais perca de vista uma conta" },
      { name: "description", content: "Organize pagamentos e recebimentos, acompanhe vencimentos e saiba o que precisa da sua atenção." },
      { property: "og:title", content: "VenceHoje — Suas contas. Seus prazos. Tudo sob controle." },
      { property: "og:description", content: "Contas a pagar e a receber com agenda de vencimentos e lembretes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const benefits = [
  { Icon: Layers, title: "Tudo em um só lugar", text: "Pagamentos e recebimentos reunidos numa lista simples." },
  { Icon: CalendarClock, title: "Saiba o que vence primeiro", text: "Agenda e lista cronológica mostram as próximas datas." },
  { Icon: Scale, title: "Controle pagamentos e recebimentos", text: "Registre baixas totais ou parciais e veja o saldo pendente." },
  { Icon: Repeat, title: "Acompanhe contas recorrentes", text: "Semanais, mensais ou anuais, cada uma com sua própria data." },
  { Icon: Bell, title: "Clareza sobre valores pendentes", text: "Veja o que está atrasado e o que vence nos próximos dias." },
];

function DashboardPreview() {
  const rows = [
    { d: "Aluguel do escritório", v: "R$ 1.800,00", s: "Vence em 2 dias", tone: "bg-warning-soft text-warning-foreground" },
    { d: "Cliente — projeto site", v: "R$ 3.200,00", s: "A receber", tone: "bg-success-soft text-accent-foreground" },
    { d: "Internet", v: "R$ 129,90", s: "Atrasado", tone: "bg-danger-soft text-danger" },
  ];
  return (
    <div aria-label="Prévia ilustrativa do painel, sem dados reais" role="img" className="rounded-3xl border bg-card p-5 shadow-[var(--shadow-lift)]">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-danger-soft p-4">
          <p className="text-xs font-semibold text-danger">A pagar</p>
          <p className="mt-1 text-xl font-extrabold tabular">R$ 2.430</p>
        </div>
        <div className="rounded-2xl bg-success-soft p-4">
          <p className="text-xs font-semibold text-accent-foreground">A receber</p>
          <p className="mt-1 text-xl font-extrabold tabular">R$ 5.900</p>
        </div>
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">Próximos vencimentos</p>
      <ul className="mt-2 divide-y">
        {rows.map((r) => (
          <li key={r.d} className="flex items-center justify-between gap-2 py-3 text-sm">
            <span className="font-medium">{r.d}</span>
            <span className="flex items-center gap-2">
              <span className="tabular font-semibold">{r.v}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.tone}`}>{r.s}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">Exemplo ilustrativo</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="hero-grid border-b">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                Suas contas. Seus prazos. Tudo sob controle.
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Nunca mais perca de vista uma conta.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Organize pagamentos e recebimentos, acompanhe vencimentos e saiba exatamente o que precisa da sua atenção.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Começar gratuitamente <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#como-funciona">Conhecer o VenceHoje</a>
                </Button>
              </div>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section id="beneficios" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight">Benefícios</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map(({ Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
                <Icon className="h-6 w-6 text-success" aria-hidden="true" />
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Como funciona</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {["Crie sua conta.", "Cadastre pagamentos e recebimentos.", "Consulte sua agenda e acompanhe os prazos."].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="pt-2 font-semibold">{t}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight">Para quem é</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: User, t: "Pessoas físicas" },
              { Icon: Briefcase, t: "Autônomos e profissionais liberais" },
              { Icon: Building2, t: "MEIs e pequenos negócios" },
            ].map(({ Icon, t }) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="font-semibold">{t}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="planos" className="scroll-mt-20 border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-extrabold tracking-tight">Planos</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border-2 border-success bg-background p-6">
                <p className="text-sm font-bold text-accent-foreground">Agora</p>
                <h3 className="mt-1 text-2xl font-extrabold">Acesso gratuito</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Durante o período de validação, todas as funções disponíveis no VenceHoje podem ser usadas sem custo.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/auth" search={{ mode: "signup" }}>Começar gratuitamente</Link>
                </Button>
              </div>
              <div className="rounded-2xl border bg-background p-6">
                <p className="text-sm font-bold text-muted-foreground">Futuro</p>
                <h3 className="mt-1 text-2xl font-extrabold">
                  R$ 15<span className="text-base font-semibold text-muted-foreground">/mês</span>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Preço indicativo de uma assinatura futura. Proposta sujeita a confirmação; nenhuma cobrança é feita hoje.
                </p>
                <Button asChild variant="outline" className="mt-6">
                  <a href="#contato">Tenho interesse</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="contato" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20">
          <h2 className="text-3xl font-extrabold tracking-tight">Quer saber mais?</h2>
          <p className="mt-2 text-muted-foreground">Deixe seu contato e conte o que você precisa.</p>
          <div className="mt-8">
            <LeadForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
