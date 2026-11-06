# DIRETRIZES PERPETUAS DE ENGENHARIA, LOGS E REGRAS RIGIDAS ROOT - JUSGOVBR
Projeto: JusGovBR - Copia Inteligente & PJe Turbo (Manifest V3 - Chromium 116+)
Autor / Contato: smarca@gmail.com
Finalidade: Fonte unica da verdade (Single Source of Truth) para diretrizes arquiteturais, logs, regras rigidamente root imutaveis e especificacao integral de testes e fuzzing.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md`
> - **Finalidade Primária:** Referência consolidada e salvaguarda histórica contendo a compilação completa das diretrizes perpétuas de engenharia.
> - **Papel na Governança e Inteligência da IA:** Arquivo de auditoria e contingência contra fragmentação de regras.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Todas as 16 diretrizes de engenharia e os princípios de governança deliberativa.

Documento Complementar: [BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md](BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md) (Especificacao de Engenharia dos modulos e estado do sistema).

---

## 1. DIRETRIZES ROOT DE ENGENHARIA DE CODIGO

1. Deliberacao Previa Obrigatoria: Jamais gerar codigo sem comando expresso; sugerir preliminarmente e na ordem exata:
   (a) Eventuais Correcoes
   (b) Mudancas de Boas Praticas
   (c) Novas Features
2. Preservacao Documental Absoluta: E terminantemente proibido apagar, resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario explica exaustivamente o *porque* (regras de negocio, falhas do framework alvo PJe/RichFaces/Angular, otimizacoes V8/Blink, isolamento Shadow DOM/Top Layer e protecoes de Regex Unicode) e nao apenas o *o que*.
3. Intra-Comentarios de Reconstrucao (Passos X.Y Intercalados): O fluxo de dados ("Passos") deve estar obrigatoriamente intercalado dentro do corpo de cada metodo e funcao, permitindo recriar 100% do sistema do zero caso o codigo deixasse de existir.
4. Codificação Padrão UTF-8 Nativa Direta e Proibição Estrita de Entidades HTML:
   - Todos os arquivos do projeto (.html, .js, .css, .json, .md) devem utilizar estritamente a codificação UTF-8 sem BOM.
   - É obrigatório o uso direto de acentos e caracteres do Português do Brasil (ç, ã, õ, é, í, ó, ú, â, ê, ô, à, etc.) diretamente no código-fonte, templates HTML, estilos e documentação.
   - É TERMINANTEMENTE PROIBIDO o uso de entidades HTML (como &ccedil;, &otilde;, &eacute;, &aacute;, etc.) no código-fonte, nos arquivos HTML ou em strings injetadas em interface visual. Entidades HTML devem ser extirpadas do código, sendo admitidas exclusivamente dentro de máscaras regex ou em rotinas de higienização de HTML bruto quando estritamente indispensável.
   - Arquivos HTML devem declarar explicitamente <meta charset="UTF-8"> e <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> logo no início de <head>. Arquivos CSS devem iniciar com @charset "UTF-8";.
5. Integridade Funcional e Copia Silenciosa:
   - Base de 6 estagios mantida integralmente; proibido remover suporte a Ctrl/Alt/Shift.
   - Jamais exibir popups ou baloes de "Copiado!" em copias validas comuns.
   - O aviso flutuante e restrito a 3 hipoteses: (1) Alerta Ambar de erro matematico/calendario (CPF, CNPJ, CNJ ou Data invalidos); (2) Estatisticas do Modo Acumulador / Tabelas (Ctrl + Alt); (3) Mini-Tip global temporario ao alternar modo via Duplo Esc ou F1.
6. Sincronizacao Obrigatoria de Blue Print e SandBox: Central de Ajuda, [options.html](../src/cfg/options.html), area de testes interativos e bateria automatizada em [debug.js](../src/cfg/debug.js) permanentemente sincronizados. Consultar [BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md](BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md) para detalhamento dos modulos.
7. Fluxo Autonomo na IDE: Gravacao direta em disco sem exigir intervencao de "Accept All" do usuario e sem forcar a abertura de abas no editor.
8. Backup Padronizado Obrigatorio (Politica Inteligente de Cadencia Operacional):
   - Destino estrito: bkp/ (relativo a raiz do projeto).
   - Nomenclatura: bkp_AAAA-MM-DD_HH-MM.zip
   - Conteudo: Todos os arquivos e subdiretorios da raiz (incluindo arquivos e pastas iniciados por `.`, como `.vscode` e `.gitignore`), aplicando apenas os filtros de exclusao:
     (a) Exclui a propria pasta `bkp`;
     (b) Exclui o repositorio interno `.git`;
     (c) Exclui arquivos e pastas iniciados por `leia-me` (case-insensitive);
     (d) Exclui a pasta `tmp` (arquivos temporarios nao sujeitos a backup);
     (e) Exclui a pasta `outros` (pasta auxiliar fora do backup).
   - Limpeza Automatica no Backup: Ao executar `util/fazer_backup.ps1`, todos os arquivos temporarios em `tmp/` sao limpos automaticamente antes de gerar o pacote.
   - Settings Global da IDE: Toda modificacao do `settings.json` global (pasta User da IDE) deve ser copiada imediatamente para `.vscode/settings.json.global`; `util/fazer_backup.ps1` repete essa copia automaticamente a cada backup.
   - Portabilidade entre Computadores: todas as preferencias (IDE, Git e projeto) devem funcionar ao abrir a pasta em outro computador. Preferencias de nivel de maquina (config global do Git com sincronizacao preferindo arquivos locais via `merge=ours`/`.gitattributes`, sem editor externo, variaveis de ambiente do usuario e `settings.json` global da IDE) sao restauradas por `util/configurar_ambiente.ps1` (ou `.bat`), executado uma vez em cada PC novo (idempotente). Toda nova preferencia de maquina deve ser incluida nesse script. Nunca gravar caminhos absolutos especificos da maquina em `.vscode/settings.json` sem alternativas (fallbacks).
   - Scripts Essenciais em `util/`: Todos os scripts essenciais de apoio (`executar_auditoria.ps1`, `executar_testes.html`, `verificar_codificacao.ps1`, `backup.bat`, `fazer_backup.bat`, `fazer_backup.ps1`, diff e patch) residem exclusivamente dentro da pasta `util/`. É terminantemente proibido criar arquivos `.bat`, `.ps1`, `.cmd` ou scripts utilitários na raiz do projeto (como `backup.bat` na raiz). Qualquer utilitário ou comando operacional novo deve ser alocado obrigatoriamente em `util/`, mantendo a raiz do repositório estritamente limpa. A antiga pasta `testes/` foi extinta.
   - Regra de Criacao de Arquivos Temporarios/Lixo: Qualquer arquivo temporario, log de saida de teste (como `chrome_output.txt`), rascunho de diagnostico ou arquivo diff intermediario deve ser criado exclusivamente dentro de `tmp/`.
   - Gatilhos de Execucao (Media de ~5 backups/dia em trabalho intenso):
     (a) Inicio do dia de trabalho / primeira sessao;
     (b) Periodico a cada 3 horas de trabalho ativo continuo;
     (c) Virada de data ("rodar o dia" apos 00:00 meia-noite);
     (d) Imediatamente antes de alteracoes estruturais, mudancas radicais ou grandes refatoracoes;
     (e) Apos compilacoes ou baterias de testes aprovadas com alto volume de modificacoes;
     (f) Sob demanda, sempre que solicitado pelo usuario no prompt ("backup", "fazer backup").
   - Scripts oficiais relativos: util/fazer_backup.ps1 e util/fazer_backup.bat.
9. Particionamento Modular Estrito (mod-copia, mod-pje, mod-mouse, mod-navegador e Modulos Futuros):
   - Modulo 1: Copia Inteligente & Forense (src/mod-copia/): Motor de 6 estagios e ciclo circular de 5 degraus (ida e volta), regra "espaco = 2 cliques", regra da virgula, acumulador (;), auditoria matematica de documentos/calendarios, atalho F1 Gemini e Colagem Rapida via Botao Direito (1 clique: normal formatado; 2 cliques rapidos: texto puro; autorizacao nativa PJe/jus.br; link utilitario X-Mouse Button Control).
   - Modulo 2: Acelerador PJe Turbo (src/mod-pje/): CSS Anti-Ampulhetas injetado precocemente em document_start e conversao automatica de cabecalhos nativos PJe ("Num. ... - Pag. ...").
   - Modulo 3: MOUSE (Navegacao por Botoes Laterais): Captura dos botoes 4 e 5 do mouse para navegacao circular entre abas (Botao 4: esquerda/anterior; Botao 5: direita/proxima).
   - Modulo 4: NAVEGADOR (Gerenciamento de Guias e Janelas): Single Window (bloqueio de novas janelas/popups forcando abas na janela principal), controle de segundo plano (padrao) vs primeiro plano, anti-duplicacao e reutilizacao de abas (URL original e atual) e ordenacao automatica de guias por URL, dominio ou titulo (A-Z ou Z-A).
   - Modulos Futuros: O ecossistema em src/ e concebido de forma desacoplada para suportar a integracao de novos modulos tematicos (ex: mod-eproc, mod-projudi, mod-assinador) com isolamento total de responsabilidade.
10. Centralização de Documentos Instrutivos em docs/, Soberania do Berço Documental e Replicação Unidirecional para a Raiz:
   - **Princípio da Soberania Documental em docs/ (Single Source of Truth para Markdown):**
     * Todos os arquivos do tipo `.md` que instruem o projeto e sua governança são rigorosamente gerados, editados e mantidos primeiramente dentro da pasta `docs/` (ex.: `docs/README.md`, `docs/01_DIRETRIZES_E_REGRAS_ROOT.md`, `docs/BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md`, `docs/AGENTS.md`). Qualquer arquivo `.md` em `docs/` é carregado e considerado soberano no contexto.
     * **Geração Inicial em docs/ com Replicação Posterior para a Raiz:** Quando um arquivo Markdown precisar residir fora da pasta `docs/` (como o `README.md` na raiz do repositório para exibição pública na página do GitHub), a lógica de geração é estritamente unidirecional de dentro para fora: o arquivo é **gerado e atualizado primeiramente dentro de `docs/` (`docs/README.md`) e em seguida replicado/sincronizado para a raiz (`README.md`)**.
     * **Salvaguarda Contra Exclusão Acidental:** Esta inversão de fluxo garante que, se por qualquer razão arquivos fora de `docs/` forem excluídos, sobrescritos ou corrompidos acidentalmente na raiz, a fonte primária e todo o patrimônio intelectual em `docs/` permaneçam 100% íntegros e possam ser imediatamente restaurados e replicados.
   - Todos os arquivos temporários de trabalho, testes ou intermediários devem estar estritamente contidos na pasta `tmp/`, a qual não é sujeita a backup. A pasta `outros/`, se existente, também permanece estritamente fora do backup.
11. Diretiva Arquitetural Fundamental de Engenharia de Software: Modularidade, Coesão, Baixo Acoplamento e Independência Funcional:
   - **Encapsulamento Orientado a Objetos por Módulo e Arquivo:** Todo arquivo `.js` e todo módulo do sistema deve obrigatoriamente encapsular suas variáveis, estado interno e métodos por meio de Orientação a Objetos (classes, closures blindadas ou namespaces estritos), sendo terminantemente vedado expor variáveis globais soltas no escopo da janela (`window`).
   - **Tolerância a Falhas e Desativação Modular (Guardas Pré-Chamada):** Se um arquivo ou módulo necessitar de funções ou serviços de outro módulo/arquivo externo por qualquer razão, é **estritamente obrigatório testar a existência prévia do método/serviço antes de sua invocação** (ex.: `typeof moduloX?.metodoY === 'function'`). O código jamais pode sofrer interrupção ("crash" ou "abort") por `TypeError: ... is not a function` ou `ReferenceError` caso um módulo externo venha a ser desativado, falhe ao carregar ou seja modularmente desligado nas opções.
   - **Casamento de Alta Coesão e Baixo Acoplamento:** Cada módulo deve possuir independência funcional estrita, operando de modo autônomo, robusto e previsível, mantendo suas responsabilidades delimitadas ao seu domínio primário.
12. Idempotência Universal no Código de Produção (com Exceção Especial para Baterias de Auditoria, Testes e Fuzzing):
   - **Idempotência Obrigatória em Produção:** Todo o código-fonte de produção (injeção de scripts, inicialização de módulos, observers, manipuladores de eventos, formatação e aplicação de efeitos visuais) deve ser estritamente idempotente. Invocar uma função, inicializar um componente ou processar um mesmo evento múltiplas vezes consecutivas deve produzir exatamente o mesmo resultado estável e seguro, sem duplicar listeners, sem empilhar nós no DOM e sem causar efeitos colaterais indesejados (`f(f(x)) === f(x)`).
   - **Exceção Estrita para Geradores de Dados de Testes, Auditoria e Fuzzing:** A única exceção admitida à regra de idempotência reside nas baterias de auto-testes, testes de regressão e motores de fuzzing (como `debug.js` e suítes de teste). Nestes contextos específicos, os geradores de carga de teste devem deliberadamente variar seus dados para atingir os objetivos de validação ampla, mesclando:
     (a) Testes Randômicos (geração estocástica/pseudoaleatória de strings mutadas, caracteres de borda e sequências truncadas para estresse de robustez);
     (b) Testes Pré-definidos (conjuntos fixos de regressão forense com casos canônicos de sucesso e insucesso);
     (c) Testes Obrigatórios de Conformidade (auditorias determinísticas de validação matemática de CPF, CNPJ, CNJ e calendário gregoriano).
13. Padrão Visual Obrigatório para Listagem e Implementação de Ações (Formato Canônico em Tabela Markdown Compacta):
   - **Formato Estrito de Resposta:** Todas as respostas da IA devem adotar obrigatoriamente a apresentação estruturada em tabelas com tipografia compacta perfeitamente integrada ao corpo do texto e seções claramente delimitadas:
      - Tabela `📋 Quadro de Pendências Priorizadas` (com 5 colunas canônicas ultra-otimizadas: `# | ID / Seção | Tipo | P | Descrição da Pendência`):
        * **Quantidade Estrita de Linhas e Ordenação Topológica:** Exibir sempre **10 casos** (se existirem no backlog/radar), organizados rigorosamente pela seguinte ordem estrutural:
          1. **Início da Lista (Topo Prioritário):** Itens marcados com o modificador de urgência `!` ("Assim que possível", "Urgente", "Pra agora");
          2. **Corpo Intermediário:** Itens normais numerados sequencialmente (`1`, `2`, `3`...), ordenados pela taxonomia de prioridade (`↑`, `↗`, `→`, `↘`, `↓`);
          3. **Final da Lista (Últimos 2 Slots):** Os itens mais antigos do histórico do projeto ocupam compulsoriamente as duas últimas posições (posições 9 e 10), identificados com os símbolos `#2` e `#1`, sendo `#1` o mais antigo absoluto do histórico e `#2` o segundo mais antigo (caso já não estejam exibidos nas posições anteriores);
        * **Coluna `#` e Tooltips para IDs Não-Padrão:** Numeração sequencial alinhada ao centro. Quando o identificador for não padrão (`#1`, `#2` para itens mais antigos ou `!` para itens urgentes), é obrigatório incluir tooltip descritivo nativo via `<span title="...">` (ex: `<span title="Item mais antigo #1 (Histórico Inicial)">#1</span>`, `<span title="Urgente / Assim que possível">!</span>`);
        * **Coluna `ID / Seção`:** Texto puro sem link de arquivo (para evitar quebra ou ícones M+ poluindo a visão), formatado com `<nobr>` / `white-space:nowrap` para caber estritamente em uma única linha e ajustar sua largura automaticamente;
        * **Coluna `Tipo`:** Dividido em duas linhas via `<br>` sem barra `/` (ex: `Correção<br>Expansão`, `Feature<br>Máscaras`), ajustando sua largura de forma estreita e compacta;
        * **Coluna `P` (Prioridade em 5 Níveis com Setas de 1 Caractere e Tooltips):** Cabeçalho minimalista de 1 letra (`P`). Adota a taxonomia de 5 níveis técnicos:
          - **Alta:** `↑` (seta vertical para cima);
          - **Média alta:** `↗` (seta diagonal inclinada para cima);
          - **Média:** `→` (seta horizontal para a direita);
          - **Média baixa:** `↘` (seta diagonal inclinada para baixo);
          - **Baixa:** `↓` (seta vertical para baixo).
          - **Prioridade Ajustada Manualmente:** Se a prioridade foi ajustada ou definida manualmente pelo usuário, formatar a setinha obrigatoriamente com sublinhado (`<u>`), ex: `<u>↑</u>`, `<u>↗</u>`, `<u>→</u>`, `<u>↘</u>`, `<u>↓</u>`;
          - **Modificador de Urgência (`!`):** Se o usuário marcar qualquer item como "Urgente", "pra agora", "no mínimo tempo possível" ou "assim que possível", o item sobe para o início da lista e recebe o prefixo `<span title="Urgente / Assim que possível">!</span>` imediatamente ao lado esquerdo da setinha;
          - **Tooltip Nativo Compulsório:** Cada indicador de prioridade e de urgência deve conter tooltip ao passar o mouse via `<span title="...">...</span>`;
        * **Coluna `Descrição da Pendência`:** Detalhamento técnico da tarefa, aproveitando a largura otimizada pelas colunas anteriores;
        * **Coluna `Próximo Passo` e Supressão de Legendas Textuais:** A coluna "Próximo Passo" é dispensada por padrão. É **terminantemente proibido incluir blocos de texto ou notas de legenda de prioridades** antes ou depois da tabela, pois os tooltips (`title="..."`) já explicam todos os símbolos de forma elegante e contextual ao passar o mouse;
      - Tabela `❓ Perguntas e Confirmações Pendentes de Resposta` (com colunas `# | ID / Seção | Pergunta / Pedido de Confirmação em Aberto | Link para Diálogo Original`), exibindo chamadas de decisão não respondidas com link nativo navegável (`conversation://<conversation-id>`). **Regra de Omissão Absoluta:** Se NÃO houver perguntas ou confirmações pendentes de resposta, esta seção/tabela DEVE SER TOTALMENTE OMITIDA das respostas (NÃO MOSTRAR NADA, eliminando ruído visual);
      - Tabela `✅ Ações Implementadas (v<versao>)` (com colunas `Item / Arquivo | Tipo de Ação | Detalhamento da Solução`):
        * **Exibição da Versão Atual do Addon:** O cabeçalho desta seção deve compulsoriamente estampar a versão oficial atual da extensão (ex.: `### Ações Implementadas (v261106.4.15)`);
        * **Foco em Alterações Reais de Código:** Focada estritamente nas alterações reais de arquivos e código. Metadados operacionais de rotina (como commits no repositório Git e hashes) continuam sendo executados nos bastidores de forma rigorosa, mas **NÃO precisam ser informados na tabela**, reduzindo ruído e economizando tokens;
      - **Extinção Total do Bloco "Procedimento para Recarregar no Chrome":** É expressamente proibido anexar a seção repetitiva com instruções de recarregar em `chrome://extensions` e `Ctrl+F5` ao final das respostas da IA. O desenvolvedor já conhece o procedimento de recarga, sendo desnecessário poluir o diálogo com instruções operacionais redundantes;
      - Tópicos objetivos e hierárquicos detalhando as decisões de engenharia, sem prolixidade e com links clicáveis para os arquivos.
   - **Padronização Visual:** Esse formato visual é obrigatório para fechamento de turnos, relatórios parciais, propostas de planejamento e entregas de código, maximizando a legibilidade humana, a densidade de informação e a rastreabilidade da conversa.
14. Continuidade de Comentários Exaustivos e Paridade Bidirecional Código-Documentação (Economia de Tokens & Reconstrução do Zero):
   - **Obrigatoriedade de Comentários Exaustivos de Reconstrução:** Todo o código-fonte deve manter continuidade inegociável de comentários detalhados e exaustivos (tanto no cabeçalho inicial de cada arquivo quanto no corpo de cada classe, método e função). A densidade e precisão dos comentários devem ser suficientes para permitir que qualquer engenheiro ou IA recrie 100% do código do zero apenas lendo os comentários, sem qualquer perda de regra de negócio, otimização de motor ou detalhe operacional.
   - **Economia Estratégica de Tokens de IA:** A presença de comentários técnicos claros, autossuficientes e hierárquicos economiza maciçamente tokens em futuras manutenções, pois a IA e os desenvolvedores compreendem o propósito e as restrições de cada trecho em uma única leitura linear, eliminando a necessidade de reprocessar dependências externas ou inferir lógicas complexas por tentativa e erro.
   - **Centralização em .md com Réplica e Enriquecimento no Código:**
     - A documentação mestra é rigorosamente centralizada nos arquivos Markdown em docs/ (DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md, BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md, etc.), cada qual com seu nível de abstração.
     - Tudo o que estiver especificado nos arquivos .md deve ter sua devida réplica correspondente refletida no código-fonte.
     - Os arquivos de código conterão nível de detalhamento ainda maior que os documentos .md: cada arquivo de código terá em seus comentários iniciais o resumo executivo de sua responsabilidade e o link para a seção correspondente do documento .md, e cada função/método detalhará as regras de negócio aplicadas, casos de borda e comportamentos vinculados à funcionalidade descrita na documentação.
15. Estrutura Canônica de Empacotamento para Distribuição no Chrome (manifest.json + src/):
   - **Escopo Estrito de Distribuição:** O pacote final de distribuição do addon para a Chrome Web Store / carregamento descompactado no Chromium é composto EXCLUSIVAMENTE pelo arquivo manifest.json (na raiz do repositório) e pela pasta src/ (com seus arquivos e subdiretórios de código de produção).
   - **Isolamento de Pastas de Suporte e Governança:** Todas as pastas auxiliares (docs/, util/, kp/, 	mp/, .vscode/, README.md) existem estritamente para governança, testes, documentação e automação local do desenvolvedor/IA, sendo terminantemente proibido colocar código de execução de produção fora de src/ ou referenciar arquivos externos a src/ dentro do manifest.json.
   - **Organização Impecável em src/:** Todo e qualquer arquivo pertencente ao runtime da extensão deve estar estritamente contido em seu subdiretório de domínio dentro de src/ (src/cfg/, src/mod-copia/, src/mod-pje/, src/icones/, etc.), sem dispersão de arquivos soltos ou lixo de compilação.


