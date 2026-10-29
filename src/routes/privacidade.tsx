import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/SiteChrome";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — VenceHoje" },
      { name: "description", content: "Como o VenceHoje trata seus dados pessoais (texto provisório)." },
      { property: "og:title", content: "Política de Privacidade — VenceHoje" },
      { property: "og:description", content: "Como o VenceHoje trata seus dados pessoais." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <LegalPage title="Política de Privacidade">
      <p>Esta política explica quais dados o VenceHoje coleta e como eles são usados.</p>
      <h2>Dados coletados</h2>
      <p>Dados de cadastro (nome, e-mail, perfil e nome do negócio), lançamentos financeiros que você registra e dados enviados pelo formulário de interesse.</p>
      <h2>Uso dos dados</h2>
      <p>Os lançamentos financeiros são usados somente para exibir suas informações dentro da sua conta. A equipe administrativa não tem acesso livre a esses lançamentos.</p>
      <h2>Contato comercial</h2>
      <p>Só entramos em contato comercial quando você marca a autorização específica. A data e a versão do texto aceito ficam registradas.</p>
      <h2>Seus direitos</h2>
      <p>Você pode solicitar acesso, correção, anonimização ou exclusão dos seus dados pelas configurações da conta ou pelo contato informado no site.</p>
      <h2>Retenção</h2>
      <p>O prazo de retenção de dados de interessados ainda será definido e informado nesta página.</p>
    </LegalPage>
  ),
});
