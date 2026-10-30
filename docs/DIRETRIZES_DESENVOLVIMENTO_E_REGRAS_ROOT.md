# DIRETRIZES PERPETUAS DE ENGENHARIA, LOGS E REGRAS RIGIDAS ROOT - JUSGOVBR
Projeto: JusGovBR - Copia Inteligente & PJe Turbo (Manifest V3 - Chromium 116+)
Autor / Contato: smarca@gmail.com
Finalidade: Fonte unica da verdade (Single Source of Truth) para diretrizes arquiteturais, logs, regras rigidamente root imutaveis e especificacao integral de testes e fuzzing.
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
9. Particionamento Modular Estrito (mod-copia, mod-pje, mod-mouse, mod-navegador e Modulos Futuros):
   - Modulo 1: Copia Inteligente & Forense (src/mod-copia/): Motor de 6 estagios e ciclo circular de 5 degraus (ida e volta), regra "espaco = 2 cliques", regra da virgula, acumulador (;), auditoria matematica de documentos/calendarios, atalho F1 Gemini e Colagem Rapida via Botao Direito (1 clique: normal formatado; 2 cliques rapidos: texto puro; autorizacao nativa PJe/jus.br; link utilitario X-Mouse Button Control).
   - Modulo 2: Acelerador PJe Turbo (src/mod-pje/): CSS Anti-Ampulhetas injetado precocemente em document_start e conversao automatica de cabecalhos nativos PJe ("Num. ... - Pag. ...").
   - Modulo 3: MOUSE (Navegacao por Botoes Laterais): Captura dos botoes 4 e 5 do mouse para navegacao circular entre abas (Botao 4: esquerda/anterior; Botao 5: direita/proxima).
   - Modulo 4: NAVEGADOR (Gerenciamento de Guias e Janelas): Single Window (bloqueio de novas janelas/popups forcando abas na janela principal), controle de segundo plano (padrao) vs primeiro plano, anti-duplicacao e reutilizacao de abas (URL original e atual) e ordenacao automatica de guias por URL, dominio ou titulo (A-Z ou Z-A).
   - Modulos Futuros: O ecossistema em src/ e concebido de forma desacoplada para suportar a integracao de novos modulos tematicos (ex: mod-eproc, mod-projudi, mod-assinador) com isolamento total de responsabilidade.
10. Centralizacao de Documentos Instrutivos em docs/ e Arquivos Temporarios em tmp/:
   - Todos os arquivos do tipo .md que instruem o projeto devem estar rigorosamente centralizados dentro da pasta docs/, localizada na raiz do projeto (ex: docs/DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md, docs/BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md, docs/AGENTS.md). Qualquer arquivo .md presente em docs/ deve ser carregado e considerado no contexto.
   - Todos os arquivos temporarios de trabalho, testes ou intermediarios devem estar estritamente contidos na pasta tmp/, a qual nao e sujeita a backup. A pasta outros/, se existente, tambem permanece estritamente fora do backup.

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
- Nas mensagens de alerta flutuante de digitacao e na Central de Ajuda, manter exclusivamente a indicacao do criterio matematico objetivo (`Modulo 11` para CPF/CNPJ, `Modulo 97` para CNJ, `Ano bissexto / dias validos` para datas), permitindo que o usuario compreenda a causa da inconsistencia sem sobrecarga tecnica.

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