---

## 2. REGRAS RIGIDAS ROOT, PRIORITARIAS ROOT E IMUTAVEIS DE NEGOCIO

> [!IMPORTANT]
> AVISO DE SALVAGUARDA ABSOLUTA: As regras desta secao sao REGRAS ROOT, PRIORITARIAS ROOT E IMUTAVEIS.
> Elas definem o cerne filosofico, matematico e operacional inegociavel do ecossistema JusGovBR.
> E terminantemente proibido flexibilizar, alterar, contornar, atalhar, subordinar ou remover qualquer uma dessas regras sob pretexto de refatoracao ou sob a justificativa de pedidos pontuais da interface.
> ESTAS REGRAS SO PODEM SER MODIFICADAS COM ORDEM EXPLICITA E CONFIRMACAO INEQUIVOCA DO USUARIO!

### 2.1 Tipo Base de Selecao (Unidade Atomica O(1))
- Ao clicar em texto comum com 1 clique unico, o motor isola a Unidade Atomica Base (micro: palavra simples ou token pontuado contiguo).
- A tabela tipada Uint8Array(128) classifica instantaneamente caracteres ASCII em tempo O(1) (~2ns por caractere), delimitando inicio e fim sem sobrecarregar a engine de expressoes regulares desnecessariamente.

### 2.2 Prefixos e Rotulos de Selecao (PALAVRA_ROTULO_INICIAL e Conectores)
- Regra de Captura Antecipada: Quando o usuario da 1 clique direto sobre uma palavra que atua como rotulo/prefixo designador ("id", "fls.", "pag.", "art.", "Lei", "no", "cpf", "cnpj", "processo", "sumula", "portaria", etc.):
  - O motor NAO seleciona apenas a palavra do rotulo.
  - O motor engloba e captura imediatamente o IDENTIFICADOR SUBSEQUENTE!
  - Exemplo: 1 clique sobre "id" em "id 2297820154" seleciona e copia "id 2297820154"; 1 clique em "art." em "art. 5o, LXXVIII" captura a referencia legal.
- Excecao Estrita de Negocio: As palavras "inciso", "alinea" e "paragrafo" NAO sao rotulos capturadores; 1 clique direto sobre elas seleciona apenas a palavra em si.
- Conectores de Intervalo ("a", "ate", "as", "c/c"): 1 clique direto sobre o conector expande automaticamente a expressao conectada (ex: clicar no conector "a" em "01/01/2026 a 31/12/2026" captura o intervalo completo de datas).

### 2.3 Regra Inegociavel da Virgula (,) e Ponto e Virgula (;)
- A virgula `,` e o ponto-e-virgula `;` atuam estritamente como fronteiras intermediarias de clausula e JAMAIS colam na palavra clicada.
- Exemplo: Clicar sobre a palavra em "Brasilia," ou "processo;" seleciona e copia estritamente "Brasilia" ou "processo", ignorando a pontuacao externa.

### 2.4 A Grande Regra Root: "Espaco" = Dois Cliques
- Clicar sobre o espaco em branco interno entre duas palavras ou blocos de uma expressao composta equivale funcionalmente a dar DOIS CLIQUES na expressao!
- O motor forca a expansao de compostos (forcarCompostos = true), ativando imediatamente:
  - Multiplos Numeros Espacados / Boletos ("215 7014 6992 8831"): 1 clique em um numero isolado captura o numero; 1 clique no espaco interno OU 2 cliques seleciona a cadeia inteira de 16 digitos!
  - Valores com Extenso ("R$ 65,00 (sessenta e cinco reais)"): 1 clique em 65,00 seleciona 65,00; 1 clique no espaco entre 65,00 e "(" OU 2 cliques seleciona a expressao completa com extenso!
  - Numeros com Extenso ("65 (sessenta e cinco)"): 1 clique em 65 seleciona 65; 1 clique no espaco antes de "(" OU 2 cliques seleciona "65 (sessenta e cinco)"!
  - Moeda ("R$ 65,00"): 1 clique em 65,00 pega 65,00; 1 clique no espaco entre "R$" e 65,00 OU 2 cliques pega "R$ 65,00"!
  - Delimitadores Simetricos ("( algo )"): 1 clique no espaco colado a borda pega o miolo "algo"; 2 cliques pega o bloco incluindo os delimitadores "( algo )"!
  - Sequencia em Caixa Alta ("REGULAR PROSSEGUIMENTO DO FEITO"): 1 clique no espaco interno OU 2 cliques seleciona todo o conjunto contiguo de palavras em maiusculas (inclusive com quebras suaves <br>)!
  - Sequencia Formatada em Destaque (negrito, italico, sublinhado, mark): 1 clique no espaco interno OU 2 cliques seleciona o bloco continuo com a mesma formatacao!
  - Conectivo de Dois-Pontos e Sentença Completa ("Atenção: confira o processo antes de prosseguir."): 1 clique sobre o espaço em branco imediatamente posterior aos dois-pontos `:` (ex.: espaço entre `:` e `confira`) atua como conectivo sintático entre a chamada anterior e a proposição seguinte, selecionando imediatamente a sentença/proposição inteira!


### 2.5 O Switch de Ida e Volta: Expansao, Minoracao e Ciclo Circular Continuo
O motor opera um ciclo deterministico de transicao dinamica de estados baseado no principio de zoom concentrico circular:

```
        +-------------------------------------------------------------+
        |                                                             |
        v                                                             |
  [MINIMO ATOMICO] ---> [COMPOSTOS / DESTAQUES] ---> [FRASE]          | (Ciclo
         ^                               |              |             |  Circular
         |                               v              v             |  Continuo)
         +--------------------- [PARAGRAFO] <--- [MAXIMO CONTEXTUAL] -+
```

1. Movimento de Expansao Progressiva (Do Minimo ao Maximo):
   - Se a selecao esta minimizada (ou inexistente), acoes e cliques subsequentes vao promovendo a selecao sucessivamente para degraus mais amplos:
     - Degrau 1 (Minimo): 1 clique na palavra isolada -> Unidade Atomica Base O(1).
     - Degrau 2 (Composto / Bloco): 1 clique no espaco ou 2 cliques -> Expressao Composta, Citacao de Lei, Sequencia em Caixa Alta, Bloco Formatado ou Delimitadores Simetricos.
     - Degrau 3 (Clausula / Frase): Frase delimitada por pontuacao forte.
     - Degrau 4 (Paragrafo Localizado): Paragrafo circunscrito sem transbordamento para paragrafos vizinhos.
     - Degrau 5 (Maximo): Bloco Ancestral Contextual (container do bloco).

2. Movimento de Minoracao / Reducao Progressiva (Do Maximo ao Minimo):
   - Se a selecao ja esta maximizada (ou se o usuario clica com intencao redutora):
     - Degrau 5 para 4: Reduz do container para o Paragrafo Localizado em questao.
     - Degrau 4 para 3/2: Reduz do paragrafo para a Frase ou Expressao Composta relevante.
     - Degrau 2 para 1: Reduz da expressao composta para a sub-parte pontuada ou palavra isolada.
     - Degrau 1: Retorna a Unidade Atomica Minima.

3. Dinamica do Ciclo Circular Continuo:
   - Se ja minimizado, novas interacoes expandem a selecao circularmente rumo ao topo.
   - Se ja maximizado, novas interacoes diminuem a selecao circularmente ate a base atomica.
   - Ao atingir o minimo, o ciclo recomeca expandindo; ao atingir o maximo, o ciclo recomeca diminuindo.
   - O usuario jamais fica bloqueado nem no teto nem na base: a navegacao contextual e fluida e ciclica.

4. Minoracao Estrita de 3 Cliques (e.detail >= 3):
   - Em blocos compostos pontuados ("12.016/2009", "136/2025", "10/01/2026", "11.222.333/0001-81"): 3 cliques opera a TENDENCIA A MINORAR imediata, capturando a sub-parte clicada ("12.016" antes da barra ou "2009" apos a barra).
   - No inicio do paragrafo ("3. Ordenar..."): 3 cliques delimita com precisao cirurgica o paragrafo localizado, sem transbordar para paragrafos anteriores ou posteriores.

### 2.6 Filtro Shift com Zero-Padding CNJ (Shift + Clique)
- Em entidades pontuadas (CPF, CNPJ Classico, Novo CNPJ Alfanumerico, Processo CNJ, SEI!, CEP, Data, Telefone):
  - Shift + Clique extrai exclusivamente os caracteres alfanumericos puros, eliminando pontos, tracos, barras e parenteses.
  - No Processo CNJ, aplica preenchimento automatico com zeros a esquerda (padStart(7, '0')) no sequencial de 7 digitos ("0991234-65.2024.4.01.4002" -> "09912346520244014002").
- Em texto comum: O 1o Shift + Clique define a ancora colapsada e o 2o Shift + Clique seleciona e copia o intervalo exato entre os dois pontos.

### 2.7 Modo Elastico (Ctrl Isolado ou Alt Isolado) e Links Nativos
- Ctrl (isolado em texto comum): Permite expandir ou encolher a selecao atual clicando ou arrastando por palavras/blocos inteiros.
- Ctrl + Clique sobre Link (<a href>): Preserva integralmente o padrao nativo do navegador, permitindo abrir o link em nova aba em segundo plano sem qualquer interferencia ou bloqueio da extensao.
- Alt (isolado): Inicia sempre uma nova selecao sobre objetos interativos (botoes, links, menus, abas), selecionando o texto todo do objeto com 1 clique unico ou permitindo Alt + Arrastar sobre partes do elemento.
- Alt + Shift + Clique sobre link: Forca download ou abertura direta.
- Ctrl + Duplo Clique ou Alt + Duplo Clique sobre linha de tabela (<tr>): Copia todas as celulas visiveis separadas por "|".

### 2.8 Modo Acumulador Completo (Ctrl + Alt)
- Concatenacao Padronizada: Concatena selecoes sucessivas separadas pelo caractere configurado e encerradas obrigatoriamente por ele no final ("item1;item2;item3;").
- Absorcao Previa Automatica: Se ja havia uma selecao ativa na tela antes de acionar Ctrl + Alt, ela e absorvida imediatamente como o 1o item da fila.
- Ordenacao Crescente Natural no DOM (Ctrl + Alt sem Shift): Posiciona o novo item na ordem cronologica/estrutural progressiva do documento HTML, antes de eventuais itens desordenados inseridos via Shift.
- Modo Baralho (Ctrl + Alt + Shift): Insere o novo item estritamente no final da fila de acumulacao.
- Toggle-Off e Proibicao de Duplicatas: Clicar novamente sobre um item ja acumulado desmarca-o, remove-o da lista e apaga o destaque visual nativo (::highlight(jusgov-acumulador)).
- Desfazer Ultima Carta (Ctrl + Alt + Clique Direito): Remove o ultimo item adicionado a pilha historica, independentemente de sua posicao no DOM.
- Aviso Flutuante de Estatisticas: Exibe estritamente metricas operacionais ("ACUMULADOR: X intervalos | Y palavras | Z caracteres"), jamais expondo o texto acumulado.
- Validacao do Separador: Maximo de 5 caracteres; proibicao absoluta de letras e numeros (somente simbolos e pontuacoes); se vazio ou invalido, reverte automaticamente para o padrao ";".

### 2.9 Regra Rigida de Tempo Zero (0 = Desativado, >0 = Ativo)
- Se o tempo configurado for igual a 0, o recurso esta rigorosamente DESATIVADO.
- Se for maior que 0 (ex: 250ms, 3500ms), esta ATIVO.
- Aplica-se a:
  - tempoAvisoMs: Tempo de exibicao dos alertas visuais (0 = desativado).
  - tempoFlashBorderMs: Contorno visual rapido ao copiar (0 = desativado).

### 2.10 DIRETRIZ ROOT IMUTAVEL: PRESERVACAO ABSOLUTA DA NAVEGACAO E INTERACAO NATIVA EM INTERFACES WEB (SEM MODIFICADORES)
- O ecossistema JusGovBR tem como diretriz root inegociavel JAMAIS atrapalhar, atrasar, interceptar ou bloquear a navegacao comum e a manipulacao nativa do usuario em interfaces web (sites, sistemas em nuvem, web apps como Google Gemini, Gmail, PJe, etc.).
- A copia automatica em 1 clique (e demais interacoes padrao sem teclas modificadoras) atua estritamente em **conteudo estatico de leitura segura** (artigos, sentencas, decisoes, despachos, peticoes, visualizadores de PDF e textos comuns exibidos ou selecionaveis pelo navegador).
- Em qualquer **elemento de interface interativa do navegador ou da aplicacao web** (botoes, dropdowns, seletores de modelos como "Flash v", icones de microfone/audio, menus, abas, links, caixas de selecao, controles customizados de frameworks como Wiz, Angular, Lit, Web Components com Shadow DOM):
  - Cliques comuns (1 clique, duplo clique, com ou sem pequeno arrasto, sem modificadores) passam 100% livres, diretos e nativos para a pagina web.
  - Zero `e.preventDefault()`, zero `e.stopPropagation()`, zero `ignorarProximoClick = true`, zero modificacao da selecao do DOM (`window.getSelection()`), zero copia espuria.
  - Preservacao Soberana do Arrasto de Selecao: Se nativamente, sem o addon, o usuario conseguiria selecionar um texto (seja no Google Gemini, em paginas web, conteudos mistos ou interfaces ricas), o texto selecionado por arrasto de mouse DEVE ser integralmente preservado e copiado pelo addon. Jamais deve haver remocao forcada da selecao nativa do usuario ('removeAllRanges') quando houver texto efetivamente selecionado. Cliques e pequenos desvios sem selecao de texto continuam passando 100% livres aos controles nativos da pagina.
- **Papel Soberano das Teclas Modificadoras (`Alt`, `Ctrl`, `Shift`, `Ctrl+Alt`)**:
  - As teclas modificadoras sao o gatilho exclusivo de intencao deliberada do usuario de manipular o addon / copiar texto sobre qualquer elemento.
  - Somente com modificador mantido (ex: `Alt + Clique` em botao/link) o addon sobrepoe a acao padrao para selecionar e copiar o rotulo do controle.
  - Cliques comuns (1, duplo, triplo clique), sem teclas modificadoras, com ou sem arrasto continuam selecionando e copiando palavras/blocos com total agilidade exclusivamente em textos comuns de leitura e arquivos PDF.

### 2.11 Atalho F1 para Prompt de IA / Assistente (Painel Lateral ou Nova Aba)
- Tratamento Generico de IA: O recurso e apresentado genericamente como "Prompt de IA" / "Assistente de IA", compativel com qualquer assistente de inteligencia artificial.
- Motor de Alta Performance e Painel Lateral: Nos bastidores, o addon mantem a integracao com o Painel Lateral nativo e com a aba web do assistente.
- Modelo de Prompt com Fonte Condensada Tahoma: Na Central de Opcoes, a caixa do modelo generico de prompt utiliza fonte condensada da familia Tahoma e alinhamento a esquerda para alta legibilidade e densidade textual.
- Bloqueia o evento nativo window.addEventListener('help') e F1 padrao do navegador no Windows.
- Gravacao no Clipboard e Painel Lateral Nativo do Navegador:
  - Como o Painel Lateral nativo do navegador e uma interface interna isolada pelo sandbox de seguranca contra injecoes de scripts externos, o motor formata o prompt completo e o grava imediatamente na Area de Transferencia (clipboard).
  - Exibe um Mini-Tip de confirmacao na tela: "Prompt de IA copiado! Cole com Ctrl+V no painel lateral ou utilize a aba aberta".
  - O usuario pode simplesmente pressionar Ctrl+V dentro do campo de prompt ("Digite / para usar as habilidades") do Painel Lateral ja aberto na tela.
  - Simultaneamente, o Service Worker localiza ou abre a aba web dedicada do assistente e preenche automaticamente o campo de texto via chrome.scripting.executeScript apos a conclusao do carregamento.

### 2.12 Atalho Duplo Esc (com debounce de 60ms a 420ms) e Desselecao Universal Profunda
- 1 Esc isolado: Executa a Desselecao Universal Profunda e Nativa:
  - Invoca as funcoes nativas do Blink/V8: window.getSelection().empty(), window.getSelection().removeAllRanges(), collapseToStart() e a instrucao nativa document.execCommand('unselect').
  - Reseta elementos de formulario: document.activeElement.setSelectionRange(0, 0), activeElement.blur() e varre todos os <input> e <textarea> ativos com selecao residual.
  - Varre recursivamente toda a arvore de iframes e frames acessiveis, window.parent, window.top, window.frames e shadowRoots no DOM.
  - Propaga a ordem de desselecao via Service Worker (broadcastDeselecionarGeral) para todas as janelas e frames isolados da mesma aba (cross-origin iframes).
  - Limpa o acumulador (;), ancoras de cursor, bordas luminosas (flash border) e alertas visuais sem jamais alterar o conteudo atual do clipboard.
- 2 Escs sequenciais rapidos (entre 60ms e 420ms): Alterna instantaneamente o interruptor "Remover Formatacoes (Somente Texto)":
  - Se "Remover Formatacoes" estiver ativado (modo Texto Puro): o 2o Esc desativa o switch e ativa a copia formatada no nivel de estilos previamente escolhido no slider (Niveis 1 a 4).
  - Se "Remover Formatacoes" estiver desativado (modo Formato Ativo): o 2o Esc ativa o switch e reverte a copia imediatamente para Somente Texto Puro (Nivel 0).
  - Projeta Mini-Tip global temporario no topo da pagina informando o modo ativo e preserva rigorosamente a posicao do slider de estilos.

### 2.13 Arquitetura Progressiva de Filtros HTML em 5 Niveis e Regra de Ouro
1. Dinamica do Switch e do Slider de Estilos:
   - O controle "Remover Formatacoes (Somente Texto)" e o interruptor principal (switch). Quando ativado (checked), a copia atua exclusivamente em Texto Puro (Nivel 0 com extracao node.textContent).
   - O botao que corre (slider) "Nivel de Filtro de Estilos" possui 4 posicoes (1: Basico, 2: Intermediario, 3: Avancado, 4: Estendido). O slider NAO possui a posicao "0 - Texto Puro", pois Texto Puro e a funcao desempenhada pelo switch "Remover Formatacoes".
   - Quando "Remover Formatacoes" estiver selecionado (checked), o slider de estilos e automaticamente desativado (disabled e com opacidade reduzida), preservando intacto o nivel previamente configurado pelo usuario.
   - Quando "Remover Formatacoes" for desmarcado (unchecked) ou alternado via Esc+Esc, o slider e reativado imediatamente e a copia passa a usar o nivel de estilo ativo.
   - A intencao de negocio e permitir alternar instantaneamente entre Texto Puro e o nivel de estilos preferido sem perder a configuracao do slider.
2. Regra de Ouro da Implementacao:
   - Direcao Unidirecional Ascendente: Cada nivel herda rigorosamente as regras do nivel anterior e adiciona sua camada de permissao (allowlist). Tipografia de origem (font-family e font-size) e sujeiras MSO/Word sao sempre eliminadas.
   - Sanitizacao Ativa no Nivel 0: O nivel inicial extrai o conteudo exclusivamente via no de texto DOM (node.textContent), evitando injecao de tags orfas ou caracteres invisiveis.
3. Pipeline Estruturado em 3 Estagios de Filtragem:
   - Filtro 1 (Dados): Higienizacao inicial de caracteres incorretos, lixo de PDF, zero-width (\u200B-\u200D, \uFEFF, \u2060), soft-hyphens (\u00AD), caracteres de controle estranhos (< 32 exceto \r, \n, \t) e normalizacao de espacos nao-quebraveis (\u00A0, &nbsp;) para espaco comum ' '.
   - Filtro 2 (Estruturas de Documento): Conversao semantica de estilos nos niveis corretos (Niveis 1 a 4) ou extracao de Texto Puro estruturado (Nivel 0 ou Regra de Ouro), convertendo quebras <br>/<hr> e elementos de bloco (<p>, <div>, <li>, <tr>, <h1>-<h6>, etc.) em quebras de linha reais (\n).
   - Filtro 3 (Informacoes e Normalizacao Tipografica): Processamento de conteudo executado estritamente apos os estilos:
     - Preservacao estrita de novas linhas reais (\n) entre linhas de conteudo util.
     - Supressao total de linhas em branco vazias (seja geradas por paragrafos vazios, tags <br> repetidas ou espacos).
     - Remocao de espacos/tabs nas bordas inicial e final de cada linha (trim por linha).
     - Reducao de espacos horizontais duplicados indefinidamente no interior da linha para um unico espaco, corrigindo tabulacoes manuais incorretas.
3. Tabela Sintetica dos 5 Niveis Progressivos de Filtragem:

