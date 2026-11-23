/* ==========================================================================
 * ARQUIVO: src/mod-copia/copia-acumulador.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-acumulador.js
 * - Classe Exportada: GerenciadorAcumulador (window.JusGovAcumulador)
 * - Métodos Públicos: adicionarItem(texto, rangeDOM, modoBaralhoShift, idElemento, metaTabela), acumularSelecaoTabelaPorColunasOuLinhas(celulaOuLinha, modo, modoBaralhoShift), removerItemPorRangeOuTexto(alvo), desempilharUltimoItem(), limpar(), formatarSaidaConsolidada(), obterConsolidado(), obterQuantidade()
 * - Eventos / APIs: CSS.highlights ('jusgov-acumulador-highlight'), Sliced Strings V8 Heap unpinning
 * - Regras / Seções: Regra 2.6 (Modo Acumulador Ctrl+Alt e Modo Baralho Shift), Seção 6.64 (blindagem POO)
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* (regras de negocio, desacoplamento
 *    de Sliced Strings na Heap do V8, CSS Custom Highlight API, captura de
 *    selecao previa, ordenacao crescente vs. Modo Baralho com Shift, remocao
 *    por clique direto / toggle-off e selecao tabular por linhas e colunas)
 *    e nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada metodo, permitindo recriar 100% do modulo do zero
 *    caso o codigo-fonte deixasse de existir.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como &ccedil;, &otilde;, &eacute;)
 *    no codigo ou em templates visuais; entidades HTML devem ser extirpadas,
 *    sendo admitidas exclusivamente dentro de mascaras regex ou parsers de HTML bruto.
 * 5) INTEGRIDADE FUNCIONAL E COPIA SILENCIOSA: Proibido simplificar a base de 6
 *    estagios, remover suporte a Ctrl/Alt/Shift, exibir popups de "Copiado!" em
 *    copias simples ou inserir anotacoes de versao (ChronoSemVer) nos cabecalhos.
 * 6) SINCRONIZACAO OBRIGATORIA DE BLUE PRINT E SANDBOX: Toda alteracao de regra
 *    de negocio, mascara ou validacao deve manter obrigatoriamente atualizados e
 *    sincronizados o Blue Print (especificacao documental interna nos cabecalhos
 *    e na Central de Ajuda) e o SandBox (area de Testes interativos em
 *    options.html e bateria automatizada em debug.js), garantindo paridade entre
 *    exemplos validos e invalidos para homologacao imediata.
 *
 * ==========================================================================
 * [ESPECIFICACAO FUNCIONAL E REGRAS DE NEGOCIO -- HELP BLUEPRINT PERPETUO]
 * (Espelho integral da Central de Ajuda / Options para reconstrucao mutua)
 *
 * 1. MODO ACUMULADOR DE COPIA (CTRL + ALT + CLIQUE OU CLIQUE E ARRASTO):
 * - Finalidade Pratica: Permite ao magistrado, servidor ou advogado coletar
 *   multiplos dados dispersos em uma peca ou tabela do PJe em uma unica
 *   sequencia mantendo as teclas "Ctrl + Alt" pressionadas.
 * - Formato Estrito de Concatenacao com Ponto e Virgula (";"):
 *   Todos os itens coletados no acumulador sao separados por ";" (sem espacos
 *   entre eles, ou pelo separador configurado em Opcoes Avancadas) e a string
 *   final termina obrigatoriamente com ";" (exemplo: "item1;item2;item3;").
 * - Exibicao Exclusiva de Estatisticas no Popup do Acumulador:
 *   Os avisos visuais do acumulador NUNCA exibem as palavras acumuladas na tela;
 *   mostram exclusivamente as estatisticas (numero de intervalos, palavras/celulas/linhas
 *   e quantidade total de caracteres).
 * - Inclusao Automatica da Selecao Pre-Existente (absorverSelecaoPreviaSeVazio):
 *   Se o usuario ja possui uma palavra ou trecho selecionado na tela e passa a
 *   utilizar "Ctrl + Alt" (seja clicando ou arrastando sobre novas palavras),
 *   a palavra anteriormente selecionada e automaticamente absorvida como o 1o
 *   item do buffer do acumulador antes de anexar a nova selecao!
 * - Ordenacao Crescente Natural (Ctrl + Alt) vs. Modo Baralho (Ctrl + Alt + Shift):
 *   * Padrao (Ctrl + Alt sem Shift): Insere o item em ordem crescente conforme a
 *     posicao natural no documento original (de cima para baixo / esquerda para
 *     direita). Se houver "cartas fora de ordem" inseridas anteriormente com Shift,
 *     elas sao mantidas exatamente no lugar onde foram colocadas, e a nova carta
 *     ordenada posiciona-se imediatamente apos a carta ordenada antecedente (ou
 *     seja, antes das cartas desordenadas subsequentes).
 *   * Modo Baralho (Ctrl + Alt + Shift): Pressionar Shift durante a selecao
 *     adiciona a carta estritamente no final da lista (ordem de chegada).
 * - Proibicao de Re-selecao e Remocao por Clique Direto (Toggle Off):
 *   * E proibido adicionar duas vezes a mesma selecao.
 *   * Clicar novamente sobre uma selecao ja marcada no acumulador remove-a
 *     instantaneamente da lista e limpa seu destaque visual (Toggle Off).
 * - Desfazer Ultima Carta (Ctrl + Alt + Clique com Botao Direito):
 *   * Remove a ultima carta inserida no acumulador (independentemente da posicao
 *     em que entrou na lista), dispensando atalhos de teclado.
 * ========================================================================== */

