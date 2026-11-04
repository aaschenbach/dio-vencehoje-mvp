# Preparação para publicação — VenceHoje

**Situação em 04/11/2026:** publicação comercial **não autorizada**. Este documento é um checklist operacional, não uma certificação jurídica ou de segurança.

## Bloqueadores e responsáveis

| Prioridade | Pendência | Responsável / ação necessária | Estado |
| --- | --- | --- | --- |
| Alta | Identificar controlador dos dados (pessoa jurídica ou física), canal de privacidade e contato de suporte | Responsável pelo produto | Não definido |
| Alta | Definir finalidades, bases legais, operadores, compartilhamentos, transferências e medidas reais de proteção | Responsável + revisão técnica/jurídica | Pendente |
| Alta | Definir e implementar retenção, anonimização, exclusão e tratamento de solicitações dos titulares (incluindo leads e backups) | Responsável + implementação no backend | Pendente |
| Alta | Substituir os textos provisórios em `src/routes/privacidade.tsx` e `src/routes/termos.tsx` por versões revisadas e datadas | Responsável + revisão jurídica | Pendente |
| Alta | Confirmar políticas RLS, RPCs e integridade no ambiente que será publicado | Revisão técnica | Pendente de evidência reproduzível |
| Média | Provisionar primeiro administrador de maneira segura | Responsável pelo produto | Concluído conforme relato do usuário; auditoria de concessão não anexada |
| Média | Testar cadastro/edição de assinatura manual, gestão/anonimização de leads, WhatsApp | Administrador de teste | A4–A7 concluídos conforme relato do usuário |
| Alta | Validar consentimento comercial e recuperação de senha | Responsável pelos testes | P1/P2 não executados; roteiro em [TESTES_FINAIS.md](TESTES_FINAIS.md) |
| Média | Revisar secrets, deploy, logs, backup e links do site; registrar versão/commit publicado | Revisão técnica | Pendente |
| Alta | Garantir acesso funcional de usuário comum na fase anunciada como gratuita | Responsável técnico/comercial | Segunda conta comum não utilizável por regra de assinatura, conforme relato |\n| Média | Política de preço após validação gratuita e comunicação de mudança | Responsável comercial | Pendente |

## Provisionamento do administrador

1. Criar uma conta normal no aplicativo com e-mail confirmado.
2. Em ambiente protegido, um operador autorizado concede o papel `admin` ao ID autenticado correto, de acordo com o modelo real de `user_roles`; **nunca** utilizar operação feita pelo navegador comum nem pedir senha ao usuário.
3. Confirmar que o usuário vê apenas os módulos comerciais e não tem acesso aos lançamentos financeiros privados dos demais.
4. Verificar RLS e trilha de autorização: não basta mostrar a aba admin.
5. Registrar quem concedeu o papel, data, justificativa e procedimento de revogação.

**Não foi fornecida aqui uma instrução SQL concreta**: colunas, constraints, políticas e fluxo administrativo devem ser conferidos diretamente no banco antes de executar qualquer comando privilegiado. A falta de créditos do Lovable pode impedir acesso ao procedimento suportado; não improvisar privilégio via frontend.

## Privacidade — decisões que faltam

As páginas atuais declaram explicitamente seu caráter provisório. Uma versão definitiva precisa identificar:

- Controlador e canal de atendimento; escopo dos dados de cadastro, financeiros, leads e telemetria;
- Finalidades e bases legais separadas para execução do serviço, segurança e contato comercial;
- Suboperadores e provedores efetivos, infraestrutura de hospedagem, transferências internacionais se houver;
- Prazos e critérios de retenção por categoria (conta ativa, pedidos de exclusão, backups, logs, leads sem conversão, leads convertidos);
- Como o titular solicita acesso, correção, revogação de consentimento, exclusão e outros direitos aplicáveis;
- Segurança, incidentes e eventuais limitações realistas;
- Versão e data de vigência do aviso, e histórico de mudanças.

**Não adotar arbitrariamente um prazo de 30/90/180 dias** sem decisão responsável e implementação técnica. Um prazo redigido na política e não executado pelo banco é um risco de conformidade.

## Termos de Uso — decisões que faltam

- Identificação do prestador, público e elegibilidade;
- Escopo de organização financeira, ausência de pagamento e de garantia de resultado;
- Obrigações de cadastramento e uso legítimo;
- Natureza do acesso gratuito de validação, eventuais planos futuros e como serão comunicados;
- Disponibilidade, suporte, suspensão e término;
- Propriedade intelectual, responsabilidade, limites juridicamente válidos e canal de contato;
- Relação com Política de Privacidade e demais exigências aplicáveis no Brasil.

Os Termos e a Política de Privacidade devem ser revisados por profissional habilitado antes de operação comercial. O repositório, por si só, **não prova conformidade com a LGPD**.

## Testes antes de liberar

1. A4–A7 foram relatados como aprovados. **Executar P1 e P2** conforme [TESTES_FINAIS.md](TESTES_FINAIS.md), e revisar P3 no ambiente final.
2. Confirmar que uma conta comum não acessa dados de outro workspace nem funções administrativas **diretamente pela API**.
3. Confirmar, com conta admin, que consultas a baixas/lançamentos privados de clientes falham.
4. Verificar exclusão/anonymização de leads, auditoria de baixas e persistência de exceções de recorrência.
5. Confirmar tratamento de erros, versão responsiva, links, acessibilidade básica, proteção contra robôs e limites.
6. Publicar somente após revisão de configuração do Lovable Cloud, escaneamento de segredos e documentação de procedimento de incidentes.
7. Executar validação automatizada no commit final e registrar evidências e responsável.

## Configuração comercial

O número do WhatsApp é opcional e deve ser informado pelo administrador. Assinaturas são cadastradas **manualmente**, sem processar pagamento nem criar débito. O preço de R$ 15/mês exibido na landing é indicativo e futuro.

## Resultado esperado

Quando todos os itens obrigatórios forem resolvidos, registrar uma decisão explícita de liberação, versão/commit, data, domínio, responsável e plano de reversão. Até lá, manter a aplicação restrita a testes com dados fictícios.

## Situação do ciclo interno em 04/11/2026

A implementação do MVP está documentada como **encerrada para fins internos, com ressalvas**, em [ENCERRAMENTO_MVP.md](ENCERRAMENTO_MVP.md). A preparação para publicação comercial continua aberta. Existem [minutas legais estruturadas](MINUTAS_LEGAIS.md), mas o responsável deve definir identidade do controlador, contato, retenção, terceiros e condições de uso; nenhuma dessas informações foi presumida ou publicada como definitiva.
