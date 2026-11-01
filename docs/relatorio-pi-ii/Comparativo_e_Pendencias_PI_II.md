# Revisão e pendências do relatório final do PI II

O relatório foi reescrito a partir do parcial, comparado à solução do PI I e confrontado com o código atual. Os arquivos de origem foram preservados. Esta revisão documental não altera o software.

## Dados atualizados

- Bruno Matteelli Neto de Oliveira — RA 2108279.
- Fabio Cordeiro de Souza — RA 23207163.
- João Pedro Thomaz Silva Oliveira — RA 23211304.
- Nathaly Carvalho Gonçalves — RA 2214013.
- Paula Melissa da Silva Leitão — RA 24207504.
- Pedro Henrique Rodrigues Oliveira — RA 24208890.
- Polos: Cajamar, Embu das Artes, Jandira, Santana de Parnaíba e São Bernardo do Campo – SP.
- Ano: 2026.

A autoria do parcial de 2025 permanece somente em sua referência bibliográfica histórica. Os autores da entrega atual são os seis integrantes informados acima. O nome da tutoria não foi transferido do parcial porque sua validade para a turma atual não foi confirmada.

## O que foi fortalecido em relação ao parcial

| Ponto do parcial | Tratamento no relatório final |
| --- | --- |
| Objetivo geral ainda concentrado em automóvel | Objetivo coerente com os três produtos e a evolução técnica |
| Alternância entre planejamento, protótipo e resultado concluído | Estado de implementação indicado em requisitos e resultados |
| Comparação pouco detalhada com a solução anterior | Quadro próprio PI I × PI II |
| Tecnologias previstas em PHP e HTML | Descrição da implementação atual: Angular/TypeScript, Node.js/Express/JavaScript e MySQL |
| Benefícios apresentados sem mensuração | Separação entre resultados técnicos e efeitos operacionais esperados |
| Alegações amplas de acessibilidade e segurança | Recursos concretos e limitações explicitados |
| Validação descrita apenas como positiva | Distinção entre registro histórico e avaliação ainda necessária da versão atual |
| Referências e citações pouco ligadas à implementação | Fundamentação apoiada em documentação primária verificada |
| Ausência de rastreabilidade técnica detalhada | Apêndice com arquivos que sustentam as afirmações |
| Documento parcial sem encerramento da entrega | Resultados consolidados, atendimento de objetivos e considerações finais |

Não foi fornecida a rubrica nem o comentário da avaliação que atribuiu nota 7. Portanto, esses pontos são achados da revisão; não representam uma explicação comprovada da nota.

## Pontos técnicos que não podem ser apresentados como concluídos

1. **Autorização por perfil.** Há JWT e cadastro de perfis, mas o middleware verifica a autenticidade do token sem aplicar uma política geral de permissão nas operações administrativas. Não afirmar que somente administradores conseguem acessar essas funções.
2. **Acessibilidade integral.** ARIA, rótulos, foco e temas foram identificados. Faltam avaliação de contraste, percurso completo com teclado e tecnologias assistivas e registro dos critérios WCAG atendidos.
3. **Migração de dados.** A V9005 remove cotações existentes. Não afirmar preservação ou conversão automática do histórico. Testar a migração em cópia de dados e planejar a preservação quando necessária.
4. **Teste com MySQL real.** Os 201 testes aprovados abrangem regras e rotas com dependências controladas. Para as capturas, um MySQL 8.4 temporário recebeu as oito migrações comuns via Flyway e os registros fictícios foram criados e consultados pela API real. Essa demonstração não substitui testes sistemáticos de transações, SQL, reversão de falhas e migração de dados existentes.
5. **Operação em produção.** Arquivos de deploy e documentação OCI existem. A disponibilidade pública e os logs de publicação não foram confirmados nesta revisão.
6. **Resultados comerciais.** Não foram disponibilizadas medições que permitam afirmar redução de custos, aumento de conversão ou ganho percentual de produtividade.
7. **Escopo comercial.** O sistema organiza solicitações; não calcula preço, não aprova crédito e não emite apólices ou cartões. Também não foi identificado um CRM completo com histórico de contatos e funil de negociação.

