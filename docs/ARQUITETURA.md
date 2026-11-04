# Arquitetura e escopo — VenceHoje

**Revisão:** 04/11/2026. **Base:** inspeção dos arquivos `package.json`, `src/routes/`, `src/lib/data.ts`, `src/components/LeadForm.tsx`, `src/integrations/supabase/client.ts` e tipos gerados do banco. As propriedades efetivas do banco remoto exigem conferência em Lovable Cloud.

## Objetivo

MVP para pessoas físicas, autônomos, MEIs e pequenos negócios acompanharem contas a pagar/receber e seus prazos. Um único produto para todos os perfis. Não pretende ser ERP, banco ou sistema contábil.

## Camadas

1. **Interface:** React, TanStack Router/Start, Tailwind CSS; rotas públicas e privadas.
2. **Dados e estado:** TanStack Query e cliente Supabase tipado.
3. **Backend gerenciado:** Lovable Cloud / Supabase com autenticação, banco PostgreSQL, funções RPC e RLS.
4. **Serviço público de leads:** formulário React chama função de servidor `submitLead`; confirmar proteção e limites no ambiente.
5. **Integração comercial:** abertura opcional de WhatsApp (`wa.me`), sem disparo automatizado de mensagens.

Rotas públicas: `/`, `/privacidade`, `/termos`, `/auth`, `/esqueci-senha`, `/reset-password`.
Rotas privadas: `/boas-vindas`, `/painel`, `/lancamentos`, `/agenda`, `/lembretes`, `/contatos`, `/categorias`, `/configuracoes`.
Rotas administrativas: `/admin`, `/admin/leads`, `/admin/clientes`, `/admin/assinaturas`, `/admin/configuracoes`.

## Modelo conceitual de dados

As tabelas tipadas incluem perfis, workspaces, associações, preferências, categorias, contatos, regras de recorrência, exceções, lançamentos financeiros, baixas, auditoria de baixas, leads, envios de leads, notas comerciais, assinaturas, configurações e papéis de usuário.

**Principais relações:** usuário → workspace → lançamentos → baixas; regra de recorrência → ocorrências; lead → envios/consentimentos/notas; usuário → assinatura administrativa.

O código utiliza a visão `entries_with_status` para saldos e situação, e RPCs como `my_workspace_id`, `ensure_occurrences`, `create_recurring_entry`, `update_series_from`, `delete_occurrence`, `delete_series_from`, `dashboard_totals` e `has_role`. **Assinaturas/types gerados não provam, por si só, que privilégios e gatilhos estejam corretos no banco implantado.**

## Regras centrais

- Valor armazenado no banco em formato numérico decimal; cálculos auxiliares do frontend em centavos.
- Situação depende do vencimento, valor e somatório efetivamente baixado: pendente, parcial, atrasado ou quitado. Uma baixa parcial vencida deve ser considerada atrasada.
- Vencimento é uma data civil (sem horário); `todaySP()` considera `America/Sao_Paulo`.
- Recorrências usam ocorrências reais, com exceções de remoção e preservação de casos quitados/editados.
- Limite operacional de geração e consulta de recorrências: até 24 meses à frente, conforme regras de backend planejadas.
- Saldo previsto do painel **não** é saldo bancário.

## Separação de acesso

O usuário deve acessar apenas o próprio workspace. O administrador atua sobre cadastros, leads e informações comerciais, **não** sobre lançamentos financeiros privados dos clientes. A rota `/admin` faz uma verificação de papel via `has_role`; segurança efetiva exige política RLS e funções corretas no banco. Revisão específica está descrita em [VALIDACAO.md](VALIDACAO.md).

## Configuração e ambientes

- Dependências: arquivo `bun.lock`; instalar com `bun install --frozen-lockfile`.
- Builds e testes: `bunx tsc --noEmit`, `bun run test`, `bun run build`.
- O projeto Lovable fornece as configurações do backend. Não registrar nem distribuir secrets reais.
- Alterações de estrutura de banco exigem migrações controladas e testes; um repositório de frontend, isoladamente, não garante reconstituição do Lovable Cloud.

## Limitações assumidas

Sem integração bancária, cobrança automática, emissão fiscal, e-mails ou notificações push de lembretes; sem equipes ou múltiplos workspaces por conta. Painel administrativo inclui assinaturas **manuais**, sem processar pagamento.