| Nivel | Denominacao | Escopo Semantico & Sanitizacao | Alvo / Destino |
|:---:|:---|:---|:---|
| **0** | **Texto Puro** | Remove 100% das tags HTML/XML, converte entidades (`&nbsp;` -> espaco, `&amp;` -> `&`, `&lt;` -> `<`, `&gt;` -> `>`), normaliza quebras de linha (`\r\n` -> `\n`). Sanitizacao ativa extraindo o conteudo exclusivamente via no de texto DOM (`node.textContent`) para evitar injecao de tags orfas ou caracteres invisiveis. | `input`, `textarea`, logs, variaveis de busca, campos de sistema legados sem suporte a markup. |
| **1** | **Basico (Inline)** | Apenas formatacao de caracteres: `b`, `strong`, `i`, `em`, `u`, `s`, `sub`, `sup`, `span`, `br`. Proibido qualquer atributo CSS de bloco ou quebras estruturais. | Caixas de comentario simples, notas rapidas de processo, chats institucionais e campos restritos. |
| **2** | **Intermediario (Paragrafo/Fluxo)** | Permite Nivel 1 + `p`, `blockquote`, `ul`, `ol`, `li`, `hr`. CSS restrito a alinhamento (`text-align: left\|right\|center\|justify`) e recuo simples (`margin-left`, `text-indent`). Sem tabelas ou quebras de layout complexas. | Editores de texto web padrao (CKEditor / TinyMCE basicos), despachos simples, certidoes. |
| **3** | **Avancado (Documental / RTF classico)** | Permite Nivel 2 + titulos (`h1`-`h6`), blocos pre-formatados (`pre`, `code`), tabelas estruturadas (`table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`). CSS inline restrito a bordas basicas, preenchimento (`padding`) e larguras de coluna (`width`). | Editores RTF completos, relatorios formatados, minutas de sentenca com tabelas de calculo e jurisprudencias. |
| **4** | **Estendido (Suites Office / Canvas)** | Permite Nivel 3 + imagens (`img`), atributos de celula (`colspan`, `rowspan`), metadados de quebra de pagina/secao, listas multinivel aninhadas e containers controlados (`div`). Mantem compatibilidade com schemas complexos sem executar scripts. | Suites de escritorio em nuvem (Google Docs, LibreOffice Online, Microsoft 365), sistemas de diagramacao e exportacao para DOCX/ODT. |

3. Regra de Ouro da Formatacao (Bloco Forense ou Palavra Unica = Somente Texto Puro):
   - Mesmo quando a manutencao de formatacao estiver ativa (em qualquer dos niveis 1 a 4), caso o usuario clique sobre um "bloco forense/estruturado" (CNPJ, CPF, CNJ, Data isolada, Data+Hora, Moeda, Telefone, Boletos, etc.) ou sobre uma "palavra unica isolada", a gravacao na area de transferencia DEVE ser estritamente SOMENTE TEXTO PURO (text/plain).
   - Frases compostas, paragrafos, sequencias maiusculas, tabelas e arrastos manuais cumprem normalmente a formatacao do nivel de estilo ativo.

### 2.14 Acelerador PJe Turbo (Anti-Ampulhetas)
- Injetado em document_start nos dominios do PJe (*pje*.jus.br).
- Neutraliza cortinas de bloqueio JSF/RichFaces (modalDiv, waitPopup) e Angular/PrimeNG (p-blockui, ui-blockui): pointer-events: none !important; opacity: 0 !important; contain: strict !important; content-visibility: hidden !important;.
- Destrava cursores wait e progress para default !important e zera tempos de transicao.

### 2.15 Otimizacoes Estruturais para o Motor Chrome V8 / Blink
- Tabela O(1) de Classificacao Instantanea: Uint8Array(128) pre-computada para consulta de classes de caracteres em ~2ns sem chamadas a engine Irregexp.
- Janela Deslizante Dobrada: Horizonte fixo de +-1.000 caracteres (~2.000 caracteres no total) ao redor do cursor.
- Desacoplamento de Sliced Strings no V8 Heap: Uso obrigatorio de ((' ' + str).slice(1)) antes de reter textos no acumulador, evitando vazamento de memoria de buffers pais de grande porte.
- Zero Layout Thrashing: Leituras geometricas (getBoundingClientRect) executadas estritamente ANTES de qualquer escrita no DOM.

### 2.16 Regra Cirurgica de Data Numerica com Horario Contiguo e Conectores ("18/09/2026 10:03:34" e "28/10/2026 - 06:28:50")
- Em datas numericas contiguas a horarios com separadores intermediarios (espaco unico " ", hifen "-", tracos en/em-dash, "as", virgula):
  - 1 clique sobre a data numerica: seleciona estritamente a data isolada ("18/09/2026").
  - 1 clique sobre o horario: seleciona estritamente o horario isolado ("10:03:34").
  - 1 clique sobre o espaco intermediario ou separador ("-", espacos ou conector): seleciona Data + Horario por inteiro ("18/09/2026 10:03:34").
  - 2 cliques em qualquer ponto da expressao (ou clique no espaco interno via "Espaco = 2 Cliques"): forca a captura composta imediata ("18/09/2026 10:03:34").
  - Precedencia Forense Rigorosa: O catalogo de padroes juridicos e avaliado prioritariamente antes de qualquer fallback generico (como MULTIPLOS_NUMEROS_ESPACADOS), impedindo truncamentos indevidos (ex: "18/09/2026 10").
  - Blindagem de Timezone: Reconhece estritamente siglas de fuso oficiais ("BRT", "BRST", "UTC", "GMT") evitando falso englobamento de palavras em portugues (ex: "nos", "em", "de").
  - Ja datas abreviadas ("17 ago. 2026"), por extenso ("29 de fevereiro de 2025") e competencias Mes/Ano ("out. 26") sao sempre selecionadas inteiras imediatamente no 1o clique.

### 2.17 DIRETRIZ ROOT: DIFERENCIACAO E COMPORTAMENTO ESTRITO ENTRE TELAS DE TEXTO/LEITURA E TELAS DE SISTEMA/INTERFACE/CONTROLES
- **Dicotomia Soberana de Ambientes:**
  - **Telas/Areas de Texto e Leitura Comum:** (documentos judiciais, peticoes, despachos, sentencas, acordaos, artigos, paginas de conteudo informativo e visualizadores de PDF):
    - O motor de selecao opera de forma ampla e confortavel: 1 clique seleciona e copia palavras/entidades atomicas; 2 cliques expandem frases ou delimitadores simetricos; arrasto seleciona e mantem texto selecionado; `Alt + Ctrl` atua como Modo Acumulador.
  - **Telas/Areas de Sistema, Interface e Controles (Modais, Dialogos, Dropdowns, Menus e Formularios):**
    - Exemplos tipicos: Modais popup (ex: "Tipo - Modelo de Documento"), menus de contexto suspensos (ex: "Encaminhar para assinatura..."), seletores e listas de opcoes (ex: "Sentenca Tipo D"), barras de ferramentas, botoes, inputs e abas.
    - **Regra de Ouro da Interface:** **JAMAIS FORCAR OU MANTER SELECAO VISUAL** (evitando poluir a tela com fundos azuis residuais em botoes, menus ou caixas de dialogo). O unico feedback de sucesso permitido e o **Contorno Visual Rapido ao Copiar (Flash Temporizado Verde)**.
- **Regras Operacionais Estritas para Telas de Sistema / Interface:**
  1. **1 Clique simples sem teclas modificadoras:**
     - Palavra avulsa comum: **Nao faz nada** (nem seleciona, nem copia; preserva totalmente a interacao e navegacao nativa da pagina/sistema).
     - Mascara util ou Bloco Estruturado (ex: data completa "17/09/2026 13:28:25", processo CNJ, CPF, CNPJ): **Copia para a Area de Transferencia** e exibe estritamente o **contorno verde temporizado (flash)**, **SEM selecionar o texto e SEM manter selecao ativa na tela**.
  2. **2 Cliques (duplo clique):**
     - Seleciona a palavra normalmente para o usuario que desejar intencionalmente a selecao nativa no elemento.
  3. **Arrasto de Mouse (Drag to Select):**
     - O usuario pode arrastar o mouse para capturar um trecho especifico.
     - Ao soltar o mouse (`mouseup`): copia o texto arrastado, dispara o contorno verde (flash) e **remove imediatamente a selecao da tela (`window.getSelection().removeAllRanges()`)**, garantindo que a tela de sistema permaneca limpa sem retangulos azuis residuais.
     - Ao segurar `Alt + Arrastar` sobre links, menus ou botoes: **JAMAIS selecionar o elemento inteiro**. O arrasto deve permitir selecionar estritamente os caracteres percorridos pelo cursor.
  4. **Alt + Clique Unico (sem arrasto):**
     - Copia o texto completo do controle, menu, botao ou item de lista (ex: "Sentenca Tipo D").
     - Dispara o contorno verde temporizado (flash) ao redor do elemento.
     - **Nao cria selecao visual** (ou desseleciona se criada).
     - Bloqueia a acao padrao (`preventDefault()`, `stopPropagation()`) para que o clique com Alt copie o texto sem navegar para links nem acionar submissoes de formularios.
  5. **Modo Acumulador (`Alt + Ctrl`):**
     - **Estritamente desabilitado** em qualquer tipo de controle, formulario ou elemento de interface (inputs, caixas, botoes, menus, modais).
     - Reservado com exclusividade para textos comuns de leitura.

---

## 3. SISTEMA DE LOGS E PRIORIDADES DO CONSOLE

### 3.1 Escala Hierarquica de Severidade
- TRACE (Nivel 10): Rastreamento detalhado de fluxo interno e micro-passos.
- DEBUG (Nivel 20): Diagnostico de desenvolvimento, inspecao de selecoes e ranges.
- INFO (Nivel 30): Mensagens operacionais informativas (copias formatadas, switches de modo).
- WARN (Nivel 40): Alertas nao bloqueantes, inconsistencias menores, fallbacks acionados.
- ERROR (Nivel 50): Falhas de execucao, excecoes capturadas, erros em chamadas de API.
- FATAL (Nivel 60): Rejeicoes criticas de promises nao tratadas, corrupcao irrecuperavel.

### 3.2 Regra de Exibicao em Producao
- No painel visual de Opcoes (options.html), apenas mensagens com prioridade >= WARN (WARN, ERROR, FATAL) sao gravadas e exibidas.
- Mensagens do tipo "[INFO] Texto formatado copiado! HTML: ..." sao tratadas como INFO e nao poluem o console visual.
- Nivel configuravel para testes e IDE via window.JusGovConfigurarNivelLog(nivel) ou window.__JUSGOV_LOG_LEVEL__.

### 3.3 Formato Estrito da Linha de Log
```text
DD/MM/AAAA HH:MM:SS.S [prio] mensagem
```
Exemplo:
```text
28/10/2026 08:34:31.2 [error] Falha de teste simulada no addon
```

---

## 4. REQUISITOS DA SUITE DE TESTES E FUZZING (debug.js)

Consultar [BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md](BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md) para a integracao com a arquitetura dos modulos.

### 4.1 Bateria de Testes Blueprint Deterministicos (125 Testes)
1. CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS: UUID v4 e Chave PIX.
2. CHAVES_FISCAIS_E_BOLETOS_ESPACADOS: Chave NF-e (11 blocos de 4) e Boleto FEBRABAN.
3. DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO: PIS/PASEP, CPF, CNPJ Classico e Alfanumerico, RG, CEP, OAB, Passaporte.
4. NUMERACOES_ID_E_PUBLICAS: Processo SEI!, Processo CNJ, Placas veiculares, Protocolo/Ano ("136/2025").
5. DATA_COM_HORARIO_CONTIGUO: Datas por extenso com horario, datas abreviadas, competencias mes/ano, data numerica com horario espacado ("DD/MM/AAAA HH:MM" e "DD/MM/AAAA HH:MM:SS") e conector hifen. Valida rigorosamente calendario e horas. Permite selecao de data com ponto final de sentenca ("Itabuna, 01.05.19.").
6. INTERVALOS_E_REFERENCIAS_ID_FOLHAS: Intervalos de datas, horarios, moedas, folhas/IDs do PJe ("fls. 123/130", "id 2297820154 pg 1"), numeros com extenso.
7. LEGISLACAO_JURISPRUDENCIA_E_ATOS: Dispositivos legais complexos, Instrucoes Normativas com orgaos compostos ("PRES/INSS no 128/2022"), Sumula Vinculante 13 do STF e atos com prefixo no.
8. COORDENADAS_GPS_E_PLUS_CODES: Graus Minutos Segundos (DMS), Graus Decimais (DD), UTM SIRGAS e Google Plus Codes.
9. EMAILS_E_PERFIS_SOCIAIS: E-mails RFC 5322 e perfis sociais iniciados por @.
10. TELEFONES_NACIONAIS_E_INTERNACIONAIS: Fixos com DDD, celulares 9 digitos, 0800, DDI internacional e blindagem contra sequencias numericas puras.
11. FINANCEIRO_E_DECIMAIS: Moedas com extenso, moedas simples e percentuais decimais.
12. DATAS_E_HORARIOS: Datas numericas pontuadas e horarios isolados.
13. GENERICOS_E_FALLBACKS: Resolucoes de tela e blocos pontuados de boletos.
14. REGRAS_COMPLEMENTARES: Tempo zero, anti-arrasto de UI, atalho F1 Gemini, atalho duplo Esc e duplo clique em espaco.
15. FORMATACAO_E_FILTROS_HTML: 5 niveis progressivos de higienizacao (Texto Puro, Basico Inline, Intermediario Fluxo, Avancado RTF e Estendido Office) e Regra de Ouro (bloco estruturado ou palavra unica copia estritamente somente texto puro).
16. DATA_E_HORA_AVANCADA: Data com horario contiguo e espacado em formatos "DD/MM/AAAA HH:MM" e "DD/MM/AAAA HH:MM:SS", conectores com hifen, clique no espaco intermediario e testes de auditoria de inconsistencia de horas/minutos/segundos e calendario bissexto.
17. SUPRESSAO_LINHAS_BRANCAS_E_ESPACOS_MULTILINHA: Preservacao estrita de novas linhas reais entre linhas de conteudo util, com supressao de linhas em branco vazias e colapso de espacos horizontais repetidos.
18. PRESERVACAO_NAVEGACAO_E_SEM_REDIRECIONAMENTO: Neutralizacao absoluta de navegacao indevida da aba durante a execucao da suite de testes e do fuzzing.
19. VARREDURA_CLIQUES_HTMLS_ADDON: Varredura automatizada nos 5 limites (inicio, -1 antes, fim, +1 depois, meio randomico) em todas as palavras de popup.html e options.html, ampliacao (2 cliques), desampliacao (3 cliques), expansao/retracao com Control e comprovacao da Regra de Ouro em modos formatado e texto puro.

### 4.2 Fuzzing Randomico por Tempo (1s/T por Categoria)
- Disponivel via funcao window.JusGovExecutarFuzzing(duracaoMsPorTipo) e botao "Fuzzing (1s/T)" na interface de Opcoes.
- Executa lacos temporais continuos gerando centenas de milhares de entidades randomicas para cada categoria:
  - Fuzzing de CPF (Modulo 11)
  - Fuzzing de CNPJ Tradicional
  - Fuzzing de Novo CNPJ Alfanumerico (ASCII - 48)
  - Fuzzing de Processo CNJ (Modulo 97 BigInt)
  - Fuzzing de Datas e Calendario Bissexto
  - Fuzzing de Posicoes de Cursor e Cliques em Fronteiras (-3 a len+3)

### 4.3 Ambiente de Desenvolvimento e IDE Silenciosa (Auto-Apply sem Abas Espurias)
- O ambiente do Antigravity IDE esta configurado com `antigravity.autoOpenFiles: false`, `antigravity.autoAcceptOnChat: true` e `chat.editing.autoAcceptDelay: 1`.
- Mudancas de codigo geradas pelo agente devem ser aplicadas de forma automatica e direta nos arquivos, sem provocar a abertura automatica de abas de revisao de diff ou editores na tela do usuario.

---

## 5. DIRETRIZES DE INTERFACE DO USUARIO (UI/UX FORENSE)

### 5.1 Proibicao Estrita de Jargoes Tecnicos de Desenvolvimento
- As interfaces visuais voltadas ao usuario (`options.html` e `popup.html`) destinam-se a operadores do direito (juizes, assessores, advogados e servidores).
- E expressamente proibido exibir jargoes de engenharia de software ou desenvolvimento interno, tais como `injecao precoce`, `document_start`, `Motor JS`, `Estilos CSS`, nomes de scripts `.js`/`.css` ou caminhos internos como `src/mod-pje/` e `src/mod-copia/`. Toda a comunicacao deve ser estritamente funcional e focada nos beneficios de produtividade forense.

### 5.2 Apontamento Informativo de Criterios Matematicos
- Nas mensagens de alerta flutuante de digitacao e na Central de Ajuda, manter exclusivamente a indicacao do criterio matematico objetivo (`Modulo 11` para CPF/CNPJ/NB-INSS, `Modulo 97` para CNJ, `Ano bissexto / dias validos` para datas), permitindo que o usuario compreenda a causa da inconsistencia sem sobrecarga tecnica.

### 5.2.1 Sistema Contextual Wiki Forense (Cartoes Verdes Informativos)
- Quando documentos forenses validos forem copiados, o motor visual projeta cartao informativo verde (`#f0fdf4`, borda `#22c55e`, texto `#166534`), sem destacar a selecao em amarelo:
  * **INSS (NB):** Valida digito verificador pelo Modulo 11 (pesos 2 a 9 da direita para a esquerda nos 9 primeiros digitos) tanto no formato pontuado `719.657.155-0` (`NNN.NNN.NNN-N` de 10 digitos) quanto no acoplado `31/6506589241`. Identifica a especie no Catalogo Oficial de 90+ especies (ex: `31 - Auxilio por Incapacidade Temporaria (RGPS - Contributivo - Ativo)`). Na mascara `31/6506589241`, 1 clique em `31` ou `/` seleciona o bloco integral; 1 clique no numero do beneficio seleciona somente ele (`6506589241`); 2 cliques selecionam o bloco integral. No formato pontuado `719.657.155-0`, 1 clique seleciona o bloco integral e exibe card Wiki com o Modulo 11 validado.
  * **CNJ (Processo Judicial):** Valida Modulo 97 (BigInt) e decodifica a estrutura `J.TR` identificando o ramo da justica (Federal, Trabalho, Estadual, etc.) e o tribunal/regiao correspondente (ex: `Justica Federal - TRF da 1ª Regiao`).
  * **CPF:** Valida Modulo 11 e decodifica a Regiao Fiscal da Receita Federal a partir do 9º digito (ex: `3ª Regiao Fiscal da RFB (CE, MA, PI)`).
  * **CNPJ:** Valida Modulo 11, identifica se e Matriz (`0001`) ou Filial e, no caso de filial, calcula e exibe deterministicamente o CNPJ da Matriz correspondente.

### 5.3 Padronizacao de Processos Judiciais Exemplo
- Todos os numeros de processo judicial de demonstracao na interface visual, no sandbox e nos testes devem obrigatoriamente iniciar com prefixo `099` e tribunal `.4.01.4002` (ou `.4.01.4000` na tabela comparativa), garantindo coerencia e clareza pedagogica.

### 5.4 Preservacao de Navegacao Nativa em Hiperlinks (`Ctrl + Clique`)
- Ao clicar segurando `Ctrl` sobre links nativos (`<a>`), o navegador preserva a abertura do hiperlink em segundo plano ou aciona o fluxo padrao sem ser interceptado pelo manipulador de selecao forense, garantindo compatibilidade universal com fluxos de navegacao web.

### 5.5 Ergonomia de Mascaras de IA (Atalho `F1`) e Restauracao Instantanea
- O campo de mascara customizada para o atalho `F1` possui alinhamento a esquerda (`text-align: left`) para facilitar a leitura e edicao de prompts juridicos complexos, acompanhado de botao de restauracao instantanea (icone de voltar no canto superior direito) para restabelecer a mascara padrao de fabrica sem necessidade de restaurar todas as demais configuracoes da extensao.

### 5.6 Ocultacao de Modulos Futuros Ate Disponibilidade Efetiva
- Secoes relativas a modulos futuros e arquitetura extensivel permanecem ocultadas da interface grafica ate sua efetiva disponibilizacao funcional, mantendo o painel despoluido e centrado nas ferramentas em producao.

### 5.7 Estabilidade Dimensional de Controles e Prevencao de Deslocamento de Texto
- O controle deslizante (slider) de "Nivel de Filtro de Estilos" possui container com dimensao estrita (380px), trilho de 130px e badge com largura fixa padronizada (210px), e o texto descritivo de ajuda posiciona-se integralmente abaixo da linha de controle, garantindo 100% de largura horizontal e prevenindo qualquer quebra de linha dinamica ou deslocamento vertical da interface ao mover o botao de correr.
- Os cartoes de selecao (<select>) na grade superior adotam empilhamento vertical balanceado com largura total (100%), impedindo que os menus transbordem alem da borda direita e conferindo espaco natural para a leitura do texto explicativo.

### 5.8 Captura e Expansao Cirurgica de Numeros com Sinal (+ ou -), Moedas e Percentuais
- Ao clicar sobre valores numericos contendo sinal unario explicito (+ ou -), sejam decimais (+0,25, -0,45), inteiros (+1, -50), pontuados (-1.233,00), percentuais (+0,25%, -10%) ou valores monetarios (R$ -1.000,00, R$ - 1.000,00, -R$ 1.000,00), o sistema captura o numero completo incluindo seu sinal de forma cirurgica.
- O clique direto sobre o sinal (+ ou -) antecedendo digito expande o bloco completo.
- O clique sobre o valor em quantias monetarias prefixadas por R$ extrai o numero assinado (-1.000,00) sem o prefixo R$, facilitando a colagem imediata em calculadoras e planilhas, enquanto 2 cliques ou clique sobre o R$ selecionam a expressao monetaria integral.

### 5.9 Nivel de Acessibilidade Textual: Configuracoes Leigas vs. Ajuda Tecnica com Tooltips
- Na aba 'Configuracoes e Listas de Sites', o texto deve ser o mais leigo possivel, traduzindo termos de desenvolvimento para linguagem acessivel ao usuario forense comum. Codigos HTML sao substituidos por sua expressao visual direta: negrito (em negrito), italico (em italico), sublinhado, tachado, subscrito, sobrescrito, paragrafos, citacoes e tabelas.
- Na aba 'Central de Ajuda', preserva-se a especificacao tecnica completa das tags ('b' (<b>), 'p' (<p>), 'table', etc.) e inclui-se obrigatoriamente tooltips multilinhas com cursor de ajuda em cada codigo para esclarecer detalhadamente a funcao de cada elemento.

