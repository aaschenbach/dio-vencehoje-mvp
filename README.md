# VenceHoje — MVP

Aplicação web em português brasileiro para organizar **contas a pagar e a receber**, vencimentos, baixas parciais e recorrências. Projeto de aprendizagem e validação de produto; **não é um banco, não movimenta dinheiro e não executa cobranças**.

> **Status em 04/11/2026:** MVP de estudo da DIO concluído e publicado no Lovable, com testes funcionais relatados como aprovados e validação automatizada de TypeScript, testes e build. Não há operação comercial ou cobranças reais. As capturas da aplicação foram fornecidas e preparadas com dados pessoais ocultados; a publicação das imagens no repositório está pendente.

## Entrega do desafio DIO — projeto de estudo

**Problema:** dificuldade de acompanhar prazos de pagamento/recebimento, baixas e contas recorrentes sem usar um ERP complexo.  
**Solução proposta:** VenceHoje, aplicativo responsivo com lançamentos, agenda, painel e baixas parciais. **Finalidade exclusivamente educacional**, sem cobrança ou pagamentos reais.

**Aplicação publicada no Lovable:** [https://vencehoje.lovable.app](https://vencehoje.lovable.app) (endereço oficial informado pelo responsável pelo projeto; acesso externo não pôde ser confirmado automaticamente nesta revisão). **Pré-visualização de desenvolvimento:** [abrir preview](https://id-preview--571e03e9-a4eb-42c9-99cc-707359e4d369.lovable.app). [Editor do projeto](https://lovable.dev/projects/571e03e9-a4eb-42c9-99cc-707359e4d369).

**Evidências visuais:** foram recebidas e preparadas 13 capturas reais em dispositivo móvel, incluindo landing, login, recuperação de senha, painel, agenda, lançamentos, lembretes, contatos, categorias e administração. Consulte o [catálogo e instruções para inclusão dos arquivos](docs/screenshots/README.md). A galeria visual só será ativada após a inclusão dos PNGs no GitHub.

**Entregáveis do desafio:**
- [Checklist de entrega e evidências](docs/ENTREGA_DIO.md)
- [Business Model Canvas visual (SVG)](docs/BMC_VENCEHOJE.svg)
- [Modelo de negócio, TAM/SAM/SOM hipotéticos e tese de validação](docs/NEGOCIO.md)
- [Mega prompt reconstruído e evolução/correções](docs/MEGA_PROMPT_E_EVOLUCAO.md)
- [Cenários funcionais e comprovações](docs/VALIDACAO.md)

**Tese a validar:** uma experiência de controle financeiro simples, com contas a pagar/receber e recorrências em um só lugar, pode ajudar públicos que não precisam de um ERP. Esta é uma hipótese, não uma conclusão de pesquisa ou desempenho real.

**Aprendizados técnicos:** regras financeiras e recorrências exigem validação transacional e tratamento de exceções; controle de acesso deve atuar no banco, não apenas nas telas; testes de compilação e CI não substituem testes funcionais; integrar o Lovable com GitHub facilita manutenção e documentação.

**Limites do experimento:** assinatura administrativa é manual; WhatsApp é um link; lembretes não disparam mensagens externas; sem banco, Pix, boleto, emissão fiscal, IA ou integrações de pagamento. Acesso de um segundo usuário comum ainda não foi revalidado no ambiente final.

## O que faz

- Cadastro, confirmação de e-mail, login, recuperação de senha e onboarding.
- Lançamentos a pagar/receber, categorias e contatos.
- Baixas totais e parciais, correção e histórico; painel de valores em aberto e quitados.
- Recorrências semanais, mensais e anuais, com edição/exclusão por ocorrência ou série.
- Agenda mensal/lista, filtros e lembretes **dentro do aplicativo**.
- Landing page com formulário de interesse e autorização comercial separada.
- Área administrativa para leads, clientes e assinaturas registradas manualmente.
- Interface responsiva; datas de vencimento consideradas no fuso de São Paulo.

**Fora do MVP:** integração bancária, Pix, boletos, emissão fiscal, pagamentos automáticos, notificações push/e-mail de lembretes, cobrança recorrente, chatbot, IA, múltiplas empresas e equipes. O preço indicativo de **R$ 15/mês** é hipótese comercial futura, não uma cobrança ativa.

## Tecnologias

React 19, TypeScript, TanStack Router/Start, Vite, Tailwind CSS, TanStack Query, Vitest, Supabase (Lovable Cloud: autenticação, Postgres/RLS e funções) e Bun. O repositório contém código de frontend e integrações; **não pressupor que um clone reproduz a infraestrutura remota do Lovable Cloud**.

## Executar localmente

Pré-requisitos: [Bun](https://bun.sh/) e acesso legítimo a um backend Supabase/Lovable Cloud configurado para o projeto.

```bash
git clone https://github.com/aaschenbach/dio-vencehoje-mvp.git
cd dio-vencehoje-mvp
bun install --frozen-lockfile
```

Configure o backend através do ambiente apropriado, **sem versionar credenciais**. O cliente utiliza `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no navegador; no ambiente de servidor, utiliza `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`. Chaves públicas de acesso não substituem as políticas RLS. **Nunca** exponha `service_role`, `sb_secret_*`, tokens administrativos ou senhas no frontend, no GitHub ou em logs.

```bash
bun run dev
```

Para qualidade e build:

```bash
bunx tsc --noEmit
bun run test
bun run build
```

O workflow [Validate MVP](.github/workflows/validate.yml) executa essas verificações em pull requests. Testes de interface e isolamento real de banco exigem um ambiente operacional e usuários de teste.

## Organização do repositório

- `src/routes/`: landing, autenticação, páginas privadas, administração e páginas legais.
- `src/components/`: formulários, listas, detalhes e elementos de interface.
- `src/lib/`: dados, datas, valores, recorrência e funções de servidor.
- `src/integrations/supabase/`: cliente e tipos gerados do backend.
- `docs/`: arquitetura, validação, operação e pendências pré-publicação.
- `.github/workflows/`: validação automatizada.

## Documentação

1. [Arquitetura e escopo](docs/ARQUITETURA.md)
2. [Matriz de testes e evidências](docs/VALIDACAO.md)
3. [Checklist de publicação, privacidade e operação](docs/PUBLICACAO.md)
4. [Modelo de negócio e hipóteses](docs/NEGOCIO.md)
5. [Encerramento interno do MVP](docs/ENCERRAMENTO_MVP.md)
6. [Roteiro de testes finais P1/P2](docs/TESTES_FINAIS.md)
7. [Minutas legais para revisão](docs/MINUTAS_LEGAIS.md)

Não há capturas de tela ou imagem do Business Model Canvas versionadas neste repositório; não foram criados links fictícios. O briefing e os prompts integrais do Lovable não estão disponíveis aqui como arquivos verificados e não são apresentados como anexos.

## Segurança e privacidade

O aplicativo **deve** isolar dados financeiros por workspace e manter papéis administrativos separados. A camada visual não substitui verificações de RLS, funções e autorização do banco. O último relatório de testes menciona isolamento e tentativas de acesso por API aprovados; consultar [a matriz](docs/VALIDACAO.md) para distinguir relatos manuais de evidências automatizadas.

As páginas `/privacidade` e `/termos` **ainda contêm textos provisórios**. Antes de uso comercial, definir controlador/contato, finalidades e bases legais, operadores, retenção, solicitações dos titulares, regras de contratação e revisão jurídica: [pendências](docs/PUBLICACAO.md).

## Desenvolvimento e sincronização

Projeto editado no [Lovable](https://lovable.dev/projects/571e03e9-a4eb-42c9-99cc-707359e4d369). Alterações integradas à `main` são sincronizadas com o Lovable quando a integração estiver ativa; confirme no editor antes de publicar. Prefira branch + pull request, nunca corrigir dados financeiros diretamente em produção.

## Estado de licença

Nenhuma licença de código aberto foi declarada neste repositório. A visibilidade de um repositório não implica concessão de licença de reutilização.
