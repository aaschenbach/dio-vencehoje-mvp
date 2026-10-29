# Plano técnico — VenceHoje MVP

Aplicação web real (não protótipo) em português, com Lovable Cloud para banco, login e funções de servidor. Visual limpo com a paleta enviada (#12304B, #059B78, #F59E0B, #DC5A5A, #F6F8FA) e fonte Manrope. Logo em SVG próprio (calendário + check).

## 1. Estrutura de páginas

Públicas:
- `/` landing (cabeçalho, hero com prévia ilustrativa do painel, benefícios, como funciona, públicos, planos, formulário de interesse, rodapé)
- `/beneficios`, `/como-funciona`, `/planos` (seções também na landing; links do menu levam às páginas próprias)
- `/privacidade`, `/termos` (texto marcado como provisório)
- `/auth` (entrar / criar conta), `/esqueci-senha`, `/reset-password`

Privadas (usuário logado):
- `/boas-vindas` (onboarding: nome, perfil, nome do negócio)
- `/painel` (indicadores + filtros de período)
- `/lancamentos` (tabela no desktop, cartões no celular) e detalhe em painel lateral com histórico de baixas
- `/agenda` (mês + lista cronológica)
- `/lembretes`
- `/contatos`, `/categorias`
- `/configuracoes`

Administração (somente papel admin, verificado no servidor):
- `/admin`, `/admin/leads`, `/admin/clientes`, `/admin/assinaturas`, `/admin/configuracoes`

## 2. Componentes principais
AppShell (barra lateral desktop / menu inferior ou gaveta no celular), Logo, KpiCard, PeriodFilter, EntryForm (dialog), EntryTable/EntryCard, StatusBadge (cor + texto), SettlementDialog, SettlementHistory, RecurrenceScopeDialog ("só esta" / "esta e futuras"), CalendarMonth, AgendaList, ReminderList, ContactForm, CategoryManager, LeadForm, AdminTable, EmptyState, ConfirmDialog. Formatação BRL e DD/MM/AAAA centralizada em utilitários.

## 3. Modelo de dados
Simplificação: um workspace por usuário criado automaticamente no cadastro (estrutura pronta para crescer, sem compartilhamento no MVP).

- `profiles` (user_id, nome, perfil, nome_negocio, onboarding_concluido)
- `workspaces` + `workspace_members` (dono único)
- `user_preferences` (antecedência de lembrete 1/3/7)
- `categories` (workspace, tipo pagar/receber, nome, ativa, padrão) — padrões criados no cadastro
- `contacts` (workspace, nome, tipo pessoa/empresa, email, telefone, obs)
- `recurrence_rules` (workspace, frequência semanal/mensal/anual, dia âncora, data inicial, data final opcional, modelo do lançamento, gerado_até)
- `financial_entries` (workspace, tipo, descrição, valor numeric(14,2), vencimento date, categoria, contato, obs, recurrence_rule_id, índice da ocorrência, editada_individualmente, timestamps) — único por (regra, data original) para impedir duplicação
- `settlements` (entry, valor numeric(14,2), data efetiva, obs) — gatilho no banco impede soma acima do valor do lançamento e valores ≤ 0
- `leads` (nome, email, whatsapp, perfil, comentário, consentimento, origem, situação, convertido_em_user_id)
- `commercial_notes` (lead ou cliente, texto, autor)
- `subscriptions` (user_id, plano, status Teste/Ativa/Pendente/Cancelada, início, vencimento contratual, valor, obs)
- `app_settings` (WhatsApp comercial configurável, vazio por padrão)
- `user_roles` + função `has_role` (papéis em tabela separada)
- `lead_rate_limits` (hash de IP/e-mail + horário, para limite de envios)

Situação (Pendente/Parcial/Quitado/Atrasado) é calculada a partir do saldo e da data de hoje em São Paulo — não gravada.

## 4. Autenticação e autorização
- E-mail e senha, confirmação de e-mail, recuperação de senha, sessão persistente.
- Rotas privadas sob área protegida; admin sob sub-área que confere o papel.
- RLS em todas as tabelas privadas: acesso só a registros do próprio workspace.
- Admin lê perfis, leads, assinaturas e notas comerciais — sem política que permita ler lançamentos, baixas, contatos ou categorias de outros usuários.
- Nenhuma política permite usuário inserir/alterar `user_roles`.
- Primeiro admin: provisionado manualmente por mim via comando SQL no banco depois que você criar sua conta (você me informa o e-mail). Nada automático para o primeiro cadastrado.
- Formulário de lead enviado por função de servidor com validação (zod), campo-armadilha anti-bot, limite de envios por IP/e-mail e bloqueio de duplo clique.

## 5. Estratégia de recorrência
- Regra guarda o modelo; ocorrências são linhas reais com identidade própria.
- Geração limitada: ao criar a regra e ao abrir o app, gera ocorrências até 12 meses à frente (ou data final), avançando `gerado_até`. Restrição única evita duplicatas em recarregamentos.
- Dia 29/30/31 em mês menor usa o último dia do mês, sempre a partir do dia âncora (31/jan → 28/fev → 31/mar).
- Editar "só esta": altera a linha e marca como individual. "Esta e futuras": encerra a regra antiga na véspera e cria nova regra a partir dela; ocorrências futuras sem baixa são regeneradas.
- Excluir "só esta" ou "futuras" (futuras sem baixas são removidas e a regra recebe data final).
- Baixa sempre ligada a uma única ocorrência.

## 6. Dependências externas
Apenas Lovable Cloud. Sem Stripe, e-mail transacional, push ou WhatsApp automático. WhatsApp na landing só abre link `wa.me` quando o número estiver configurado pelo admin.

## 7. Ordem de implementação
1. Ativar Lovable Cloud, identidade visual, logo, layout.
2. Banco completo: tabelas, gatilhos, RLS, papéis, dados padrão no cadastro.
3. Landing, páginas legais, formulário de lead.
4. Login, cadastro, recuperação, onboarding.
5. Lançamentos, categorias, contatos, baixas.
6. Recorrência.
7. Painel, agenda, lembretes, configurações (incl. troca de senha e pedido de exclusão da conta).
8. Área admin.
9. Testes automatizados das regras, verificação no navegador, revisão de segurança.
10. README e `docs/` (mega-prompt, correções). O Canvas em `docs/business-model-canvas.png` e capturas só se produzidos; sem links quebrados.

## 8. Riscos técnicos
- Datas e fuso: tratar vencimentos como data de calendário (sem hora) para evitar deslocamento por UTC.
- Edição de séries com baixas existentes: ocorrências já pagas nunca são alteradas pela edição da série.
- Limite de envio de leads em servidor sem estado: feito com tabela no banco.
- TAM/SAM/SOM no README são estimativas com fontes públicas (IBGE, Sebrae, Receita) identificadas como hipóteses.
- Sincronização com GitHub (`vencehoje-mvp`) é feita por você nas configurações do projeto; eu deixo tudo pronto.

## 9. Critérios de aceitação
Os 15 cenários do item 20. Cobertura automatizada: cálculo de situação, saldo com baixas parciais, bloqueio de excesso, geração mensal com fim de mês, edição de ocorrência isolada, totais do painel sem duplicar recorrências. Verificação no navegador: cadastro, lançamentos, painel, agenda, celular. Isolamento entre usuários e bloqueio do admin verificados via políticas no banco. O que não puder ser automatizado será listado com instruções de verificação manual.

## Fora do escopo
Tudo listado no item 22 (bancos, Pix, boletos, nota fiscal, chatbot, IA, múltiplas empresas, equipes).