### 5.10 Isolamento Estrito de Delimitadores Simetricos Adjacentes (2 Cliques)
- Ao simular ou executar cliques duplos em palavras comuns antecedendo expressoes delimitadas (como "completo (JSON)" ou "sobrescrito (ex: 1)"), o cursor sobre o corpo da palavra possui busca de borda restrita a zero (raioBusca = 0), prevenindo que o algoritmo de delimitadores salte sobre o espaco em branco e capture indevidamente blocos externos menores que a palavra alvo.
- A expansao de delimitadores simetricos para o escopo externo ocorre apenas quando o clique incide diretamente sobre o caractere delimitador ou sobre o espaco adjacente imediato (delta <= 1), ou quando a palavra esta estritamente aninhada dentro dos delimitadores.

### 5.11 Injecao Universal em Subframes, Documentos PDF e Deteccao Global de Selecao
- Subframes e Visualizadores de PDF (PDF.js, PJe, eproc, iframes, embeds):
  * Durante a navegacao web ou abertura de processos e documentos judiciais, o motor e injetado universalmente em todos os frames (`allFrames: true`), combinando declaracao nativa (`content_scripts`), monitoramento ativo de ciclo de vida (`webNavigation`), MutationObserver com deteccao de insercao e mutacao de atributos (`src`/`data`), inspecao local em iframes same-origin e captura de eventos `load` em subframes com retentativas temporizadas assincronas (250ms e 800ms).
  * Camadas de texto de documentos PDF (`.textLayer`, `.pdfViewer`, `.page`, `[data-page-number]`, `embed[type*="pdf"]`, etc.) pertencem estritamente ao dominio de `LEITURA_COMUM`, sendo vedado classifica-las como controles de sistema ou des-seleciona-las arbitrariamente.
  * Deteccao Global de Selecao: Qualquer selecao ativa de texto na tela (seja gerada por arrasto de mouse, atalhos de teclado como Shift+Setas ou selecoes nativas de visualizadores) e identificada globalmente via `selectionchange` (com debounce de 120ms) e imediatamente processada pelo motor (higienizacao, formatacao no nivel configurado, copia para a Area de Transferencia, validacao matematica com alerta e contorno visual com Flash Verde), sem interferir em campos de digitacao protegidos pela Regra de Ouro.

---

## 6. BACKLOG DE TAREFAS FUTURAS E ANOTAÇÕES DE ENGENHARIA

### 6.1 Seleção com 1 Clique em Elementos de Interface Contendo Dados Estruturados / Máscaras Úteis
- **Contexto Operacional:** Em telas e cabeçalhos de sistema (como barras informativas do PJe, painéis superiores ou faixas informativas como `Informação de Prevenção` / metadados do tipo `"Juntado por ... em 30/10/2026 00:35:21"` ou `"30/10/2026"`), existem blocos de texto que, embora estejam estruturados no DOM dentro de áreas de interface (como `div#detalheDocumento`, contêineres de etiquetas, badges ou barras de ferramentas), contêm dados forenses de interesse direto do operador (datas completas com hora, números de processos, etc.).
- **Comportamento Previsto para Futura Implementação:**
  * Permitir que um clique simples (1 clique) sobre esses blocos de metadados/dados estruturados na interface consiga isolar e selecionar o dado/máscara útil correspondente (`30/10/2026`, `30/10/2026 00:35:21`, etc.) de forma inteligente e pontual.
  * Diferenciar claramente esses contêineres estáticos de texto/metadados da interface (mesmo que tenham classes de sistema ou filhos decorativos) de botões de ação e links clicáveis de navegação direta, garantindo que o 1 clique nesses dados copie/selecione a informação sem interferir nos controles interativos reais.

### 6.2 Auto Seleção Inteligente de Texto em Visualizadores de Documentos PDF Nativos / Incorporados (Ex.: PJe download.seam)
- **Contexto Operacional:** Em visualizadores de documentos PDF abertos diretamente pelo navegador ou incorporados no tribunal (ex.: `pje1g.trf1.jus.br/pje/download.seam?cid=...` exibindo certidões de juntada com `"O documento a seguir foi juntado aos autos do processo de nmero 1015306-38.2026.4.01.4002 em 19/10/2026 11:13:55..."` ou petições iniciais), os textos residem no visualizador interno de PDF do Chromium / PDF.js.
- **Comportamento Previsto para Futura Implementação:**
  * **Habilitar Seleção Completa de Textos em PDF:** Permitir a seleção e cópia de qualquer texto em documentos PDF (seja com 1 clique para palavras/números de processo/datas ou arrasto manual contínuo), garantindo que a suíte capture os eventos dentro do visualizador (`embed`, `object`, `#viewer`, `.textLayer` ou documento PDF direto).
  * **Reconhecimento de Entidades em PDF:** Assegurar que o motor reconheça processos (`1015306-38.2026.4.01.4002`), datas/horários (`19/10/2026 11:13:55`), nomes e parágrafos dentro de PDFs, aplicando contorno visual imediato e cópia formatada/texto puro para a Área de Transferência sem bloqueios do visualizador.
  * Garantir a reconstrução do mapa de texto contínuo mesmo com quebras virtuais de linhas geradas pela disposição CSS dos `<span>` posicionados da camada de texto (`textLayer`) do visualizador de PDF.


### 6.3 Supressão de Quebras de Linha em Linha Única com Espaçamento Obrigatório Anti-Truncamento
- **Contexto Operacional:** Em cards e painéis do PJe (ex.: listas de tarefas `col-sm-11`, cartões de processo com `dtPoloAtivo`, `dtPoloPassivo`, `ÚLTIMA MOVIMENTAÇÃO: REMETIDOS OS AUTOS...`, etiquetas e classes `col-sm-12 no-padding`), elementos irmãos ou `<span>`/`<div>` quebrados em múltiplas linhas visuais contêm trechos contíguos de texto.
- **Comportamento Previsto para Futura Implementação:**
  * Ao suprimir quebras de linha (`\n`, `<br>`) para condensar o conteúdo copiado em uma única linha (linha só), é **estritamente obrigatório** inserir um espaço em branco separador (`' '`) entre os blocos e linhas conectadas.
  * **Regra Anti-Truncamento:** Jamais colar ou fundir o final de uma linha com o início da linha seguinte sem espaço (ex.: evitar concatenar `"DISTRIBUIÇÃO AO VARA FEDERAL"` com `"CÍVEL E CRIMINAL"` gerando `"FEDERALCÍVEL"`). Toda unificação de linhas deve assegurar espaçamento limpo e normalizado sem truncamento de palavras.

### 6.4 Investigação de Seleção Dupla Cruzada / Efeito Fantasma Multi-Frame (Ex.: "Parnaíba-PI" e "Prevenção")
- **Comportamento Estranho Observado:**
  * Ao clicar no texto `"Parnaíba-PI"` (ou `"Distribuição"` dentro do documento PDF / área inferior), uma palavra distante no topo da tela (ex.: `"Prevenção"` ou `"ALMEIDA"` no cabeçalho `2297820154 - Informação de Prevenção`) também aparece destacada com contorno verde de seleção simultânea.
- **Diagnóstico Técnico Preliminar para Correção Futura:**
  * Ocorre quando a janela pai (`top window`) e o subframe do documento (iframe do PDF ou visualizador) mantêm seleções independentes no DOM simultaneamente, ou quando o evento de clique/mudança de foco não executa `sel.removeAllRanges()` na janela oposta antes de aplicar a nova seleção.
  * Além disso, se o contorno visual temporizado (Flash Verde / `CSS.highlights` ou divs de overlay) da seleção anterior no cabeçalho não tiver sido desarmado (`limparFlashBorderImediatamente()`), ele permanece visível na tela enquanto a nova seleção no corpo do documento é efetuada.
- **Diretriz de Correção Futura:**
  * Ao registrar uma nova seleção em qualquer frame (seja na página principal ou dentro de um subframe/PDF), garantir a limpeza imediata e mútua de ranges e de sobreposições de Flash visual em todos os contextos (`broadcastDeselecionarGeral` / `removeAllRanges()` cruzado entre pai e filhos), impedindo qualquer seleção dupla ou contorno residual fantasma na tela.

### 6.5 Garantia de Cópia e Seleção de Datas, Horários e Datas com Horário (Ex.: "23/10/2026 10:14:18")
- **Contexto Operacional:** Em cabeçalhos de juntada, certidões e linhas de metadados forenses do PJe (ex.: `"Juntado por FRANCISCO NOGUEIRA ALMEIDA JUNIOR - SUPERVISOR DA DISTRIBUIÇÃO em 23/10/2026 10:14:18"`), a seleção do bloco temporal pode ocorrer por clique no corpo da data, no horário ou por arrasto/seleção manual sobre a expressão completa.
- **Comportamento Previsto para Implementação/Ajuste Futuro:**
  * **Permissão de Cópia Completa:** Assegurar que tanto a seleção automatizada por clique quanto a seleção nativa/manual de datas isoladas (`23/10/2026`), horários isolados (`10:14:18`) e blocos contíguos de data com horário (`23/10/2026 10:14:18`) sejam sempre copiados fielmente para a Área de Transferência.
  * **Preservação de Formato:** Tratar a expressão combinada `DD/MM/AAAA HH:MM:SS` como entidade temporal forense de primeira classe no motor, garantindo que o clique simples, clique no espaço intermediário ou arrasto manual envie exatamente os dados limpos para a Área de Transferência com validação matemática e contorno visual verde imediato.

### 6.6 Escopo de Seleção em Alt + Clique sobre Botões, Etiquetas e Itens de Interface (Regra de Mínimo Possível)
- **Regra de Precedência em 3 Níveis Estritos:**
  1. **Nível 1 (Bloco/Registro Forense):** Se o clique incidir sobre um campo ou registro estruturado (Data, Hora, CPF, CNPJ, NB, RG, Processo CNJ, etc.), copia estritamente o bloco/máscara forense.
  2. **Nível 2 (Objeto Real de Interface):** Se for controle real de interface (botão `<button>`, link `<a>`, aba, switch, menu, ou etiqueta/badge/chip):
     * Em etiquetas/badges/chips com botão irmão de exclusão (ex.: `<div class="label label-etiqueta"><span data-jusgov-selecionavel="true">HOMOLOGAR ACORDO</span><span class="icon-desvincular-tag"><i class="fa fa-times"></i></span></div>`), o `Alt + Clique` seleciona e copia **exclusivamente o rótulo da etiqueta** (`HOMOLOGAR ACORDO`), ignorando o ícone "X" irmão e jamais capturando o contêiner externo (card de tarefa, linha da tabela ou painel).
     * O contorno visual do Flash e a cópia incidem estritamente sobre o texto visível do rótulo, sem envolver a estrutura física do contêiner externo.
     * Contêineres compostos (cards de tarefas do PJe, linhas com múltiplos controles, listas de processos) são expressamente rejeitados como objetos interativos únicos.
  3. **Nível 3 (Unidade Palavra):** Caso o clique não incida sobre um campo estruturado nem sobre um controle real de interface (ex.: parágrafo de texto ou texto comum dentro de um card), o `Alt + Clique` seleciona e copia pontualmente a **palavra sob o cursor**, mantendo a regra de mínima seleção e nunca capturando o contêiner por inteiro.

### 6.7 Prioridade de Bloco / Máscara Útil vs. Linha do Link vs. Texto Total em Alt + Clique
- **Regra de Negócio Estabelecida:**
  * Ao clicar em um link (`<a href>`) com a tecla `Alt` pressionada, o motor obedece a seguinte ordem estrita de precedência:
    1. **Passo 1 (Teste Prévio de Bloco sob o Cursor):** Primeiramente testa-se se a posição exata do clique corresponde a um bloco/padrão estruturado do catálogo forense ou máscara útil (ex.: ID, processo CNJ, CPF, CNPJ, data, valor em dinheiro, etc.). Havendo bloco sob o cursor, segue-se a regra geral de textos com base nas máscaras e regras tradicionais (clique no número isola o número; clique no hífen ou separador expande o bloco completo; clique no espaço segue o comportamento consolidado).
    2. **Passo 2 (Links Multilinhas -> Cópia da Linha Inteira Clicada):** Caso o clique NÃO tenha incidido sobre um bloco específico, mas o texto do link possua **múltiplas linhas** (seja por quebras explícitas `<br>`/`\n` ou por quebra visual de layout/bloco), o motor copia **apenas a linha inteira onde ocorreu o clique**, e não todo o texto das demais linhas do link.
    3. **Passo 3 (Link de Linha Única):** Caso o link seja composto por uma única linha e não contenha bloco específico sob o cursor, copia-se o texto visível integral do link.


### 6.8 Correção de Sobrescrita e Acúmulo de Retângulos / Cor do Flash Verde (Ex.: CNPJ com Múltiplas Bordas)
- **Comportamento Estranho Observado:**
  * Em números formatados como CNPJ (`41.522.194/0001-72`), ao selecionar partes ou o bloco, surgem múltiplos retângulos verdes sobrepostos (ex.: uma caixa para a base `41.522.194/0001` e duas ou mais caixas coladas/deslocadas sobre o dígito `-72`), gerando um efeito visual estranho de bordas duplicadas com tonalidade escurecida/acumulada e caixas sobrepostas.
- **Diagnóstico Técnico Preliminar:**
  * **Acúmulo de elementos de contorno (Overlays DOM / Highlights):** Ao re-executar seleções parciais ou ao calcular múltiplos `DOMRects` via `range.getClientRects()`, retângulos antigos de contorno do Flash não estão sendo removidos do DOM ou do mapa de highlights antes da injeção do novo contorno.
  * **Fragmentação indevida de nós/sub-ranges:** Quando o range divide nós de texto adjacentes ou cruza limites de pontuação, o despachador de contorno desenha caixas separadas para cada pedaço sem unir retângulos contíguos na mesma linha, gerando linhas duplas no encontro entre o corpo e o dígito verificador.
- **Diretriz de Ajuste Futuro:**
  * Garantir a limpeza atômica imediata (`limparFlashBorderImediatamente()`) antes de desenhar qualquer novo contorno.
  * Empregar fusão geométrica (coalescência) de `DOMRects` contíguos na mesma linha horizontal ou aplicar contorno por `range.getBoundingClientRect()` unificado quando se tratar de uma mesma entidade/bloco textual, prevenindo caixas sobrepostas e saturação de cor.

### 6.9 Ignorar Seleção / Cópia por Arrasto Curto (< 5 Caracteres) em Elementos de Interface sem Tecla Alt
- **Contexto Operacional:** Em locais que são claramente elementos de interface gráfica do sistema e não áreas de leitura de texto corrido (conforme a classificação e diferenciação de contexto de UI já existente no motor), o usuário pode acidentalmente clicar e arrastar o cursor ao interagir com componentes, abas, botões, cabeçalhos ou divisórias.
- **Regra de Negócio Estabelecida:**
  * Nos casos de clicar e arrastar o mouse em locais que correspondam categoricamente a elementos de interface (e não textos de leitura/conteúdo), ignorar completamente as seleções ou cópias caso a tecla `Alt` NÃO esteja pressionada e o texto selecionado resultante tenha menos de 5 caracteres (`selection.trim().length < 5`).
  * Caso o usuário queira expressamente selecionar ou copiar pequenos fragmentos ou labels curtos dentro de áreas de interface, ele deverá manter a tecla `Alt` pressionada durante a ação, ou a seleção por arrasto deverá possuir 5 ou mais caracteres para ser considerada intencional.
- **Diretriz de Ajuste Futuro:**
  * No tratador global de evento de arrasto/mouseup e `selectionchange`, verificar se o alvo da seleção originou-se em área de interface do sistema (`isContextoDeSistemaOuUi` ou contexto interativo).
  * Se o modificador `Alt` estiver ausente (`!e.altKey`) e o comprimento do texto selecionado for inferior ao limiar mínimo (`textoLimpo.length < 5`), abortar o fluxo de cópia, desarmar a seleção ativa no DOM (`window.getSelection().removeAllRanges()`) e suprimir o contorno visual do Flash Verde.

### 6.10 Investigação de Lentidão / Percepção de Atraso no Carregamento de Páginas
- **Sintoma Relatado:** Percepção de lentidão aumentada durante a abertura e carregamento de páginas e abas.
- **Hipóteses Técnicas e Pontos de Verificação para Diagnóstico Futuro:**
  1. **Injeção Redundante e Múltiplos Listeners (`webNavigation` vs `content_scripts` vs `MutationObserver`):**
     * O monitoramento assíncrono em `background.js` (listeners de `onCommitted`, `onDOMContentLoaded`, `onCompleted`) combinando chamadas a `chrome.scripting.executeScript` com injeção estática declarada no `manifest.json` pode estar causando execuções repetidas dos scripts de conteúdo em cada frame/subframe.
  2. **Sobrecarga de `MutationObserver` de Subframes e Iframes:**
     * A observação ativa de mutações no DOM com `subtree: true` e checagem contínua de iframes recém-inseridos ou alteração de atributos `src`/`data` consome ciclos da thread principal do navegador logo nos momentos críticos de renderização inicial (fase de parsing do HTML).
  3. **Disparos em Massa de `content_start` e Retentativas Temporizadas (`setTimeout` de 250ms / 800ms):**
     * Múltiplos temporizadores concorrentes criados para subframes podem estar concorrendo com os scripts nativos pesados de páginas judiciais (PJe, Angular, RichFaces).
  4. **Comunicação IPC Excessiva com Service Worker via `chrome.runtime.sendMessage`:**
     * Verificações síncronas ou frequentes de configurações (`obterConfiguracoes`) no início do ciclo de vida de cada frame podem estar enfileirando mensagens no canal de runtime.
- **Diretrizes de Investigação e Otimização:**
  * **Profiling de Performance:** Medir o tempo de execução dos passos de inicialização (`performance.mark` / DevTools Performance panel) nos scripts de conteúdo.
  * **Guarda de Idempotência Precoce:** Garantir que se a flag `window.__JUSGOVBR_INICIALIZADO__` já estiver ativa, a execução seja interrompida imediatamente no primeiro milissegundo, antes de qualquer query no DOM ou attach de listeners.
  * **Otimização de Observers:** Ajustar o `MutationObserver` de subframes para ser disparado com debounce/throttling ou limitá-lo a contêineres específicos em vez de `document.documentElement` irrestrito durante o carregamento inicial.

### 6.11 Otimizações do PJe: Eliminação de Delays e Popups/Toasts Nativos (Eliminar "Lag" e Falta de Fluidez do Mouse)
- **Sintoma Observado e Contexto Operacional:**
  * Em operações habituais do PJe (ex.: movimentação em painéis de tarefas e modal/menu flutuante de etiquetas de processos com PJe+R / PDPJ), surgem sucessivos popups/toasts retangulares verdes empilhados no canto da tela (ex.: `"Tarefa - A tarefa foi executada!"`, `"Etiqueta - Etiqueta vinculada ao processo"`, `"Etiqueta - Etiqueta desvinculada do processo"`).
  * **Janela/Modal de Etiquetas é Estritamente Interface de Sistema:** A caixa de diálogo suspensa de etiquetas (`Últimas etiquetas usadas`, lista de seleção com checkboxes, botões de lixeira e badges coloridas no topo como `[A] Pedido de desistência`, `PREVENÇÃO PDPJ`, `CERTIFICAR TRANSITO`, etc.) é categoricamente **área de interface gráfica e controle interativo**, e NÃO área de leitura de texto judicial (conforme a diferenciação funcional já existente no addon).
  * O acúmulo desses toasts nativos, somado a scripts/observers do addon e de extensões adicionais como o PJe+R interagindo sobre cada clique de adição/remoção de tag, gera uma latência crítica ("lag"), tornando a seleção e remoção de etiquetas extremamente lenta e o movimento/arraste do mouse pesado e sem fluidez.
- **Diretriz de Engenharia e Comportamento Futuro Solicitado:**
  * **Classificação Estrita de Contexto:** Garantir que o modal/painel de etiquetas (`pje-etiquetas`, modais de seleção rápida de tags e checkboxes de triagem) seja classificado como `INTERFACE_SISTEMA` / não-textual, desabilitando rotinas de seleção textual desnecessárias sobre cliques ou arrastos casuais nesses botões e listas.
  * **No Módulo de Otimizações do PJe (`src/mod-pje/`):**
    1. **Eliminar Delays Artificiais e Animações:** Interceptar ou suprimir as animações, transições e esperas temporizadas de transição de estado que bloqueiam a thread visual do navegador durante a vinculação e desvinculação de etiquetas.
    2. **Suprimir / Neutralizar Popups e Toasts Nativos:** Ocultar e eliminar imediatamente a exibição desses toasts/popups repetitivos de feedback (como confirmações sucessivas de "Etiqueta vinculada", "Etiqueta desvinculada" e "Tarefa executada"), seja via injeção de CSS de alta prioridade (`display: none !important; opacity: 0 !important; pointer-events: none !important;`) nas classes correspondentes (ex.: `.toast`, `.toastr`, `.ui-growl`, `.snack-bar`, ou elementos de notificação flutuante do PJe), seja anulando o delay de fade/renderização.
    3. **Restaurar Fluidez Total do Mouse:** Ao remover esses nós flutuantes pesados e suas rotinas de animação JS/CSS, eliminar qualquer atraso de renderização gráfica que cause atrito ("lag") na interação com o ponteiro do mouse em modais de etiquetas e no uso com PJe+R.

### 6.12 Eliminação de Bloqueios de Interface / Telas Escuras (Overlays e Modais Residuais) no PJe
- **Sintoma Observado e Contexto Operacional:**
  * Na transição de tarefas ou carregamento de processos no painel PJe (conforme evidenciado na tela dividida em colunas), ocorre um bloqueio persistente onde a interface fica escura (efeito "backdrop" / máscara cinza translúcida travada).
  * O bloqueio visual pode incidir sobre a **tela total**, ou afetar **apenas o lado esquerdo** (coluna de processos/tarefas) ou **apenas o lado direito** (painel de detalhes/visualização do processo) separadamente.
  * Esse escurecimento bloqueia a interação do usuário com os elementos da tela, exigindo recarregamentos forçados ou gerando perda de tempo operacional.
