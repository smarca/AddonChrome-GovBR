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
13. Padrão Visual Obrigatório para Listagem e Implementação de Ações:
   - Sempre que apresentar ações pendentes, planos de implementação ou relatórios de ações concluídas ao usuário, utilizar obrigatoriamente a visualização estruturada em tabela Markdown (`📋 Próximas ações pendentes` / `✅ Resumo de implementação`) com as colunas `# | Descrição | Área` (ou `# | Descrição | Área | Status`), seguida de tópicos objetivos com os detalhes técnicos essenciais.


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

### 6.6 Correção do Escopo de Seleção em Alt + Clique sobre Botões e Itens Pequenos (Evitar Selecionar o Contêiner do Botão em Vez da Palavra/Label)
- **Comportamento Estranho Observado:**
  * Ao clicar com a tecla `Alt` pressionada sobre itens pequenos de interface ou botões (ex.: botão `"MARCAR TODOS COMO LIDOS"`, que não é um link `<a>` comum), está ocorrendo um erro em que o elemento botão inteiro (o contêiner/caixa externa com sua borda retangular completa) é selecionado visualmente com Flash Verde, em vez de selecionar/copiar apenas o texto/label interno ou a palavra clicada dentro do botão.
- **Diagnóstico Técnico Preliminar:**
  * No Passo 9.7.1 (`Alt + Clique`), ao detectar que o elemento é um botão (`elInterativo`), o código executa `rangeParaFlash.selectNode(elInterativo)` ou `rangeParaFlash.selectNodeContents(elInterativo)` envolvendo a caixa do elemento pai inteiro em vez de restringir a seleção ao nó de texto do rótulo (`TextNode` do label) ou à palavra sob o cursor.
- **Diretriz de Ajuste Futuro:**
  * Refinar o `Alt + Clique` em botões e elementos interativos para que o contorno visual do Flash e a cópia incidam estritamente sobre o texto/label visível (`range` do nó de texto interno), e não sobre a caixa ou estrutura física do contêiner do botão, evitando a impressão visual de "selecionar tudo" ou englobar o componente gráfico da interface.

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

---

### 6.19 Status de Implementacao (2026-10-30)
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
* **Pendente (Salvo para implementação futura):**
  * Desacoplamento físico em arquivos separados (Módulo de Seleção e Cópia vs Módulo de Mudança de Interface/UI) e encapsulamento POO completo por módulo `.js` (Seção 6.13 / Diretriz Root 11).
## 7. RADAR AUTÔNOMO DE ANÁLISE DE ENGENHARIA (BUGS, BOAS PRÁTICAS E NOVAS FUNCIONALIDADES IDENTIFICADAS)

> [!NOTE]
> Esta seção é mantida em separado do backlog de demandas diretas do usuário (Seção 6). Ela registra ativamente e continuamente tudo o que for identificado de forma autônoma pela análise de engenharia durante o ciclo de inspeções, diagnósticos, logs e leitura de código.
> Quando o usuário solicitar um levantamento de pendências de mudanças, correções/bugs ou previsibilidade de novas funcionalidades, esta seção somada à Seção 6 fornecerá a resposta estruturada completa e exaustiva.

### 7.1 Bugs e Falhas Potenciais Identificados pela Análise de Engenharia
- **BUG-01: Vazamento de Handlers Globais em Subframes Descarregados:**
  * *Descrição:* Ao navegar ou substituir dinamicamente páginas em iframes sem reload completo da janela-mãe, listeners atachados diretamente em `window` ou `document` do subframe podem permanecer referenciados em memória antes do garbage collector atuar.
  * *Ação Preventiva:* Adicionar rotina de teardown explícito em `beforeunload` ou via `AbortController` com `signal` compartilhado por ciclo de vida do frame.
- **BUG-02: Sobrescrita de `z-index` de Overlays do PJe e PDPJ:**
  * *Descrição:* O contorno do Flash Verde possui `z-index: 2147483647`. Caso surja um diálogo nativo de confirmação ou modal crítico do tribunal que necessite de foco modal estrito, o contorno pode sobrepor botões desse modal antes de seu timeout expirar.
  * *Ação Preventiva:* O contorno visual deve possuir estritamente `pointer-events: none !important;` e ser destruído atômica e imediatamente ao detectar `keydown` (como Escape/Enter) ou clique externo.

### 7.2 Oportunidades de Boas Práticas e Refatoração Arquitetural
- **BP-01: Adoção Estruturada de Namespaces por Módulo (`JusGovBR.Copia`, `JusGovBR.UI`, `JusGovBR.PJe`):**
  * *Descrição:* Em cumprimento à Diretriz Root 11 (POO e encapsulamento), converter todos os scripts de conteúdo e service worker para objetos selados (`Object.freeze`) com API pública explícita e métodos privados blindados via closures ou campos privados (`#metodoPrivado`).
- **BP-02: Isolamento de Comunicação via EventBus Local / CustomEvents:**
  * *Descrição:* Em vez de acoplamento direto entre arquivos de script que compartilham o mesmo frame, utilizar um barramento leve de eventos customizados (`document.dispatchEvent(new CustomEvent('jusgovbr:acao', ...))`), permitindo que módulos assinem eventos de forma 100% desacoplada e sem risco de quebra quando um módulo estiver ausente.

### 7.3 Previsibilidade de Novas Funcionalidades e Evolução do Sistema
- **FEAT-01: Modo Leitura Judicial Focado (Distraction-Free PJe):**
  * *Descrição:* Capacidade de recolher com 1 atalho (ex.: Alt + Z) todas as barras laterais, cabeçalhos administrativos e menus do PJe para focar unicamente na leitura e conferência da petição/decisão em tela cheia.
- **FEAT-02: Painel de Diagnóstico em Tempo Real do Motor de Cópia (Modo Auditor Forense):**
  * *Descrição:* Exibição de um pequeno painel flutuante retrátil (acessível apenas em modo de depuração ou via atalho) que exibe instantaneamente o tipo de dado detectado (CPF válido, Processo CNJ íntegro, Data válida), nível de formatação aplicado e tamanho em bytes transferido para o clipboard.


















