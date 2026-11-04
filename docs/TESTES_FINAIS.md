# Testes finais P1/P2 — VenceHoje

**Atualização:** 04/11/2026. Não marcar como aprovados por inspeção de código. Esta instrução permite execução posterior com uma única conta administrativa e endereços de teste controlados. Não usar dados reais.

## P1 — Consentimento comercial

**O que foi verificado no código:**

- O checkbox do formulário de leads inicia desmarcado em `src/components/LeadForm.tsx`.
- O texto utilizado está em `src/lib/labels.ts`, versão `2026-10-v1`.
- A função `submitLead` em `src/lib/leads.functions.ts` armazena `marketing_consent` e, quando há autorização, data/versão na entidade principal do lead. Para envios repetidos, preserva o consentimento anterior do lead e cria um evento em `lead_submissions` com a nova escolha.

**Atenção:** o lead principal pode permanecer com consentimento antigo mesmo após um envio repetido sem autorização. Isso preserva auditoria, mas **não implementa por si só um processo de revogação de consentimento**. O serviço precisa de procedimento efetivo para retirar o consentimento e interromper contatos. Não interpretar envio repetido desmarcado automaticamente como revogação formal sem regra definida.

**Teste com um único administrador:**

1. Em janela anônima, abrir a landing. Enviar lead fictício com e-mail de teste A e checkbox **desmarcado**. Registrar horário. Esperado: gravação de `marketing_consent=false` na linha e envio correspondente, sem data/versão de aceite no lead novo.
2. Enviar outro lead fictício com e-mail de teste B e checkbox **marcado**. Esperado: `marketing_consent=true`, data de consentimento e versão `2026-10-v1`.
3. No painel administrativo, conferir ambos; verificar no histórico de envios o consentimento específico de cada envio.
4. Com e-mail A, reenviar marcando autorização. Confirmar que o histórico registra a nova escolha sem sobrescrever o aceite original do registro principal. Avaliar se o processo comercial interpreta corretamente o histórico.
5. Registrar capturas do estado/horário (sem expor dados pessoais), commit, responsável e data.
6. Não realizar contato comercial para leads sem base apropriada. Verificar mecanismo de revogação antes de produção.

**Status:** não executado nesta conversa após o checklist original.

## P2 — Recuperação de senha

**O que foi verificado no código:**

- `src/routes/esqueci-senha.tsx` chama `supabase.auth.resetPasswordForEmail`.
- A mensagem ao solicitante é genérica e não confirma se o e-mail existe.
- `src/routes/reset-password.tsx` permite definir senha nova a partir de sessão considerada apta ao fluxo.
- **Ponto de atenção técnico:** a tela marca `ready=true` também quando encontra qualquer sessão ativa, independentemente de confirmação de um evento `PASSWORD_RECOVERY`. Essa decisão merece revisão específica; a autorização real da troca depende do Supabase Auth. Para uso externo, testar link expirado, fluxo inválido e sessões normais.

**Teste com a mesma conta de teste:**

1. Fazer logout. Solicitar redefinição por `/esqueci-senha` com e-mail já cadastrado e depois com endereço inexistente. A interface deve responder genericamente, sem revelar existência da conta.
2. Verificar se o e-mail real chega e se o link abre `/reset-password` no domínio correto.
3. Utilizar o link legítimo para alterar a senha para outra senha de teste única e confirmar login com a nova senha.
4. Verificar resultado com link vencido/reutilizado e com acesso direto sem link.
5. Não capturar nem divulgar tokens, links de redefinição ou senhas.
6. Após os testes, usar uma senha definitiva exclusiva, preferencialmente com MFA quando disponível.

**Status:** não executado nesta conversa após o checklist original.

## Limite dos testes

P1 não exige segundo usuário autenticado; os envios podem ser realizados anonimamente. P2 pode ser feito com a própria conta existente; cuidado para não interromper o acesso administrativo.

O relatório de sucesso do build não substitui o resultado dessas operações reais.