- **Diagnóstico Técnico Preliminar:**
  * Os frameworks do PJe (Angular / RichFaces / Bootstrap / UI-Blocker) inserem elementos de sobreposição (`.modal-backdrop`, `.block-ui-overlay`, `.loading-overlay`, `.cdk-overlay-backdrop`, `.rf-st-mp`) que deveriam ser destruídos ao final de requisições AJAX ou conclusão da tarefa.
  * Quando há erro de script, resposta assíncrona fora de ordem ou interferência nos eventos de ciclo de vida, o elemento de overlay de backdrop não é removido do DOM ou mantém as propriedades `pointer-events: auto` e `opacity > 0`, travando o painel correspondente na escuridão.
- **Diretriz de Ajuste Futuro no Módulo Acelerador PJe Turbo (`src/mod-pje/`):**
  * **Neutralização Contínua de Overlays Zumbis:** No CSS Anti-Ampulhetas e no monitoramento de lifecycle, neutralizar qualquer camada de bloqueio/escurecimento residual que permaneça visível sem atividade de rede real (`opacity: 0 !important; pointer-events: none !important; display: none !important;`).
  * **Tratamento Específico por Coluna:** Mapear os seletores de bloqueio de painel divido (painel lateral esquerdo vs container de visualização direito) para desbloquear pontualmente a coluna afetada sem quebrar eventuais modais legítimos abertos pelo usuário (como janelas ativas de digitação de despachos/decisões).

### 6.13 Separação Modular Rígida dos Arquivos de Código-Fonte (Isolar Mudança de Interface vs. Selecionar/Copiar)
- **Constatação e Diagnóstico Arquitetural:**
  * Atualmente, rotinas de modificação e manipulação de interface (como comportamentos de mouse, teclado, atalhos de navegação e auto-seleção com foco em campos de formulários/inputs) encontram-se acopladas e misturadas dentro do mesmo fluxo e arquivos de código do módulo de seleção inteligente e cópia forense (`src/mod-copia/`).
- **Diretriz de Reorganização e Refatoração Futura:**
  1. **Desacoplamento Físico de Arquivos de Código:**
     * Isolar rigorosamente o código-fonte por domínios de responsabilidade única:
       - **Módulo de Seleção e Cópia Inteligente:** Responsável estritamente pelo ciclo de cópia, níveis de formatação, regex/máscaras, validações matemáticas (CPF/CNPJ/CNJ/Datas), contorno visual de Flash Verde e Área de Transferência.
       - **Módulo de Mudança de Interface (UI / Interação):** Responsável isoladamente pelas rotinas de mouse (botões laterais 4 e 5, gestos), teclado (atalhos de sistema), tratamento de foco, clique em controles e auto-seleção específica em campos de formulários (`<input>`, `<textarea>`, editores e forms).
     * O código de intervenção em formulários e interface não deve poluir a lógica de parsing e seleção de texto corrido.
  2. **Preservação Unificada das Telas de Opções e Ajuda:**
     * As páginas centrais de configuração ([options.html](../src/cfg/options.html)) e a Central de Ajuda ([ajuda.html](../src/cfg/ajuda.html)) devem **continuar centralizadas em arquivos únicos**, contendo todos os módulos integrados.
     * Manter a excelente organização já consolidada, onde as preferências e documentações são agrupadas de forma clara e intuitiva em seções/abas temáticas por módulo.
  3. **Aderência Obrigatória aos Princípios de Engenharia (Item 11 das Diretrizes Root):**
     * Estruturação de cada arquivo `.js` por Orientação a Objetos com encapsulamento de estado interno e guardas defensivas (`typeof ... === 'function'`) antes de qualquer chamada intermodular, garantindo que o desligamento de qualquer módulo de UI ou cópia jamais aborte ou quebre os demais módulos em execução.

### 6.14 Regra de Bloco: Conectivo de Dois-Pontos com Espaço Posterior Expandindo Sentença Completa
- **Contexto e Regra de Negócio Estabelecida:**
  * Em frases estruturadas com dois-pontos precedendo uma proposição ou instrução (exemplo canônico: `"Atenção: confira o processo antes de prosseguir."`, `"Importante: verifique os prazos."`, `"Despacho: cumpra-se imediatamente."`).
  * **Comportamento da Ação de Clique:**
    * Ao clicar no espaço em branco imediatamente posterior ao caractere dois-pontos `:` (isto é, o espaço entre `:` e `confira`), o motor deve identificar os dois-pontos antecedentes imediatos como um conectivo de sentença direta.
    * Em vez de isolar apenas a palavra subsequente ou apenas o rótulo anterior, esse clique no espaço conectado aos dois-pontos expande e seleciona imediatamente a **sentença inteira** (`"Atenção: confira o processo antes de prosseguir."`), integrando o prefixo enfático ao corpo da proposição de forma atômica e fluida.

### 6.15 Aperfeiçoamento do Flash Verde: Eliminação de Sobreposições Concorrentes e Redesenho em Múltiplas Linhas
- **Sintomas Observados e Exemplos Práticos:**
  1. **Sobreposição em Linha Única / Fragmentação Estranha:**
     * No cabeçalho do processo `MSCiv 1007676-28.2026.4.01.4002 - [Civ] Certificar trânsito em julgado - Definir data`, ao destacar o bloco, surgem três retângulos sobrepostos/colados: uma caixa para o número do processo, uma caixa aninhada sobre o colchete/hífen intermediário `[ - [Civ] C` e outra caixa para o restante da descrição.
     * Há colisão visual das bordas verticais gerando traços duplos e escurecimento na junção.
  2. **Estranheza e Fragmentação em Múltiplas Linhas / Parágrafos Complexos:**
     * Na seleção de parágrafos judiciais contendo rótulos e quebras de linha (`NÚMERO: 1007676...`, `PARTE(S): ...`, `UNIVERSIDADE FEDERAL... representada pelo membro da Advocacia-Geral da União... requer o que segue.`):
     * O motor desenha retângulos vazios compridos em linhas intermediárias, pequenas caixas pontuais flutuantes (traços verticais isolados nos espaços ou entrelinhas) e caixas separadas que englobam a linha inteira até a borda direita mesmo sem texto preenchido.
     * O aspecto visual fica desorganizado, excessivamente fragmentado e esteticamente poluído.
- **Diretriz de Refatoração e Solução Arquitetural:**
  * **Causa Raiz:** O motor utiliza `range.getClientRects()` iterando diretamente sobre fragmentos brutos de quebra de nó de texto (`TextNode`), nós invisíveis com quebras de linha (`\n` com altura de linha mas sem largura) e contêineres inline-block do DOM, desenhando uma `div` de overlay para cada `DOMRect` sem qualquer higienização geométrica.
  * **Algoritmo de Higienização e Coalescência Geométrica (Bounding Coalescer):**
    1. **Descarte de Caixas Vazias/Fantasmas:** Ignorar qualquer `DOMRect` com largura útil menor ou igual ao espaço em branco (`rect.width <= 4px` ou `rect.height <= 2px`) para eliminar traços verticais soltos e linhas vazias.
    2. **Fusão Horizontal de Retângulos na Mesma Linha (`mergeHorizontalRects`):** Retângulos adjacentes situados no mesmo alinhamento vertical (`Math.abs(r1.top - r2.top) < 3` e sobreposição ou proximidade horizontal `<= 6px`) devem ser fundidos em uma única caixa retangular unificada, eliminando completamente as bordas duplas internas.
    3. **Unificação Vertical Estética:** Em blocos contíguos de parágrafo, avaliar o uso de um contorno envolvente contíguo (`CSS Custom Highlight API` nativa onde suportada, ou uma máscara poligonal/envelope limpo) para evitar o aspecto de "gaiola de caixas empilhadas" com linhas desiguais.

### 6.16 Desacoplamento Arquitetural entre Seleção e Cópia (Listener Reativo de Cópia sobre Seleções Ativas e Retenção Condicional de Seleção)
- **Falha Observada no Comportamento Atual:**
  * Em certas situações, ao dar duplo clique sobre palavras longas ou blocos textuais, a seleção nativa/visual ocorre na tela, porém o texto **não é copiado para a Área de Transferência**, mesmo atendendo com folga ao requisito de comprimento mínimo de caracteres.
- **Validação Técnica da Lógica Proposta:**
  * A proposta é **100% válida, robusta e aderente às melhores práticas de arquitetura desacoplada**.
  * Atualmente, o fluxo de clique tenta realizar simultaneamente o cálculo geométrico do range, a injeção do Flash temporizado, a atualização da seleção do DOM e a cópia para a Área de Transferência em uma única função monolítica. Se qualquer etapa intermediária sofrer race condition ou bloqueio temporário de foco, a cópia falha silenciosamente.
- **Estruturação do Novo Modelo Desacoplado:**
  1. **Módulo de Seleção Autônoma (Geometria, Interação e Flash):**
     * Opera com base na posição do cursor, cliques (1, 2, 3 cliques, espaço), modificadores de teclado e regras de bloco.
     * Aplica o contorno visual rápido do Flash Verde temporizado (se ativo nas preferências).
     * **Regra de Retenção da Seleção do Sistema:**
       - Se o elemento clicado **não for elemento de interface** (isto é, pertencer à área de leitura/texto judicial, documento, petição, decisão, certidão ou **documento PDF aberto dentro do Chrome / visualizador de PDF**): **mantém a seleção ativa no sistema** que foi replicada ou criada. *(Ressalva explícita: não inclui a barra de ferramentas ou botões de interface de abertura/navegação do PDF, que continuam classificados estritamente como interface)*.
       - Se for elemento de interface gráfica/controle: **remove imediatamente a seleção do sistema** (`window.getSelection().removeAllRanges()`) logo após a finalização da ação, sem precisar aguardar o término do Flash temporizado visual.
  2. **Módulo de Cópia Reativo (Escuta e Disparo por Seleção):**
     * A funcionalidade de cópia atua como uma **escuta reativa (listener)** que monitora seleções ativas na tela (sejam disparadas pelo motor de seleção do próprio addon, pelo duplo clique nativo do navegador, por arraste de mouse ou por atalhos de teclado).
     * **Garantia de Entrega:** Ao detectar uma seleção válida na janela/frame, a rotina de cópia verifica: *"Este texto selecionado já foi copiado no ciclo atual?"*. Caso não tenha sido copiado ainda, **dispara a cópia para a Área de Transferência imediatamente**.
     * Isso assegura que **jamais ocorra seleção sem cópia correspondente**, tornando o sistema imune a falhas em duplo clique.

### 6.17 Redefinição do Botão do Meio (Scroll Click), Histórico Nativo Win+V e Extinção Total de Leitura do Clipboard
- **Contexto e Motivação Arquitetural:**
  * Políticas recentes de segurança de navegadores Chromium (Permissions-Policy / clipboard-read) bloqueiam ou exigem confirmações invasivas e restrições para a leitura assíncrona do Clipboard (`navigator.clipboard.readText()`).
  * Para simplificar radicalmente a experiência e conferir máxima confiabilidade sem atritos de permissão, o addon **extingue por completo qualquer dependência de releitura do clipboard do sistema**.
- **Novo Comportamento do Botão do Meio do Mouse (Scroll Click / Botão 2/3):**
  1. **Clique do Meio Simples (Scroll Click sem teclas):**
     * Simula as teclas de colagem nativas do sistema (`Ctrl + V`) no elemento em foco (ou invoca rotina própria de inserção via `document.execCommand('paste')` / despacho de evento de input/paste).
  2. **Ctrl + Clique do Meio (Scroll Click com tecla Ctrl):**
     * Envia/despacha para o sistema a combinação de teclas de chamada do histórico nativo da Área de Transferência do Windows: **`Win + V`** (ou aciona o atalho correspondente para abrir o menu flutuante nativo de histórico de área de transferência do SO, caso configurado no sistema operacional pelo usuário).
- **Simplificação das Telas de Opções, Ajuda e Configurações:**
  * **Configuração Única:** Mantém-se apenas a opção unificada: *"Colar com o botão do Meio (Scroll Click)"*.
  * **Remoção de Opções Obsoletas:** Ficam desnecessárias e devem ser eliminadas as opções *"Usar área de transferência (clipboard) do sistema"* e *"Histórico da Área de Transferência / Rollback (Ctrl + Botão do Meio do Mouse)"*, bem como quaisquer caixas de diálogo ou alertas sobre acesso impossibilitado ao clipboard.
  * **Migração do Texto de Ajuda:** A explicação que residia no help de rollback deve ser condensada e integrada de forma simples diretamente na descrição de *"Colar com o botão do Meio (Scroll Click)"*, informando o suporte ao atalho `Ctrl + Clique do Meio` para acionamento do histórico `Win + V`.
- **Eliminação Total da Releitura do Clipboard e Nova Tela "Última Seleção":**
  * **Retirada de Leitura:** Varrer e remover do código-fonte toda e qualquer rotina que tente ler ou requisitar o conteúdo da Área de Transferência do sistema operacional (`clipboard.read`, `readText`).
  * **Preservação Integral da Escrita:** As rotinas de gravação no clipboard (`writeText`, `write` com MIME types text/plain e text/html conforme o nível de formatação configurado) permanecem ativas exatamente como estão!
  * **Nova Área de Monitoramento "Última Seleção:":** No painel de controle e depuração, a seção anterior *"Conteúdo atual da Área de Transferência:"* será renomeada e ajustada para **"Última Seleção:"**, mantendo abas/formatos HTML e TXT. Essa área exibirá estritamente o payload exato que este addon enviou para a Área de Transferência no momento da cópia, dispensando 100% qualquer leitura física do clipboard do SO.

### 6.18 Generalização da Regra de Atos Administrativos (De "Ato INSS" para "Ato Adm: Órgão/Sigla")
- **Contexto da Regra:** Anteriormente mapeada para casos específicos (ex.: `"Ato INSS: Instrução Normativa PRES/INSS nº 128/2022"`).
- **Regra de Negócio Generalizada:**
  * Expandir a categorização e a máscara regex para **"Ato Adm:"** de forma universal, contemplando qualquer órgão, autarquia, tribunal ou ministério da administração pública.
  * O padrão deve suportar dinamicamente siglas e subdivisões fracionadas em barras de múltiplos níveis (ex.: `##`, `##/##`, `##/##/###/###`, como `PRES/INSS`, `DG/DPF`, `SAJ/SG/PR`, `SGP/SEGES/MGI`, etc.), reconhecendo número e ano (`nº 128/2022`) e capturando a menção do ato administrativo normativo de forma completa e íntegra.

### 6.20 Identificação Única de Componentes (`Ctrl + Alt + Shift + Clique`) e Mapeamento Manual Avançado de Elementos (Interface vs. Textual)
- **Contexto e Objetivo Operacional:**
  * Permitir que usuários avançados identifiquem elementos do DOM com unicidade cirúrgica (similar às opções de "Copiar" do DevTools F12 do Chrome) e possam cadastrar regras locais explícitas para forçar o comportamento do elemento como **Interface** ou **Textual**, corrigindo manualmente casos específicos de funcionamento da aplicação web.
- **1. Atalho de Inspeção e Captura de Identificador Único (`Ctrl + Alt + Shift + Clique`):**
  * Ao pressionar `Ctrl + Alt + Shift` e clicar com o mouse sobre qualquer componente de tela ou elemento de texto, o addon identifica o elemento em sua unicidade e extrai/copia seu caminho/seletor único (nos moldes do menu *Copy* do Chrome DevTools F12).
  * **Nota de Conciliação com Acumulador:** Verificar e harmonizar com o Modo Baralho atual do Acumulador (`Ctrl + Alt + Shift` em `SelecionarCopiar.js` / `AcumuladorCopia.js`), definindo se a captura de seletor atua quando não há fila de acumulação ativa, se abre um seletor/copia o caminho em formato configurável ou se substitui/complementa o gatilho.
- **2. Formatos de Identificação e Motores de Resolução no DOM:**
  * O sistema deve suportar os 4 estilos clássicos de identificação de elementos, resolvendo-os pelos motores nativos adequados do navegador:
    1. **Seletor Simplificado (CSS Selector):** ex.: `#detalheDocumento\:j_id477 > div`, `body`, `menu`. Resolvido via `document.querySelector()` / `document.querySelectorAll()` ou `element.matches()` / `element.closest()`.
    2. **Caminho JS (JS Path):** ex.: `document.querySelector("#detalheDocumento\\:j_id477 > div")`. Extraído/avaliado com segurança extraindo o seletor interno para `querySelector` (sem `eval` inseguro em páginas de terceiros, compatível com CSP do Manifest V3).
    3. **XPath Simplificado (XPath Relativo por ID):** ex.: `//*[@id="detalheDocumento:j_id477"]/div`, `//div[@id="menu"]`. Resolvido via **segundo motor nativo**: `document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)`.
    4. **XPath Completo (Full XPath Absoluto):** ex.: `/html/body/div[1]/div[2]/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/form[1]/form/div[3]/div[2]/div`, `/html/body`. Resolvido também via `document.evaluate(...)`.
  * **Caso Real Imediato de Uso (Pré-cadastrado / Homologação Obrigatória como Tipo Textual ou Semiflexível para Clique Simples):**
    * O motor deverá aceitar e categorizar imediatamente estes caminhos reais do PJe (permitindo seleção e cópia com 1 clique simples sobre dados/máscaras úteis ou palavras dentro deles e de seus filhos):
      - `//*[@id="detalheDocumento:j_id477"]/div` (XPath Simplificado — Detalhe do Documento)
      - `/html/body/div[1]/div[2]/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/form[1]/form/div[3]/div[2]/div` (XPath Completo — Detalhe do Documento)
      - `//*[@id="poloAtivo"]/table/tbody/tr/td/span/span` (XPath Simplificado — Polo Ativo / Partes e CPF)
      - `/html/body/div[1]/div[1]/div[1]/form[1]/ul/li/ul/li/div[3]/table/tbody/tr/td/span/span` (XPath Completo — Polo Ativo / Partes e CPF)
- **3. Grupo Recolhido para Usuários Experientes em Configurações Avançadas (`options.html`):**
  * Localizado dentro de **Configurações Avançadas**, posicionado **sempre como o último grupo**, **não numerado** e **sempre recolhido inicialmente** (mesmo ao expandir "Configurações Avançadas", este subgrupo permanece recolhido até que o usuário clique nele diretamente — idêntico ao comportamento da própria seção de Configurações Avançadas).
  * **Estrutura de Cada Regra Cadastrada (Suporte a Múltiplas Regras):**
    * **Campo de Expressão/Caminho:** Onde o usuário cola qualquer um dos 4 estilos (XPath Simplificado, XPath Completo, Caminho JS ou Seletor Simplificado), com detecção automática ou seleção do estilo.
    * **Declaração Explícita de Tipo (3 Modos — Textual, Interface ou Regra Semiflexível):**
      1. **Tipo Textual:** Aplicam-se rigorosamente todas as regras de conteúdo/leitura textual (1 clique seleciona/copia palavras ou blocos e mantém seleção ativa no DOM).
      2. **Tipo Interface:** Aplicam-se rigorosamente todas as regras de sistema/interface (1 clique não copia palavras comuns; exige `Alt + Clique` ou arrasto; zero retenção de seleção azul).
      3. **Regra Semiflexível (Restrita a Máscaras/Blocos Definidos):**
         - Não é tratada nem como interface pura nem como texto corrido comum, mas sim **de acordo com o conteúdo exato onde foi clicado, restrito às máscaras/blocos definidos no catálogo forense** (ex.: datas completas `"22/10/2026 13:27:16"`, datas abreviadas `"22 out. 2026"`, horários `"05:19"`, IDs `"2297533315"`, CPFs `"258.198.013-34"` ou `"CPF: 258.198.013-34"`, processos CNJ, CNPJ, moedas, etc.).
         - **Comportamento no 1 Clique Simples (sem teclas modificadoras):** O motor observa especificamente onde foi clicado (inclusive para qualquer `div`, `span`, `small` ou dentro de cabeçalhos/links `<a>`/`<h3>`). **Se o ponto clicado for um bloco/máscara definida**, **ele copia imediatamente para a Área de Transferência, exibe apenas o Flash Verde rápido e NÃO seleciona o texto via sistema (`removeAllRanges()`)**. **Se NÃO for bloco/máscara** (ex.: clicar em `"Juntado"`, `"LUCIANO"`, `"Pedido"`, `"Juntada"`), **não faz nada com clique único** (preservando 100% o clique nativo, copiando texto comum somente se `Alt` estiver pressionado).
         - **Exemplos HTML Reais de Homologação Obrigatória para Regra Semiflexível e Mapeamento XPath:**
           ```html
           <div>Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16</div>
           ```
           ```html
           <h3><a><span class="" title="2297533315 - Pedido de homologação de acordo">
               2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16
           </span></a></h3>
           ```
           ```html
           <span class="text-upper texto-movimento">Juntada de Pedido de homologação de acordo</span>
           <span class="" title="">2297533315 - Pedido de homologação de acordo</span>
           <div class="media-body">
               <span class="text-muted data-interna">22 out. 2026</span>
           </div>
           <span class="text-muted data-interna">22 out. 2026</span>
           <small class="text-muted pull-right">05:19</small>
           <span class=""><span class="">JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)</span></span>
           ```
    * **Escopo de Herança (Filhos):** Indicação (checkbox/switch) se a regra vale também para os **filhos** (objetos/elementos HTML descendentes do nó mapeado) ou estritamente para o elemento exato.
    * **Estado da Regra:** Indicação (checkbox/switch) se a regra está **Ativa** ou **Inativa**.
  * **Importação e Exportação em JSON:**
    * Botões **bem pequenos e discretos**, contendo **apenas os símbolos** de **Exportar** (ex.: `📤` / `⬇️`) e **Importar** (ex.: `📥` / `⬆️`) no cabeçalho/barra do grupo, permitindo salvar e carregar essas definições locais em arquivo `.json`.

### 6.21 Análise e Refinamento do CSS PJe Anti-Ampulhetas em Telas com Loop / Despachos em Lote
- **Necessidade e Contexto Operacional:**
  * Verificar e comparar minuciosamente com o CSS original do PJe.
  * O CSS atual (`src/mod-pje/PJE-anti_ampuletas.css`) neutraliza as cortinas e telas de carregamento do PJe (`movimentarRegion:status.stop`, `opacity: 0.01`, `pointer-events: none`). Contudo, essa intervenção indiscriminada retira partes essenciais da interface onde existe processamento em lote ou loops assíncronos em andamento, como na **tela de despachos em lote**.
  * Nestes cenários específicos com loop/processamento em lote (onde o sistema processa sequencialmente múltiplos expedientes), **é mandatório e interessante manter o bloqueio/cortina visual da interface**, impedindo que o usuário interaja concorrentemente ou clique em botões durante o processamento de segundo plano, o que causaria descompasso ou falha na rotina do backend.
