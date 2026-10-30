# JUSGOVBR - BLUEPRINT MESTRE DE ENGENHARIA E ESPECIFICACAO INTEGRAL DE RECONSTRUCAO
Projeto: JusGovBR - Copia Inteligente & PJe Turbo (Manifest V3 - Chromium 116+)
Autor / Contato: smarca@gmail.com
Finalidade: Fonte unica da verdade (Single Source of Truth) para arquitetura, regras root imutaveis e integridade dos 10 modulos.
Documento Complementar: [DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md](DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md) (Diretrizes de Desenvolvimento, Logs, Regras Root e Suite de Testes).

---

## 1. DIRETIVAS ROOT DE ENGENHARIA E OPERACAO

1. DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso; sugerir preliminarmente e na ordem exata:
   (a) Eventuais Correcoes
   (b) Mudancas de Boas Praticas
   (c) Novas Features
2. PRESERVACAO DOCUMENTAL ABSOLUTA: Proibido apagar, resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario explica o *porque* (regras de negocio, falhas do framework PJe/RichFaces/Angular, otimizacoes V8/Blink e protecoes de Regex Unicode).
3. INTRA-COMENTARIOS DE RECONSTRUCAO: O fluxo de dados ("Passo X.Y") e mantido intercalado no corpo de cada metodo.
4. CODIFICACAO PADRAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS):
   - Arquivos .js, .html, .css, .json e .md mantidos em UTF-8 padrao sem BOM.
   - Uso direto e nativo de caracteres acentuados (ç, ã, õ, é, í, ó, ú, etc.) no codigo, templates e documentacao.
   - Proibicao estrita de entidades HTML (&ccedil;, &otilde;, &eacute;, etc.) em interfaces visuais e codigo, restritas unicamente a regex ou parsers brutos.
   - Declaracao explicita de <meta charset="UTF-8"> em HTML e @charset "UTF-8"; em CSS.
5. COPIA SILENCIOSA E INTEGRIDADE FUNCIONAL:
   - Proibido exibir baloes de "Copiado!" em copias simples validas.
   - O aviso flutuante surge apenas em 3 situacoes: (1) Erro matematico/calendario ambar (CPF, CNPJ, CNJ, Data); (2) Estatisticas do Acumulador/Tabelas (Ctrl+Alt); (3) Mini-Tip global temporario no topo da tela (Duplo Esc ou F1).
6. SINCRONIZACAO TOTAL BLUEPRINT E SANDBOX: Central de Ajuda, options.html, area de testes interativos e debug.js permanentemente sincronizados.
7. FLUXO AUTONOMO NA IDE: Gravacao direta em disco sem exigir "Accept All" do usuario e sem forcar abertura de abas no editor.
8. BACKUP PADRONIZADO OBRIGATORIO (POLITICA INTELIGENTE DE CADENCIA):
   - Destino estrito: bkp/ (relativo a raiz do projeto).
   - Nomenclatura: bkp_AAAA-MM-DD_HH-MM.zip
   - Conteudo: Todos os arquivos e subdiretorios da raiz, aplicando filtros estritos:
     (a) Exclui a propria pasta bkp;
     (b) Exclui arquivos e pastas iniciados por '.' (ex: .vscode, .git);
     (c) Exclui arquivos e pastas iniciados por 'leia-me' (case-insensitive);
     (d) Exclui a pasta 'tmp' (arquivos temporarios nao sujeitos a backup);
     (e) Exclui a pasta 'outros' (pasta auxiliar fora do backup).
   - Gatilhos de Execucao (Media de ~5 backups/dia em trabalho intenso):
     (a) Inicio do dia de trabalho / primeira sessao;
     (b) Periodico a cada 3 horas de trabalho ativo continuo;
     (c) Virada de data ("rodar o dia" apos 00:00 meia-noite);
     (d) Imediatamente antes de alteracoes estruturais, mudancas radicais ou grandes refatoracoes;
     (e) Apos compilacoes ou baterias de testes aprovadas com alto volume de modificacoes;
     (f) Sob demanda, sempre que solicitado pelo usuario no prompt ("backup", "fazer backup").
   - Scripts oficiais relativos: util/fazer_backup.ps1 e util/fazer_backup.bat.

---

## 2. REGRAS ROOT INFLEXIVEIS E IMUTAVEIS DO MOTOR DE SELECAO

Para aprofundamento das regras de negocio, logs e suite de testes, consulte [DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md](DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md).

### 2.1 Tipo Base de Selecao (Unidade Atomica O(1))
- Ao clicar em texto comum com 1 clique unico, o motor isola a Unidade Atomica Base (palavra simples ou token juridico pontuado contiguo).
- A tabela tipada Uint8Array(128) classifica instantaneamente caracteres ASCII em tempo O(1) (~2ns), delimitando inicio e fim sem sobrecarga da engine de regex.

