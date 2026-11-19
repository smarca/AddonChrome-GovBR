/* ==========================================================================
 * ARQUIVO: src/cfg/popup.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/popup.js
 * - Natureza: Controlador do Popup de Ação Rápida da Extensão (popup.html)
 * - Guarda de Idempotência: window.__JUSGOV_POPUP_CARREGADO__
 * - Sincronização: Lê/grava modoTurbo, urlsTurbo, manterFormatacaoBasica, nivelFiltroFormatacao e ativoAmpuletas em chrome.storage.sync + escuta storage.onChanged
 * - Regras / Seções: Seção 6.26 (slider condicional de nível de filtro), Seção 6.64 (idempotência e cabeçalho @MAPA-IA)
 *
 * DIRETIVAS DE GERACAO E MANUTENCAO IA [DEV - ENGENHARIA DE CODIGO]:
 * 1) DELIBERACAO PREVIA OBRIGATORIA: Jamais gerar codigo sem comando expresso;
 *    sugerir preliminarmente e na ordem exata: (a) Eventuais Correcoes,
 *    (b) Mudancas de Boas Praticas e (c) Novas Features.
 * 2) PRESERVACAO DOCUMENTAL ABSOLUTA: E terminantemente proibido apagar,
 *    resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario
 *    deve explicar exaustivamente o *porque* (regras de negocio, isolamento CSP,
 *    sincronismo em tempo real com o Service Worker e manipulacao da aba ativa)
 *    e nao apenas o *o que*.
 * 3) INTRA-COMENTARIOS DE RECONSTRUCAO (PSEUDOCODIGO INTERCALADO / BLUEPRINT):
 *    O fluxo de dados ("Passos") deve estar obrigatoriamente INTERCALADO
 *    dentro do corpo de cada metodo, permitindo recriar 100% do controlador do
 *    Popup do zero caso o codigo-fonte deixasse de existir.
 * 4) CODIFICACAO UTF-8 NATIVA DIRETA (ACENTOS E CEDILHAS REAIS): O codigo-fonte
 *    e os arquivos de interface utilizam a codificacao padrao UTF-8 com suporte
 *    nativo a acentos e cedilhas (ç, ã, é, etc.) diretamente no texto. E
 *    terminantemente PROIBIDO o uso de entidades HTML (como ç, õ, é)
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
 * 1. SINCRONIZACAO BIDIRECIONAL COM O STORAGE E ABAS ABERTAS:
 * - Ao abrir o Popup, o script le o estado atual de "chrome.storage.sync"
 *   ("modoTurbo", "urlsTurbo", "ativoAmpuletas", "manterFormatacaoBasica") e
 *   atualiza a interface instantaneamente.
 * - Tambem escuta o evento "chrome.storage.onChanged" para que, se o usuario
 *   pressionar "Esc + Esc" ou alterar algo na aba de Opcoes, o Popup reflita
 *   a mudanca na mesma hora.
 *
 * 2. LOGICA INVERTIDA DO CHECKBOX "REMOVER FORMATACOES (TEXTO PURO)":
 * - Conforme diretriz de usabilidade, a opcao padrao de fabrica vem MARCADA
 *   como "Remover Formatacoes (Texto Puro)" (o que equivale internamente a
 *   "manterFormatacaoBasica = false").
 * - Quando o usuario DESMARCA a caixa "Remover Formatacoes", o sistema ativa
 *   "manterFormatacaoBasica = true" (preservando exclusivamente Negrito,
 *   Italico e Sublinhado nas copias subsequentes).
 *
 * 3. INCLUSAO / REMOCAO RAPIDA DO DOMINIO DA ABA ATIVA:
 * - Consulta "chrome.tabs.query({ active: true, currentWindow: true })" para
 *   identificar o hostname da aba atual (ex: "pje1g.trf1.jus.br") e permite
 *   incluir ou remover a mascara "*://pje1g.trf1.jus.br/*" na lista "urlsTurbo"
 *   com 1 clique.
 *
 * 4. OCULTACAO INTELIGENTE DA OPCAO "PJE TURBO":
 * - A funcionalidade Anti-Ampulhetas so faz sentido no PJe. O controle
 *   permanece oculto (display: none) a menos que a URL atual contenha "pje"
 *   ou ".jus.br", simplificando a interface em outros sites.
 *
 * 5. ICONE VETORIAL DINAMICO NO HTML (INTERATIVO):
 * - O icone no topo do Popup altera suas cores (fundo, borda e raio) de acordo
 *   com o modo escolhido para dar feedback claro de ativacao (Azul, Ambar ou Cinza).
 * ========================================================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && window.__JUSGOV_POPUP_CARREGADO__) {
        return;
    }
    if (typeof window !== 'undefined') {
        window.__JUSGOV_POPUP_CARREGADO__ = true;
    }

    /* Passo 1.1: Mapear elementos de controle da interface do Popup com suporte a multiplas variantes de ID */
    const badgeStatusGeral = document.getElementById('badgeStatusGeral') || document.getElementById('statusBadge');
    const labelModoAtual = document.getElementById('labelModoAtual');
    const btnModoGlobal = document.getElementById('btnModoGlobal') || document.getElementById('btnGlobal');
    const btnModoUrl = document.getElementById('btnModoUrl') || document.getElementById('btnUrl');
    const btnModoDesligado = document.getElementById('btnModoDesligado') || document.getElementById('btnOff');
    const infoDominioAba = document.getElementById('infoDominioAba') || document.getElementById('currentDomain');
    const barraDominioAtual = document.getElementById('barraDominioAtual') || document.querySelector('.barra-dominio-atual');
    const btnAlternarDominioAba = document.getElementById('btnAlternarDominioAba') || document.getElementById('btnToggleDomain');
    const checkAmpuletas = document.getElementById('checkAmpuletas') || document.getElementById('chkAmpuletas');
    const containerAmpuletas = document.getElementById('containerAmpuletas');
    const tituloAmpuletas = document.getElementById('tituloAmpuletas');
    const subtituloAmpuletas = document.getElementById('subtituloAmpuletas');
    const containerAutomatePje = document.getElementById('containerAutomatePje');
    const subtituloAutomatePopup = document.getElementById('subtituloAutomatePopup');
    const checkAutomatePje = document.getElementById('checkAutomatePje');
    const barraAcoesAutomatePopup = document.getElementById('barraAcoesAutomatePopup');
    const btnExecutarAutomatePopup = document.getElementById('btnExecutarAutomatePopup');
    const btnConfigurarAutomatePopup = document.getElementById('btnConfigurarAutomatePopup');
    const btnPararAutomatePopup = document.getElementById('btnPararAutomatePopup');
    const btnRestaurarBarraAutomatePopup = document.getElementById('btnRestaurarBarraAutomatePopup');
    const grupoInativosPopup = document.getElementById('grupoInativosPopup');
    const btnIconeAutomateDesativado = document.getElementById('btnIconeAutomateDesativado');
    const iconeStatusMotorCopia = document.getElementById('iconeStatusMotorCopia');
    const iconeStatusAmpuletas = document.getElementById('iconeStatusAmpuletas');
    const iconeStatusAutomate = document.getElementById('iconeStatusAutomate');
    const btnAbrirOpcoes = document.getElementById('btnAbrirOpcoes') || document.getElementById('btnOptions');
    const btnBugsOnline = document.getElementById('btnBugsOnline');
    const rodapeProdutividadeOnline = document.getElementById('rodapeProdutividadeOnline');
    const selectPerfilPopup = document.getElementById('selectPerfilPopup');
    const avisoMiniTipPopup = document.getElementById('avisoMiniTipPopup');

    /* Mapear elementos do icone SVG para alterar cor dinamicamente */
    const iconeBg = document.getElementById('iconeBg');
    const iconeRaio = document.getElementById('iconeRaio');

    let hostnameAbaAtual = '';
    let mascaraDominioAbaAtual = '';
    let cacheUrlsTurbo = [];
    let modoOperacionalAtual = 'global';

    /*
     * FUNCAO: adicionarOuvinteSeguro
     * OBJETIVO DE RECONSTRUCAO: Impedir excecoes fatais "TypeError: Cannot read
     * properties of null (reading 'addEventListener')" verificando a existencia
     * fisica da referencia DOM antes de acoplar o listener.
     */
    function adicionarOuvinteSeguro(elemento, evento, callback) {
        /* Passo 1.2: Validar se a referencia do elemento nao e nula nem indefinida */
        if (elemento && typeof elemento.addEventListener === 'function') {
            elemento.addEventListener(evento, callback);
        }
    }

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

    function atualizarIconeBotaoBarraAutomatePopup(barraVisivel = true) {
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

    function consultarEstadoBarraAutomateAbaAtiva() {
        if (!btnRestaurarBarraAutomatePopup || typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) return;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs && tabs[0] && tabs[0].id;
            if (!tabId) return;
            chrome.tabs.sendMessage(tabId, { acao: 'AUTOMATE_OBTER_ESTADO_BARRA' }, (resp) => {
                if (chrome.runtime && chrome.runtime.lastError) return;
                if (resp && resp.ok) {
                    const visivel = (resp.barraVisivel !== undefined)
                        ? Boolean(resp.barraVisivel)
                        : Boolean(resp.ativo && !resp.fechadaNaAba);
                    atualizarIconeBotaoBarraAutomatePopup(visivel);
                }
            });
        });
    }

    function atualizarVisibilidadeAutomatePopup(ativo, expandirAgora = false) {
        const ehOperacional = Boolean(ativo);
        if (checkAutomatePje) checkAutomatePje.checked = ehOperacional;
        if (barraAcoesAutomatePopup) {
            barraAcoesAutomatePopup.style.display = ehOperacional ? 'flex' : 'none';
        }
        if (ehOperacional) {
            consultarEstadoBarraAutomateAbaAtiva();
        }
        if (containerAutomatePje) {
            containerAutomatePje.style.display = ehOperacional ? 'flex' : 'none';
            if (ehOperacional && expandirAgora) {
                containerAutomatePje.classList.remove('colapsado');
                containerAutomatePje.dataset.fixado = '1';
                const cabAuto = containerAutomatePje.querySelector('.grupo-cabecalho');
                if (cabAuto) cabAuto.setAttribute('aria-expanded', 'true');
            } else if (!ehOperacional) {
                containerAutomatePje.classList.add('colapsado');
                containerAutomatePje.dataset.fixado = '0';
            }
        }
        if (grupoInativosPopup) {
            grupoInativosPopup.style.display = ehOperacional ? 'none' : 'inline-flex';
        }
        if (btnIconeAutomateDesativado) {
            btnIconeAutomateDesativado.style.display = ehOperacional ? 'none' : 'inline-flex';
        }
        aplicarIndicadorDiscreto(iconeStatusAutomate, ehOperacional, ehOperacional ? 'Operacional' : 'Inoperacional');
    }

    /*
     * FUNCAO: atualizarInterfaceModo
     * OBJETIVO DE RECONSTRUCAO: Destacar o botao correspondente ao modo ativo,
     * atualizar o badge com <br> e ajustar as cores do icone SVG inline com
     * verificacoes defensivas em cada no DOM.
     */
    function atualizarInterfaceModo(modoAtivo) {
        modoOperacionalAtual = modoAtivo;

        /* Passo 2.1: Limpar classes ativas dos 3 botoes com checagem de nulidade */
        if (btnModoGlobal) btnModoGlobal.classList.remove('ativo');
        if (btnModoUrl) btnModoUrl.classList.remove('ativo');
        if (btnModoDesligado) btnModoDesligado.classList.remove('ativo');

        /* Ocultar barra de inclusao de site quando em Modo Global ou Desligado */
        if (barraDominioAtual) {
            barraDominioAtual.style.display = (modoAtivo === 'url') ? 'flex' : 'none';
        }

        /* Passo 2.2: Aplicar destaque visual, rotulo descritivo e cores do SVG via DOM seguro */
        const preencherBadgeDuasLinhas = (linha1, linha2) => {
            badgeStatusGeral.textContent = '';
            badgeStatusGeral.appendChild(document.createTextNode(linha1));
            badgeStatusGeral.appendChild(document.createElement('br'));
            badgeStatusGeral.appendChild(document.createTextNode(linha2));
        };

        if (modoAtivo === 'global') {
            if (btnModoGlobal) btnModoGlobal.classList.add('ativo');
            if (labelModoAtual) labelModoAtual.textContent = 'Todos os Sites';
            if (badgeStatusGeral) {
                preencherBadgeDuasLinhas('Ativo', '(Global)');
                badgeStatusGeral.classList.remove('inativo', 'lista');
            }
            if (iconeBg) {
                iconeBg.setAttribute('fill', '#10b981');
                iconeBg.setAttribute('stroke', '#059669');
            }
            if (iconeRaio) {
                iconeRaio.setAttribute('fill', '#fef08a');
            }
            aplicarIndicadorDiscreto(iconeStatusMotorCopia, true, 'Operacional (Todos os Sites)');
        } else if (modoAtivo === 'url') {
            if (btnModoUrl) btnModoUrl.classList.add('ativo');
            if (labelModoAtual) labelModoAtual.textContent = 'Lista de Sites';
            if (badgeStatusGeral) {
                preencherBadgeDuasLinhas('Ativo', '(Lista)');
                badgeStatusGeral.classList.remove('inativo');
                badgeStatusGeral.classList.add('lista');
            }
            if (iconeBg) {
                iconeBg.setAttribute('fill', '#1a73e8');
                iconeBg.setAttribute('stroke', '#1557b0');
            }
            if (iconeRaio) {
                iconeRaio.setAttribute('fill', '#fbbc04');
            }
            aplicarIndicadorDiscreto(iconeStatusMotorCopia, true, 'Operacional (Lista de Sites)');
        } else {
            if (btnModoDesligado) btnModoDesligado.classList.add('ativo');
            if (labelModoAtual) labelModoAtual.textContent = 'Desligado';
            if (badgeStatusGeral) {
                badgeStatusGeral.textContent = 'Pausado';
                badgeStatusGeral.classList.remove('lista');
                badgeStatusGeral.classList.add('inativo');
            }
            if (iconeBg) {
                iconeBg.setAttribute('fill', '#64748b');
                iconeBg.setAttribute('stroke', '#475569');
            }
            if (iconeRaio) {
                iconeRaio.setAttribute('fill', '#cbd5e1');
            }
            aplicarIndicadorDiscreto(iconeStatusMotorCopia, false, 'Inoperacional (Desligado)', true);
        }
    }

    /*
     * FUNCAO: atualizarBotaoDominioAba
     * OBJETIVO DE RECONSTRUCAO: Indicar se o dominio da aba atual ja consta na
     * lista urlsTurbo e permitir adiciona-lo ou remove-lo rapidamente. Exibe a
     * opcao PJe Turbo apenas se o site pertencer a rede Jus/PJe.
     */
    function atualizarBotaoDominioAba() {
        /* Passo 2.4: Verificar se o hostname da aba atual e valido e se consta em cacheUrlsTurbo */
        if (!hostnameAbaAtual) {
            if (infoDominioAba) {
                infoDominioAba.textContent = 'Site: ';
                const forteIndisp = document.createElement('strong');
                forteIndisp.textContent = 'Indisponível';
                infoDominioAba.appendChild(forteIndisp);
            }
            if (btnAlternarDominioAba) btnAlternarDominioAba.disabled = true;
            if (containerAmpuletas) containerAmpuletas.style.display = 'none';
            atualizarVisibilidadeAutomatePopup(Boolean(checkAutomatePje && checkAutomatePje.checked), false);
            return;
        }

        if (btnAlternarDominioAba) btnAlternarDominioAba.disabled = false;
        if (infoDominioAba) {
            infoDominioAba.textContent = 'Site: ';
            const forte = document.createElement('strong');
            forte.textContent = hostnameAbaAtual;
            infoDominioAba.appendChild(forte);
        }
        if (barraDominioAtual) {
            barraDominioAtual.style.display = (modoOperacionalAtual === 'url') ? 'flex' : 'none';
        }

        /* Passo 2.5: Deteccao multi-sistema judicial (PJe, Eproc, PDPJ, Projudi, SAJ, Creta, SEEU ou *.jus.br) */
        if (containerAmpuletas) {
            const strHost = hostnameAbaAtual.toLowerCase();
            const matrizSistemas = [
                { nome: 'PJe', padrao: /\bpje\b|pje\./i },
                { nome: 'Eproc', padrao: /\beproc\b|eproc\./i },
                { nome: 'PDPJ', padrao: /\bpdpj\b|\bprevjud\b|stf\.jus\.br|stj\.jus\.br/i },
                { nome: 'Projudi', padrao: /\bprojudi\b|projudi\./i },
                { nome: 'SAJ', padrao: /\besaj\b|\bsaj\b|esaj\./i },
                { nome: 'Creta', padrao: /\bcreta\b|creta\./i },
                { nome: 'SEEU', padrao: /\bseeu\b|seeu\./i }
            ];
            const sisMatch = matrizSistemas.find((s) => s.padrao.test(strHost));
            if (sisMatch || strHost.includes('.jus.br')) {
                const nomeExibicao = sisMatch ? sisMatch.nome : 'Sistema Judicial';
                if (tituloAmpuletas) tituloAmpuletas.textContent = `${nomeExibicao} Turbo`;
                if (subtituloAmpuletas) subtituloAmpuletas.textContent = `Neutraliza bloqueios ("Aguarde...") no ${nomeExibicao}.`;
                containerAmpuletas.style.display = 'flex';
            } else {
                containerAmpuletas.style.display = 'none';
            }
            if (subtituloAutomatePopup) {
                const ehPje = Boolean((sisMatch && sisMatch.nome === 'PJe') || /\bpje\b|pje\.|frontend\.prd\.cnj\.cloud|sso\.cloud\.pje\.jus\.br/i.test(strHost));
                subtituloAutomatePopup.textContent = ehPje
                    ? 'Contexto: PJe (manual ou por domínios).'
                    : `Contexto: ${hostnameAbaAtual}`;
            }
            atualizarVisibilidadeAutomatePopup(Boolean(checkAutomatePje && checkAutomatePje.checked), false);
        }

        const jaEstaNaLista = cacheUrlsTurbo.some(u => {
            if (!u || u === '<all_urls>') return false;
            return u.toLowerCase().includes(hostnameAbaAtual.toLowerCase());
        });

        if (btnAlternarDominioAba) {
            btnAlternarDominioAba.textContent = jaEstaNaLista ? '- Remover da Lista' : '+ Incluir na Lista';
        }
    }

    function renderizarSeletorPerfisPopup(listaPerfis, perfilAtivoId) {
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

    /*
     * FUNCAO: carregarEstadoInicial
     * OBJETIVO DE RECONSTRUCAO: Ler configuracoes do chrome.storage.sync e
     * identificar a URL da aba ativa na janela atual.
     */
    function carregarEstadoInicial() {
        /* Passo 3.1: Ler chaves salvas na nuvem com sobreposicao local pendente (anti-cota) */
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get([
                'modoTurbo',
                'urlsTurbo',
                'ativoAmpuletas',
                'automatePjeAtivo',
                'manterFormatacaoBasica',
                'nivelFiltroFormatacao',
                'comportamentoCliqueIcone',
                'listaPerfis',
                'perfilAtivoId'
            ], async (config) => {
                const cfg = { ...(config || {}) };
                try {
                    if (chrome.storage.session) {
                        const ses = await chrome.storage.session.get(['cacheConfigJusGov']);
                        if (ses && ses.cacheConfigJusGov && typeof ses.cacheConfigJusGov === 'object') {
                            Object.assign(cfg, ses.cacheConfigJusGov);
                        }
                    }
                } catch (_) { }
                try {
                    if (chrome.storage.local) {
                        const loc = await chrome.storage.local.get(['jusgovConfigSyncPendente', 'perfilAtivoId']);
                        if (loc && typeof loc.perfilAtivoId === 'string' && loc.perfilAtivoId.trim()) {
                            cfg.perfilAtivoId = loc.perfilAtivoId.trim();
                        }
                        if (loc && loc.jusgovConfigSyncPendente && typeof loc.jusgovConfigSyncPendente === 'object') {
                            Object.assign(cfg, loc.jusgovConfigSyncPendente);
                        }
                    }
                } catch (_) { }
                const modo = cfg.modoTurbo || 'url';
                cacheUrlsTurbo = Array.isArray(cfg.urlsTurbo) ? cfg.urlsTurbo : [];

                if (Array.isArray(cfg.listaPerfis) && cfg.listaPerfis.length > 0) {
                    renderizarSeletorPerfisPopup(cfg.listaPerfis, cfg.perfilAtivoId || 'padrao');
                } else if (chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ acao: 'OBTER_PERFIS' }, (resp) => {
                        if (chrome.runtime.lastError) return;
                        if (resp && resp.ok && Array.isArray(resp.listaPerfis)) {
                            renderizarSeletorPerfisPopup(resp.listaPerfis, resp.perfilAtivoId);
                        }
                    });
                }

                atualizarInterfaceModo(modo);
                const ampuletasAtivo = (cfg.ativoAmpuletas !== false);
                if (checkAmpuletas) checkAmpuletas.checked = ampuletasAtivo;
                aplicarIndicadorDiscreto(iconeStatusAmpuletas, ampuletasAtivo, ampuletasAtivo ? 'Operacional' : 'Inoperacional');
                atualizarVisibilidadeAutomatePopup(Boolean(cfg.automatePjeAtivo), false);
                atualizarBotaoDominioAba();
            });
        }

        /* Passo 3.2: Consultar a aba ativa para extrair o hostname */
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs[0] && tabs[0].url) {
                    try {
                        const urlObj = new URL(tabs[0].url);
                        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
                            hostnameAbaAtual = urlObj.hostname;
                            mascaraDominioAbaAtual = `*://${hostnameAbaAtual}/*`;
                        }
                    } catch (_) {}
                }
                atualizarBotaoDominioAba();
            });
        }
    }

    function salvarPreferenciaPopupDiferida(patch, callback) {
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
            chrome.runtime.sendMessage({ acao: 'AGENDAR_SYNC_NUVEM_DIFERIDO', payload: patch }, () => {
                if (typeof callback === 'function') callback();
            });
            return;
        }
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set(patch, callback);
        }
    }

    /* Passo 4.1: Eventos dos botoes de Modo de Execucao com blindagem defensiva */
    adicionarOuvinteSeguro(btnModoGlobal, 'click', () => {
        atualizarInterfaceModo('global');
        salvarPreferenciaPopupDiferida({ modoTurbo: 'global' });
    });

    adicionarOuvinteSeguro(btnModoUrl, 'click', () => {
        atualizarInterfaceModo('url');
        salvarPreferenciaPopupDiferida({ modoTurbo: 'url' });
    });

    adicionarOuvinteSeguro(btnModoDesligado, 'click', () => {
        atualizarInterfaceModo('desligado');
        salvarPreferenciaPopupDiferida({ modoTurbo: 'desligado' });
    });

    /* Passo 4.2: Evento do botao de incluir/remover dominio da aba atual */
    adicionarOuvinteSeguro(btnAlternarDominioAba, 'click', () => {
        if (!hostnameAbaAtual || !mascaraDominioAbaAtual) return;

        const idxExistente = cacheUrlsTurbo.findIndex(u =>
            u && u !== '<all_urls>' && u.toLowerCase().includes(hostnameAbaAtual.toLowerCase())
        );

        if (idxExistente !== -1) {
            cacheUrlsTurbo.splice(idxExistente, 1);
        } else {
            cacheUrlsTurbo.push(mascaraDominioAbaAtual);
        }

        salvarPreferenciaPopupDiferida({ urlsTurbo: cacheUrlsTurbo }, () => {
            atualizarBotaoDominioAba();
        });
    });

    /* Passo 4.4: Evento do switch "PJe Turbo (Anti-Ampulhetas)" */
    adicionarOuvinteSeguro(checkAmpuletas, 'change', (e) => {
        const ativoAmp = Boolean(e.target.checked);
        aplicarIndicadorDiscreto(iconeStatusAmpuletas, ativoAmp, ativoAmp ? 'Operacional' : 'Inoperacional');
        salvarPreferenciaPopupDiferida({ ativoAmpuletas: ativoAmp });
    });

    /* Passo 4.4.1: Eventos do switch e botoes "Automação de Tarefas" com sincronizacao online na aba ativa */
    function sincronizarEstadoAutomateOnlineAbaAtiva(ativo, restaurarBarra = true) {
        if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) return;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs && tabs[0] && tabs[0].id;
            if (!tabId) return;
            chrome.tabs.sendMessage(tabId, {
                acao: 'atualizarEstadoModulo',
                automatePjeAtivo: ativo,
                restaurarBarra,
                expandirBarra: Boolean(ativo && restaurarBarra)
            }, () => {
                if (chrome.runtime && chrome.runtime.lastError && typeof chrome.runtime.sendMessage === 'function') {
                    chrome.runtime.sendMessage({
                        acao: 'AUTOMATE_GARANTIR_INJECAO_ABA',
                        tabId,
                        ativo,
                        restaurarBarra,
                        expandirBarra: Boolean(ativo && restaurarBarra)
                    });
                }
            });
        });
    }

    adicionarOuvinteSeguro(checkAutomatePje, 'change', (e) => {
        const ativo = Boolean(e.target.checked);
        atualizarVisibilidadeAutomatePopup(ativo, false);
        salvarPreferenciaPopupDiferida({ automatePjeAtivo: ativo });
        sincronizarEstadoAutomateOnlineAbaAtiva(ativo, ativo);
    });

    adicionarOuvinteSeguro(btnIconeAutomateDesativado, 'click', () => {
        atualizarVisibilidadeAutomatePopup(true, true);
        salvarPreferenciaPopupDiferida({ automatePjeAtivo: true });
        sincronizarEstadoAutomateOnlineAbaAtiva(true, true);
    });

    function enviarComandoAutomateParaAbaAtiva(acaoAutomate, fecharPopup = false, aoResponder = null) {
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

    adicionarOuvinteSeguro(btnExecutarAutomatePopup, 'click', () => {
        enviarComandoAutomateParaAbaAtiva('AUTOMATE_DISPARAR_CICLO', true);
    });

    adicionarOuvinteSeguro(btnConfigurarAutomatePopup, 'click', () => {
        enviarComandoAutomateParaAbaAtiva('AUTOMATE_ABRIR_CFG', true);
    });

    adicionarOuvinteSeguro(btnPararAutomatePopup, 'click', () => {
        enviarComandoAutomateParaAbaAtiva('AUTOMATE_PARAR', false);
    });

    adicionarOuvinteSeguro(btnRestaurarBarraAutomatePopup, 'click', () => {
        enviarComandoAutomateParaAbaAtiva('AUTOMATE_ALTERNAR_BARRA', false, (resp) => {
            if (resp && resp.ok) {
                atualizarIconeBotaoBarraAutomatePopup(Boolean(resp.barraVisivel));
            }
        });
    });

    /* Passo 4.5: Evento de abertura da pagina completa de Opcoes e Central de Ajuda */
    adicionarOuvinteSeguro(btnAbrirOpcoes, 'click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else if (chrome.runtime.getURL) {
                window.open(chrome.runtime.getURL('src/cfg/options.html'));
            }
        }
        window.close();
    });

    /* Passo 4.5.1: Botao Help / Bugs Online (Joaninha - Secao 6.135 / FEAT-28) */
    adicionarOuvinteSeguro(btnBugsOnline, 'click', () => {
        const urlRepo = 'https://github.com/smarca/AddonChrome-GovBR';
        if (typeof chrome !== 'undefined' && chrome.windows && typeof chrome.windows.create === 'function') {
            chrome.windows.create({ url: urlRepo, focused: true }).catch(() => {
                window.open(urlRepo, '_blank', 'noopener,noreferrer');
            });
        } else {
            window.open(urlRepo, '_blank', 'noopener,noreferrer');
        }
        window.close();
    });

    const instanciaProdutividadePopup = (typeof window !== 'undefined' && typeof window.JusGovModuloProdutividade === 'function')
        ? new window.JusGovModuloProdutividade()
        : null;

    function atualizarContadoresProdutividadePopup() {
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

    /* Passo 4.6: Escutar alteracoes externas no storage (ex: Duplo Esc na pagina) */
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                if (changes.listaPerfis) {
                    carregarEstadoInicial();
                    atualizarContadoresProdutividadePopup();
                    return;
                }
                if (changes.modoTurbo) atualizarInterfaceModo(changes.modoTurbo.newValue);
                if (changes.ativoAmpuletas !== undefined) {
                    const ativoAmp = (changes.ativoAmpuletas.newValue !== false);
                    if (checkAmpuletas) checkAmpuletas.checked = ativoAmp;
                    aplicarIndicadorDiscreto(iconeStatusAmpuletas, ativoAmp, ativoAmp ? 'Operacional' : 'Inoperacional');
                }
                if (changes.automatePjeAtivo !== undefined) {
                    atualizarVisibilidadeAutomatePopup(Boolean(changes.automatePjeAtivo.newValue), false);
                }
                if (changes.urlsTurbo) {
                    cacheUrlsTurbo = Array.isArray(changes.urlsTurbo.newValue) ? changes.urlsTurbo.newValue : [];
                    atualizarBotaoDominioAba();
                }
                if (
                    changes.pomodoroAtivo || changes.pomodoroProporcao || changes.pomodoroFocoMinutos ||
                    changes.pomodoroCiclos || changes.pomodoroModoAviso || changes.pomodoroEstiloMinipopup ||
                    changes.tempoTrabalhoCorridoAtivo || changes.tempoTrabalhoAtivoAtivo
                ) {
                    atualizarContadoresProdutividadePopup();
                }
            } else if (area === 'local' && (changes.jusgovTrabalhoEstado || changes.jusgovProdNuvemMeta || changes.jusgovPomodoroBarraEstadoGlobal)) {
                atualizarContadoresProdutividadePopup();
            } else if (area === 'local' && (changes.jusgovConfigSyncPendente || changes.perfilAtivoId)) {
                carregarEstadoInicial();
                atualizarContadoresProdutividadePopup();
            }
        });
    }

    if (selectPerfilPopup) {
        selectPerfilPopup.addEventListener('change', () => {
            const novoPerfilId = selectPerfilPopup.value;
            if (!novoPerfilId || typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) return;
            selectPerfilPopup.disabled = true;
            chrome.runtime.sendMessage({ acao: 'ALTERNAR_PERFIL', perfilId: novoPerfilId }, (resp) => {
                selectPerfilPopup.disabled = false;
                if (chrome.runtime.lastError) return;
                if (resp && resp.ok) {
                    carregarEstadoInicial();
                    if (!resp.miniTipExibidoNaAba && avisoMiniTipPopup) {
                        const nomeSel = (resp.perfil && resp.perfil.nome) ? resp.perfil.nome : novoPerfilId;
                        avisoMiniTipPopup.textContent = `Perfil de Uso:\n${nomeSel}`;
                        avisoMiniTipPopup.style.display = 'block';
                    } else if (avisoMiniTipPopup) {
                        avisoMiniTipPopup.style.display = 'none';
                    }
                }
            });
        });
    }

    inicializarGruposColapsaveisPopup();
    carregarEstadoInicial();
    atualizarContadoresProdutividadePopup();
    if (rodapeProdutividadeOnline) {
        setInterval(atualizarContadoresProdutividadePopup, 1000);
    }
});
