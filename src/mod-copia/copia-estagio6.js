/**
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * ARQUIVO: src/mod-copia/copia-estagio6.js
 * CLASSE: EstagioTabelas
 * 
 * FINALIDADE:
 * Implementação do Estágio 6 do Motor de Expansão Contextual:
 * - Seleção inteligente e estruturada em Tabelas de Dados (`<table>`, `<tr>`, `<td>`, `<th>`).
 * - Distinção precisa entre células de leitura de dados e controles interativos embutidos (botões, links).
 * - Integração nativa com o Acumulador de Cópia (`AcumuladorCopia.js`):
 *   * Modo Coluna: Alt + Clique no cabeçalho ou célula acumula a coluna vertical inteira.
 *   * Modo Linha: Alt + Clique na linha acumula o registro horizontal completo formatado.
 *   * Modo Baralho com Shift (ordem cronológica de clique) vs. Ordem Crescente Natural do documento.
 * 
 * REGRAS DE NEGÓCIO E PORQUÊS:
 * 1. Células de dados de tabelas (ex: extratos previdenciários CNIS, cálculos de liquidação,
 *    tabelas de custas) mantêm a seleção ativa no DOM para conferência visual.
 * 2. Se a célula contiver um botão de ação rápida (ex: ícone de exclusão ou edição no PJe),
 *    o clique prioritário não deve ser interceptado como seleção de texto puro.
 * 
 * DOCUMENTAÇÃO RELACIONADA:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md (Regra 2.6: Estágio 6 - Tabelas e Acumulador)
 * - docs/02_ARQUITETURA_E_AS_BUILT.md (Seção 3.6: Estágio 6 e Acumulador)
 * - docs/05_DECISOES_ARQUITETURAIS_ADR.md (ADR-004: Modularização em Classes POO)
 */

(function () {
    'use strict';

    if (typeof window !== 'undefined' && window.JusGovEstagioTabelas) {
        return;
    }

    class EstagioTabelas {
        #acumulador;

        constructor(acumulador = null) {
            this.#acumulador = acumulador || (typeof window !== 'undefined' && window.JusGovAcumuladorInstancia ? window.JusGovAcumuladorInstancia : null);
        }

        get acumulador() {
            return this.#acumulador;
        }

        set acumulador(instancia) {
            this.#acumulador = instancia;
        }

        /**
         * Identifica se um elemento DOM reside dentro de uma célula de tabela de dados de leitura legítima.
         */
        isCelulaTabelaDadosLeitura(el) {
            if (!el) return false;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return false;

            const tagBase = (base.tagName || '').toUpperCase();
            if (
                tagBase === 'BUTTON' || tagBase === 'A' || tagBase === 'INPUT' ||
                tagBase === 'SELECT' || tagBase === 'TEXTAREA' || tagBase === 'LABEL'
            ) {
                return false;
            }
            if (base.getAttribute && (base.getAttribute('role') === 'button' || base.getAttribute('role') === 'link')) {
                return false;
            }

            const celula = (typeof base.closest === 'function')
                ? base.closest('td, th, [role="cell"], [role="gridcell"], .rich-table-cell')
                : null;
            if (!celula) return false;

            let curr = base;
            while (curr && curr !== celula) {
                if (curr.nodeType === Node.ELEMENT_NODE) {
                    const t = (curr.tagName || '').toUpperCase();
                    if (t === 'BUTTON' || t === 'A' || t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') {
                        return false;
                    }
                    const r = (curr.getAttribute && curr.getAttribute('role')) || '';
                    if (r === 'button' || r === 'link') {
                        return false;
                    }
                }
                curr = curr.parentElement;
            }

            return true;
        }

        /**
         * Localiza a linha `<tr>` ancestral de uma célula ou elemento.
         */
        obterLinhaTabelaAncestral(el) {
            if (!el) return null;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return null;
            return (typeof base.closest === 'function') ? base.closest('tr, [role="row"]') : null;
        }

        /**
         * Localiza a célula `<td>`/`<th>` ancestral de um elemento.
         */
        obterCelulaTabelaAncestral(el) {
            if (!el) return null;
            const base = (el.nodeType === Node.TEXT_NODE) ? el.parentElement : el;
            if (!base) return null;
            return (typeof base.closest === 'function') ? base.closest('td, th, [role="cell"], [role="gridcell"]') : null;
        }

        /**
         * Acumula seleção de coluna ou linha de tabela no módulo acumulador.
         */
        acumularSelecaoTabela(celulaOuLinha, modo = 'COLUNA', modoBaralhoShift = false) {
            if (!this.#acumulador || typeof this.#acumulador.acumularSelecaoTabelaPorColunasOuLinhas !== 'function') {
                return false;
            }
            return this.#acumulador.acumularSelecaoTabelaPorColunasOuLinhas(celulaOuLinha, modo, modoBaralhoShift);
        }
    }

    window.JusGovEstagioTabelas = EstagioTabelas;
})();