### 2.2 Prefixos e Rotulos de Selecao (PALAVRA_ROTULO_INICIAL)
- Quando o usuario da 1 clique direto sobre a palavra que atua como rotulo/prefixo designador ("id", "fls.", "pag.", "art.", "Lei", "no", "cpf", "cnpj", "processo", etc.):
  - O motor NAO seleciona apenas a palavra "id" ou "art.".
  - O motor engloba e captura imediatamente o IDENTIFICADOR SUBSEQUENTE!
  - Excecao estrita: As palavras "inciso", "alinea" e "paragrafo" NAO sao rotulos capturadores; 1 clique direto sobre elas seleciona apenas a palavra em si.
- Conectores de Intervalo ("a", "ate", "as", "c/c"): 1 clique direto sobre o conector expande automaticamente a expressao conectada (ex: clicar em "a" em "01/01/2026 a 31/12/2026" captura o intervalo completo).

### 2.3 A Regra Inegociavel da Virgula (,) e Ponto e Virgula (;)
- A virgula `,` e o ponto-e-virgula `;` atuam estritamente como fronteiras intermediarias de clausula.
- E proibido colar virgula ou ponto-e-virgula na palavra clicada (clicar em "Brasilia," seleciona e copia exclusivamente "Brasilia").

### 2.4 A Grande Regra Root: "Espaco" = Dois Cliques
- Clicar sobre o espaco em branco interno entre duas palavras ou blocos de uma expressao composta equivale funcionalmente a dar DOIS CLIQUES na expressao!
- Exemplos de Equivalencia:
  - Multiplos Numeros Espacados / Boletos ("215 7014 6992 8831"): 1 clique em um numero isolado pega apenas o numero ("6992"); 1 clique no espaco interno OU 2 cliques seleciona a cadeia inteira!
  - Valores com Extenso ("R$ 65,00 (sessenta e cinco reais)"): 1 clique em 65,00 pega 65,00; 1 clique no espaco entre 65,00 e "(" OU 2 cliques seleciona a expressao completa com extenso!
  - Numeros com Extenso ("65 (sessenta e cinco)"): 1 clique em 65 pega 65; 1 clique no espaco antes de "(" OU 2 cliques pega "65 (sessenta e cinco)"!
  - Moeda ("R$ 65,00"): 1 clique em 65,00 pega 65,00; 1 clique no espaco entre "R$" e 65,00 OU 2 cliques pega "R$ 65,00"!
  - Delimitadores Simetricos ("( algo )"): 1 clique no espaco colado a borda pega o miolo "algo"; 2 cliques pega o bloco incluindo os delimitadores "( algo )"!
  - Palavras em Caixa Alta ("REGULAR PROSSEGUIMENTO DO FEITO"): 1 clique no espaco interno OU 2 cliques seleciona todo o conjunto contiguo em maiusculas!
  - Palavras com Destaque Formato (negrito, italico): 1 clique no espaco interno OU 2 cliques seleciona o bloco formatado continuo!

### 2.5 O Switch de Ida e Volta: Expansao, Minoracao e Ciclo Circular Continuo
O motor opera um ciclo deterministico de transicao dinamica de estados baseado no principio de zoom concentrico circular:
1. Movimento de Expansao Progressiva (Do Minimo ao Maximo):
   - Se a selecao esta minimizada (ou inexistente), cliques e interacoes subsequentes promovem a selecao sucessivamente para degraus mais amplos:
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
- Em entidades pontuadas (CPF, CNPJ classico e alfanumerico, Processo CNJ, SEI!, CEP, Data, Telefone): Extrai exclusivamente caracteres alfanumericos sem pontuacao e preenche zeros a esquerda no sequencial de 7 digitos do CNJ ("0991234-65.2024.4.01.4002" -> "09912346520244014002").
- Em texto comum: 1o Shift+Clique posiciona a ancora; 2o Shift+Clique copia o intervalo entre os dois pontos.

### 2.7 Modo Elastico (Ctrl Isolado ou Alt Isolado) e Links Nativos
- Ctrl (isolado em texto comum): Continua, expande ou retrai a selecao por palavras/blocos via clique ou arrasto.
- Ctrl + Clique sobre Link (<a href>): Preserva integralmente o padrao nativo do navegador (abrir o link em nova aba em segundo plano) sem bloqueio ou interceptacao.
- Alt (isolado): Inicia sempre uma nova selecao sobre elementos interativos (botoes, links, menus, abas), copiando todo o texto do objeto com 1 clique ou permitindo Alt + Arrastar sobre partes do elemento; Alt+Shift+Clique faz download/abertura direta; Ctrl/Alt + Duplo Clique em linha de tabela (<tr>) copia com "|".