- **Diretriz de Refinamento:**
  * Mapear os seletores, classes e contêineres específicos da tela de despachos em lote e loops de processamento coletivo do PJe (ex.: identificar classes de contêineres pais de lote ou atributos de tela de lote).
  * Garantir que a regra do CSS Anti-Ampulhetas não suprima o bloqueio da interface especificamente quando o contexto for de processamento em lote/loop.

### 6.22 Regra de Seleção em Lugares Não-Editáveis por Tempo de Flash/Box (0ms vs. >0ms)
- **Contexto e Motivação Operacional:**
  * Em áreas e elementos não editáveis (conteúdo de leitura jurídica, documentos, petições, despachos, páginas web e PDFs), o comportamento da seleção nativa do sistema operacional (seleção azul) deve ser condicionado ao tempo configurado para o contorno visual temporizado (Flash Verde / Box).
- **Regra de Negócio Estabelecida:**
  1. **Tempo de Flash igual a 0ms (Box Desativado):**
     * O motor deve **usar a seleção normal do sistema**.
     * Ao selecionar/copiar (1 clique ou atalhos), a seleção nativa azul do navegador permanece ativa e retida sobre o texto copiado (`window.getSelection()` preservado).
  2. **Tempo de Flash maior que 0ms (Box Ativado):**
     * O motor desenha o **box de destaque** (contorno poligonal do Flash Verde).
     * **Desabilitar a seleção do sistema** (de-selecionar quando selecionado via `window.getSelection().removeAllRanges()`).
     * Desta forma, o usuário visualiza unicamente o box temporizado, eliminando a concorrência estética ou sobreposição da seleção azul nativa com o contorno colorido do Flash.

### 6.23 Indicação do Dia da Semana em Seleções de Data na Wiki Forense
- **Contexto e Motivação Operacional:**
  * Assim como já ocorre para CNPJ (indicação de Matriz vs Filial), CPF (Região Fiscal da RFB), CNJ (Ramo e Tribunal) e INSS (Espécie de Benefício), seleções e cópias de Datas isoladas ou combinadas com horários exibem na Wiki Forense a decodificação do dia da semana correspondente.