Esses limites foram incorporados ao relatório. Para transformá-los em resultados positivos, será necessário concluir e verificar as funcionalidades correspondentes; uma mudança apenas de redação não cria essa evidência.

## Evidência de testes

- Código: commit b3a12b3, de 31/10/2026.
- Execução em cópia temporária, com dependências do lockfile e sem acesso ao banco de produção.
- Node.js local: 18.19.1. O CI está configurado para Node.js 22.
- Comando: `npm run test:cov`.
- Resultado: **201 testes aprovados; zero falhas, cancelamentos ou testes ignorados**.
- O resumo global de cobertura inclui arquivos de teste. Por esse motivo, o percentual global não foi apresentado como cobertura do produto.
- A suíte do frontend não foi executada nesta revisão. Percentuais históricos não foram reaproveitados como resultados atuais.
- Log completo: [evidencias/testes_backend_2026-10-31.txt](evidencias/testes_backend_2026-10-31.txt).

A tentativa inicial no workspace não encontrou as dependências JavaScript instaladas. A evidência utilizada no relatório é a execução posterior bem-sucedida na cópia temporária, após instalação das dependências.

## Telas atuais do aplicativo

As capturas incorporadas ao relatório foram obtidas executando o frontend e a API do repositório, sem alterações na interface, com MySQL temporário separado dos bancos existentes. São onze capturas desktop, com 1440 pixels de largura, e 22 capturas mobile, com 390 × 844 pixels CSS e emulação de toque. Foram utilizados apenas dados fictícios criados pela API. A navegação automatizada não registrou erros JavaScript de página, e as fontes Roboto e Material Icons foram carregadas.

As imagens mostram: login, painel claro, lista de clientes, edição de cliente, lista de cotações, automóvel, residencial, cartão de crédito, lista de usuários, novo usuário e painel escuro. O menu móvel também é apresentado expandido. Os formulários extensos possuem vistas sequenciais de rolagem, organizadas lado a lado no Word. O Apêndice C relaciona cada tela mobile à figura desktop correspondente.

A origem, as rotas e as dimensões estão registradas em [evidencias/capturas_app_2026-10-31.json](evidencias/capturas_app_2026-10-31.json). O ambiente temporário de captura foi encerrado após o registro das imagens.

## Antes da entrega acadêmica

- Conferir o modelo e a rubrica atuais da disciplina. Não foram fornecidos os documentos oficiais dessa turma.
- Inserir o nome da tutoria e dados institucionais adicionais se o modelo os exigir.
- No Word, atualizar o sumário e os campos após a última revisão da paginação.
- Realizar a sessão de avaliação do Apêndice A e registrar data, participantes, tarefas, dificuldades e alterações. Atualizar a seção de avaliação com os resultados reais, caso disponíveis.
- Incluir autorização da comunidade, termos e consentimentos aplicáveis. Os documentos antigos não foram copiados automaticamente porque participantes, ano e finalidade precisam ser conferidos.
- As telas desktop e mobile do repositório já foram capturadas, incluindo seleção de produto, residencial e cartão, com dados fictícios. Refazer as capturas somente se a interface da versão entregue mudar. A configuração móvel utilizada é uma emulação de navegador, sem avaliação em aparelho físico.
- Acrescentar o link do vídeo da entrega atual, caso exigido. Não reutilizar automaticamente o vídeo do trabalho inicial.
- Verificar as referências ao parcial de 2025 como documento de origem, preservando sua autoria, e a cronologia da análise de 2026.
- Se houver correções no código, atualizar a identificação da versão, repetir os testes pertinentes e revisar as limitações do texto.

## Arquivos de trabalho

- `Relatorio_Final_PI_II_2026.docx`: versão editável.
- `Relatorio_Final_PI_II_2026.md`: conteúdo textual e referências para revisão.
- `imagens/`: diagramas e 33 capturas atuais do aplicativo do repositório, sendo onze desktop e 22 mobile.
- `evidencias/`: log técnico dos testes e registro de origem das capturas.

A entrega foi preparada somente em Word, conforme solicitado. A versão é uma minuta final para revisão do grupo; os resultados de campo e os documentos institucionais pendentes não foram inventados.