### 2.8 Modo Acumulador Completo (Ctrl + Alt)
- Concatena itens separados e encerrados por separador (padrao ";").
- Absorcao Previa Automatica: Se ja havia selecao ativa na tela ao acionar Ctrl+Alt, absorve-a na posicao 0.
- Ordenacao Crescente Natural DOM (sem Shift) vs. Modo Baralho no final da lista (com Shift).
- Proibicao de duplicatas e Toggle-Off (re-clicar desmarca e apaga CSS Custom Highlight).
- Desfazer Ultima Carta (Ctrl + Alt + Clique Direito).
- Aviso flutuante exibe estritamente metricas operacionais, jamais o texto acumulado.
- Separador configuravel: maximo 5 caracteres, proibido letras e numeros, reverte para ";" se vazio.

### 2.9 Regra de Tempo Zero (0 = Desativado, >0 = Ativo)
- Configurar tempo em 0ms significa estritamente DESATIVADO.
- Valores maiores que zero ativam o recurso pelo tempo especificado.
- Aplica-se a tempoAvisoMs (alertas visuais) e tempoFlashBorderMs (contorno flash).

### 2.10 DIRETRIZ ROOT IMUTAVEL: PRESERVACAO ABSOLUTA DA NAVEGACAO E INTERACAO NATIVA EM INTERFACES WEB (SEM MODIFICADORES)
- O addon JusGovBR jamais deve atrapalhar, atrasar, interceptar ou bloquear a navegacao comum e a manipulacao nativa do usuario em interfaces web (sites, sistemas em nuvem, web apps como Google Gemini, Gmail, PJe, etc.).
- A copia automatica em 1 clique (e demais interacoes padrao sem teclas modificadoras) atua estritamente em conteudo estatico de leitura segura (artigos, sentencas, decisoes, despachos, peticoes, visualizadores de PDF e textos comuns exibidos ou selecionaveis pelo navegador).
- Em qualquer elemento de interface interativa do navegador ou da aplicacao web (botoes, dropdowns, seletores de modelos como "Flash v", icones de microfone/audio, menus, abas, links, caixas de selecao, controles customizados de frameworks como Wiz, Angular, Lit, Web Components com Shadow DOM):
  - Cliques comuns (1 clique, duplo clique, com ou sem pequeno arrasto, sem modificadores) passam 100% livres, diretos e nativos para a pagina web.
  - Zero preventDefault, zero stopPropagation, zero ignorarProximoClick, zero alteracao da selecao do DOM (window.getSelection()), zero copia espuria.
  - Preservacao Soberana do Arrasto de Selecao: Se nativamente, sem o addon, o usuario conseguiria selecionar um texto (seja no Google Gemini, em paginas web, conteudos mistos ou interfaces ricas), o texto selecionado por arrasto de mouse DEVE ser integralmente preservado e copiado pelo addon. Jamais deve haver remocao forcada da selecao nativa do usuario ('removeAllRanges') quando houver texto efetivamente selecionado. Cliques e pequenos desvios sem selecao de texto continuam passando 100% livres aos controles nativos da pagina.
- As teclas modificadoras (Alt, Ctrl, Shift, Ctrl+Alt) sao o gatilho exclusivo de intencao deliberada do usuario de manipular o addon / copiar texto sobre qualquer elemento (ex: Alt + Clique copia o texto do botao/link).
- Cliques comuns (1, duplo, triplo clique), sem teclas modificadoras, com ou sem arrasto continuam selecionando e copiando palavras/blocos com total agilidade exclusivamente em textos comuns de leitura e arquivos PDF.

### 2.11 Atalho F1 para Prompt de IA / Assistente (Painel Lateral e Aba Web)
- Interpola a tag {{TEXTO}} no template generico de Prompt de IA (apresentado em fonte condensada Tahoma e alinhado a esquerda nas opcoes) com o trecho selecionado, grava imediatamente na Area de Transferencia (clipboard) e notifica o usuario com Mini-Tip claro: "Prompt de IA copiado! Cole com Ctrl+V no painel lateral ou utilize a aba aberta".
- Bloqueia o evento nativo F1/help do navegador.
- No Painel Lateral nativo do navegador (isolado pelo sandbox nativo contra scripts de extensao), o usuario apenas cola com Ctrl+V no campo de prompt ("Digite / para usar as habilidades"). Na aba web aberta do assistente de IA, o Service Worker injeta o texto automaticamente via chrome.scripting.executeScript apos a conclusao do carregamento.