- **Diferenciação Visual por Tipo de Dia:**
  * **Segunda a Sexta-feira (Dia Útil):** Card com cor verde padrão da Wiki Forense (fundo #f0fdf4, borda #22c55e, texto #166534, subtítulo [Nome do Dia] (Dia Útil)).
  * **Sábado e Domingo (Final de Semana):** Card com tom diferenciado em azul céu / ciano suave (fundo #f0f9ff, borda #0284c7, texto #075985, subtítulo [Nome do Dia] (Final de Semana)).
  * **Integração com Horários:** Em expressões contíguas (DD/MM/AAAA HH:MM ou HH:MM:SS), os metadados do dia da semana e horário integram-se no subtítulo (Quarta-feira (Dia Útil) • Horário: 06:28h).

### 6.24 Padronização de Nomenclatura de Backups sem Duplicação
- **Padrão de Nome do Arquivo ZIP:**
  * Os arquivos de backup gerados via `util/backup.bat` (`util/fazer_backup.ps1`) adotam o formato: `bkp_AAAA-MM-DD_HH-mm v<MAJOR>.<MINOR>.zip` (para backups automáticos sem comentário) ou `bkp_AAAA-MM-DD_HH-mm v<MAJOR>.<MINOR> - Comentario.zip` (quando requisitado comentário manual pelo usuário).
  * Backups automáticos do sistema/assistente NUNCA devem incluir comentário automático gerado pela IA. Comentários só são incluídos quando expressamente informados pelo usuário.
  * Elimina a redundância de duplicar mensagens longas do Git no nome do arquivo compactado.

### 6.25 Padrão de Versionamento AAMMDD.MAJOR.MINOR[.PATCH]
- **Regras do Versionamento do Addon:**
  * O identificador de versão adota estritamente o formato: `AAMMDD.MAJOR.MINOR[.PATCH]` (ex.: `261104.1.5`).
  * **Ano com 2 Dígitos (AA):** Utiliza apenas os dois últimos dígitos do ano (ex.: 26 para 2026), seguido de MM e DD (`261104`).
  * **Omissão / Supressão do .0:** O sufixo .0 de patch é dispensável e deve ser omitido da versão quando for zero (ex.: `261104.1.5.0` torna-se `261104.1.5`). Caso haja patch numérico superior a zero, é anexado pontualmente (ex.: `261104.1.5.1`).
  * **Regra Diária do MAJOR:** A cada novo dia (avanço de `AAMMDD`), o número `MAJOR` sempre é reiniciado em `1` (ex.: `261105.1.0`). Lançamentos ou features maiores subsequentes no mesmo dia incrementam o `MAJOR` (ex.: `2`, `3`).
  * **Subversões no Mesmo Dia:** Melhorias e correções no mesmo dia incrementam `MINOR` (ex.: `261104.1.1`, `261104.1.2`, `261104.1.3`, `261104.1.5`), enquanto patches pontuais incrementam `PATCH` (`261104.1.5.1`).
  * **Reflexo nos Backups e no Manifesto:** No `manifest.json`, reflete as propriedades `"version"` e `"version_name"`, enquanto os backups gerados via `util/backup.bat` (`util/fazer_backup.ps1`) integram a tag correspondente `v<MAJOR>.<MINOR>` (ex.: `bkp_2026-11-04_12-11 v1.5.zip`).

### 6.26 Refinamento de Balões da Wiki Forense e Erros de Auditoria (Regra de Concisão e Limpeza Visual)
- **Eliminação de Tipos de Cálculo em Balões Válidos:**
  * Quando a validação matemática for bem-sucedida, não exibir menções ao tipo de cálculo nos balões informativos (ex.: banir expressões redundantes como (Módulo 11 Válido) em NB pontuado).
- **Supressão de "Ativo" e Exibição de "Tipo Inativo / Tipo Extinto":**
  * Para benefícios e cadastros ativos, dispensar a indicação redundante de Ativo.
  * Caso o tipo seja extinto ou inativo, exibir com o prefixo explicativo Tipo Extinto ou Tipo Inativo, prevenindo que o operador confunda a vigência jurídica da espécie com o status cadastral individual no INSS.
- **Quebra de Linha em Textos Auxiliares:**
  * Informações acessórias (ex.: (RGPS - Contributivo)) devem ser posicionadas na linha seguinte do subtítulo (\n), promovendo máxima clareza e escaneabilidade visual.
- **Ícones de Validação (✓ e ✗) sem Sublinhado após o Dado:**
  * Dispensar o texto redundante (Válido ✓) ou (Válida ✓).
  * O dado principal permanece com sublinhado (<u>), seguido diretamente pelo ícone correspondente fora do sublinhado (<span style="text-decoration:none;">✓</span> para dados válidos da Wiki Forense, ou ✗ em vermelho para erros de auditoria).

### 6.27 Opção de Retirada e Retenção de Seleções do Sistema após Copiar
- **Contexto e Motivação Operacional:**
  * Define explicitamente o comportamento da seleção azul nativa do navegador após a captura automática com Flash Verde temporizado.
- **Modos Suportados (`modoRetirarSelecao`):**
  1. **Das partes com interface (`interface` - Padrão / Recomendado):**
     * Mantém as seleções nativas ativas sobre textos de leitura judicial, despachos, páginas web e documentos PDF.
     * Retira a seleção visual do sistema unicamente quando a cópia incidir sobre elementos de interface gráfica (botões, menus, diálogos, modais, toolbar e etiquetas), evitando sobreposição e caixas de seleção residuais em controles do sistema.
  2. **Total (`total` - Interface web e texto de leitura):**
     * Desseleciona do sistema em todas as áreas após a cópia (`removeAllRanges()`), tanto em interfaces quanto em textos de leitura/PDFs. O operador conta exclusivamente com a sinalização do Flash temporizado.
  3. **Total (exceto ao arrastar o mouse) (`total_exceto_arrasto`):**
     * Mantém a seleção nativa intacta caso a ação tenha ocorrido por arrasto manual do mouse (`eraArrasto === true`).
     * Desseleciona do sistema em todas as outras ações (clique simples, duplo clique, triplo clique, Alt+clique, Shift+clique) após soltar o mouse e antes do flash sumir.
  4. **Nenhuma (`nenhuma` - Manter selecionado):**
     * Jamais retira automaticamente seleções do sistema, preservando a seleção azul nativa visível em todas as situações (tanto em textos de leitura quanto em interfaces web).

### 6.28 Seleção Integral Multilinhas de Links com `Alt + 3 Cliques` (Unificação em Linha Única) [IMPLEMENTADO]
- **Contexto e Progressão de Cliques com `Alt` sobre Links (`<a>` / `[role="link"]`):**
  * **`Alt + 1 clique` em um link:** Comportamento aprovado (seleciona o campo forense/palavra sob o cursor ou o rótulo direto).
  * **`Alt + 2 cliques` em um link:** Comportamento aprovado (expande para o bloco/expressão ou objeto na linha).
  * **`Alt + 3 cliques` em um link (`extrairTextoLinkUmaLinha`):** Seleciona obrigatoriamente **TODO O TEXTO DO LINK** (mesmo que o link ocupe duas ou mais linhas visuais, contenha `<br>`, múltiplos `<span>`/`<div>` internos ou mais de 120 caracteres), fazendo com que o texto copiado fique **tudo em uma linha só**, contendo a integralidade do texto visível do link devidamente separado por espaços simples (normalizando quebras de linha `\r\n`/`\n` e espaços múltiplos em um único espaço `' '`).

### 6.29 Diretriz POLICE — Catálogo Hierárquico Append-Only (`exemplos.txt`, `exemplos.js` e `options.html`) [IMPLEMENTADO]
- **Regra Inviolável POLICE (Nunca Remover Exemplos):**
  1. É terminantemente **PROIBIDO** remover exemplos, tipos de exemplos, máscaras ou casos de uso de `src/cfg/options.html`, `src/cfg/exemplos.txt` e `src/cfg/exemplos.js`.
  2. Qualquer remoção só pode ocorrer quando uma funcionalidade for explicitamente desabilitada e mediante pergunta prévia e autorização expressa do usuário.
  3. Toda evolução do catálogo deve ser estritamente **aditiva (append)**: novos exemplos fixos são agregados dentro de uma máscara existente, ou novas máscaras dentro de um caso de uso, mantendo estrutura estritamente **HIERÁRQUICA** (`Caso de Uso -> Máscara -> Exemplos Fixos Positivos e Negativos`).
  4. `src/cfg/exemplos.js` e `src/cfg/exemplos.txt` documentam cada exemplo com tipo, máscara, comportamento de uso e origem, e **100% dos exemplos catalogados** (todos os de `options.html` + adicionais + gerados) são obrigatoriamente testados e validados por `src/cfg/debug.js`.

### 6.30 Fechamento Imediato de Popups de Auditoria e Mensagens Wiki Forense ao Clicar ou Desselecionar [IMPLEMENTADO]
- **Comportamento Sincronizado com o Flash Temporizado e a Desseleção:**
  1. Assim como ocorre quando se clica com o mouse (onde o texto é desselecionado e o Flash Temporizado desaparece imediatamente), todos os **popups de checagem/auditoria** (ex.: cálculo Módulo 11/97 falhou, CPF/CNPJ/CNJ/NB/Data inválido e máscara amarela de alerta) e todas as **mensagens de instrução / Wiki Forense** (ex.: tipo de aposentadoria/benefício do INSS, região fiscal do CPF, Matriz/Filial do CNPJ, ramo/tribunal do CNJ, dia da semana da data e minitips globais) devem ser **fechados imediatamente** (`ocultarTodosAvisosImediatamente()`).
  2. Gatilhos de fechamento imediato: clique com o mouse (`mousedown`), desseleção do texto (`selectionchange` quando a seleção colapsa fora da janela de graça de `40ms` e fora da desseleção automática do próprio addon), teclas `Escape` ou `Enter`, rolagem (`scroll`), perda de foco da janela (`blur`) e surgimento de modais/diálogos críticos.

### 6.31 Detecção Hierárquica de Editores (`pai`/`avô`/`ancestral` `contenteditable="true"`) e Exceção de Interface CKEditor (`cke_*` / `cke_*editor`) [IMPLEMENTADO]
- **Verificação Hierárquica de Editabilidade (`isElementoOuAncestralContentEditable`):**
  1. Em editores ricos reais (como o CKEditor do PJe em `<body contenteditable="true" class="cke_editable cke_editable_themed cke_contents_ltr cke_show_borders">`), o elemento diretamente clicado costuma ser um nó descendente (`<p> -> <span> -> <span>`) cujo pai, avô ou ancestral (`<body>`) possui `contenteditable="true"`.
  2. O motor verifica explicitamente o elemento clicado, o seu **pai** (`parentElement`), o seu **avô** (`parentElement.parentElement`) e toda a cadeia ancestral até o `ownerDocument.body` (incluindo classes `.cke_editable`, `.ql-editor`, `.ProseMirror`, `.mce-content-body`), garantindo que todas as checagens e automações de editor (como auto-seleção de *placeholders* complexos `@@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@` e `#####`) funcionem com 100% de precisão mesmo em subframes (`iframe`) do PJe.
- **Exceção Estrita para a Interface dos Editores (`isElementoInterfaceDeEditorRico`):**
  1. Ficam estritamente **excluídos** do tratamento de conteúdo editável todos os elementos pertencentes à interface/barra de ferramentas do editor: elementos com `id` ou `class` iniciados por `cke_*` (`cke_top`, `cke_toolbox`, `cke_toolbar`, `cke_combo`, `cke_button`, `cke_reset`, `cke_chrome`, `cke_inner`, `cke_voice_label`) ou cujo pai/avô/ancestral seja o contêiner de interface `cke_*editor` (ex.: `id="cke_ckEditor-frame-editorTexto"` / `class="cke_editor_..."`), bem como barras `.ql-toolbar`, `.tox-toolbar`, `.mce-toolbar` e `.editor-toolbar-main`.
  2. A única exceção dentro do prefixo `cke_` que representa documento editável é `.cke_editable` (ou elemento com `contenteditable="true"` explícito).

### 6.32 Seleção de Texto de Leitura em PDF Embedded (`pdf-viewer` / `<embed type="application/x-google-chrome-pdf">` / PDF.js) e Exceção da Interface do PDF (`viewer-toolbar` / `#toolbar` / `input#pageSelector`) [ANOTADO — PENDENTE DE AUTORIZAÇÃO]
- **Estrutura Identificada nas Imagens (PDF Embedded no PJe):**
  1. **Conteúdo de Leitura do PDF Embedded (Imagem 1):**
     * Host customizado `<pdf-viewer id="viewer">` com `#shadow-root (open)` contendo `<div id="container">` -> `<div id="main">` -> `<div id="scroller">` -> `<div id="content">` -> `<embed id="plugin" type="application/x-google-chrome-pdf" original-url="https://pje1g.trf1.jus.br/pje/downloadBinario.seam" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/...">` (ou camada textual PDF.js `.textLayer` / `.pdfViewer` / `.page`).
     * No documento/área de leitura do PDF embedded, o clique simples (1 clique) deve selecionar e copiar o texto/bloco forense da mesma forma que ocorre fora desse caso, mantendo a regra de leitura documental (`LEITURA_COMUM` / `isAreaLeituraOuPdfConteudo === true`).
     * *Nota técnica:* Na função `isElementoInterativoOuUi`, a tag `EMBED` e `OBJECT` estava incluída indiscriminadamente em `TAGS_INTERATIVAS`, e eventos dentro de `#shadow-root (open)` do `<pdf-viewer>` precisam ser resolvidos via `e.composedPath()[0]` para distinguir se o clique ocorreu em `#content` / `#scroller` / `<embed type="application/x-google-chrome-pdf">` (área de leitura do PDF) ou na barra de ferramentas. Além disso, no plugin nativo PDFium (`mhjfbmdgcfjbbpaeojofohoefgiehjai`), o texto selecionado dentro do plugin `<embed>` pode ser capturado via `postMessage({ type: 'getSelectedText' })` ou API de seleção quando em camada DOM/Shadow DOM.
  2. **Exceção Estrita para a Interface do Próprio PDF (Imagens 2 e 3):**
     * Barra de ferramentas superior e controles laterais dentro de `#shadow-root (open)`: `<viewer-toolbar id="toolbar">`, `<div id="toolbar">`, `<div id="start">`, `<cr-icon-button id="sidenavToggle">`, `<div id="center">`, `<viewer-page-selector>` -> `#shadow-root (open)` -> `<input part="input" type="text" id="pageSelector" aria-label="Número da página">`, `<span id="zoom-controls">`, `<cr-icon-button id="fit">`, `<div id="sidenav-container">` (`viewer-pdf-sidenav`, miniaturas de páginas).
     * Todos esses elementos permanecem estritamente classificados como **Interface** (`LINK_CLICAVEL` / `CAMPO_SIMPLES_EDITAVEL` no caso do `input#pageSelector`), obedecendo às regras de interface (auto-seleção do `input#pageSelector` sem cópia automática e preservação total dos botões de zoom/rotação/download/impressão).

---

### 6.33 Posicionamento Inteligente Fora da Seleção para Popups de Verificação e Erro (`AvisoFlutuante.js`) [IMPLEMENTADO]
- **Problema Relatado pelo Usuário:**
  * Atualmente, os popups e tooltips de verificação matemática, avisos de erro de auditoria (ex.: CPF, CNPJ, NB inválido, falha de Módulo 11/97) e cartões da Wiki Forense estão sendo renderizados diretamente **em cima do texto clicado**.
  * Eles cobrem a própria seleção de texto nativa do sistema (`window.getSelection()`) e também cobrem o "Contorno Visual Rápido ao Copiar" (o retângulo do Flash Verde temporizado), prejudicando a visibilidade imediata do usuário.
- **Diferença de Comportamento em Relação ao Acumulador:**
  * O quadrante do Acumulador de Cópia (`AcumuladorCopia.js`) segue lógica de quadrante inteligente e está se posicionando de forma excelente.
  * O fator determinante para o problema no `AvisoFlutuante.js` decorre de que os avisos e verificações possuem múltiplas linhas de texto/HTML dinâmico com altura e largura variáveis (que antes de renderizadas ou sem cálculo prévio de `offsetHeight` levam a cálculos incorretos de ancoragem), enquanto o acumulador é mais compacto e unilinear.
- **Diretriz Técnica do Algoritmo Inteligente Anti-Sobreposição:**
  1. **Ancoragem Externa:** O balão do aviso deve sempre nascer **fora** da área ocupada pelo texto selecionado (`range.getBoundingClientRect()`) e **fora** do contorno visual do Flash.
  2. **Cálculo Baseado em Posição do Mouse e Bounding Box do Texto:**
     * Utilizar simultaneamente o retângulo da seleção (`selRect = range.getBoundingClientRect()`) e a posição do cursor do mouse (`mouseX`, `mouseY`).
     * Preferencialmente projetar o aviso imediatamente **acima** da seleção (com margem de segurança de `8px` a `12px` acima do topo do Flash/seleção).
     * Caso o espaço superior até o topo do viewport seja insuficiente (`top - cardHeight < 10px`), projetar imediatamente **abaixo** do limite inferior da seleção/flash (`bottom + 10px`).
     * No eixo horizontal, alinhar pelo centro da seleção ou do clique, aplicando travamento estrito dentro das bordas do viewport (`left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, left))`) para evitar qualquer transbordamento da janela.
  3. **Medição Prévia e Aplicação dos Estilos:**
     * Antes de posicionar o balão, garantir a medição real das dimensões multilinhas do card (`offsetWidth`, `offsetHeight`) ou calcular com precisão as caixas delimitadoras, eliminando sobreposições acidentais sobre o texto que acabou de ser clicado/copiado.

### 6.34 Unificação da Opção "Seleção Automática de Placeholders em Editores", Reorganização de Categorias e Padronização Visual de Fontes (`options.html`) [IMPLEMENTADO]
- **Unificação das Opções de Editores:**
  * As antigas opções "Pré-seleção sem Cópia em Campos Editáveis e Minutas" (`optSelecaoAutomaticaTextoEditavel`) e "Seleção Automática de Placeholders em Editores HTML Online (Minutas)" (`selectModoPlaceholdersMinutasHtml`) foram unificadas em uma única opção clara e concisa: **"Seleção Automática de Placeholders em Editores"**.
  * **Comportamento unificado:**
    - Quando configurada como `"Desabilitado (sem seleção alguma)"` (`desabilitado`), desativa a pré-seleção automática tanto em campos simples de formulário (`<input>`, `<textarea>`) quanto em editores ricos/minutas HTML/CKEditor (`selecaoEditavelAtiva = false`, `placeholdersMinutasHtmlAtivo = false`).
    - Quando qualquer outro modo está selecionado (`placeholders`, `ctrl_avancado` ou `avancado`), os campos de input/textarea ativam sua pré-seleção rápida e os editores de texto seguem a regra operacional selecionada (`selecaoEditavelAtiva = true`, `placeholdersMinutasHtmlAtivo = true`).
- **Reorganização das Categorias Avançadas (`options.html`):**
  * "Separador do Modo Acumulador (Ctrl + Alt)" migrado para dentro de **"2. CÓPIA INTELIGENTE: Editores de Minutas e Validação"**, imediatamente antes do item "Tempo de Exibição dos Avisos na Tela".
  * "Atalho Inteligente F1 (Prompt de IA / Assistente)" migrado para **"3. TECLADO/MOUSE: Navegação por Teclado e Botões Laterais"**, imediatamente após "Permitir navegação em campos de entrada usando o teclado".
- **Padronização Visual da Fonte em `options.html`:**
  * O bloco da opção "Retirar Seleções do Sistema após Copiar" apresenta estilo visual de fonte divergente das demais seções.
  * Padronizar as tags, tamanhos de fonte, cores e margens para seguir rigorosamente o padrão visual consolidado das demais opções do painel de configurações.

### 6.35 Diagnóstico e Correção de Seleções em Editores CKEditor e em Visualizadores de PDF [ANOTADO — PENDENTE DE IMPLEMENTAÇÃO]
- **Diagnóstico Aprofundado via DevTools / Imagens Anexadas:**
  1. **Estrutura Real do CKEditor no PJe (Imagem `media_1793860964286_f8a38622.jpg`):**
     * O container externo é `<div id="taskInstanceForm:Minutar_ato-10552541588:editorTexto">` -> `<div class="col-sm-12">`.
     * O `<textarea id="ckEditor-frame-editorTexto">` tem `display: none; visibility: hidden;` (apenas para binding do formulário).
     * O editor visual real é instanciado em `<div id="cke_ckEditor-frame-editorTexto" class="cke_1 cke cke_reset cke_chrome cke_editor_ckEditor-frame-editorTexto ...">`.
     * A barra superior com botões de formatação fica em `<span id="cke_1_top" class="cke_top ...">` (interface pura).
     * A área real onde o texto da minuta reside é um **iframe**: `<iframe class="cke_wysiwyg_frame cke_reset" ...>` -> `#document` -> `<html ...>` -> `<body contenteditable="true" class="cke_editable cke_editable_themed ...">`.
     * **Comportamento exigido no CKEditor:** As seleções de texto comum não devem roubar o foco nem copiar texto espúrio com 1 clique (para permitir que o operador digite livremente sem interferências); o cursor de digitação nativo deve permanecer visível e apenas os *placeholders* (`@@@...@@@` ou `#####`) devem ser auto-selecionados ao serem clicados, sem cópia automática.
  2. **Estrutura Real do Visualizador de PDF (Imagem `media_1793860777507_fd8572ab.jpg`):**
     * O visualizador é encapsulado em `<pdf-viewer id="viewer">` -> `#shadow-root (open)` -> `<div id="container">` -> `<div id="main">` -> `<div id="scroller">` -> `<div id="content">` -> `<embed id="plugin" type="application/x-google-chrome-pdf" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/...">`.
     * Dentro do `#document` do embed há `<div id="sizer">` e outro `<embed type="application/x-google-chrome-pdf">`.
     * **Comportamento exigido no PDF:** Sendo um documento de leitura estritamente não editável, o clique simples sobre qualquer dado ou palavra deve executar o fluxo completo de cópia com sinalização do Flash Verde e retirada da seleção visual do sistema conforme a opção selecionada (`interface` ou `total`).

### 6.36 Migração de `exemplos.txt` para `exemplos.json` Integrado a `ConstantesPadroes.js` e `debug.js` [ANOTADO — PENDENTE DE IMPLEMENTAÇÃO]
- **Objetivo da Migração:**
  * Transformar o catálogo de exemplos atualmente em formato texto (`src/cfg/exemplos.txt`) em um arquivo JSON estruturado, tipado e hierárquico (`src/cfg/exemplos.json`).
  * Em vez de utilizar identificadores e códigos artificiais de máscara (como `01.05_BENEFICIO_PREVIDENCIARIO_INSS_NB`), correlacionar diretamente as chaves, nomes e regex com as constantes já definidas em `ConstantesPadroes.js` e com as opções de `options.html`.
- **Origem e Geração do Catálogo:**
  * O arquivo `exemplos.json` deve ser composto pela junção de:
    1. Constantes e expressões regulares catalogadas em `ConstantesPadroes.js`.
    2. Todos os exemplos de exibição e testes presentes em `options.html` (seja no help/ajuda contextual, seja nas telas explicativas).
- **Consumo Obrigatório por `debug.js` sob a Regra POLICE:**
  * O script `src/cfg/debug.js` deverá carregar e iterar sobre o `exemplos.json`, executando a bateria de testes de validação matemática e formatação contra 100% dos exemplos catalogados.
  * Fica estritamente mantida a regra incondicional **POLICE Append-Only** (nunca remover exemplos existentes, apenas enriquecer o catálogo com novos casos de teste).

### 6.37 Regra de Negócio Universal de `Alt + Clique` em Espaço em Branco (1 Clique Expande como 2 Cliques) [IMPLEMENTADO]
- **Diretriz Root Universal para Interações com Tecla `Alt`:**
  1. **Comportamento do Clique sobre Espaço em Branco:**
     * Ao pressionar a tecla `Alt` e clicar com o mouse sobre um **espaço em branco** contido dentro de um link (`<a>`), botão ou elemento de texto, o sistema deve seguir a regra de negócio consolidada:
       - **1 clique em cima do espaço em branco faz exatamente o que 2 cliques fazem na palavra** (expande imediatamente a seleção para a palavra, bloco ou expressão completa em que o espaço atua como conector).
       - `Alt + 2 cliques` expande para o bloco completo ou para o elemento/linha inteira.
       - `Alt + 3 cliques` em um link executa a extração integral unificada em uma única linha (`extrairTextoLinkUmaLinha`).
  2. **Universalidade da Regra:**
     * Esta regra possui caráter **root e universal**, aplicando-se a links, botões, etiquetas de interface e parágrafos de texto comum.
     * Preservação da lógica contínua de expansão sem quebras artificiais de contexto.

### 6.38 Proteção de Tamanho Mínimo em Texto de Leitura e Unificação de Desinências Isoladas entre Parênteses `(A)` [ANOTADO — PENDENTE DE IMPLEMENTAÇÃO]
- **Problema Relatado com Evidência Visual (`media_1793860297200_8eaaa2bb.png`):**
  * Na imagem anexada de cabeçalho de petição judicial (`"EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL..."`), ao clicar na desinência `(A)` de `"SENHOR(A)"`, o sistema selecionou e copiou exclusivamente a letra `"A"`.
  * **Inconformidades diagnosticadas:**
    1. **Violação do tamanho mínimo configurado:** A restrição de mínimo de caracteres (ex.: mínimo de 5 caracteres) não filtrou a cópia em texto de leitura documental.
    2. **Desmembramento incorreto de palavras flexionadas:** Em textos forenses, desinências entre parênteses como `(a)`, `(o)`, `(s)`, `(as)`, `(os)`, `(es)` integram a palavra que as antecede.
- **Diretriz de Correção:**
  * O motor de seleção atômica deve unir automaticamente a desinência entre parênteses ao vocábulo anterior (`"SENHOR(A)"`, `"DOUTOR(A)"`, `"JUIZ(A)"`), copiando o termo completo.
  * Respeitar estritamente o filtro de tamanho mínimo de letras configurado nas opções, impedindo a captura de letras soltas sem combinação explícita de tecla modificadora.

### 6.39 Auto-Seleção com 1 Clique e Reconhecimento de Seleção Manual em Tabelas JSF/RichFaces de Subframes (`listTasksUsuarioPje2.seam`) [IMPLEMENTADO]
- **Evidência Visual e Estrutura Identificada na Imagem (`media_1793861616606_50324c46.jpg`):**
  * **Contexto de Tela:** Lista de últimas tarefas executadas no PJe (`div.frameUltimasTarefas` contendo `<iframe id="frameUltimasTarefas" src="https://pje1g.trf1.jus.br/pje/Painel/painel_usuario/include/listTasksUsuarioPje2.seam?iframe=true">`).
  * **Elemento Específico sob Inspeção:** Célula de tabela contendo o Número do Processo CNJ (`1020445-05.2025.4.01.4002`):
    * Tag: `<td class="rich-table-cell" id="j_id22:ultimasTarefasDataTable:0:j_id23">1020445-05.2025.4.01.4002</td>`.
    * Tabela: `<table class="rich-table" id="j_id22:ultimasTarefasDataTable">` dentro de `<form id="j_id22" ...>`.
- **Problemas Relatados pelo Usuário:**
  1. **Falha de Auto-Seleção por 1 Clique Simples:** O número do processo na célula `td.rich-table-cell` não está sendo selecionado/copiado com 1 clique simples, apesar de ser um dado estruturado de processo CNJ legítimo.
  2. **Não Reconhecimento da Seleção Manual Feita pelo Usuário:** Ao arrastar o mouse e selecionar manualmente o texto do processo com a seleção azul nativa do sistema (sem uso de automação), o addon não detecta que houve uma seleção ativa e não executa a auto-cópia para a Área de Transferência.
- **Diretrizes Técnicas de Negócio e Engenharia:**
  1. **Mudança 1: Auto-Seleção com 1 Clique Simples em Células de Tabela RichFaces:**
     * As células `<td>` de tabelas de dados do PJe (`rich-table`, `dataTable`, `p-datatable`) que contenham texto puro ou nós de texto direto (como processos CNJ, datas, horários, nomes) são categorizadas como **conteúdo legível/leitura** (`LEITURA_COMUM`) e não como controles interativos opacos de UI.
     * O clique simples em `td.rich-table-cell` sobre um padrão estruturado (Processo CNJ) deve disparar a expansão atômica imediata do bloco do processo, com cópia limpa para a Área de Transferência e validação visual correspondente.
  2. **Mudança 2: Detecção Inteligente e Robusta de Seleções Genéricas / Manuais (`selectionchange` / `mouseup`):**
     * Quando o usuário seleciona um texto manualmente (arrastando o mouse ou usando teclado nativo), o motor do addon deve capturar a seleção via ouvinte de `mouseup` / `selectionchange`.
     * **Auto-Cópia com Salvaguardas:** Detectada a seleção manual válida de texto útil (respeitando o limite mínimo de caracteres e filtros de dados), o sistema deve copiar o texto automaticamente para o clipboard (mesmo dispensando o contorno visual de Flash para evitar atrito visual ou instabilidade durante arrasto manual).
     * **Blindagem Anti-Loop e Prevenção de Múltiplos Disparos:**
       - Criar trava por assinatura do texto selecionado (`ultimaSelecaoManualTexto` e timestamp `ultimoTimestampSelecaoManual`) para impedir que a mesma seleção seja processada múltiplas vezes em cascata.
       - Impedir loops de seleção: a auto-cópia disparada por seleção manual não deve re-disparar novos eventos sintéticos de seleção nem sobrepor seleções ativas do usuário.
       - Harmonizar múltiplos tipos de seleção por eventos concorrentes (`click` vs `mouseup` vs `selectionchange`), garantindo que uma seleção iniciada por clique único prevaleça e desative o handler de arrasto concorrente, e vice-versa.
       - Garantir que a injeção do motor ocorra corretamente dentro do subframe `listTasksUsuarioPje2.seam` (`all_frames: true`), permitindo a escuta atenta dos eventos de mouse na janela interna da tabela.

### 6.40 Correção do Popup de Duplo Esc (`Esc + Esc`): Duração Efêmera e Desrespeito ao "Tempo de Exibição dos Avisos na Tela" [IMPLEMENTADO]
- **Problema Relatado:**
  * O popup de alternância de modo acionado pelo atalho `Esc + Esc` (`Remover Formatacoes: DESATIVADO / ATIVADO`) está surgindo e desaparecendo quase instantaneamente na tela ("muito rápido").
  * Ele **não está respeitando** o valor configurado na opção `"Tempo de Exibição dos Avisos na Tela"` (`tempoExibicaoAlertaMs` configurado em `options.html`, padrão 3,5s).
- **Diagnóstico Técnico da Causa Raiz:**
  1. **Conflito de Fechamento por Tecla Esc:** No evento `keydown`, a tecla `Escape` dispara imediatamente `limparAvisosAuditoriaEWikiImediatamente()` e `executarDeselecaoUniversal(false)`. O segundo `Esc` que completa o duplo clique dispara a projeção do mini-tip via `validador.projetarMiniTipGlobal(msgModo, corBorda)`. Porém, ouvintes concorrentes de teclado ou o fechamento universal subsequente em `selectionchange` ou frames filhos capturam o evento residual do `Escape` e ocultam o popover de forma prematura.
  2. **Tempo Fixo Hardcoded em `AvisoFlutuante.js`:** O método `projetarMiniTipGlobal(mensagem, corBorda)` possui temporizador fixo hardcoded (`setTimeout(..., 2400)`), ignorando totalmente a propriedade dinâmica `this.tempoExibicaoMs` configurada pelo usuário via `validador.definirTempoExibicao(cfg.tempoExibicaoAlertaMs)`.
  3. **Auto-Destruição Indesejada:** Quando `tempoExibicaoAlertaMs > 0`, o mini-tip do duplo Esc deve permanecer em exibição exatamente pelo tempo configurado (`this.tempoExibicaoMs`), e o temporizador do mini-tip (`this.temporizadorMiniTip`) deve ser imune ao fechamento acidental pelo próprio evento de `Escape` que o invocou.
- **Diretriz de Correção Futura:**
  * Em `AvisoFlutuante.js`: fazer `projetarMiniTipGlobal` utilizar estritamente `const duracao = (typeof this.tempoExibicaoMs === 'number' && this.tempoExibicaoMs > 0) ? this.tempoExibicaoMs : 3500;`.
  * Em `SelecionarCopiar.js`: blindar a projeção do duplo Esc contra a limpeza atômica imediata provocada pela própria tecla de escape, garantindo que o badge permaneça visível e legível pelo período estipulado nas opções.

### 6.41 Verificação e Implementação do Cálculo de Validação Matemática para PIS/PASEP/NIT (`NNN.NNNNN.NN-N`) [IMPLEMENTADO]
- **Contexto e Demanda Relatada:**
  * Verificar e implementar o cálculo de validação matemática (Módulo 11 com pesos `3, 2, 9, 8, 7, 6, 5, 4, 3, 2`) para inscrições do tipo **PIS / PASEP / NIT** no formato `NNN.NNNNN.NN-N` (11 dígitos), como no exemplo da Central de Ajuda (`PIS/NIT: 120.43256.72-8`).
- **Implementação do Motor (`AvisoFlutuante.js` e `ConstantesPadroes.js`):**
  * Expressão centralizada `PIS_ISOLADO` adicionada a `REGEX_AUDITORIA` em `ConstantesPadroes.js`.
  * Método `validarPIS(pisStr)` implementado em `AvisoFlutuante.js`, validando sequência repetida, pesos Mod 11, resto e DV esperado, gerando aviso de erro amarelo quando inválido e Wiki Forense verde quando válido.
  * Auditado com 100% de sucesso em `debug.js`.

### 6.42 Validação Matemática Genérica Fallback para Números Não-Identificados, Não-Pontuados ou Incompletos [IMPLEMENTADO]
- **Contexto Operacional e Motivação:**
  * Permitir que números genéricos, números não-pontuados ou com pontuação incompleta (ex.: `099123450-2`, `0991234502`, `120.43256.72-4`, `12043256.72-4`, `1204325672-4`, `1300802143` ou alfanuméricos como novos CNPJs) passem por uma verificação matemática mesmo quando o padrão de máscara não for estritamente casado ou quando a frase contextual não permitir inferir explicitamente o tipo do documento (como NB, Benefício, INSS, CPF, etc.).
- **Regra de Negócio Estabelecida e Implementada (Última Barreira de Verificação):**
  1. **Mecanismo Fallback de Última Barreira (`validarNumeroGenericoFallback`):**
     * Caso o texto clicado/selecionado seja numérico (ou alfanumérico com números e letras) e **não** tenha sido identificado por nenhuma máscara específica com contexto, o motor aplica uma bateria de testes com todos os cálculos de dígitos verificadores conhecidos (Mod 11 com pesos cíclicos 2..9, Mod 11 NB INSS de 10 dígitos, Mod 11 PIS/NIT de 11 dígitos, Mod 11 estilo CPF com 2 DVs, Mod 11 Alfanumérico CNPJ, Mod 97 de processo CNJ / BigInt e Mod 10 / Luhn).
  2. **Exibição Exclusiva em Caso de Sucesso Matemático (Cartão em Cinza Neutro):**
     * Se um (ou mais) dos cálculos matemáticos der certo, o sistema projeta um **balão em cor cinza neutra** (`#f1f5f9`, borda `#94a3b8`, texto `#1e293b`) informando o **tipo de cálculo** aprovado (e não o tipo de documento, já que o tipo é desconhecido).
     * Formato visual:
       ```html
       [Mod11]: <u>1300802143</u> <span style="text-decoration:none;color:#16a34a;">✓</span>
       ```
     * Caso múltiplos cálculos batam, cada algoritmo é projetado em uma linha própria dentro do cartão cinza.
  3. **Silêncio Absoluto em Caso de Não-Validação (Nada Apresentar):**
     * **Regra Fundamental de Ouro:** Se o número genérico/não-identificado NÃO for validado por nenhum dos cálculos matemáticos testados, **NADA É APRESENTADO NA TELA** (zero popups, zero balões e zero alertas), permanecendo 100% silencioso para evitar falsos-positivos em números aleatórios da página.
  4. **Cobertura em Auditoria:** Validado com 252/252 testes automatizados aprovados no Chrome Headless.

### 6.43 Proteção Universal de Tamanho Mínimo de Texto para Cópia (Páginas e Interfaces) [IMPLEMENTADO]
- **Contexto e Solicitação do Usuário:**
  * O sistema estava permitindo a seleção, cópia e contorno em palavras minúsculas soltas (como `"ou"`, de 2 caracteres) em texto comum da página, mesmo com a opção de limite mínimo configurada (padrão de 5 caracteres).
  * O rótulo e o escopo da opção foram estendidos de `"Tamanho Mínimo de Texto para Cópia em Interfaces"` para `"Tamanho Mínimo de Texto para Cópia"`, passando a atuar universalmente tanto em textos da página quanto em elementos de interface.
- **Regra e Texto Oficial Atualizado em `options.html`:**
  * **Rótulo:** `Tamanho Mínimo de Texto para Cópia`
  * **Texto de Ajuda (`setting-help`):** `Em textos da página ou elementos de interface, caso não seja um campo estruturado, evita a perda acidental do conteúdo da Área de Transferência quando inexistem teclas modificadoras (clique único, duplo ou arrasto sem combinações das teclas Ctrl ou Alt). Assim, se não for campo estruturado (data, CPF, etc.), exige no mínimo esta quantidade de caracteres para confirmar a cópia e o contorno.`
- **Implementação do Motor (`SelecionarCopiar.js`):**
  * `verificarProtecaoTamanhoMinimoInterface`: Se não houver tecla modificadora (`Ctrl` ou `Alt`) e o texto limpo (sem espaços) não for um campo estruturado forense (`!isTextoCampoEstruturadoForense(texto)`), exige `textoSemEspacos.length >= minimoCaracteresInterface`. Se for inferior, a cópia e o contorno flash são cancelados, preservando o conteúdo anterior da Área de Transferência.
  * Coberto por auditoria automatizada em `debug.js` (246/246 testes aprovados).

### 6.44 Correção e Padrão de Fábrica do Botão de Sentido de Ordenação de Guias [IMPLEMENTADO]
- **Contexto e Solicitação do Usuário:**
  * O switch de alternância do Sentido de Ordenação de Guias apresentava inconsistências visuais e comportamentais de estado ativo/desativo em relação ao texto descritivo.
- **Padrão de Fábrica e Comportamento Estabelecido:**
  * **Padrão de Fábrica:** `"Da Esquerda para a Direita (A-Z)"`, com o botão switch em estado **azul, ativo** (`checked = true`, valor `'esq_dir'`).
  * **Ao clicar no botão azul ativo:** Transiciona para o estado **desativo** (cinza/desmarcado, `checked = false`, valor `'dir_esq'`) e o texto descritivo muda imediatamente para `"Da Direita para a Esquerda (Z-A)"`.
  * **Ao clicar novamente (e vice-versa):** Transiciona de volta para o estado **ativo** (azul, `checked = true`, valor `'esq_dir'`) e o texto descritivo retorna para `"Da Esquerda para a Direita (A-Z)"`.
  * Compatibilizados `options.html`, `options.js`, `background.js` (persistência e defaults) e a suíte de auditoria em `debug.js` (246/246 testes aprovados).

### 6.45 Validação Matemática de Benefício INSS (NB) e Protocolo Administrativo [ANOTADO — ANÁLISE TÉCNICA CONCLUÍDA]
- **Contexto e Exemplo Submetido:**
  * Exemplo avaliado: `"Protocolo Administrativo nº 692364437 / NB 1300802143"`.
- **Diagnóstico Matemático e Algoritmos:**
  1. **Número de Benefício (NB) — `1300802143` (10 dígitos):**
     * **Algoritmo Oficial:** Módulo 11 com pesos `2, 3, 4, 5, 6, 7, 8, 9, 2` aplicados da direita para a esquerda sobre os 9 primeiros dígitos (`130080214`):
       $$\text{Soma} = (4\times2) + (1\times3) + (2\times4) + (0\times5) + (8\times6) + (0\times7) + (0\times8) + (3\times9) + (1\times2) = 8 + 3 + 8 + 0 + 48 + 0 + 0 + 27 + 2 = 96$$
       $$\text{Resto} = 96 \pmod{11} = 8$$
       $$\text{Dígito Verificador (DV)} = 11 - 8 = \mathbf{3}$$
     * **Resultado:** O DV esperado é **3**, que coincide exatamente com o 10º dígito informado (`3`). Portanto, `1300802143` é **100% válido matematicamente** pelo Módulo 11 do NB do INSS.
     * **Situação Atual no Addon:** O método [`validarNumeroBeneficioINSS`](file:///z:/AddonChrome-GovBR/src/mod-copia/AvisoFlutuante.js#L775) já implementa esse cálculo exato. Quando precedido por `"NB "` ou pontuado (`130.080.214-3`), ele já valida e exibe a Wiki Forense. Com a feature FEAT-03 (Seção 6.42), ele também será validado se clicado isoladamente sem máscara.
  2. **Protocolo Administrativo — `692364437` (9 dígitos):**
     * Diferente do NB (que possui DV oficial padronizado pela Dataprev), protocolos do Meu INSS / SAG / PAP são sequenciais gerados pelos sistemas de triagem administrativa. Se submetido a teste genérico de Mod11 como última barreira (FEAT-03), o sistema testa múltiplos pesos; se não validar, mantém a Regra de Ouro (silêncio total, zero popups de erro para evitar falso-positivo).

### 6.46 Separação Arquitetural de "NAVEGADOR: Gerenciamento de Guias e Janelas" e "TECLADO/MOUSE: Navegação por Teclado e Botões Laterais" em Módulos Independentes [ANOTADO — PENDÊNCIA IMPORTANTE]
- **Escopo da Separação:**
  1. **Módulo Independente de Navegador (`Gerenciamento de Guias e Janelas`):**
     * Extrair todas as rotinas de Janela Única (bloqueio de popups e preservação de janelas de autenticação Gov.br / ICP-Brasil / PJEOffice / Shodô), Abertura de Novas Guias em Primeiro/Segundo Plano, Reutilização de Guias Já Abertas (Anti-Duplicação de Links, proteção SPA/dirty e ações de conteúdo), Ordenação Hierárquica e Agrupamento por Domínio (Tab Groups) e Descarte Automático de Guias Inativas para um módulo físico próprio e desacoplado.
  2. **Módulo Independente de Teclado/Mouse (`Navegação por Teclado e Botões Laterais`):**
     * Extrair todas as rotinas de Navegação entre Abas com os Botões Laterais do Mouse (Botão 4 Voltar e Botão 5 Avançar), Colar com o Botão do Meio (Scroll Click e Histórico `Ctrl + Botão do Meio`), Navegação em Campos de Entrada usando o Teclado (`↑` e `↓`) e Atalho Inteligente `F1` (Prompt de IA / Assistente Gemini) para um módulo físico próprio e independente, desacoplado do motor de Seleção/Cópia Inteligente.

### 6.47 Varredura Completa do Código, Revisão Profunda de Comentários e Separação de Módulos [ANOTADO — PENDÊNCIA]
- **Escopo da Varredura e Documentação:**
  * Realizar varredura sistemática linha a linha no código-fonte de todos os módulos (`src/cfg/`, `src/mod-copia/`, `src/mod-pje/`), mapeando todos os pontos de acoplamento entre as rotinas de Cópia Inteligente, Navegação Web/Abas e Teclado/Mouse.
  * Revisar, expandir e enriquecer todos os comentários internos com detalhes exatos de funcionamento operacional, lógica de fronteiras, estruturas de dados manipuladas e regras de negócio.
  * Auditar continuamente o alinhamento com a Central de Ajuda (`options.html`), catálogo centralizado de regras (`exemplos.json`) e suíte de testes determinísticos de debug (`debug.js`).

### 6.48 Correção do Duplo Clique em Elementos Formatados Inline / Marca-Texto (`<mark>`) [RESOLVIDO E COBERTO POR TESTES]
- **Descrição do Bug:**
  * Ao dar duplo clique em um termo com formatação inline ou marca-texto isolado (ex: `<mark>marca-texto</mark>` em `options.html`), a rotina `tentarExpandirBlocoFormatadoDestaque` falhava por exigir prematuramente ao menos duas palavras com espaço interno (`/\S+\s+\S+/`).
  * Em consequência, o fluxo caía em fallback para expansão por pontuação, capturando o espaço em branco à direita (`marca-texto `) e estendendo a caixa do contorno flash verde além do fundo amarelo do marca-texto.
- **Solução Implementada:**
  * Modificada a rotina `tentarExpandirBlocoFormatadoDestaque` em `SelecionarCopiar.js`: quando o destaque decorre de tag inline explícita (`<mark>`, `<b>`, `<i>`, `<u>`, etc.) ou background CSS diferenciado (`usouTagInline`), a delimitação respeita estritamente o contêiner inline sem exigir multiplicidade de palavras e sem capturar espaços conectores externos.
  * Adicionado teste de homologação determinístico em `src/cfg/debug.js` (`EXPANSAO_FORMATADA_MARK_ISOLADO`), aprovando 289/289 testes com 100% de sucesso.

### 6.49 Arquitetura Especializada em Classes POO em Diretório Plano Único (`src/mod-copia/`) [ANOTADO — PROJETO FUTURO]
- **Diretriz de Design:** Desacoplar o atual arquivo monolítico `SelecionarCopiar.js` em **arquivos `.js` especializados mantidos todos dentro do mesmo diretório plano (`src/mod-copia/`) sem criação de subpastas**, onde cada arquivo instancia e exporta uma classe coesa e dedicada, aplicando as melhores práticas de Programação Orientada a Objetos (SOLID, Single Responsibility, High Cohesion, Encapsulamento estrito com campos privados `#`, métodos imutáveis e objetos selados com `Object.freeze`).
- **Otimização de Nomenclatura para Busca Rápida e Economia de Tokens:**
  * Para evitar nomes excessivamente longos, maximizar a velocidade de busca/indexação do Chrome e minimizar o consumo de tokens de contexto da IA em leituras/prompts, adota-se nomes concisos, intuitivos e padronizados em kebab-case no mesmo diretório:
    * `src/mod-copia/mod-copia.js` -> `class ModuloCopia` (Main / Fachada Orquestradora)
    * `src/mod-copia/copia-estagio1.js` -> `class EstagioUnidadeAtomica` (Estágio 1 — Unidade atômica e tokens)
    * `src/mod-copia/copia-estagio2.js` -> `class EstagioExpressoes` (Estágio 2 — Padrões compostos, maiúsculas e marca-texto `<mark>`)
    * `src/mod-copia/copia-estagio3.js` -> `class EstagioSentencas` (Estágio 3 — Frases, cláusulas e conectivo `:`)
    * `src/mod-copia/copia-estagio4.js` -> `class EstagioDelimitadores` (Estágio 4 — Delimitadores simétricos e aspas)
    * `src/mod-copia/copia-estagio5.js` -> `class EstagioParagrafos` (Estágio 5 — Parágrafo em 3 cliques)
    * `src/mod-copia/copia-estagio6.js` -> `class EstagioTabelas` (Estágio 6 — Linhas/células e acumulador)
    * `src/mod-copia/copia-geometria.js` -> `class GeometriaDOM` (Caret, coordenadas de clique, nós de texto e `Range`)
    * `src/mod-copia/copia-filtros.js` -> `class FiltrosHtml` (5 Níveis Progressivos de Filtros HTML e sanitização)
    * `src/mod-copia/copia-validadores.js` -> `class ValidadoresForenses` (Cálculos de Mod 11/97/10 e Wiki Forense)
    * `src/mod-copia/copia-minutas.js` -> `class PlaceholdersMinutas` (4 modos de seleção de placeholders sem cópia)
    * `src/mod-copia/copia-visual.js` -> `class FeedbackVisual` (Flash verde, polígonos SVG e MiniTips)
- **Papel do Arquivo Main (`mod-copia.js`):**
  * Ponto de entrada único e isolado (`class ModuloCopia`).
  * Constrói o grafo de dependências via injeção nos construtores, escuta eventos nativos do navegador com guardas de unicidade e canaliza chamadas de ponta a ponta sem poluição de escopo global e sem overhead de tokens.

---

### 6.19 Status de Implementacao (2026-10-30) e Historico de Entregas
* **Implementado e coberto por auditoria (182/182 testes):**
  * **Performance e Eliminação de Lentidão (Idempotência O(1) e Debounce de Injeção):**
    * Guardas de idempotência imediatas (`__JUSGOV_*_CARREGADO__` / `__JUSGOV_MOTOR_SELECAO_ATIVO__`) em `ConstantesPadroes.js`, `AvisoFlutuante.js`, `AcumuladorCopia.js` e `SelecionarCopiar.js`, impedindo recompilação repetitiva de dezenas de Regex e recriação de listeners DOM.
    * Remoção do registro dinâmico redundante em `background.js` e substituição da tempestade tripla de `executeScript` (`0ms / 250ms / 800ms`) por `agendarInjecaoSeguraNaAba` com debounce de `350ms` por aba.
    * Otimização de hot-paths DOM: `getComputedStyle` limitado à profundidade máxima de 6 níveis após checagens rápidas de tags/atributos; `caretRangeFromPoint` em O(1) antes de varredura de caracteres; eliminação de `querySelectorAll('*')` no `Escape`; neutralização de toasts/backdrops órfãos do PJe em `PJE-anti_ampuletas.css`.
  * **Separação Formal entre Seleção e Cópia (`aplicarSelecaoDOM` vs `executarCopiaDeSelecao`):**
    * Módulo de Seleção (`aplicarSelecaoDOM`) aplica o range, calcula e desenha o Flash Verde e decide a retenção ou limpeza imediata da seleção no DOM.
    * Módulo de Cópia (`executarCopiaDeSelecao`) sanitiza, formata, grava no clipboard do sistema e atualiza o clipboard simulado interno com backup.
  * **Distinção Refinada entre Áreas de Interface (UI) e Áreas de Texto/Leitura/PDF (`isAreaLeituraOuPdfConteudo`, `isTelaSistemaEstritaParaDesselecao`, `deveManterSelecaoAtivaNoDom`):**
    * Áreas de Leitura e camadas de conteúdo de PDF (`.textLayer`, `.pdfViewer`, `.page[data-page-number]`, `#viewerContainer`, exceto barras de ferramentas `.toolbar`, `#toolbarViewer`, `#toolbarContainer`) mantêm a seleção ativa no DOM após a cópia.
    * Áreas de Interface/Sistema (modais, diálogos, botões, links, menus, `.pje-etiquetas`, toolbar de PDF) removem imediatamente a seleção (`removeAllRanges()`) após copiar, mantendo o Flash Verde; arrastes curtos acidentais (`< 5` caracteres) sem `Alt` em UI estrita são ignorados; `Alt + Clique` prioriza blocos forenses antes do texto integral do controle.
  * **Simulação de Clipboard com Backup Anterior (`Botão do Meio` e `Ctrl + Botão do Meio`):**
    * Após gravar no clipboard do sistema, `salvarClipboardInternoComBackup` salva com `try/catch` e trava de 512KB o item anterior em `window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__` e o novo em `window.__JUSGOV_ULTIMO_CLIPBOARD__`.
    * Clique com o Botão do Meio cola o clipboard simulado atual; `Ctrl + Botão do Meio` cola diretamente o clipboard simulado anterior (sem alterar o clipboard principal).
  * Painel "Ultima Selecao" (substitui "Conteudo atual da Area de Transferencia"), sem leitura de clipboard e sem alertas de permissao.
  * "Ato INSS" generalizado para "Ato Adm" (testes com orgaos de 3 niveis e numericos ##/##/###/###).
  * Auto-copia de selecao ainda nao copiada (assinatura offsets+texto liberada ao desfazer a selecao, mesmo com mouse pressionado; rede de seguranca no mouseup).
  * Regra de bloco do ":" (clique no espaco apos ":" seleciona a sentenca inteira).
  * Contorno flash sem sobreposicao: so retangulos de texto, fusao por linha e um poligono unico em varias linhas.
  * **Guarda de Unicidade e Eliminação de Sobreposição Multi-Frame (Itens 1, 2 e 3):**
    * Isolamento estrito de subframes em `observarFramesDinamicos`: subframes com motor ativo (`__JUSGOV_MOTOR_SELECAO_ATIVO__`) não recebem listeners concorrentes do frame pai.
    * Mutex reativo global entre frames (`__JUSGOV_MUTEX_SELECAO_GLOBAL__`) e detecção de foco em `<iframe>` em `tratarMudancaSelecaoGlobal`.
    * Limpeza atômica profunda de contêineres de flash (`limparFlashBorderImediatamente`) em `document` e `window.top`, impedindo sobreposição e caixas fantasmas.
    * Ajuste de debounce e cancelamento de timers de `selectionchange` em cópias internas (`selecaoSendoAplicadaPeloAddon = true`).
  * **Condicionamento de Seleção em Não-Editáveis por Tempo de Flash/Box (Seção 6.22):**
    * Com Flash ativo (`tempoFlashBorderMs > 0`), aplica o Box visual e desseleciona do sistema (`removeAllRanges()`), eliminando concorrência visual com o destaque azul nativo.
    * Com Flash desativado (`tempoFlashBorderMs = 0`), preserva a seleção normal nativa do sistema.
* **Pendente (Salvo na fila para implementação futura):**
  * **Seleção de Texto de Leitura em PDF Embedded e Exceção da Interface do PDF (`viewer-toolbar` / `#toolbar` / `input#pageSelector`) (Seção 6.32):** Permitir seleção/cópia do texto de leitura em PDFs embarcados (`<pdf-viewer>`, `<embed type="application/x-google-chrome-pdf">`, `#content`/`#scroller`, `.textLayer`), mantendo toda a barra de ferramentas do PDF (`viewer-toolbar`, `div#toolbar`, `cr-icon-button`, `viewer-page-selector`, `input#pageSelector`, `#sidenav-container`) sob as regras estritas de interface/campo editável.
  * **Desacoplamento Físico em Módulos e POO Blindada (Seção 6.13 / Diretriz Root 11 / BP-01):** Isolar fisicamente em arquivos separados o Módulo de Seleção/Cópia Inteligente e o Módulo de Mudança de Interface/UI (Mouse 4/5, Scroll Click, Teclado, Auto-seleção de Inputs), aplicando encapsulamento POO com API pública congelada (`Object.freeze`).
  * **Barramento de Eventos Desacoplado (BP-02):** Comunicação intermodular via `CustomEvent` (`jusgovbr:*`) sem dependência direta entre arquivos.
  * **Identificação Única de Componentes (`Ctrl + Alt + Shift + Clique`) e Mapeamento Manual Avançado XPath/CSS (Seção 6.20):** Grupo recolhido em Configurações Avançadas para cadastrar regras locais (Textual, Interface ou Semiflexível) com exportação/importação JSON.
  * **Higienização de Handlers Globais em Subframes via `AbortController` (BUG-01):** Teardown determinístico no descarregamento de iframes dinâmicos.
* **Implementado no Ciclo Atual (243/243 testes aprovados):**
  * **Detecção Hierárquica de Editores (`pai`/`avô`/`ancestral` `contenteditable="true"`) e Exceção de Interface CKEditor (`cke_*` / `cke_*editor`) (Seção 6.31) [IMPLEMENTADO]:** Verificação do elemento clicado, pai, avô e cadeia ancestral até `ownerDocument.body` para `contenteditable="true"` / `.cke_editable`, auto-seleção de placeholders longos/complexos (`@@@@INSTITUTO...; @@@` e `#####`) e exclusão estrita da interface CKEditor (`cke_*`, `cke_*editor`).
  * **Fechamento Imediato de Popups de Auditoria e Mensagens Wiki Forense (Seção 6.30) [IMPLEMENTADO]:** Popups de checagem/auditoria (cálculo Mod 11/97 falhou, CPF/CNPJ/CNJ/NB/Data inválido e máscara amarela) e mensagens de instrução Wiki Forense (tipo de aposentadoria/benefício INSS, região fiscal do CPF, Matriz/Filial CNPJ, ramo CNJ, dia da semana) fecham imediatamente ao clicar com o mouse (`mousedown`), desselecionar o texto, pressionar `Escape`/`Enter`, rolar a página ou perder foco, acompanhando o comportamento do Flash Temporizado.
  * **Seleção Integral Multilinhas de Links com `Alt + 3 Cliques` (Seção 6.28) [IMPLEMENTADO]:** Ao dar `Alt + 3 cliques` sobre um link (`<a>` ou `[role="link"]`), seleciona todo o texto visível do link (mesmo que ocupe duas ou mais linhas, possua `<br>`, múltiplos blocos ou `> 120` caracteres), unificando tudo em uma única linha separada por espaços simples (`extrairTextoLinkUmaLinha`).
  * **Refinamento do CSS Anti-Ampulhetas em Operações em Lote (Seção 6.21) [IMPLEMENTADO]:** Preservação de barras de progresso e modais de assinatura/movimentação em lote (`mpProgresso`, `pje-assinatura-lote`, `mat-progress-bar`, `p-progressbar`, `.rich-progress-bar`, `[role="progressbar"]`).
  * **Destruição Imediata do Flash em Modais Críticos (BUG-02) [IMPLEMENTADO]:** Garantia de `pointer-events: none !important` e destruição atômica imediata em `Enter`, `Escape` e em modais/diálogos críticos (`[role="dialog"]`, `[role="alertdialog"]`, `.modal`, `.rich-modalpanel`).
  * **Catálogo Hierárquico Append-Only (`src/cfg/exemplos.txt` e `src/cfg/exemplos.js` — Seção 6.29) [IMPLEMENTADO]:** 8 casos de uso e 15 máscaras cobrindo todos os exemplos de `options.html` + adicionais positivos e negativos, validados em `src/cfg/debug.js`.

## 7. RADAR AUTÔNOMO DE ANÁLISE DE ENGENHARIA (BUGS, BOAS PRÁTICAS E NOVAS FUNCIONALIDADES IDENTIFICADAS)

> [!NOTE]
> Esta seção é mantida em separado do backlog de demandas diretas do usuário (Seção 6). Ela registra ativamente e continuamente tudo o que for identificado de forma autônoma pela análise de engenharia durante o ciclo de inspeções, diagnósticos, logs e leitura de código.
> Quando o usuário solicitar um levantamento de pendências de mudanças, correções/bugs ou previsibilidade de novas funcionalidades, esta seção somada à Seção 6 fornecerá a resposta estruturada completa e exaustiva.

### 7.1 Bugs e Falhas Potenciais Identificados pela Análise de Engenharia
- **BUG-01: Vazamento de Handlers Globais em Subframes Descarregados [PENDENTE]:**
  * *Descrição:* Ao navegar ou substituir dinamicamente páginas em iframes sem reload completo da janela-mãe, listeners atachados diretamente em `window` ou `document` do subframe podem permanecer referenciados em memória antes do garbage collector atuar.
  * *Ação Preventiva:* Adicionar rotina de teardown explícito em `beforeunload` ou via `AbortController` com `signal` compartilhado por ciclo de vida do frame.
- **BUG-02: Sobrescrita de `z-index` de Overlays do PJe e PDPJ [IMPLEMENTADO]:**
  * *Descrição:* O contorno do Flash Verde possui `z-index: 2147483647`. Caso surja um diálogo nativo de confirmação ou modal crítico do tribunal que necessite de foco modal estrito, o contorno poderia sobrepor botões desse modal antes de seu timeout expirar.
  * *Solução Implementada:* Garantido `pointer-events: none !important;` e destruição atômica imediata ao detectar `keydown` (`Escape`/`Enter`), clique em modal ou surgimento de modal crítico no DOM.
- **BUG-03: Sincronização Duplicada de `turboCSS` vs `PJE-anti_ampuletas.css` [IDENTIFICADO NA ANÁLISE DE CÓDIGO]:**
  * *Descrição:* As regras CSS de desbloqueio do PJe existem tanto em `src/mod-pje/PJE-anti_ampuletas.css` quanto na string `turboCSS` em `src/mod-copia/SelecionarCopiar.js`.
  * *Ação Futura:* Unificar sob o módulo `mod-pje` durante o Desacoplamento Físico em Módulos (Seção 6.13).
- **BUG-04: Concentração Monolítica em `SelecionarCopiar.js` (~7.900 linhas) [IDENTIFICADO NA ANÁLISE DE CÓDIGO]:**
  * *Descrição:* `SelecionarCopiar.js` concentra atualmente motor geométrico de seleção, filtros HTML em 5 níveis, conversão de cabeçalhos PJe, gestos de mouse (botões 4/5 e botão do meio), navegação por teclado entre campos e injeção de CSS.
  * *Ação Futura:* Fatiar em submódulos independentes (`FiltroFormatacaoHtml.js`, `InteracaoMouseTecladoUI.js`, `MotorGeometriaFlash.js`) na refatoração de Desacoplamento Físico e POO Blindada.

### 7.2 Oportunidades de Boas Práticas e Refatoração Arquitetural (Futura Otimização)
- **BP-01: Desacoplamento Físico em Módulos e POO Blindada (`JusGovBR.Copia`, `JusGovBR.UI`, `JusGovBR.PJe`):**
  * *Descrição:* Em cumprimento à Diretriz Root 11, converter todos os scripts de conteúdo e service worker para objetos selados (`Object.freeze`) com API pública explícita e métodos privados blindados via closures ou campos privados (`#metodoPrivado`).
- **BP-02: Barramento de Eventos Desacoplado (`EventBus` Local / `CustomEvents`):**
  * *Descrição:* Em vez de acoplamento direto entre arquivos de script que compartilham o mesmo frame, utilizar um barramento leve de eventos customizados (`document.dispatchEvent(new CustomEvent('jusgovbr:acao', ...))`), permitindo que módulos assinem eventos de forma 100% desacoplada e sem risco de quebra quando um módulo estiver ausente.
- **BP-03: Pré-Compilação de Expressões Regulares Ancoradas em `ConstantesPadroes.js`:**
  * *Descrição:* Evitar `new RegExp('^(?:' + rx.source + ')$', ...)` em tempo de execução dentro de `isTextoCampoEstruturadoForense`, pré-compilando-as uma única vez no dicionário estático.

### 7.3 Previsibilidade de Novas Funcionalidades e Evolução do Sistema
- **FEAT-03: Validação Matemática Genérica Fallback para Números Não-Identificados em Balão Cinza (Seção 6.42) [IMPLEMENTADO]:**
  * Mecanismo de última barreira que testa algoritmos de dígitos verificadores (Mod 11 múltiplos pesos, Mod 97, Mod 10, CPF, CNPJ, etc.) em números puros, pontuados incompletos ou alfanuméricos.
  * Se aprovado, exibe balão em cinza neutro no formato `[Mod11]: <u>nnnnnnnn</u> ✓`; se não aprovado, permanece 100% silencioso.
- **Alt + 3 Cliques em Links (Seção 6.28) [IMPLEMENTADO]:** Seleção integral multilinhas de links unificando o texto em linha única separada por espaços.
- *(FEAT-01 e FEAT-02 dispensadas pelo usuário).*





















