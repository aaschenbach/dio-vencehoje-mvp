# Plano técnico revisado — VenceHoje MVP

Aplicação web real (não protótipo) em português, com Lovable Cloud para banco, login e funções de servidor. Visual limpo com a paleta enviada (#12304B, #059B78, #F59E0B, #DC5A5A, #F6F8FA) e fonte Manrope. Logo em SVG próprio (calendário + check). Nada fora do escopo será adicionado.

## 1. Estrutura de páginas

Públicas:
- `/` landing com seções âncora: Benefícios, Como funciona, Públicos, Planos, formulário de interesse, rodapé (sem páginas redundantes)
- `/privacidade`, `/termos` (texto marcado como provisório)
- `/auth` (entrar / criar conta), `/esqueci-senha`, `/reset-password`

Privadas (usuário logado):
- `/boas-vindas` (onboarding: nome, perfil, nome do negócio)
- `/painel`, `/lancamentos` (detalhe com histórico de baixas), `/agenda`, `/lembretes`, `/contatos`, `/categorias`, `/configuracoes`

Administração (papel admin verificado no servidor):
- `/admin`, `/admin/leads`, `/admin/clientes`, `/admin/assinaturas`, `/admin/configuracoes`

## 2. Componentes principais
AppShell (barra lateral desktop / gaveta no celular), Logo, KpiCard, PeriodFilter, EntryForm, EntryTable/EntryCard, StatusBadge (cor + texto), SettlementDialog, SettlementHistory, RecurrenceScopeDialog ("só esta" / "esta e futuras"), CalendarMonth, AgendaList, ReminderList, ContactForm, CategoryManager, LeadForm, AdminTable, EmptyState, ConfirmDialog. Formatação BRL e DD/MM/AAAA centralizada.

## 3. Modelo de dados
Um workspace por usuário, criado automaticamente no cadastro (sem compartilhamento no MVP).

- `profiles`, `workspaces`, `workspace_members`, `user_preferences` (antecedência 1/3/7)
- `categories` (tipo, nome, ativa; padrões criados no cadastro; desativação em vez de exclusão quando em uso)
- `contacts`
- `recurrence_rules` (frequência, dia âncora, data inicial, data final opcional, modelo do lançamento, `gerado_ate`, `regra_anterior_id` para histórico de alterações de série)
- `recurrence_exceptions` (regra, data original, motivo: excluída) — impede que ocorrências removidas reapareçam
- `financial_entries` (valor numeric(14,2), vencimento date, regra, data original da ocorrência, `editada_individualmente`, timestamps) — único por (regra, data original)
- `settlements` (lançamento, valor numeric(14,2), data efetiva, obs)
- `settlement_audit` (registro de correções/exclusões de baixas: valor anterior, autor, data)
- `leads` (dados, consentimento, `consentimento_em`, `consentimento_versao`, origem, situação, contagem de envios, último envio, `anonimizado_em`, vínculo com usuário convertido)
- `commercial_notes`, `subscriptions`, `app_settings` (WhatsApp comercial, vazio por padrão), `lead_rate_limits`
- `user_roles` + função `has_role`

Situação (Pendente/Parcial/Quitado/Atrasado) calculada pelo saldo e pela data de hoje em São Paulo.

## 4. Integridade financeira
- Registrar, corrigir e excluir baixas por funções no banco (transação única) que travam a linha do lançamento (`SELECT ... FOR UPDATE`) antes de somar — baixas simultâneas não ultrapassam o valor.
- Gatilho de reforço: rejeita baixa ≤ 0 e soma acima do valor, mesmo fora das funções.
- Gatilho impede reduzir o valor do lançamento abaixo do total já baixado.
- Lançamento com baixas não pode ser excluído diretamente: o usuário precisa excluir as baixas antes (com confirmação), e cada correção/exclusão de baixa fica registrada em `settlement_audit`. Nada some silenciosamente.
- Totais do painel calculados no banco a partir dos lançamentos e baixas atuais (sem valores cacheados), então refletem alterações e exclusões imediatamente.

## 5. Recorrência
- Regras guardam o modelo; ocorrências são linhas reais com identidade própria. Baixa sempre ligada a uma única ocorrência.
- Janela móvel: ocorrências são materializadas até 12 meses à frente de hoje. Séries sem data final avançam essa janela ao abrir o app. Se o usuário consultar um período além da janela (até o limite de 24 meses), a geração é estendida para cobrir o período consultado. Restrição única + função idempotente evitam duplicatas.
- Datas são geradas sempre a partir do dia âncora: 31/jan → 28 ou 29/fev → 31/mar; dez → jan do ano seguinte.
- Geração pula datas presentes em `recurrence_exceptions`.
- Excluir "só esta": remove a ocorrência (se não tiver baixas) e grava exceção. "Esta e futuras": define data final na regra e remove apenas futuras sem baixas e não editadas.
- Editar "só esta": altera a linha e marca `editada_individualmente`.
- Editar "esta e futuras": encerra a regra antiga na véspera, cria nova regra ligada à anterior e atualiza apenas ocorrências futuras elegíveis (sem baixas e não editadas individualmente). Ocorrências pagas, parciais ou editadas são preservadas com seus valores.

## 6. Autenticação, autorização e administração
- E-mail e senha, confirmação de e-mail, recuperação de senha, sessão persistente.
- RLS em todas as tabelas privadas: acesso só ao próprio workspace.
- Admin lê perfis, leads, assinaturas e notas comerciais; nenhuma política dá ao admin acesso a lançamentos, baixas, contatos, categorias ou recorrências de clientes.
- `user_roles`: usuários só leem o próprio papel; nenhuma política de inserção/alteração para usuários comuns.
- Funções de servidor administrativas verificam o papel no servidor antes de qualquer operação; funções do usuário usam o login dele e respeitam RLS.
- Primeiro admin: você cria a conta normalmente pela tela de cadastro e me informa apenas o e-mail; eu atribuo o papel por comando no banco. Nunca será pedida senha. Procedimento documentado no README (incluindo como adicionar/remover admins).

## 7. Leads e privacidade
- Consentimento comercial em caixa separada, nunca pré-marcada; grava data e versão do texto aceito.
- Envio por função de servidor: validação, campo-armadilha anti-bot, limite por IP/e-mail, bloqueio de duplo clique.
- Duplicados: mesmo e-mail atualiza o lead existente (contagem de envios, último envio, novo comentário) em vez de criar outro.
- Admin pode anonimizar (apaga nome, contato e comentário, mantém só dados agregados) ou excluir um lead. Política de retenção fica como pendência a definir por você.
- WhatsApp só aparece quando o número estiver configurado, e a mensagem contém apenas o que a pessoa preencheu e autorizou.

## 8. Dependências externas
Apenas Lovable Cloud. Sem Stripe, e-mail transacional, push ou WhatsApp automático.

## 9. Ordem de implementação
1. Ativar Lovable Cloud, identidade visual, logo, layout.
2. Banco: tabelas, gatilhos, funções transacionais, RLS, papéis, dados padrão no cadastro.
3. Landing, páginas legais, formulário de lead.
4. Login, cadastro, recuperação, onboarding.
5. Lançamentos, categorias, contatos, baixas.
6. Recorrência.
7. Painel, agenda, lembretes, configurações.
8. Área admin.
9. Testes, verificação no navegador, revisão de segurança.
10. README e `docs/` (mega-prompt, correções); Canvas e capturas só se produzidos, sem links quebrados.

## 10. Critérios de aceitação e testes
Testes automatizados de regras (código):
- Situação calculada (pendente, parcial, quitado, atrasado, parcial atrasado).
- Geração mensal: fim de mês (31 → fevereiro bissexto e não bissexto), virada de ano, semanal e anual.
- Exceção impede reaparecimento; regeração idempotente.
- Edição de série preserva ocorrências pagas/editadas; edição isolada não altera a série.
- Totais do painel por período sem duplicar recorrências.

Testes no banco (executados com dois usuários de teste):
- Baixa acima do saldo rejeitada; duas baixas simultâneas não ultrapassam o valor.
- Redução do valor abaixo do baixado rejeitada; exclusão de lançamento com baixas bloqueada.
- Usuário A não lê nem altera dados do usuário B.
- Usuário comum não altera o próprio papel nem chama funções administrativas.
- Admin não lê lançamentos ou baixas de clientes.

Verificação no navegador: cadastro e login, lançamento a pagar/receber, painel, baixa parcial e total, agenda, lead aparecendo no admin, assinatura manual, desktop e celular.

O resumo final separará claramente testes executados e verificações pendentes (com instruções manuais). A aplicação não será declarada pronta se houver falha de autorização ou de integridade financeira.

## 11. Riscos remanescentes
- Datas e fuso: vencimentos tratados como data sem hora; "hoje" calculado em São Paulo.
- Janela de recorrência: consultas além de 24 meses mostram apenas até o limite (informado na tela).
- Limite de envio de leads é básico (por IP/e-mail); ataques distribuídos exigiriam proteção adicional depois.
- Confirmação de e-mail depende do envio padrão do Lovable Cloud; e-mails com marca própria ficam para depois.
- Pedido de exclusão de conta é registrado para o admin processar (não apaga automaticamente).
- Política de retenção de leads e textos legais definitivos dependem de você.
- TAM/SAM/SOM no README serão estimativas com fontes públicas, identificadas como hipóteses.
- Sincronização com GitHub (`vencehoje-mvp`) é feita por você nas configurações do projeto.

## Fora do escopo
Tudo do item 22 do briefing (bancos, Pix, boletos, nota fiscal, chatbot, IA, múltiplas empresas, equipes).