### 2.12 Atalho Duplo Esc (com debounce de 60ms a 420ms) e Desselecao Universal Profunda
- 1 Esc: Desselecao universal profunda multi-contexto (Blink selection.empty(), removeAllRanges(), collapseToStart(), document.execCommand('unselect'), reset de inputs/textareas, varredura recursiva de iframes/frames/shadowRoots e broadcast cross-origin via Service Worker). Limpa acumulador e alertas da tela sem jamais alterar o clipboard.
- 2 Escs sequenciais rapidos (60ms a 420ms): Opera como switch de alternancia instantanea entre "Remover Formatacoes (Somente Texto)" e o Nivel de Filtro de Estilos selecionado no slider, projetando Mini-Tip global temporario e preservando intacta a posicao do slider.

### 2.13 Arquitetura Progressiva de Filtros HTML em 5 Niveis e Regra de Ouro
- Dinamica de Negocio do Switch e do Slider:
  - O controle "Remover Formatacoes (Somente Texto)" e o interruptor principal (switch). Quando ativado, a copia atua exclusivamente em Texto Puro (Nivel 0).
  - O slider "Nivel de Filtro de Estilos" possui 4 posicoes (1: Basico, 2: Intermediario, 3: Avancado, 4: Estendido). O slider NAO possui a posicao "0 - Texto Puro", pois Texto Puro e funcao exclusiva do switch "Remover Formatacoes".
  - Quando "Remover Formatacoes" estiver marcado, o slider e desativado (disabled e com opacidade reduzida), preservando o nivel configurado. Quando desmarcado (ou via Esc+Esc), o slider se ativa e a copia usa o nivel selecionado.
- Direcao Unidirecional Ascendente: Cada nivel herda rigorosamente as regras do nivel anterior e adiciona sua camada de permissao (allowlist). Tipografia de origem (font-family e font-size) e sujeiras MSO/Word sao sempre expurgadas.
- Pipeline Estruturado em 3 Estagios de Filtragem:
  1. Filtro 1 (Dados): Higienizacao inicial de caracteres incorretos, lixo de PDF, zero-width (\u200B-\u200D, \uFEFF, \u2060), soft-hyphens (\u00AD), caracteres de controle estranhos (< 32 exceto \r, \n, \t) e normalizacao de espacos nao-quebraveis (\u00A0, &nbsp;) para espaco comum ' '.
  2. Filtro 2 (Estruturas de Documento): Conversao semantica de estilos nos niveis corretos (Niveis 1 a 4) ou extracao de Texto Puro estruturado (Nivel 0 ou Regra de Ouro), convertendo quebras <br>/<hr> e elementos de bloco (<p>, <div>, <li>, <tr>, <h1>-<h6>, etc.) em quebras de linha reais (\n).
  3. Filtro 3 (Informacoes e Normalizacao Tipografica): Processamento de conteudo executado estritamente apos os estilos:
     - Preservacao estrita de novas linhas reais (\n) entre linhas de conteudo util.
     - Supressao total de linhas em branco vazias (seja geradas por paragrafos vazios, tags <br> repetidas ou espacos).
     - Remocao de espacos/tabs nas bordas inicial e final de cada linha (trim por linha).
     - Reducao de espacos horizontais duplicados indefinidamente no interior da linha para um unico espaco, corrigindo tabulacoes manuais incorretas.
- Tabela Sintetica dos 5 Niveis Progressivos de Filtragem:

| Nivel | Denominacao | Escopo Semantico & Sanitizacao | Alvo / Destino |
|:---:|:---|:---|:---|
| **0** | **Texto Puro** | Remove 100% das tags HTML/XML, converte entidades (`&nbsp;` -> espaco, `&amp;` -> `&`, `&lt;` -> `<`, `&gt;` -> `>`), normaliza quebras de linha (`\r\n` -> `\n`). Sanitizacao ativa extraindo o conteudo exclusivamente via no de texto DOM (`node.textContent`) para evitar injecao de tags orfas ou caracteres invisiveis. | `input`, `textarea`, logs, variaveis de busca, campos de sistema legados sem suporte a markup. |
| **1** | **Basico (Inline)** | Apenas formatacao de caracteres: `b`, `strong`, `i`, `em`, `u`, `s`, `sub`, `sup`, `span`, `br`. Proibido qualquer atributo CSS de bloco ou quebras estruturais. | Caixas de comentario simples, notas rapidas de processo, chats institucionais e campos restritos. |
| **2** | **Intermediario (Paragrafo/Fluxo)** | Permite Nivel 1 + `p`, `blockquote`, `ul`, `ol`, `li`, `hr`. CSS restrito a alinhamento (`text-align: left\|right\|center\|justify`) e recuo simples (`margin-left`, `text-indent`). Sem tabelas ou quebras de layout complexas. | Editores de texto web padrao (CKEditor / TinyMCE basicos), despachos simples, certidoes. |
| **3** | **Avancado (Documental / RTF classico)** | Permite Nivel 2 + titulos (`h1`-`h6`), blocos pre-formatados (`pre`, `code`), tabelas estruturadas (`table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`). CSS inline restrito a bordas basicas, preenchimento (`padding`) e larguras de coluna (`width`). | Editores RTF completos, relatorios formatados, minutas de sentenca com tabelas de calculo e jurisprudencias. |
| **4** | **Estendido (Suites Office / Canvas)** | Permite Nivel 3 + imagens (`img`), atributos de celula (`colspan`, `rowspan`), metadados de quebra de pagina/secao, listas multinivel aninhadas e containers controlados (`div`). Mantem compatibilidade com schemas complexos sem executar scripts. | Suites de escritorio em nuvem (Google Docs, LibreOffice Online, Microsoft 365), sistemas de diagramacao e exportacao para DOCX/ODT. |

