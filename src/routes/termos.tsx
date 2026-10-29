import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/SiteChrome";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — VenceHoje" },
      { name: "description", content: "Condições de uso do VenceHoje (texto provisório)." },
      { property: "og:title", content: "Termos de Uso — VenceHoje" },
      { property: "og:description", content: "Condições de uso do VenceHoje." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Termos de Uso">
      <p>Ao criar uma conta, você concorda com estas condições.</p>
      <h2>O serviço</h2>
      <p>O VenceHoje ajuda a organizar contas a pagar e a receber. Não realiza pagamentos, não emite boletos ou notas fiscais e não substitui um contador.</p>
      <h2>Responsabilidade pelas informações</h2>
      <p>Os valores e datas cadastrados são de responsabilidade de quem os registra. O saldo previsto é uma estimativa e não representa saldo bancário.</p>
      <h2>Período de validação</h2>
      <p>Durante a validação o acesso é gratuito. Condições comerciais futuras serão comunicadas antes de qualquer cobrança.</p>
      <h2>Encerramento</h2>
      <p>Você pode solicitar a exclusão da conta a qualquer momento nas configurações.</p>
    </LegalPage>
  ),
});
