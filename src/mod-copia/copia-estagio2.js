/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-estagio2.js
 * CLASSE: EstagioExpressoes
 * 
 * @MAPA-IA:
 * - Arquivo: src/mod-copia/copia-estagio2.js
 * - Classe Exportada: EstagioExpressoes (window.JusGovEstagioExpressoes)
 * - Métodos Públicos: tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idx), tentarExpandirPadraoJuridico(texto, idx, forcarCompostos, ehDuploClique), extrairPalavraSobCursor(texto, idx), linhaEhTodaMaiuscula(strLinha)
 * - Dependências Injetadas: window.JusGovConstantes (CATALOGO_PADROES_JURIDICOS, EXPRESSOES_REGULARES, TABELA_MASCARA_ASCII)
 * - Regras / Seções: Regra 2.2 (Estágio 2), Seção 6.5, Seção 6.36, BUG-06, Seção 6.60, Seção 6.64 (blindagem POO)
 * 
 * FINALIDADE:
 * Implementação do Estágio 2 do Motor de Expansão Contextual:
 * - Entidades Forenses Compostas do Catálogo Jurídico (CPF, CNPJ, CNJ, PJe IDs, OAB, Leis/Artigos,
 *   Datas e Horários, Moedas com extenso, Coordenadas GPS, Chaves NFe).
 * - Blocos contíguos em LETRAS MAIÚSCULAS com suporte a quebras suaves de linha (ex: títulos e cabeçalhos).
 * - Blocos destacados por formatação inline (<b>, <i>, <u>, <s>, <mark>, etc.) ou background CSS diferenciado.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. Padrões Compostos: Quando forçado (duplo clique, clique em espaço ou rótulo), captura
 *    a expressão inteira ("Art. 1.022, II, do CPC", "R$ 1.500,00 (mil e quinhentos reais)").
 * 2. Precedência de Data/Hora: Em "23/10/2026 10:14:18", 1 clique na data seleciona a data,
 *    1 clique no horário seleciona a hora, e clique no espaço/conector ou 2 cliques seleciona ambos.
 * 3. Tag <mark> e Destaques Inline: Contêineres de marca-texto ou tags inline selecionam o bloco
 *    destacado integral sem transbordar para espaços conectores externos.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.2: Estágio 2 - Expressões Compostas)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 3.2: Estágio 2)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovEstagioExpressoes) {
        return;
    }

    class EstagioExpressoes {
        #constantes;

        constructor(constantes = null) {
            this.#constantes = constantes || (typeof window !== 'undefined' && window.JusGovConstantes ? window.JusGovConstantes : {});
        }

        eAlfanumericoUnicode(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) {
                return (tab[c] & (masc.DIGITO | masc.LETRA_ASCII)) !== 0;
            }
            const rx = this.#constantes.EXPRESSOES_REGULARES;
            if (rx && rx.CHAR_ALFANUMERICO_UNICODE) {
                return rx.CHAR_ALFANUMERICO_UNICODE.test(ch);
            }
            return /[\p{L}\p{N}]/u.test(ch);
        }

        eEspacoBranco(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) return (tab[c] & masc.ESPACO_BRANCO) !== 0;
            return c === 160 || (this.#constantes.EXPRESSOES_REGULARES && this.#constantes.EXPRESSOES_REGULARES.CHAR_ESPACO_UNICODE ? this.#constantes.EXPRESSOES_REGULARES.CHAR_ESPACO_UNICODE.test(ch) : /\s/.test(ch));
        }

        eQuebraDeLinha(ch) {
            return ch === '\n' || ch === '\r';
        }

        ePontuacaoFim(ch) {
            if (!ch) return false;
            const c = ch.charCodeAt(0);
            const tab = this.#constantes.TABELA_MASCARA_ASCII;
            const masc = this.#constantes.MASCARA_CARACTERE || {};
            if (tab && c < 128) return (tab[c] & masc.PONTUACAO_FIM) !== 0;
            return c === 8212 || c === 8211 || c === 8230;
        }

        linhaEhTodaMaiuscula(strLinha) {
            if (!strLinha) return false;
            const limpa = strLinha.trim();
            if (limpa.length < 2) return false;
            const rx = this.#constantes.EXPRESSOES_REGULARES || {};
            const rxLetra = rx.CHAR_LETRA_GERAL || /\p{L}/u;
            const rxMinuscula = rx.CHAR_LETRA_MINUSCULA || /\p{Ll}/u;
            return rxLetra.test(limpa) && !rxMinuscula.test(limpa);
        }

        extrairPalavraSobCursor(texto, idx) {
            if (idx < 0 || idx >= texto.length) return '';
            let pos = idx;
            if (!this.eAlfanumericoUnicode(texto[pos]) && pos > 0 && this.eAlfanumericoUnicode(texto[pos - 1])) {
                pos--;
            }
            if (!this.eAlfanumericoUnicode(texto[pos])) return '';

            let ini = pos;
            while (ini > 0 && (this.eAlfanumericoUnicode(texto[ini - 1]) || texto[ini - 1] === '\u00BA' || texto[ini - 1] === '\u00B0')) {
                ini--;
            }
            let fim = pos + 1;
            while (fim < texto.length && (this.eAlfanumericoUnicode(texto[fim]) || texto[fim] === '\u00BA' || texto[fim] === '\u00AA' || texto[fim] === '\u00B0')) {
                fim++;
            }
            return texto.substring(ini, fim);
        }

        tentarExpandirBlocoMaiusculasComQuebraSuave(texto, idx) {
            const rx = this.#constantes.EXPRESSOES_REGULARES || {};
            if (rx.SEQUENCIA_PALAVRAS_MAIUSCULAS) {
                const regexSeqMaiusculas = new RegExp(rx.SEQUENCIA_PALAVRAS_MAIUSCULAS.source, 'gu');
                let mSeq;
                while ((mSeq = regexSeqMaiusculas.exec(texto)) !== null) {
                    const iniSeq = mSeq.index;
                    const fimSeq = iniSeq + mSeq[0].length;
                    if (idx >= (iniSeq - 1) && idx <= (fimSeq + 1)) {
                        const trecho = mSeq[0].trim();
                        const temPeloMenosDuasLetrasSeguidas = rx.CONTEM_DUAS_PALAVRAS_MAIUSCULAS
                            ? rx.CONTEM_DUAS_PALAVRAS_MAIUSCULAS.test(trecho)
                            : trecho.indexOf(' ') !== -1;
                        if (temPeloMenosDuasLetrasSeguidas) {
                            let iniLimpo = iniSeq;
                            let fimLimpo = fimSeq;
                            while (iniLimpo < fimLimpo && this.eEspacoBranco(texto[iniLimpo])) iniLimpo++;
                            while (fimLimpo > iniLimpo && this.eEspacoBranco(texto[fimLimpo - 1])) fimLimpo--;
                            if (fimLimpo > iniLimpo) {
                                return { inicio: iniLimpo, fim: fimLimpo };
                            }
                        }
                    }
                }
            }

            let iniLinha = idx;
            while (iniLinha > 0 && !this.eQuebraDeLinha(texto[iniLinha - 1])) {
                iniLinha--;
            }
            let fimLinha = idx;
            while (fimLinha < texto.length && !this.eQuebraDeLinha(texto[fimLinha])) {
                fimLinha++;
            }

            const linhaAtual = texto.substring(iniLinha, fimLinha);
            if (!this.linhaEhTodaMaiuscula(linhaAtual)) {
                return null;
            }

            let iniBloco = iniLinha;
            while (iniBloco > 0 && this.eQuebraDeLinha(texto[iniBloco - 1])) {
                let fimLinhaAnt = iniBloco - 1;
                while (fimLinhaAnt > 0 && texto[fimLinhaAnt - 1] === '\r') fimLinhaAnt--;
                let iniLinhaAnt = fimLinhaAnt;
                while (iniLinhaAnt > 0 && !this.eQuebraDeLinha(texto[iniLinhaAnt - 1])) {
                    iniLinhaAnt--;
                }
                const linhaAnt = texto.substring(iniLinhaAnt, fimLinhaAnt);
                if (this.linhaEhTodaMaiuscula(linhaAnt)) {
                    iniBloco = iniLinhaAnt;
                } else {
                    break;
                }
            }

            let fimBloco = fimLinha;
            while (fimBloco < texto.length && this.eQuebraDeLinha(texto[fimBloco])) {
                let iniLinhaProx = fimBloco + 1;
                while (iniLinhaProx < texto.length && texto[iniLinhaProx] === '\n') iniLinhaProx++;
                let fimLinhaProx = iniLinhaProx;
                while (fimLinhaProx < texto.length && !this.eQuebraDeLinha(texto[fimLinhaProx])) {
                    fimLinhaProx++;
                }
                const linhaProx = texto.substring(iniLinhaProx, fimLinhaProx);
                if (this.linhaEhTodaMaiuscula(linhaProx)) {
                    fimBloco = fimLinhaProx;
                } else {
                    break;
                }
            }

            while (iniBloco < fimBloco && this.eEspacoBranco(texto[iniBloco])) iniBloco++;
            while (fimBloco > iniBloco && this.eEspacoBranco(texto[fimBloco - 1])) fimBloco--;

            return (fimBloco > iniBloco) ? { inicio: iniBloco, fim: fimBloco } : null;
        }

        tentarExpandirBlocoFormatadoDestaque(mapa, idx) {
            if (!mapa || !Array.isArray(mapa.segmentos) || mapa.segmentos.length === 0) return null;

            const idxGlobal = idx + mapa.deslocamentoJanela;
            const blocoBase = mapa.bloco;
            const TAGS_DESTAQUE = new Set([
                'B', 'STRONG', 'I', 'EM', 'DFN', 'VAR', 'U', 'INS', 'MARK', 'S', 'STRIKE', 'DEL', 'SUP', 'SUB', 'CODE', 'KBD', 'SAMP', 'CITE', 'Q', 'ABBR'
            ]);

            let pesoBase = 400;
            let italicoBase = false;
            let sublinhadoBase = false;
            let bgBase = '';
            try {
                if (blocoBase && blocoBase.nodeType === Node.ELEMENT_NODE) {
                    const stBase = window.getComputedStyle(blocoBase);
                    if (stBase) {
                        pesoBase = parseInt(stBase.fontWeight, 10) || (stBase.fontWeight === 'bold' ? 700 : 400);
                        italicoBase = stBase.fontStyle === 'italic' || stBase.fontStyle === 'oblique';
                        const decBase = (stBase.textDecorationLine || stBase.textDecoration || '').toLowerCase();
                        sublinhadoBase = decBase.indexOf('underline') !== -1 || decBase.indexOf('line-through') !== -1;
                        bgBase = stBase.backgroundColor || '';
                    }
                }
            } catch (_) { }

            const verificarDestaqueSegmento = (seg) => {
                if (!seg || seg.ehBr || !seg.no) return { destacado: false, porTagInline: false };
                let atual = seg.no.parentElement;
                let porTagInline = false;

                while (atual && atual !== blocoBase && atual !== document.body && atual !== document.documentElement) {
                    if (TAGS_DESTAQUE.has(atual.tagName)) {
                        porTagInline = true;
                        break;
                    }
                    atual = atual.parentElement;
                }
                if (porTagInline) {
                    return { destacado: true, porTagInline: true };
                }

                const elPai = seg.no.parentElement;
                if (!elPai || elPai === blocoBase) return { destacado: false, porTagInline: false };
                if (elPai.classList && elPai.classList.contains('sample-token')) {
                    return { destacado: false, porTagInline: false };
                }

                try {
                    const st = window.getComputedStyle(elPai);
                    if (st) {
                        const peso = parseInt(st.fontWeight, 10) || (st.fontWeight === 'bold' || st.fontWeight === 'bolder' ? 700 : 400);
                        const fam = (st.fontFamily || '').toLowerCase();
                        const ehNegritoCss = (peso >= 600 && pesoBase < 600) || (fam.indexOf('bold') !== -1);
                        const ehItalicoCss = ((st.fontStyle === 'italic' || st.fontStyle === 'oblique') && !italicoBase) || (fam.indexOf('italic') !== -1);
                        const dec = (st.textDecorationLine || st.textDecoration || '').toLowerCase();
                        const ehSublinhadoCss = (dec.indexOf('underline') !== -1 || dec.indexOf('line-through') !== -1) && !sublinhadoBase;
                        const bg = st.backgroundColor || '';
                        const ehMarcaTextoCss = Boolean(bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== bgBase);

                        if (ehNegritoCss || ehItalicoCss || ehSublinhadoCss || ehMarcaTextoCss) {
                            return { destacado: true, porTagInline: false };
                        }
                    }
                } catch (_) { }

                return { destacado: false, porTagInline: false };
            };

            const segmentoEhApenasEspacoConector = (seg) => {
                if (!seg) return false;
                if (seg.ehBr) {
                    const comp = seg.comprimento || 0;
                    return comp === 1;
                }
                if (!seg.no) return false;
                const v = seg.no.nodeValue || '';
                return v.trim().length === 0;
            };

            let idxSegAlvo = -1;
            for (let i = 0; i < mapa.segmentos.length; i++) {
                const s = mapa.segmentos[i];
                if (idxGlobal >= s.inicioGlobal && idxGlobal <= s.fimGlobal) {
                    idxSegAlvo = i;
                    const infoS = verificarDestaqueSegmento(s);
                    if (infoS.destacado) break;
                }
            }
            if (idxSegAlvo === -1) return null;

            let infoAlvo = verificarDestaqueSegmento(mapa.segmentos[idxSegAlvo]);
            if (!infoAlvo.destacado && segmentoEhApenasEspacoConector(mapa.segmentos[idxSegAlvo])) {
                const infoAnt = idxSegAlvo > 0 ? verificarDestaqueSegmento(mapa.segmentos[idxSegAlvo - 1]) : { destacado: false };
                const infoProx = (idxSegAlvo + 1) < mapa.segmentos.length ? verificarDestaqueSegmento(mapa.segmentos[idxSegAlvo + 1]) : { destacado: false };
                if (infoAnt.destacado && infoProx.destacado) {
                    infoAlvo = { destacado: true, porTagInline: infoAnt.porTagInline || infoProx.porTagInline };
                } else if (infoAnt.destacado) {
                    idxSegAlvo = idxSegAlvo - 1;
                    infoAlvo = infoAnt;
                } else if (infoProx.destacado) {
                    idxSegAlvo = idxSegAlvo + 1;
                    infoAlvo = infoProx;
                }
            }
            if (!infoAlvo.destacado) return null;

            let segIni = idxSegAlvo;
            let usouTagInline = infoAlvo.porTagInline;
            while (segIni > 0) {
                const sAnt = mapa.segmentos[segIni - 1];
                const infoAnt = verificarDestaqueSegmento(sAnt);
                if (infoAnt.destacado) {
                    if (infoAnt.porTagInline) usouTagInline = true;
                    segIni--;
                } else if (segmentoEhApenasEspacoConector(sAnt) && segIni >= 2) {
                    const infoAntesEspaco = verificarDestaqueSegmento(mapa.segmentos[segIni - 2]);
                    if (infoAntesEspaco.destacado) {
                        if (infoAntesEspaco.porTagInline) usouTagInline = true;
                        segIni -= 2;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            let segFim = idxSegAlvo;
            while ((segFim + 1) < mapa.segmentos.length) {
                const sProx = mapa.segmentos[segFim + 1];
                const infoProx = verificarDestaqueSegmento(sProx);
                if (infoProx.destacado) {
                    if (infoProx.porTagInline) usouTagInline = true;
                    segFim++;
                } else if (segmentoEhApenasEspacoConector(sProx) && (segFim + 2) < mapa.segmentos.length) {
                    const infoDepoisEspaco = verificarDestaqueSegmento(mapa.segmentos[segFim + 2]);
                    if (infoDepoisEspaco.destacado) {
                        if (infoDepoisEspaco.porTagInline) usouTagInline = true;
                        segFim += 2;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            let iniLocal = Math.max(0, mapa.segmentos[segIni].inicioGlobal - mapa.deslocamentoJanela);
            let fimLocal = Math.min(mapa.texto.length, mapa.segmentos[segFim].fimGlobal - mapa.deslocamentoJanela);

            while (iniLocal < fimLocal && (this.eEspacoBranco(mapa.texto[iniLocal]) || this.eQuebraDeLinha(mapa.texto[iniLocal]))) {
                iniLocal++;
            }
            while (fimLocal > iniLocal && (this.eEspacoBranco(mapa.texto[fimLocal - 1]) || this.eQuebraDeLinha(mapa.texto[fimLocal - 1]) || this.ePontuacaoFim(mapa.texto[fimLocal - 1]))) {
                fimLocal--;
            }

            if (fimLocal <= iniLocal) return null;

            const trechoDestacado = mapa.texto.substring(iniLocal, fimLocal).trim();
            if (!usouTagInline && !/\S+\s+\S+/.test(trechoDestacado)) {
                return null;
            }

            if (!usouTagInline && iniLocal === 0 && fimLocal >= mapa.texto.trim().length) {
                return null;
            }

            return { inicio: iniLocal, fim: fimLocal };
        }

        tentarExpandirPadraoComposto(texto, idx, forcarCompostos = false, ehDuploClique = false) {
            const catalogo = this.#constantes.CATALOGO_PADROES_JURIDICOS || [];
            const rx = this.#constantes.EXPRESSOES_REGULARES || {};

            const palavraSobCursor = this.extrairPalavraSobCursor(texto, idx);
            const clicouEmRotuloInicial = palavraSobCursor.length > 0 && rx.PALAVRA_ROTULO_INICIAL && rx.PALAVRA_ROTULO_INICIAL.test(palavraSobCursor);
            const clicouEmConectorIntervalo = palavraSobCursor.length > 0 && rx.PALAVRA_CONECTORA_INTERVALO && rx.PALAVRA_CONECTORA_INTERVALO.test(palavraSobCursor);

            const finalizarMatchSemTransbordo = (iniBruto, fimBruto, nomeGrupo, supShift) => {
                let ini = iniBruto;
                let fim = fimBruto;
                while (ini < fim && (this.eEspacoBranco(texto[ini]) || this.eQuebraDeLinha(texto[ini]))) {
                    ini++;
                }
                while (fim > ini && (this.eEspacoBranco(texto[fim - 1]) || this.eQuebraDeLinha(texto[fim - 1]))) {
                    fim--;
                }
                if (nomeGrupo === 'LEGISLACAO_JURISPRUDENCIA_E_ATOS' || nomeGrupo === 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS') {
                    const trechoAtual = texto.substring(ini, fim);
                    const mSufixoSolto = trechoAtual.match(/(?:[\s,;:\-]+(?:e|ou|c\/c|cumulado\s+com|combinado\s+com|de|do|da|dos|das|no|na|nos|nas|ao|aos|a|o|as|os|em|por|para|com))+$/iu);
                    if (mSufixoSolto && mSufixoSolto[0].length < trechoAtual.length) {
                        fim -= mSufixoSolto[0].length;
                    }
                    while (fim > ini && (this.eEspacoBranco(texto[fim - 1]) || this.eQuebraDeLinha(texto[fim - 1]) || texto[fim - 1] === ',' || texto[fim - 1] === ';' || texto[fim - 1] === ':')) {
                        fim--;
                    }
                }
                if (ini >= fim || idx < ini || idx > fim) return null;
                return { inicio: ini, fim, grupo: nomeGrupo, suportaFiltroShift: supShift };
            };

            for (let g = 0; g < catalogo.length; g++) {
                const grupo = catalogo[g];
                const suportaShift = Boolean(grupo.suportaFiltroShiftDigitos);

                if (grupo.exigeEspacoOuDuploClique && !forcarCompostos && !clicouEmRotuloInicial && !clicouEmConectorIntervalo) {
                    continue;
                }

                for (let r = 0; r < grupo.regexes.length; r++) {
                    const padraoOriginal = grupo.regexes[r];
                    const regex = new RegExp(padraoOriginal.source, padraoOriginal.flags);
                    let match;

                    while ((match = regex.exec(texto)) !== null) {
                        const textoMatch = match[0];
                        const inicioMatch = match.index;
                        const fimMatch = inicioMatch + textoMatch.length;

                        if (idx < inicioMatch || idx > fimMatch) continue;
                        const idxRelativo = idx - inicioMatch;

                        if (grupo.grupo === 'FINANCEIRO_E_DECIMAIS' && !textoMatch.endsWith('%')) {
                            const idxAbrePar = textoMatch.indexOf('(');

                            if (idxAbrePar !== -1) {
                                if (idxRelativo > idxAbrePar) {
                                    continue;
                                }

                                const textoAntesPar = textoMatch.substring(0, idxAbrePar).trimEnd();
                                const compValor = textoAntesPar.length;

                                if (ehDuploClique || (idxRelativo >= compValor && idxRelativo <= idxAbrePar)) {
                                    const resFin = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                    if (resFin) return resFin;
                                    continue;
                                }

                                const matchPrefixoRS = rx.PREFIXO_MOEDA_RS ? textoAntesPar.match(rx.PREFIXO_MOEDA_RS) : null;
                                if (matchPrefixoRS) {
                                    const compPrefixoRS = matchPrefixoRS[0].length;
                                    if (idxRelativo < compPrefixoRS) {
                                        const resFin = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compValor, grupo.grupo, suportaShift);
                                        if (resFin) return resFin;
                                        continue;
                                    }
                                    const resFin = finalizarMatchSemTransbordo(inicioMatch + compPrefixoRS, inicioMatch + compValor, grupo.grupo, suportaShift);
                                    if (resFin) return resFin;
                                    continue;
                                }
                                const resFin = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compValor, grupo.grupo, suportaShift);
                                if (resFin) return resFin;
                                continue;
                            } else {
                                const matchPrefixoRS = rx.PREFIXO_MOEDA_RS ? textoMatch.match(rx.PREFIXO_MOEDA_RS) : null;
                                if (matchPrefixoRS) {
                                    const compPrefixoRS = matchPrefixoRS[0].length;
                                    if (ehDuploClique || forcarCompostos || idxRelativo < compPrefixoRS) {
                                        const resFin = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                        if (resFin) return resFin;
                                        continue;
                                    }
                                    const resFin = finalizarMatchSemTransbordo(inicioMatch + compPrefixoRS, fimMatch, grupo.grupo, suportaShift);
                                    if (resFin) return resFin;
                                    continue;
                                }
                                const resFin = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                if (resFin) return resFin;
                                continue;
                            }
                        }

                        if (grupo.grupo === 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS') {
                            const idxAbrePar = textoMatch.indexOf('(');
                            if (idxAbrePar !== -1 && rx.INICIO_DIGITO && rx.INICIO_DIGITO.test(textoMatch)) {
                                const trechoAnterior = texto.substring(Math.max(0, inicioMatch - 6), inicioMatch);
                                if (rx.SUFIXO_MOEDA_RS_ANTERIOR && rx.SUFIXO_MOEDA_RS_ANTERIOR.test(trechoAnterior)) {
                                    continue;
                                }
                                if (idxRelativo > idxAbrePar) {
                                    continue;
                                }
                                const textoAntesPar = textoMatch.substring(0, idxAbrePar).trimEnd();
                                const compNum = textoAntesPar.length;
                                if (ehDuploClique || (idxRelativo >= compNum && idxRelativo <= idxAbrePar)) {
                                    const resInt = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                    if (resInt) return resInt;
                                    continue;
                                }
                                const resInt = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compNum, grupo.grupo, suportaShift);
                                if (resInt) return resInt;
                                continue;
                            }
                        }

                        if (grupo.grupo === 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO') {
                            const matchInssComEspecie = textoMatch.match(/^(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/);
                            if (matchInssComEspecie) {
                                const idxBarra = textoMatch.indexOf('/');
                                if (ehDuploClique || forcarCompostos) {
                                    const resInss = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                    if (resInss) return resInss;
                                    continue;
                                }
                                if (idxRelativo <= idxBarra) {
                                    const resInss = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                    if (resInss) return resInss;
                                    continue;
                                }
                                if (idxRelativo > idxBarra) {
                                    const resInss = finalizarMatchSemTransbordo(inicioMatch + idxBarra + 1, fimMatch, grupo.grupo, suportaShift);
                                    if (resInss) return resInss;
                                    continue;
                                }
                            }
                        }

                        if (!forcarCompostos && !ehDuploClique && grupo.grupo === 'DATA_COM_HORARIO_CONTIGUO') {
                            if (rx.DATA_NUMERICA_COM_HORARIO &&
                                rx.DATA_NUMERICA_COM_HORARIO.test(textoMatch) &&
                                rx.SUFIXO_HORARIO_EM_DATA) {
                                const matchHorario = textoMatch.match(rx.SUFIXO_HORARIO_EM_DATA);
                                if (matchHorario) {
                                    const compDataSemHorario = matchHorario.index !== undefined ? matchHorario.index : (textoMatch.length - matchHorario[0].length);
                                    const matchRelHora = matchHorario[0].search(/\d{1,2}:\d{2}/);
                                    const idxInicioHora = compDataSemHorario + (matchRelHora >= 0 ? matchRelHora : matchHorario[0].length);

                                    if (idxRelativo < compDataSemHorario) {
                                        const resDt = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + compDataSemHorario, grupo.grupo, suportaShift);
                                        if (resDt) return resDt;
                                        continue;
                                    }
                                    if (idxRelativo >= idxInicioHora) {
                                        const resTm = finalizarMatchSemTransbordo(inicioMatch + idxInicioHora, fimMatch, grupo.grupo, suportaShift);
                                        if (resTm) return resTm;
                                        continue;
                                    }
                                    const resComp = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                                    if (resComp) return resComp;
                                    continue;
                                }
                            }
                        }

                        if (!forcarCompostos && grupo.grupo === 'NUMERACOES_ID_E_PUBLICAS' && rx.PROTOCOLO_BARRA_ANO) {
                            const matchAtoBarra = textoMatch.match(rx.PROTOCOLO_BARRA_ANO);
                            if (matchAtoBarra) {
                                const idxBarra = textoMatch.indexOf('/');
                                if (idxRelativo < idxBarra) {
                                    const resAt = finalizarMatchSemTransbordo(inicioMatch, inicioMatch + idxBarra, grupo.grupo, suportaShift);
                                    if (resAt) return resAt;
                                    continue;
                                }
                                if (idxRelativo > idxBarra) {
                                    const resAt = finalizarMatchSemTransbordo(inicioMatch + idxBarra + 1, fimMatch, grupo.grupo, suportaShift);
                                    if (resAt) return resAt;
                                    continue;
                                }
                            }
                        }

                        const resFinal = finalizarMatchSemTransbordo(inicioMatch, fimMatch, grupo.grupo, suportaShift);
                        if (resFinal) return resFinal;
                    }
                }
            }

            if (forcarCompostos && rx.MULTIPLOS_NUMEROS_ESPACADOS) {
                const regexMultiNum = new RegExp(rx.MULTIPLOS_NUMEROS_ESPACADOS.source, 'gu');
                let mNum;
                while ((mNum = regexMultiNum.exec(texto)) !== null) {
                    const iniM = mNum.index;
                    const fimM = iniM + mNum[0].length;
                    if (idx >= iniM && idx <= fimM) {
                        const resMulti = finalizarMatchSemTransbordo(iniM, fimM, 'MULTIPLOS_NUMEROS_ESPACADOS', true);
                        if (resMulti) return resMulti;
                    }
                }
            }

            return null;
        }
    }

    Object.freeze(EstagioExpressoes.prototype);
    window.JusGovEstagioExpressoes = Object.freeze(EstagioExpressoes);
})();