- Regra de Ouro: Em qualquer nivel de estilo (Niveis 1 a 4), clicar sobre um bloco forense/estruturado (CNPJ, CPF, CNJ, Data, Moeda, Telefone, Boletos, etc.) ou sobre uma palavra unica copia estritamente SOMENTE TEXTO PURO (text/plain). Frases, paragrafos e tabelas cumprem a formatacao ativa.

### 2.14 Acelerador PJe Turbo (Anti-Ampulhetas)
- Neutraliza cortinas de bloqueio JSF/RichFaces e Angular/PrimeNG no PJe (pointer-events: none, opacity: 0, contain: strict, content-visibility: hidden). Destrava cursores wait/progress para default e zera transicoes.

### 2.15 Regra Cirurgica de Data Numerica com Horario Contiguo, Espacado (HH:MM / HH:MM:SS) e Conectores
- Suporte integral a ambos os formatos de horario acoplado: "DD/MM/AAAA HH:MM" (sem segundos) e "DD/MM/AAAA HH:MM:SS" (com segundos), alem de separadores com hifen ("28/10/2026 - 06:28:50"), en-dash e "as".
- 1 clique sobre a data numerica isolada: seleciona apenas a data ("28/10/2026").
- 1 clique sobre o horario isolado: seleciona apenas o horario ("06:28" ou "06:28:50").
- 1 clique sobre o separador intermediario (espaco em branco, hifen "-", traco, "as", virgula): seleciona Data + Horario por inteiro ("28/10/2026 06:28", "18/09/2026 10:03:34" ou "28/10/2026 - 06:28:50").
- 2 cliques em qualquer ponto (ou clique no espaco interno via "Espaco = 2 Cliques"): seleciona Data + Horario por inteiro.
- Auditoria Matematica Obrigatoria Encadeada: Valida rigorosamente tanto a data no calendario civil gregoriano (anos bissextos, meses de 30/31 dias, dias inexistentes) quanto as horas (00-23), minutos (00-59) e segundos opcionais (00-59). Dispara alerta ambar explicativo de inconsistencia ("Data Invalida" ou "Horario Invalido") sem bloquear a transferencia para a Area de Transferencia.
- Blindagem de Ponto Final de Sentenca em Datas: Reconhece datas isoladas seguidas de ponto final ortografico de encerramento de sentenca (ex: "Itabuna, 01.05.19.") sob o catalogo forense DATAS_E_HORARIOS atraves da mascara (?![\p{L}\p{N}\/\-]|\.\p{N}), garantindo auditoria automatica e impedindo falso positivo em cadeias de versao ou IPs.
- Filtro de Fuso Horario Seguro: Captura exclusivamente siglas de fuso legais ("BRT", "BRST", "UTC", "GMT"), impedindo captura de palavras comuns do portugues (ex: "nos", "em", "de").

### 2.16 Revisao da Caixa de Mensagens de Console, Neutralizacao de Redirecionamento e Botao Fuzzing (1s/T)
- Neutralizacao de Redirecionamento em Testes Unitarios:
  - No teste unitario CTRL_CLIQUE_LINK_PADRAO_BROWSER (Bateria 7 de debug.js), o elemento de teste `<a href="https://pje1g.trf1.jus.br/processo/1000">` agora anexa listeners dedicados na fase de borbulhamento que capturam o estado `ev.defaultPrevented` (comprovando que o motor em captura nao bloqueou o evento nativo) e chamam `ev.preventDefault()` e `ev.stopPropagation()`.
  - Essa blindagem impede categoricamente que o navegador realize a navegacao real da aba de opcoes para a URL do PJe ao acionar "Auditoria" ou "Fuzzing (1s/T)".
