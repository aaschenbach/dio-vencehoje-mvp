# Mega prompt e evolução no Lovable — VenceHoje

**Data de consolidação:** 04/11/2026. **Origem:** requisitos iniciais da conversa de 29/10/2026, código atual, documentos do repositório e alterações registradas no GitHub.

> **Transparência:** o texto literal completo do prompt colado inicialmente no Lovable **não está disponível como arquivo verificável**. O conteúdo da seção seguinte é uma **reconstrução técnica fiel ao escopo conhecido**, adequada para reproduzir o projeto, e não uma transcrição literal.

## Briefing inicial recuperado

- Criar um MVP web responsivo **em português brasileiro**, chamado **VenceHoje**, para controlar contas a pagar e a receber, sem depender de planilhas.
- Público: pessoas físicas, autônomos, profissionais liberais, MEIs e pequenos negócios; uma única experiência para todos, com perfil no onboarding.
- Usar **Lovable** e **Lovable Cloud** para autenticação, banco e backend; valores em **BRL**, datas civis no fuso `America/Sao_Paulo`.
- Identidade visual proposta: azul `#12304B`, verde `#059B78`, amarelo `#F59E0B`, vermelho `#DC5A5A`, fundo `#F6F8FA`, fonte Manrope; símbolo de calendário com check.
- Telas: landing, cadastro/login, onboarding, painel, lançamentos, agenda, lembretes internos, contatos, categorias, configurações e administração de leads/assinaturas.
- Regras: baixa integral ou parcial, prevenção de baixa acima do saldo, recorrências com exceções, alterações em uma ocorrência ou futuras, dashboard consistente, isolamento entre usuários por workspace e bloqueio administrativo.
- Landing com captação de interessados e autorização comercial separada; WhatsApp optativo.
- Não fazer pagamento, boleto, integração bancária, processamento de cobrança, e-mails automáticos de lembrete, IA nem integração Stripe.
- Preço futuro ilustrativo R$ 15/mês; **sem cobrança real** no estudo.

## Mega prompt reconstruído para reprodução

```text
Construa um MVP web responsivo chamado VenceHoje, inteiramente em português brasileiro,
para pessoas físicas, autônomos, MEIs e pequenos negócios acompanharem vencimentos
de contas a pagar e receber. Utilize Lovable Cloud/Supabase para autenticação,
PostgreSQL e regras do backend. BRL e fuso de São Paulo.

Páginas:
1. Landing com proposta de valor, benefícios, explicação de uso, acesso
gratuito demonstrativo, preço futuro meramente indicativo e formulário
de interesse com checkbox separado e desmarcado por padrão para contato comercial.
2. Cadastro, confirmação de e-mail, login, recuperação de senha e onboarding
com nome, perfil de uso e nome opcional do negócio.
3. Painel com totais a pagar e receber, valores em aberto, atrasos, quitados
e próximos vencimentos; nunca confundir saldo projetado com saldo bancário.
4. Lançamentos a pagar/receber, com descrição, valor, data, categoria,
contato opcional e observações.
5. Baixas parciais/integrais, edição e remoção com trilha de histórico,
validação transacional para impedir baixa acima do saldo e proibição
de reduzir valor original abaixo do que já foi pago.
6. Regras de recorrência semanais, mensais e anuais, inclusive datas como
dia 31, ocorrências reais e exceções. Permitir editar/excluir uma ocorrência
ou esta e as futuras preservando histórico e ocorrências já baixadas.
7. Agenda mensal e lista cronológica, filtros por tipo e situação e
lembretes internos próximos do vencimento.
8. Contatos, categorias e configurações por usuário.
9. Administração exclusiva para leads, clientes, configurações comerciais,
WhatsApp e registros de assinaturas manuais, sem processamento de cobrança.

Segurança e dados:
- Criar perfil e workspace ao cadastrar usuário.
- Isolar lançamentos, baixas, contatos e categorias por workspace via RLS.
- A role admin deve ser administrada somente pelo backend autorizado.
- Administradores não devem visualizar lançamentos financeiros privados
de clientes só por terem role admin.
- Proteger funções RPC, validar no backend e manter histórico auditável.
- Não colocar chaves privadas ou service-role no navegador.
- Leads devem ter limite de requisições, validação de entrada, registro
separado de autorização comercial e processo de anonimização.

Interface:
- Layout mobile-first com linguagem objetiva.
- Paleta sugerida: #12304B, #059B78, #F59E0B, #DC5A5A, #F6F8FA.
- Fonte Manrope; marca com calendário/check; feedbacks de loading/erro/sucesso.
- Fluxos completos e funcionais, sem dados simulados nas operações reais.

Critérios de aceite:
- Usuário comum consegue registrar contas e baixas e consultar o painel.
- Total baixado nunca ultrapassa valor do lançamento.
- Recorrência no dia 31 ajusta para fevereiro e retorna ao dia 31 em março.
- Alteração de ocorrência não corrompe a série.
- Conta A não acessa dados da conta B.
- Usuário comum não acessa operações de admin.
- O app compila, passa testes automatizados e pode ser publicado pelo Lovable.
- Registrar limitações e não afirmar operação comercial ou pagamentos.
```

## Correções e evolução documentadas

| Fase | O que ocorreu | Evidência |
| --- | --- | --- |
| Geração | Telas, rotas, integração de autenticação e dados pelo Lovable | Código em `src/` no GitHub |
| Primeira validação | Preview inicialmente apresentou erros de TypeScript e problema de workspace ao registrar baixa | [PR #1](https://github.com/aaschenbach/dio-vencehoje-mvp/pull/1) |
| Correção | Substituição de UUID fictício por workspace da sessão e ajustes de tipagem/erros | [PR #1](https://github.com/aaschenbach/dio-vencehoje-mvp/pull/1) |
| Automação | Pipeline TypeScript, Vitest e build | [Workflow](../.github/workflows/validate.yml) |
| Testes funcionais | 21/21 cenários nas rodadas 1–2, conforme relato do responsável | [Validação](VALIDACAO.md) |
| Testes admin | Provisionamento da conta admin e testes A4–A7, conforme relato | [Encerramento](ENCERRAMENTO_MVP.md) |
| Documentação | README, arquitetura, validação, negócio e checklists | [PR #2](https://github.com/aaschenbach/dio-vencehoje-mvp/pull/2) e [PR #3](https://github.com/aaschenbach/dio-vencehoje-mvp/pull/3) |
| Encerramento educacional | BMC visual e documentação específica da entrega DIO | Este conjunto de arquivos |

## O que ficou manual, demonstrativo ou fora do MVP

Assinaturas são registros administrativos manuais e não geram cobranças. WhatsApp é um link opcional e não um envio automático. Lembretes são internos e não notificações por e-mail/push. Integrações bancárias, emissão fiscal, pagamento automático, multiempresa/equipe e IA ficaram de fora. Textos legais servem como material demonstrativo de estudo, não como documentos de um serviço lançado comercialmente.

## O que não pode ser afirmado sem evidência adicional

- Texto **literal** do primeiro prompt e histórico completo dos prompts intermediários.
- URL de produção publicada e acesso independente fora do editor.
- Capturas autênticas do aplicativo ao vivo.
- Validação com uma segunda conta comum no ambiente final, após o bloqueio de assinatura informado.
