/* ==========================================================================
 * ARQUIVO: src/cfg/popup-ui-helpers.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Popup — Helpers de UI (Indicadores SVG, Grupos Colapsáveis e Seletor de Perfis)
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/popup-ui-helpers.js
 * - Exportado: window.JusGovPopupUiHelpers (aplicarIndicadorDiscreto, inicializarGruposColapsaveisPopup, atualizarIconeBotaoBarraAutomatePopup, renderizarSeletorPerfisPopup)
 * - Regras / Seções: ENG-00, ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz) {
    'use strict';

    function aplicarIndicadorDiscreto(el, operacional, textoTitle, modoAlerta = false) {
        if (!el) return;
        el.classList.remove('operacional', 'inoperacional', 'alerta');
        el.classList.add(operacional ? 'operacional' : (modoAlerta ? 'alerta' : 'inoperacional'));
        if (textoTitle) el.title = textoTitle;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('width', '9');
        svg.setAttribute('height', '9');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2.1');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        if (operacional) {
            p.setAttribute('d', 'M3.5 8.5 6.5 11.5 12.5 4.5');
        } else if (modoAlerta) {
            p.setAttribute('d', 'M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5');
        } else {
            p.setAttribute('d', 'M4 8h8');
        }
        svg.appendChild(p);
        el.replaceChildren(svg);
    }

    function inicializarGruposColapsaveisPopup() {
        const grupos = document.querySelectorAll('.grupo-colapsavel');
        grupos.forEach((grupo) => {
            const cabecalho = grupo.querySelector('.grupo-cabecalho');
            if (!cabecalho || cabecalho.dataset.autoColapsoInit === '1') return;
            cabecalho.dataset.autoColapsoInit = '1';
            let timerHover = 0;
            let timerFechar = 0;

            const definirExpandido = (expandido, fixar = false) => {
                grupo.classList.toggle('colapsado', !expandido);
                cabecalho.setAttribute('aria-expanded', expandido ? 'true' : 'false');
                if (fixar) {
                    grupo.dataset.fixado = expandido ? '1' : '0';
                }
            };

            grupo.addEventListener('mouseenter', () => {
                if (timerFechar) { clearTimeout(timerFechar); timerFechar = 0; }
                if (!grupo.classList.contains('colapsado')) return;
                if (timerHover) clearTimeout(timerHover);
                timerHover = setTimeout(() => {
                    timerHover = 0;
                    definirExpandido(true, false);
                }, 280);
            });

            grupo.addEventListener('mouseleave', () => {
                if (timerHover) { clearTimeout(timerHover); timerHover = 0; }
                if (grupo.dataset.fixado === '1') return;
                if (timerFechar) clearTimeout(timerFechar);
                timerFechar = setTimeout(() => {
                    timerFechar = 0;
                    if (!grupo.matches(':hover') && grupo.dataset.fixado !== '1') {
                        definirExpandido(false, false);
                    }
                }, 160);
            });

            cabecalho.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (timerHover) { clearTimeout(timerHover); timerHover = 0; }
                if (timerFechar) { clearTimeout(timerFechar); timerFechar = 0; }
                const vaiExpandir = grupo.classList.contains('colapsado');
                definirExpandido(vaiExpandir, true);
            });

            cabecalho.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    const vaiExpandir = grupo.classList.contains('colapsado');
                    definirExpandido(vaiExpandir, true);
                }
            });
        });
    }

    function atualizarIconeBotaoBarraAutomatePopup(btnRestaurarBarraAutomatePopup, barraVisivel = true) {
        if (!btnRestaurarBarraAutomatePopup) return;
        const visivel = Boolean(barraVisivel);
        btnRestaurarBarraAutomatePopup.classList.toggle('ativo', visivel);
        btnRestaurarBarraAutomatePopup.title = visivel
            ? 'Barra visível nesta aba (clique para ocultar)'
            : 'Barra oculta nesta aba (clique para exibir)';
        btnRestaurarBarraAutomatePopup.setAttribute('aria-pressed', visivel ? 'true' : 'false');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '13');
        svg.setAttribute('height', '13');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2.1');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        if (visivel) {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z');
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('cx', '12');
            c.setAttribute('cy', '12');
            c.setAttribute('r', '3');
            svg.appendChild(p);
            svg.appendChild(c);
        } else {
            const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p1.setAttribute('d', 'M17.94 17.94A10.9 10.9 0 0 1 12 18c-6.5 0-10-6-10-6a18.5 18.5 0 0 1 5.06-5.94');
            const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p2.setAttribute('d', 'M9.9 4.24A10.9 10.9 0 0 1 12 4c6.5 0 10 6 10 6a18.5 18.5 0 0 1-2.16 3.19');
            const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            l.setAttribute('x1', '2');
            l.setAttribute('y1', '2');
            l.setAttribute('x2', '22');
            l.setAttribute('y2', '22');
            svg.appendChild(p1);
            svg.appendChild(p2);
            svg.appendChild(l);
        }
        btnRestaurarBarraAutomatePopup.replaceChildren(svg);
    }

    function renderizarSeletorPerfisPopup(selectPerfilPopup, listaPerfis, perfilAtivoId) {
        if (!selectPerfilPopup || !Array.isArray(listaPerfis) || listaPerfis.length === 0) return;
        const atual = String(perfilAtivoId || 'padrao');
        selectPerfilPopup.textContent = '';
        listaPerfis.forEach((perfil) => {
            if (!perfil || !perfil.id) return;
            const opt = document.createElement('option');
            opt.value = perfil.id;
            opt.textContent = perfil.nome || perfil.id;
            selectPerfilPopup.appendChild(opt);
        });
        selectPerfilPopup.value = atual;
        if (selectPerfilPopup.value !== atual && selectPerfilPopup.options.length > 0) {
            selectPerfilPopup.selectedIndex = 0;
        }
    }

        function atualizarContadoresProdutividadePopup(rodapeProdutividadeOnline, instanciaProdutividadePopup) {
        if (!rodapeProdutividadeOnline || typeof chrome === 'undefined') return;
        const renderizar = (st, cfgObs = null, nuvemMeta = null, agoraSrv = null) => {
            if (!st) return;
            if (instanciaProdutividadePopup && typeof instanciaProdutividadePopup.renderizarResumoProdutividadeDom === 'function') {
                instanciaProdutividadePopup.renderizarResumoProdutividadeDom(rodapeProdutividadeOnline, st, cfgObs || {}, Number(agoraSrv || Date.now()), { nuvemMeta });
                return;
            }
            const corridoMin = Math.max(0, Math.floor(Number(st.corridoMinutos) || 0)) + Math.max(0, Math.floor(Number(nuvemMeta && nuvemMeta.outrosCorridoMin) || 0));
            const hh = String(Math.floor(corridoMin / 60)).padStart(2, '0');
            const mm = String(corridoMin % 60).padStart(2, '0');
            rodapeProdutividadeOnline.textContent = corridoMin > 0 ? `👉 Corrido ${hh}h:${mm}m` : '';
        };
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ acao: 'OBTER_STATUS_TRABALHO' }, (resp) => {
                if (!chrome.runtime.lastError && resp && resp.ok && resp.estado) {
                    renderizar(resp.estado, resp.config || null, resp.nuvemMeta || null, resp.agoraServidor || null);
                    return;
                }
                if (chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get(['jusgovTrabalhoEstado', 'jusgovProdNuvemMeta'], (dados) => {
                        if (!chrome.runtime.lastError && dados && dados.jusgovTrabalhoEstado) {
                            renderizar(dados.jusgovTrabalhoEstado, null, dados.jusgovProdNuvemMeta || null);
                        }
                    });
                }
            });
        } else if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['jusgovTrabalhoEstado', 'jusgovProdNuvemMeta'], (dados) => {
                if (!chrome.runtime.lastError && dados && dados.jusgovTrabalhoEstado) {
                    renderizar(dados.jusgovTrabalhoEstado, null, dados.jusgovProdNuvemMeta || null);
                }
            });
        }
    }

    function enviarComandoAutomateParaAbaAtiva(atualizarIconeFn, acaoAutomate, fecharPopup = false, aoResponder = null) {
        if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) return;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs && tabs[0] && tabs[0].id;
            if (!tabId) return;
            chrome.tabs.sendMessage(tabId, { acao: acaoAutomate }, (resp) => {
                if (chrome.runtime && chrome.runtime.lastError && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({
                        acao: 'AUTOMATE_GARANTIR_INJECAO_ABA',
                        tabId,
                        ativo: true,
                        restaurarBarra: true,
                        expandirBarra: true
                    }, () => {
                        chrome.tabs.sendMessage(tabId, { acao: acaoAutomate }, (respRetry) => {
                            if (typeof aoResponder === 'function') aoResponder(respRetry);
                            if (fecharPopup) window.close();
                        });
                    });
                    return;
                }
                if (typeof aoResponder === 'function') aoResponder(resp);
                if (fecharPopup) window.close();
            });
        });
    }

    raiz.JusGovPopupUiHelpers = Object.freeze({
        atualizarContadoresProdutividadePopup,
        enviarComandoAutomateParaAbaAtiva,
        aplicarIndicadorDiscreto,
        inicializarGruposColapsaveisPopup,
        atualizarIconeBotaoBarraAutomatePopup,
        renderizarSeletorPerfisPopup
    });
})(typeof self !== 'undefined' ? self : this);