- Botao Fuzzing (1s/T) e Execucao Resiliente:
  - O botao de Fuzzing na interface de opcoes foi renomeado de "Fuzzing (1s)" para "Fuzzing (1s/T)" para refletir com exatidao que a duracao configurada (1 segundo) e aplicada por tipo de teste (CPF, CNPJ Tradicional, CNPJ Alfanumerico, Processo CNJ, Datas/Bissextos e Limites de Cursor).
  - Inclui protecao de estado visual (desativa o botao durante a execucao, exibe rotulo "Executando...", dispara toast e restaura o botao em bloco finally).
  - Exibe o relatorio consolidado no painel `<pre id="painelResultadoAuditoria">`, com auto-scroll suave e registro de resumo no visor de console.
- Sincronizacao da Caixa "Mensagens de Console":
  - Acoes explicitas do usuario acionadas no cabecalho da caixa (Auditoria, Fuzzing e Limpeza) registram entradas formatadas diretamente no historico do visor com prefixo temporal e severidade `[info]` ou `[error]`.
  - O botao "Limpar" esvazia simultaneamente o array de historico, zera o contador `lblContadorConsole` para "0", redefine o texto padrao do visor e oculta o painel de auditoria.

### 2.17 Ergonomia de Layout: Fixacao Dimensional de Sliders, Card Dropdowns e Varredura de HTMLs
- Slider de Nivel de Filtro de Estilos:
  - O container de configuracao foi reestruturado com linha superior para titulo e controle, e linha inferior com 100% de largura para a descricao detalhada de ajuda.
  - O container do slider possui dimensao fixa (`width: 380px; box-sizing: border-box`), o trilho possui largura estrita (`width: 130px; flex-shrink: 0`) e o badge possui largura padronizada invariante (`width: 210px; min-width: 210px; max-width: 210px`).
  - Essa fixacao impede terminantemente que a alteracao do rotulo (de 1 a 4) expanda ou contraia o badge, evitando qualquer compressao do botao de correr ou deslocamento do texto explicativo abaixo.
- Alinhamento dos Cards na Grade de Opcoes:
  - Os cartoes de "Modo de Ativacao do Motor" e "Comportamento do Icone da Extensao" adotam empilhamento vertical balanceado (`flex-direction: column; justify-content: space-between`).
  - Os seletores `<select>` ocupam 100% da largura interna do card (`width: 100%; box-sizing: border-box`), eliminando sobreposicao ou transbordo alem da borda direita e conferindo espaco amplo para o texto explicativo.
- Bateria 8: Varredura de Cliques nos Arquivos HTML (popup.html e options.html):
  - Extracao exaustiva de todas as sentencas e palavras reais dos arquivos HTML da extensao.
  - Simulacao automatizada nos 5 limites obrigatorios de cada palavra: primeira letra de inicio, uma posicao antes, ultima letra, uma posicao depois e meio interno randomico.
  - Testagem de ampliacao (2 cliques), desampliacao (3 cliques / minoracao), expansao e retracao elastica com Control e comprovacao da Regra de Ouro (palavra unica copia sempre texto puro).

### 2.18 COBERTURA COMPLETA DE NUMEROS COM SINAL POSITIVO E NEGATIVO (+ OU -), MOEDAS E PERCENTUAIS
- Expansao do Catalogo Forense (Grupo 11: FINANCEIRO_E_DECIMAIS) em ConstantesPadroes.js:
  - Sub-tipo 10.1 (Moeda em Reais): Suporte pleno a sinais unarios (+ ou -) antes ou depois de R$, incluindo caracteres ASCII (+ e -), menos matematico Unicode (\u2212) e en-dash (\u2013). Exemplos: "R$ -1.000,00", "R$ - 1.000,00", "R$ +1.000,00", "-R$ 1.000,00".
  - Sub-tipo 10.2 (Formatos Percentuais): Suporte pleno a sinais unarios (+ ou -) no inicio de percentuais: "+0,25%", "-0,45%", "+1%", "-10%", "-1.233,00%".
  - Sub-tipo 10.3 (Numeros com Sinal Explicito): Captura de decimais e inteiros com sinal unario: "+0,25", "-0,45", "+1", "-1.233,00", "+1.233,00", "-1.000", "+100". Blindagem com lookahead negativo para evitar falso-positivo em marcadores ou quebras de sentenca.
- Refinamento de Expansao Atomica (Estagio 1) em SelecionarCopiar.js:
  - Clique direto sobre o sinal (+ ou -): detecta digito subsequente e expande o numero completo com seu respectivo sinal.
  - Clique sobre o corpo do numero: retrocesso backward absorve virgula decimal e o sinal unario (+ ou -) na fronteira inicial.
  - Suporte cirurgico a moedas compostas: clique em R$ seleciona o bloco monetario completo ("R$ -1.000,00"), enquanto clique no valor extrai o numero assinado ("-1.000,00").
