# Validação do MVP — VenceHoje

**Data dos relatos:** 04/11/2026. **Regra de evidência:** distinguir observações do responsável pelos testes, resultados do CI e inspeção de código. Marcar “aprovado” não equivale a laudo de auditoria independente.

## Verificações técnicas executadas

A execução GitHub Actions [#41818613406](https://github.com/aaschenbach/dio-vencehoje-mvp/actions/runs/41818613406) terminou com sucesso, de acordo com a consulta dos jobs feita em 04/11/2026:

| Etapa | Resultado informado pela execução |
| --- | --- |
| Instalação com Bun | Aprovado |
| `bunx tsc --noEmit` | Aprovado |
| `bun run test` | Aprovado |
| `bun run build` | Aprovado |

O pipeline não valida por si só as regras RLS no ambiente remoto, a experiência mobile, nem conformidade legal. O Lovable relatou 24 testes de regras aprovados e testes SQL de integridade e autorização, mas seus relatórios detalhados e evidências não foram anexados ao repositório nesta revisão.

## Rodada funcional 1 — relato do usuário (8/8)

| Código | Cenário | Resultado |
| --- | --- | --- |
| B1 | Criar conta e confirmar e-mail | Aprovado |
| B2 | Entrar e sair | Aprovado |
| B3 | Criar conta a pagar | Aprovado |
| B4 | Criar conta a receber | Aprovado |
| B5 | Registrar baixa parcial | Aprovado |
| B6 | Quitar saldo restante | Aprovado |
| B7 | Verificar valores do painel | Aprovado |
| B8 | Criar recorrência | Aprovado |

## Rodada funcional 2 — relato do usuário (13/13)

| Código | Cenário | Resultado |
| --- | --- | --- |
| F1 | Rejeitar baixa acima do saldo | Aprovado |
| F2 | Corrigir baixa; verificar saldo e histórico | Aprovado |
| F3 | Excluir baixa; restaurar saldo e registrar histórico | Aprovado |
| F4 | Impedir reduzir valor abaixo do já baixado | Aprovado |
| F5 | Impedir exclusão direta de conta com baixas | Aprovado |
| R1 | Recorrência no dia 31, fevereiro e março | Aprovado |
| R2 | Editar ocorrência isolada sem afetar demais | Aprovado |
| R3 | Editar série preservando anteriores e baixadas | Aprovado |
| R4 | Excluir ocorrência; ela não reaparece | Aprovado |
| R5 | Excluir futuras; anteriores permanecem | Aprovado |
| A1 | Formulário de lead e registro administrativo | Aprovado |
| A2 | Bloqueio de rota `/admin` para usuário comum | Aprovado |
| A3 | Interface no celular ou emulação mobile | Aprovado |

## Rodada 3 — relato do usuário

| Código | Cenário | Resultado |
| --- | --- | --- |
| S1 | Separação de lançamentos/contatos/categorias entre contas | Aprovado |
| S2 | Admin sem acesso a dados financeiros privados | Aprovado (conforme relato) |
| S3 | Rotas privadas exigem login após logout | Aprovado |
| S4 | Operações administrativas bloqueadas via API para usuário comum | Aprovado (conforme relato; método de teste não anexado) |
| A4 | Criar/editar assinatura manual sem cobrança | Pendente |
| A5 | Alterar situação de lead e adicionar observação | Pendente |
| A6 | Anonimizar lead fictício | Pendente |
| A7 | Configurar link de WhatsApp comercial | Pendente |
| P1 | Consentimento comercial explicitamente autorizado | Pendente |
| P2 | Recuperação de senha sem exposição de dados | Pendente (fluxo de confirmação de e-mail já testado na rodada 1) |
| P3 | Inspeção de segredos no repositório/frontend | Aprovado conforme relato; repetir varredura na publicação |
| P4 | README/documentação e links | Falhou na rodada, correção documental proposta em PR; exige nova verificação após merge |
| P5 | Política de Privacidade e Termos definitivos | Falhou; continuam provisórios |

**Totais:** 21/21 cenários funcionais das rodadas 1–2 aprovados; na rodada 3, 5 aprovados, 6 pendentes e 2 falharam, conforme relato. Isso **não** significa que o MVP passou em auditoria final.

## Verificações adicionais exigidas antes da publicação

- Testar diretamente API e banco autenticados com dois usuários independentes, registrando requisições e resultados, para todas as operações críticas de RLS.
- Confirmar no ambiente Lovable Cloud as políticas, `SECURITY DEFINER`/permissões, limites de função e gatilhos de baixas.
- Executar A4–A7, P1–P3 e verificar a documentação após merge.
- Substituir textos legais provisórios; definir retenção de leads e atendimento aos titulares.
- Testar com valores fictícios, inclusive concorrência de baixas, exceções de recorrências e acesso negado.
- Revalidar GitHub Actions no commit de `main` que será publicado.
- Registrar data, executor, ambiente, versão/commit, evidência e resultado de cada teste de liberação.

## Registro de incidentes e correções

Em 04/11/2026 foram identificados erros de TypeScript impedindo o preview e um identificador de workspace fictício ao registrar baixas. As correções foram produzidas no PR [#1](https://github.com/aaschenbach/dio-vencehoje-mvp/pull/1), e o usuário confirmou posteriormente que a pré-visualização abriu e as operações básicas funcionaram.

**Importante:** não usar dados financeiros reais enquanto a liberação e a revisão de privacidade não estiverem concluídas.