(function() {
    'use strict';

    /* Passo 1.1: Permitir atualizacao da classe em reinjecoes sem perder compatibilidade,
     * evitando reprocessamento redundante se a classe ja estiver registrada no frame. */
    if (window.__JUSGOV_ACUMULADOR_CARREGADO__ && typeof window.JusGovAcumulador === 'function') {
        return;
    }
    window.__JUSGOV_ACUMULADOR_CARREGADO__ = true;

    const C_EXT = window.JusGovConstantes || {};
    const EXPRESSOES_REGULARES = C_EXT.EXPRESSOES_REGULARES || {};

    /* ==========================================================================
     * SECAO 1: CONSTANTES IMUTAVEIS DO ACUMULADOR (OBJECT.FREEZE)
     * ========================================================================== */
    const CONFIG_ACUMULADOR = Object.freeze({
        NOME_REGISTRO_HIGHLIGHT: 'jusgov-acumulador',
        ID_ESTILO_HIGHLIGHT: 'jusgov-estilo-custom-highlight',
        SEPARADOR_ITENS: ';',
        SUFIXO_FINAL: ';',
        LIMITE_MAXIMO_RANGES_VISUAIS: 128
    });

    // =====================================================================
    // CLASSE PRINCIPAL: GERENCIADOR DE ESTADO DO MODO ACUMULADOR E TABELAS
    // =====================================================================
    class GerenciadorAcumulador {
        constructor() {
            /* Passo 1.2: Inicializar 100% das propriedades no construtor com tipos
             * estaticos para preservar Hidden Classes (Shapes) monomorficas no V8. */
            this.entradasAcumuladas = [];
            this.pilhaHistoricoIds = [];
            this.contadorSequencialId = 0;
            this.itensTexto = [];
            this.rangesDestacados = [];
            this.estiloHighlightInjetado = false;
            this.NOME_HIGHLIGHT = CONFIG_ACUMULADOR.NOME_REGISTRO_HIGHLIGHT;
            this.separadorCustomizado = CONFIG_ACUMULADOR.SEPARADOR_ITENS;
            this.incluirSeparadorFinal = true;
            this.separadorTabelaCustomizado = CONFIG_ACUMULADOR.SEPARADOR_ITENS;
            this.modoTabelaAtivo = '';
            this.tabelaAlvo = null;
            this.indicesColunasSelecionadas = [];
            this.indicesLinhasSelecionadas = [];
            this.ultimoIndiceTabelaClicado = -1;
        }

        /*
         * METODO: definirSeparador
         * OBJETIVO DE RECONSTRUCAO: Permitir configurar o separador de itens do
         * acumulador (padrao ';') a partir das Configuracoes Avancadas.
         */
        definirSeparador(novoSeparador) {
            /* Passo 2.0: Validar string do separador (max 5 caracteres, sem letras/numeros, somente simbolos/pontuacoes; padrao: ';') */
            if (typeof novoSeparador === 'string' &&
                novoSeparador.trim().length > 0 &&
                !/[0-9\p{L}]/u.test(novoSeparador) &&
                /[!-\/:-@\[-`{-~|\u00A7\u00B0\u00BA\u00AA\p{P}\p{S}]/u.test(novoSeparador)) {
                this.separadorCustomizado = novoSeparador.slice(0, 5);
            } else {
                this.separadorCustomizado = CONFIG_ACUMULADOR.SEPARADOR_ITENS;
            }
        }

        definirSeparadorFinal(ativo) {
            this.incluirSeparadorFinal = (ativo !== false);
        }

        definirSeparadorTabela(novoSeparadorTabela) {
            if (typeof novoSeparadorTabela === 'string' && novoSeparadorTabela.length > 0) {
                this.separadorTabelaCustomizado = novoSeparadorTabela;
            } else {
                this.separadorTabelaCustomizado = CONFIG_ACUMULADOR.SEPARADOR_ITENS;
            }
        }

        /*
         * METODO: desacoplarStringV8
         * OBJETIVO DE RECONSTRUCAO: Quebrar a referencia interna de Sliced String
         * na Heap do motor V8, garantindo que armazenar uma palavra curta no array
         * do acumulador nunca impeca o Garbage Collector de liberar o documento-pai.
         */
        desacoplarStringV8(str) {
            /* Passo 2.1: Concatenar espaco neutro e fatiar a partir do indice 1 */
            return (' ' + String(str || '')).slice(1);
        }

        /*
         * METODO: sincronizarEspelhosLegados
         * OBJETIVO DE RECONSTRUCAO: Manter this.itensTexto e this.rangesDestacados
         * sincronizados a partir de this.entradasAcumuladas para total retrocompatibilidade
         * com baterias de auditoria e CSS Custom Highlight API.
         */
        sincronizarEspelhosLegados() {
            /* Passo 2.1.1: Reconstruir arrays espelho a partir da lista mestre de cartas */
            this.itensTexto.length = 0;
            this.rangesDestacados.length = 0;
            for (let i = 0; i < this.entradasAcumuladas.length; i++) {
                const entrada = this.entradasAcumuladas[i];
                this.itensTexto.push(entrada.texto);
                if (entrada.range && this.rangesDestacados.length < CONFIG_ACUMULADOR.LIMITE_MAXIMO_RANGES_VISUAIS) {
                    this.rangesDestacados.push(entrada.range);
                }
            }
        }

        /*
         * METODO: formatarSaidaConsolidada
         * OBJETIVO DE RECONSTRUCAO: Unir todos os itens do buffer separando-os por ";"
         * sem espacos e encerrando obrigatoriamente com ";" (ex: "item1;item2;item3;").
         */
        formatarSaidaConsolidada() {
            /* Passo 2.2: Se nao houver itens, retorna string vazia; caso contrario, une com separador e sufixo */
            if (this.entradasAcumuladas.length === 0) return '';
            const textos = [];
            for (let i = 0; i < this.entradasAcumuladas.length; i++) {
                textos.push(this.entradasAcumuladas[i].texto);
            }
            const sep = this.separadorCustomizado || CONFIG_ACUMULADOR.SEPARADOR_ITENS;
            const sufixo = this.incluirSeparadorFinal ? (sep.trim() || CONFIG_ACUMULADOR.SUFIXO_FINAL) : '';
            return textos.join(sep) + sufixo;
        }

        /*
         * METODO: contarPalavrasNoBuffer
         * OBJETIVO DE RECONSTRUCAO: Calcular o total de palavras acumuladas em todos
         * os itens da pilha para exibicao exclusiva de estatisticas no aviso visual.
         */
        contarPalavrasNoBuffer() {
            /* Passo 2.2.1: Percorrer entradasAcumuladas contando unidades separadas por espaco ou ';' */
            let totalPalavras = 0;
            const rxDivisor = EXPRESSOES_REGULARES.DIVISOR_PALAVRAS_ACUMULADOR;
            for (let i = 0; i < this.entradasAcumuladas.length; i++) {
                const item = String(this.entradasAcumuladas[i].texto || '').trim();
                if (!item) continue;
                const partes = rxDivisor ? item.split(rxDivisor).filter(Boolean) : item.split(' ').filter(Boolean);
                totalPalavras += partes.length;
            }
            return totalPalavras | 0;
        }

        /*
         * METODO: garantirEstiloHighlightCSS
         * OBJETIVO DE RECONSTRUCAO: Injetar uma unica vez no <head> do documento a
         * regra pseudo-elemento ::highlight(jusgov-acumulador).
         */
        garantirEstiloHighlightCSS() {
            /* Passo 2.3: Abortar se ja injetado, se head indisponivel ou se navegador nao suportar CSS.highlights */
            if (this.estiloHighlightInjetado || !document.head) return;
            if (typeof CSS === 'undefined' || !CSS.highlights) return;

            if (document.getElementById(CONFIG_ACUMULADOR.ID_ESTILO_HIGHLIGHT)) {
                this.estiloHighlightInjetado = true;
                return;
            }

            /* Passo 2.4: Criar tag <style> com destaque ambar suave e sublinhado tracejado */
            const style = document.createElement('style');
            style.id = CONFIG_ACUMULADOR.ID_ESTILO_HIGHLIGHT;
            style.setAttribute('data-jusgov-ignore', 'true');
            style.textContent = `
                ::highlight(jusgov-acumulador) {
                    background-color: rgba(251, 188, 4, 0.28);
                    text-decoration: underline dashed #d97706;
                }
            `;
            document.head.appendChild(style);
            this.estiloHighlightInjetado = true;
        }

        /*
         * METODO: atualizarDestaqueVisualCSS
         * OBJETIVO DE RECONSTRUCAO: Sincronizar a lista de objetos Range clonados
         * com o registro nativo CSS.highlights do navegador Blink.
         */
        atualizarDestaqueVisualCSS() {
            /* Passo 2.5: Sincronizar espelhos e verificar suporte a CSS Custom Highlight API */
            this.sincronizarEspelhosLegados();
            if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') {
                return;
            }

            try {
                if (this.rangesDestacados.length === 0) {
                    CSS.highlights.delete(this.NOME_HIGHLIGHT);
                } else {
                    this.garantirEstiloHighlightCSS();
                    const instanciaHighlight = new Highlight(...this.rangesDestacados);
                    CSS.highlights.set(this.NOME_HIGHLIGHT, instanciaHighlight);
                }
            } catch (_) {}
        }

        /*
         * METODO: encontrarIndiceRangeSobreposto
         * OBJETIVO DE RECONSTRUCAO: Verificar se o novo Range clicado pelo usuario ja
         * coincide ou se sobrepoe a alguma selecao previamente acumulada na tela.
         * O porque: Permite remover a selecao ao clicar novamente sobre ela (Toggle Off)
         * e bloqueia re-selecoes repetidas do mesmo trecho.
         */
        encontrarIndiceRangeSobreposto(rangeDOM) {
            /* Passo 2.6: Comparar fronteiras DOM de cada Range armazenado com o Range clicado */
            if (!rangeDOM) return -1;
            for (let i = 0; i < this.entradasAcumuladas.length; i++) {
                const rExistente = this.entradasAcumuladas[i].range;
                if (!rExistente) continue;
                try {
                    if (rExistente.startContainer === rangeDOM.startContainer &&
                        rExistente.startOffset === rangeDOM.startOffset &&
                        rExistente.endContainer === rangeDOM.endContainer &&
                        rExistente.endOffset === rangeDOM.endOffset) {
                        return i;
                    }
                    /* Dois Ranges se sobrepoem quando o inicio de um e anterior ao fim do outro e vice-versa */
                    const compFimComInicio = rExistente.compareBoundaryPoints(Range.END_TO_START, rangeDOM);
                    const compInicioComFim = rExistente.compareBoundaryPoints(Range.START_TO_END, rangeDOM);
                    if (compFimComInicio > 0 && compInicioComFim < 0) {
                        return i;
                    }
                } catch (_) {}
            }
            return -1;
        }

        /*
         * METODO: compararPosicaoDOM
         * OBJETIVO DE RECONSTRUCAO: Determinar a ordem progressiva natural entre dois
         * Ranges no documento original (-1 se rangeA vem antes de rangeB, 1 se depois, 0 se igual).
         */
        compararPosicaoDOM(rangeA, rangeB) {
            /* Passo 2.7: Usar compareBoundaryPoints START_TO_START com fallback geometrico */
            if (!rangeA || !rangeB) return 0;
            try {
                return rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
            } catch (_) {
                try {
                    const rectA = rangeA.getBoundingClientRect();
                    const rectB = rangeB.getBoundingClientRect();
                    if (Math.abs(rectA.top - rectB.top) > 4) {
                        return rectA.top < rectB.top ? -1 : 1;
                    }
                    return rectA.left <= rectB.left ? -1 : 1;
                } catch (__) {
                    return 0;
                }
            }
        }

        /*
         * METODO: absorverSelecaoPreviaSeVazio
         * REFERENCIA HELP: Inclusao automatica da palavra anteriormente selecionada ao iniciar Ctrl+Alt.
         */
        absorverSelecaoPreviaSeVazio(textoPrevioLimpo, rangePrevioDOM = null) {
            /* Passo 3.0: So absorve se o acumulador estiver vazio no inicio da sequencia Ctrl+Alt */
            if (this.entradasAcumuladas.length > 0) return false;
            if (!textoPrevioLimpo || typeof textoPrevioLimpo !== 'string') return false;

            const rxPvFinal = EXPRESSOES_REGULARES.PONTO_VIRGULA_FINAL;
            const textoSemPv = rxPvFinal ? textoPrevioLimpo.replace(rxPvFinal, '').trim() : textoPrevioLimpo.trim();
            const limpo = this.desacoplarStringV8(textoSemPv);
            if (limpo.length < 1) return false;

            const cloneRange = (rangePrevioDOM && typeof rangePrevioDOM.cloneRange === 'function')
                ? rangePrevioDOM.cloneRange()
                : null;

            const novoId = ++this.contadorSequencialId;
            this.entradasAcumuladas.push({
                id: novoId,
                texto: limpo,
                range: cloneRange,
                modoBaralho: false
            });
            this.pilhaHistoricoIds.push(novoId);
            this.atualizarDestaqueVisualCSS();
            return true;
        }

        /*
         * METODO: adicionarItem
         * REFERENCIA HELP: Item 5 -- Ctrl + Alt + Clique ou Arrasto (Modo Acumulador).
         * OBJETIVO DE RECONSTRUCAO:
         * 1) Se o Range clicado ja estiver selecionado no acumulador, remove-o (Toggle Off)
         *    e impede re-selecao duplicada.
         * 2) Se ehModoBaralho === true (Ctrl + Alt + Shift), adiciona a carta no final da lista.
         * 3) Se ehModoBaralho === false (Ctrl + Alt sem Shift), insere a carta em ordem
         *    crescente natural do texto original, posicionando-a imediatamente apos a
         *    ultima carta ordenada antecedente e ANTES de eventuais cartas desordenadas
         *    (inseridas com Shift), mantendo as cartas de Shift no mesmo lugar!
         */
        adicionarItem(textoLimpo, rangeDOM = null, ehModoBaralho = false) {
            /* Passo 3.1: Validar, remover eventual ';' periferico duplicado e desacoplar a string */
            if (!textoLimpo || typeof textoLimpo !== 'string') return null;
            const rxPvBordas = EXPRESSOES_REGULARES.PONTO_VIRGULA_BORDAS;
            const textoSemPontoVirgulaFinal = rxPvBordas
                ? textoLimpo.replace(rxPvBordas, '').trim()
                : textoLimpo.trim();
            const textoDesacoplado = this.desacoplarStringV8(textoSemPontoVirgulaFinal);
            if (textoDesacoplado.length < 1) return null;

            /* Passo 3.2: Verificar se o usuario clicou sobre uma selecao ja feita (Toggle Off / Proibir Re-selecao) */
            if (rangeDOM) {
                const idxSobreposto = this.encontrarIndiceRangeSobreposto(rangeDOM);
                if (idxSobreposto !== -1) {
                    const removida = this.entradasAcumuladas.splice(idxSobreposto, 1)[0];
                    if (removida) {
                        const posHist = this.pilhaHistoricoIds.indexOf(removida.id);
                        if (posHist !== -1) {
                            this.pilhaHistoricoIds.splice(posHist, 1);
                        }
                    }
                    this.atualizarDestaqueVisualCSS();
                    const consolidadoAposRemocao = this.formatarSaidaConsolidada();
                    return {
                        consolidado: consolidadoAposRemocao,
                        quantidade: this.entradasAcumuladas.length | 0,
                        palavras: this.contarPalavrasNoBuffer(),
                        caracteres: consolidadoAposRemocao.length | 0,
                        removidoToggle: true
                    };
                }
            }

            /* Passo 3.3: Criar a nova carta do acumulador com clone isolado do Range DOM */
            const cloneRange = (rangeDOM && typeof rangeDOM.cloneRange === 'function')
                ? rangeDOM.cloneRange()
                : null;
            const novoId = ++this.contadorSequencialId;
            const novaCarta = {
                id: novoId,
                texto: textoDesacoplado,
                range: cloneRange,
                modoBaralho: Boolean(ehModoBaralho)
            };

            /* Passo 3.4: Posicionar a carta conforme Modo Baralho (Shift) vs. Ordem Crescente Natural */
            if (ehModoBaralho || !cloneRange) {
                /* Com Shift (Modo Baralho) ou sem Range DOM: entra estritamente no final da lista */
                this.entradasAcumuladas.push(novaCarta);
            } else {
                /* Sem Shift (Ordem Crescente): Localiza a ultima carta ordenada (!modoBaralho)
                 * cuja posicao no documento seja anterior ou igual a novaCarta. Insere logo
                 * apos ela (portanto, antes de quaisquer cartas desordenadas de Shift que
                 * estejam apos ela e antes da proxima carta ordenada maior). */
                let idxUltimaOrdenadaMenor = -1;
                for (let i = 0; i < this.entradasAcumuladas.length; i++) {
                    const existente = this.entradasAcumuladas[i];
                    if (!existente.modoBaralho && existente.range) {
                        if (this.compararPosicaoDOM(existente.range, cloneRange) <= 0) {
                            idxUltimaOrdenadaMenor = i;
                        }
                    }
                }
                const indiceInsercao = idxUltimaOrdenadaMenor + 1;
                this.entradasAcumuladas.splice(indiceInsercao, 0, novaCarta);
            }

            this.pilhaHistoricoIds.push(novoId);
            this.atualizarDestaqueVisualCSS();

            /* Passo 3.5: Retornar objeto com o consolidado e as estatisticas completas */
            const consolidado = this.formatarSaidaConsolidada();
            return {
                consolidado,
                quantidade: this.entradasAcumuladas.length | 0,
                palavras: this.contarPalavrasNoBuffer(),
                caracteres: consolidado.length | 0,
                removidoToggle: false
            };
        }

        /*
         * METODO: desfazerUltimoItem
         * REFERENCIA HELP: Desfazer Ultima Carta do Acumulador (Ctrl + Alt + Clique Direito).
         * OBJETIVO DE RECONSTRUCAO: Remover exatamente a ultima carta inserida pelo usuario
         * consultando a pilha de IDs sequenciais (mesmo que ela tenha sido posicionada no
         * meio da lista pela ordenacao crescente automatica).
         */
        desfazerUltimoItem() {
            /* Passo 4.1: Verificar se ha itens na pilha para remover */
            if (this.entradasAcumuladas.length === 0) return null;

            /* Passo 4.2: Localizar o ID da ultima carta inserida ou remover do topo se vazio */
            let indiceRemover = this.entradasAcumuladas.length - 1;
            if (this.pilhaHistoricoIds.length > 0) {
                const ultimoId = this.pilhaHistoricoIds.pop();
                const idxEncontrado = this.entradasAcumuladas.findIndex(item => item.id === ultimoId);
                if (idxEncontrado !== -1) {
                    indiceRemover = idxEncontrado;
                }
            }

            const removidoObj = this.entradasAcumuladas.splice(indiceRemover, 1)[0];
            this.atualizarDestaqueVisualCSS();

            /* Passo 4.3: Retornar estatisticas atualizadas apos a remocao */
            const consolidado = this.formatarSaidaConsolidada();
            return {
                removido: removidoObj ? removidoObj.texto : '',
                consolidado,
                quantidade: this.entradasAcumuladas.length | 0,
                palavras: this.contarPalavrasNoBuffer(),
                caracteres: consolidado.length | 0
            };
        }

        /*
         * METODO: limpar
         * OBJETIVO DE RECONSTRUCAO: Esvaziar o buffer e limpar destaques CSS.
         */
        limpar() {
            /* Passo 5.1: Bailout rapido se o acumulador ja estiver limpo */
            if (this.entradasAcumuladas.length === 0 &&
                this.itensTexto.length === 0 &&
                this.rangesDestacados.length === 0 &&
                this.indicesColunasSelecionadas.length === 0 &&
                this.indicesLinhasSelecionadas.length === 0) {
                return;
            }

            /* Passo 5.2: Truncar arrays in-place e limpar CSS */
            this.entradasAcumuladas.length = 0;
            this.pilhaHistoricoIds.length = 0;
            this.itensTexto.length = 0;
            this.rangesDestacados.length = 0;
            this.indicesColunasSelecionadas.length = 0;
            this.indicesLinhasSelecionadas.length = 0;
            this.tabelaAlvo = null;
            this.modoTabelaAtivo = '';
            this.ultimoIndiceTabelaClicado = -1;
            this.atualizarDestaqueVisualCSS();
        }

        obterConsolidado() {
            return this.formatarSaidaConsolidada();
        }

        obterQuantidade() {
            return this.entradasAcumuladas.length | 0;
        }
    }

    /* Passo 6.1: Exportar a classe globalmente blindada com Object.freeze para consumo pelo orquestrador principal */
        const _ext_GerenciadorAcumulador = [
        { g: 'JusGovCopiaAcumuladorTabela', p: './copia-acumulador-tabela.js' }
    ];
    for (let i = 0; i < _ext_GerenciadorAcumulador.length; i++) {
        const it = _ext_GerenciadorAcumulador[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(GerenciadorAcumulador.prototype);
        }
    }

    Object.freeze(GerenciadorAcumulador.prototype);
    window.JusGovAcumulador = Object.freeze(GerenciadorAcumulador);
    window.JusGovCopiaAcumulador = window.JusGovAcumulador;
})();