- Suite de Testes em debug.js:
  - Adicionados 12 novos testes em Bateria 2 (G11) e teste dedicado de simulacao de cliques em sinais e digitos na Bateria 8, elevando a suite para 138 testes deterministicos aprovados (100% de sucesso).

### 2.19 DIFERENCIACAO DIDATICA: INTERFACE LEIGA NAS CONFIGURACOES VS. GUIA TECNICO NA CENTRAL DE AJUDA
- Aba 1 (Configuracoes e Listas de Sites):
  - Traducao de jargoes e termos tecnicos para linguagem acessivel, clara e centrada na rotina forense do usuario leigo.
  - Substituicao de codigos HTML crus por formatacao visual direta: "negrito" (formatado em negrito), "italico" (em italico), "sublinhado" (sublinhado), "tachado" (tachado), subscrito, sobrescrito, paragrafos, citacoes e tabelas.
  - Descricao didatica dos 4 niveis progressivos de estilo preservado e da Regra de Ouro.
- Aba 2 (Central de Ajuda):
  - Manutencao da arquitetura tecnica completa de 5 niveis com nomenclatura formal ("b" (<b>), "p" (<p>), "table", etc.).
  - Implementacao de tooltips multilinhas ricos (title com &#10; e cursor de ajuda) em todas as tags HTML e propriedades CSS da tabela comparativa, exibindo a tag, sua funcao em portugues e seu comportamento documental.

### 2.20 ISOLAMENTO CIRURGICO DE DELIMITADORES ADJACENTES E BLINDAGEM DE AMPLIACAO (2 CLIQUES)
- Causa-raiz da falha AMPLIACAO_E_DESAMPLIACAO_SEM_CONTROL:
  - Ao testar a ultima letra de palavras antecedentes a expressoes entre parenteses (ex: "completo (JSON)", "sobrescrito (ex: 1)", "multi-selecao ( Ctrl+Alt )", "Acumulador (;)"), o raio de busca delta=2 em tentarExpandirDelimitadoresSimetricos saltava o espaco em branco e capturava o delimitador adjacente externo menor que a propria palavra.
- Solucao implementada em SelecionarCopiar.js:
  - Se o caractere sob o cursor for alfanumerico (eAlfanumericoUnicode), o raioBusca e estritamente 0. Nao ha salto para delimitadores vizinhos fora do corpo da palavra.
  - Caso a palavra esteja genuinamente inserida dentro de delimitadores (ex: "(teste)"), a verificacao retroativa/progressiva de aninhamento continua ativa e expande o bloco englobante (res2 > res1).
- Enriquecimento Diagnostico em debug.js:
  - Registro de telemetria completa em caso de qualquer discrepancia futura (texto testado, indice do cursor, palavra, limite e comprimentos res1/res2).

---

## 3. ARQUITETURA MODULAR DOS ARQUIVOS DO SISTEMA (AGRUPAMENTO MODULAR)

A estrutura do projeto segue estrita separacao de responsabilidades em subpastas dentro de src/:

### MODULO 1: COPIA INTELIGENTE & FORENSE (src/mod-copia/)
1. src/mod-copia/ConstantesPadroes.js: Tabela Uint8Array(128) O(1), configuracoes de motor, expressoes regulares atomicas, regexes de auditoria matematica e todos os 13 grupos do catalogo forense congelados via Object.freeze.
2. src/mod-copia/AvisoFlutuante.js: Validador matematico nao-bloqueante (CPF Modulo 11, CNPJ classico e alfanumerico ASCII-48, Processo CNJ Modulo 97 BigInt, Datas/Bissextos). Shadow DOM fechado + Popover API manual.
3. src/mod-copia/AcumuladorCopia.js: Gerenciador do Modo Acumulador (Ctrl+Alt). Desacoplamento de Sliced Strings V8, ordenacao DOM vs Modo Baralho (Shift), Toggle-Off, Desfazer, selecao de tabelas por colunas/linhas e CSS Custom Highlight API.
4. src/mod-copia/SelecionarCopiar.js: Motor de selecao contextual em 6 estagios. Captura cliques, gerencia modificadores Ctrl/Alt/Shift, processa duplicidade de espaco=2 cliques, minoracao de 3 cliques, ciclo circular continuo de 5 degraus (expansao e reducao), arquitetura progressiva de filtros HTML em 5 niveis (0 a 4), atalho F1 Gemini, Duplo Esc, conversao automatica nativa de cabecalhos PJe ("Num. 2297820154 - Pag. 1" para "id 2297820154, pg. 1") e Colagem Rapida via Botao Direito (1 clique: modo normal/avancado; 2 cliques rapidos: texto puro; autorizacao nativa em dominios PJe/jus.br; link para download do X-Mouse Button Control em options).

### MODULO 2: ACELERADOR PJE TURBO (src/mod-pje/)
5. src/mod-pje/PJE-anti_ampuletas.css: Folha de estilos injetada em document_start nos dominios PJe para neutralizar cortinas modais de bloqueio visual ("Aguarde..."), ampulhetas e travamento de cursor.

### MODULO 3: MOUSE (NAVEGACAO POR BOTOES LATERAIS)
6. Captura nativa dos botoes 4 e 5 do mouse (botoes de navegacao lateral): Botao 4 retrocede a aba anterior a esquerda; Botao 5 avanca para a proxima aba aberta a direita na mesma janela, operando em ciclo circular continuo com supressao nativa do historico.

### MODULO 4: NAVEGADOR (GERENCIAMENTO DE GUIAS E JANELAS)
7. Single Window (bloqueio de novas janelas avulsas e popups, forcando criacao de abas na janela principal ativa sem falhas de reparenting), controle de plano de abertura (segundo plano padrao vs primeiro plano), reutilizacao inteligente e anti-duplicacao de abas (comparacao de URL original e URL atual) e ordenacao automatica de guias ao abrir (por URL, dominio ou titulo, sentido A-Z ou Z-A, com suporte a guias fixadas).

### CONFIGURACOES, NUCLEO E INTERFACES (src/cfg/ e src/ico/)
8. manifest.json: Manifesto Oficial V3 (Chromium 116+) mantido na raiz do addon. Declaracao de permissoes minimas (clipboardWrite, scripting, storage, tabs), host_permissions: ["<all_urls>"], service worker ("src/cfg/background.js"), popup ("src/cfg/popup.html"), options ("src/cfg/options.html") e icones ("src/ico/icon128.png").
9. src/cfg/background.js: Orquestrador em Service Worker. Injeta CSS Anti-Ampulhetas e modulos JS por match patterns, gerencia Single Window, anti-duplicacao de abas, ordenacao automatica de guias, chaveamento circular de abas pelos botoes 4 e 5 do mouse e atalho F1 Gemini.
10. src/cfg/popup.html & src/cfg/popup.js: Interface popup minimalista de 350px.
11. src/cfg/options.html & src/cfg/options.js: Painel de controle em 3 abas: (1) Preferencias e Opcoes Avancadas (incluindo grupos MOUSE e NAVEGADOR); (2) Central de Ajuda Completa com Help Blueprint; (3) Laboratorio Interativo com 7 blocos de teste, console (>= WARN), botao de download do X-Mouse Button Control e suite de testes.
12. src/cfg/debug.js: Suite automatizada completa com 149 testes de blueprint deterministico (100% aprovados) cobrindo todos os grupos forenses, numeros assinados (+ e -), colagem rapida via botao direito, botoes laterais do mouse, Single Window, ordenacao de guias e varredura exaustiva de cliques em todas as palavras dos HTMLs (popup.html e options.html), alem de suite de fuzzing randomico temporal (1s/T por tipo de teste).
13. src/ico/icon128.png: Icone mestre oficial da extensao.
14. docs/: Diretrizes de desenvolvimento, regras root e blueprints tecnicos com referencia cruzada.
15. util/: Scripts oficiais de automacao de backup (fazer_backup.ps1 e fazer_backup.bat).
16. bkp/: Repositorio padronizado de backups compactados (.zip).

---

## 4. ESTADO DE IMPLEMENTACAO E HOMOLOGACAO

Todos os modulos do ecossistema estao 100% implementados, organizados, testados e homologados:
- Sem pendencias de unificacao ou correcao em options.html/options.js.
- Sincronizacao fina entre SelecionarCopiar.js e ConstantesPadroes.js 100% operacional.
- Selecao cirurgica de Datas com Horario Contiguo ("18/09/2026 10:03:34" e "28/10/2026 - 06:28:50") 100% homologada (1 clique no espaco/separador seleciona o bloco completo sem truncamentos).
- Atalho F1 (Prompt de IA) integrado com mascara personalizavel, alinhamento a esquerda e botao de restauracao instantanea de fabrica.
- Modulos MOUSE e NAVEGADOR 100% integrados em background.js, options e content scripts.
- Listeners onMessage em background.js 100% operacionais.
- Suite automatizada de testes (debug.js) executada com 149/149 testes aprovados (0 falhas) em modo deterministico e cobertura de Fuzzing (1s/T).
- 100% dos arquivos em conformidade estrita com US-ASCII puro de 7-bits (0 caracteres > 127).
- Sistema oficial de backup automatizado configurado em util/ e gerando em bkp/.

