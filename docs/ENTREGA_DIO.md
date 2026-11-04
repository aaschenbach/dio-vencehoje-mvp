# Entrega do desafio DIO — VenceHoje

**Data:** 04/11/2026  
**Finalidade:** projeto de estudo; não há planos de lançamento comercial neste exercício.

## Conferência dos entregáveis

| Entregável | Resultado | Evidência |
| --- | --- | --- |
| MVP de contas a pagar/receber | Implementado e testado internamente | [Testes](VALIDACAO.md) |
| Login, painel, recorrências, baixas e administração | Implementados e testados conforme relato | [Arquitetura](ARQUITETURA.md) |
| Repositório GitHub | Existe; **ainda privado** na última consulta de metadados | [Repositório](https://github.com/aaschenbach/dio-vencehoje-mvp) |
| README da DIO | Documentado no repositório | [README](../README.md) |
| Business Model Canvas em imagem vetorial | Criado como SVG editável | [Canvas](BMC_VENCEHOJE.svg) |
| TAM, SAM, SOM e tese | Documentados como **hipóteses** | [Negócio](NEGOCIO.md) |
| Mega prompt e alterações | Escopo reconstruído, **não transcrição literal** | [Mega prompt](MEGA_PROMPT_E_EVOLUCAO.md) |
| Partes manuais/fora do MVP | Documentadas | [Mega prompt](MEGA_PROMPT_E_EVOLUCAO.md) |
| Screenshots reais do aplicativo | **Não capturados**; dependem de acesso visual autenticado | Orientações abaixo |
| Pré-visualização do aplicativo | **URL informada:** [abrir VenceHoje](https://id-preview--571e03e9-a4eb-42c9-99cc-707359e4d369.lovable.app); acesso anônimo não verificado | Link fornecido pelo responsável |
| Link da aplicação publicada | **Informado como publicado:** [vencehoje.lovable.app](https://vencehoje.lovable.app); acesso externo não confirmado automaticamente | Endereço fornecido pelo responsável |

## Evidências visuais a capturar no Lovable

Não usar montagens ou prints inventados como prova de funcionamento.

1. Landing page, destacando proposta de valor e formulário de interesse, sem dados pessoais.
2. Painel com dados **fictícios** representando contas a pagar e receber.
3. Tela de lançamentos com uma baixa parcial e uma quitação.
4. Agenda com duas ou mais ocorrências recorrentes.
5. Administração de leads/assinaturas manuais, com nomes e e-mails fictícios.

Salvar imagens em `docs/screenshots/` com nomes como `01-landing.png`, `02-painel.png`, `03-lancamentos.png`, `04-agenda.png`, `05-admin.png`. Adicionar links no README **apenas depois dos arquivos estarem realmente presentes**.

## Endereço publicado e pré-visualização

**Publicado pelo Lovable (informado pelo responsável):** [https://vencehoje.lovable.app](https://vencehoje.lovable.app). O teste automático de acesso externo não pôde confirmar a resposta do site; recomenda-se validar a abertura em janela anônima.

### Pré-visualização de desenvolvimento

[Visualizar o VenceHoje](https://id-preview--571e03e9-a4eb-42c9-99cc-707359e4d369.lovable.app) — URL com prefixo `id-preview--`, fornecida pelo responsável, ainda não comprovada como endereço público definitivo. Testar acesso deslogado antes de apresentá-la como URL publicada.

## Publicação para fins de entrega

1. No editor Lovable, abrir o projeto VenceHoje e usar a opção **Publish**.
2. Selecionar o endereço público oferecido pelo Lovable e confirmar publicação.
3. Abrir a URL em uma janela anônima, verificando landing, links e eventual necessidade de login nas áreas privadas.
4. O endereço publicado já foi incluído no README; confirmar que a URL `vencehoje.lovable.app` abre em janela anônima. Não confundir com o editor `lovable.dev/projects/...`.
5. No GitHub, em **Settings → General → Danger Zone → Change repository visibility**, selecionar **Public** e confirmar, **após conferir segredos e dados privados no repositório e histórico**.
6. Acessar o GitHub deslogado e confirmar que o README, o Canvas e o código estão visíveis. Revogar/rotacionar qualquer credencial que tenha sido exposta anteriormente.
7. Preencher o formulário de entrega da DIO com a URL da aplicação e do GitHub.

**Nota:** publicar o aplicativo torna uma superfície de autenticação e armazenamento acessível pela Internet. Mesmo em exercício de estudo, não usar dados financeiros reais nem expor segredos.

## Instruções de acompanhamento

O repositório contém documentação do estudo; minutas legais e checklists de conformidade são **exercícios técnicos**, não aprovações para negócio real.

A URL oficial de publicação foi informada e documentada. A entrega ainda depende de confirmar acesso público, visibilidade do GitHub e capturas autênticas.
