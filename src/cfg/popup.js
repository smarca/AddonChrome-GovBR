/* ==========================================================================
 * Nome do arquivo: popup.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
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
    /* Passo 1.1: Mapear elementos de controle da interface do Popup com suporte a multiplas variantes de ID */
    const badgeStatusGeral = document.getElementById('badgeStatusGeral') || document.getElementById('statusBadge');
    const labelModoAtual = document.getElementById('labelModoAtual');
    const btnModoGlobal = document.getElementById('btnModoGlobal') || document.getElementById('btnGlobal');
    const btnModoUrl = document.getElementById('btnModoUrl') || document.getElementById('btnUrl');
    const btnModoDesligado = document.getElementById('btnModoDesligado') || document.getElementById('btnOff');
    const infoDominioAba = document.getElementById('infoDominioAba') || document.getElementById('currentDomain');
    const barraDominioAtual = document.getElementById('barraDominioAtual') || document.querySelector('.barra-dominio-atual');
    const btnAlternarDominioAba = document.getElementById('btnAlternarDominioAba') || document.getElementById('btnToggleDomain');
    const checkRemoverFormatacoes = document.getElementById('checkRemoverFormatacoes') || document.getElementById('chkRemoveFormat');
    const descModoFormatacao = document.getElementById('descModoFormatacao');
    const containerNivelFiltroPopup = document.getElementById('containerNivelFiltroPopup');
    const optNivelFiltroPopup = document.getElementById('optNivelFiltroPopup');
    const lblValorNivelFiltroPopup = document.getElementById('lblValorNivelFiltroPopup');
    const lblDescNivelFiltroPopup = document.getElementById('lblDescNivelFiltroPopup');
    const checkAmpuletas = document.getElementById('checkAmpuletas') || document.getElementById('chkAmpuletas');
    const containerAmpuletas = document.getElementById('containerAmpuletas');
    const selectComportamentoIconePopup = document.getElementById('selectComportamentoIconePopup');
    const descComportamentoIcone = document.getElementById('descComportamentoIcone');
    const btnAbrirOpcoes = document.getElementById('btnAbrirOpcoes') || document.getElementById('btnOptions');

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

        /* Passo 2.2: Aplicar destaque visual, rotulo descritivo e cores do SVG */
        if (modoAtivo === 'global') {
            if (btnModoGlobal) btnModoGlobal.classList.add('ativo');
            if (labelModoAtual) labelModoAtual.innerHTML = 'Todos os Sites';
            if (badgeStatusGeral) {
                badgeStatusGeral.innerHTML = 'ATIVO<br>(GLOBAL)';
                badgeStatusGeral.classList.remove('inativo', 'lista');
            }
            if (iconeBg) {
                iconeBg.setAttribute('fill', '#10b981');
                iconeBg.setAttribute('stroke', '#059669');
            }
            if (iconeRaio) {
                iconeRaio.setAttribute('fill', '#fef08a');
            }
        } else if (modoAtivo === 'url') {
            if (btnModoUrl) btnModoUrl.classList.add('ativo');
            if (labelModoAtual) labelModoAtual.innerHTML = 'Lista de Sites';
            if (badgeStatusGeral) {
                badgeStatusGeral.innerHTML = 'ATIVO<br>(LISTA)';
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
        } else {
            if (btnModoDesligado) btnModoDesligado.classList.add('ativo');
            if (labelModoAtual) labelModoAtual.innerHTML = 'Desligado';
            if (badgeStatusGeral) {
                badgeStatusGeral.innerHTML = 'PAUSADO';
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
        }
    }

    /*
     * FUNCAO: atualizarInterfaceFormatacao
     * OBJETIVO DE RECONSTRUCAO: Sincronizar o checkbox "Remover Formatacoes" e
     * seu texto explicativo (utilizando entidades HTML no JavaScript) com o
     * booleano interno, ofuscando o controle de nivel quando Somente Texto estiver ativo.
     */
    function atualizarInterfaceFormatacao(manterBasica) {
        /* Passo 2.3: Inverter logica visual (Marcado = Remover Formatacoes / Somente Texto) */
        const removerFormatacoes = !manterBasica;
        if (checkRemoverFormatacoes) {
            checkRemoverFormatacoes.checked = removerFormatacoes;
        }

        if (containerNivelFiltroPopup) {
            if (removerFormatacoes) {
                containerNivelFiltroPopup.style.opacity = '0.45';
                containerNivelFiltroPopup.style.pointerEvents = 'none';
            } else {
                containerNivelFiltroPopup.style.opacity = '1';
                containerNivelFiltroPopup.style.pointerEvents = 'auto';
            }
        }

        if (descModoFormatacao) {
            if (removerFormatacoes) {
                descModoFormatacao.innerHTML = 'Ativo: copia somente texto limpo. Se desmarcar, preserva formatos de acordo com o Nível de Filtro.';
            } else {
                descModoFormatacao.innerHTML = 'Ativo: Mantém formatos conforme o Nível de Filtro (fontes sempre limpas para herdar destino).';
            }
        }
    }

    function converterNivelFiltroParaIndice(nivel) {
        if (typeof nivel === 'number') {
            if (nivel >= 0 && nivel <= 4) return nivel;
        }
        const s = String(nivel || '').toLowerCase().trim();
        if (s === '0' || s === 'texto_puro' || s === 'puro' || s === 'texto') return 0;
        if (s === '1' || s === 'basico' || s === 'inline') return 1;
        if (s === '2' || s === 'intermediario' || s === 'paragrafo' || s === 'fluxo') return 2;
        if (s === '3' || s === 'avancado' || s === 'documental' || s === 'rtf') return 3;
        if (s === '4' || s === 'estendido' || s === 'extendido' || s === 'sem_filtro' || s === 'office') return 4;
        return 1;
    }

    function converterIndiceParaNivelFiltro(indice) {
        const idx = Number(indice);
        if (idx === 0) return 'texto_puro';
        if (idx === 1) return 'basico';
        if (idx === 2) return 'intermediario';
        if (idx === 3) return 'avancado';
        if (idx === 4) return 'estendido';
        return 'basico';
    }

    function atualizarInterfaceNivelFiltro(nivel) {
        const idx = converterNivelFiltroParaIndice(nivel);
        if (optNivelFiltroPopup) {
            optNivelFiltroPopup.value = String(idx);
        }
        if (lblValorNivelFiltroPopup) {
            if (idx === 0) lblValorNivelFiltroPopup.innerHTML = '0 - Texto Puro';
            else if (idx === 1) lblValorNivelFiltroPopup.innerHTML = '1 - Básico (Inline)';
            else if (idx === 2) lblValorNivelFiltroPopup.innerHTML = '2 - Intermediário (Parágrafo)';
            else if (idx === 3) lblValorNivelFiltroPopup.innerHTML = '3 - Avançado (Documental)';
            else if (idx === 4) lblValorNivelFiltroPopup.innerHTML = '4 - Estendido (Suítes Office)';
            else lblValorNivelFiltroPopup.innerHTML = '1 - Básico';
        }
        if (lblDescNivelFiltroPopup) {
            if (idx === 0) lblDescNivelFiltroPopup.innerHTML = 'Nível 0: Remove 100% das tags, converte entidades, quebras normalizadas.';
            else if (idx === 1) lblDescNivelFiltroPopup.innerHTML = 'Nível 1: Formatação de caracteres (negrito, itálico, sublinhado, riscado, sub/sup, quebras).';
            else if (idx === 2) lblDescNivelFiltroPopup.innerHTML = 'Nível 2: Parágrafos, listas, citações, alinhamento e recuo simples. Sem tabelas.';
            else if (idx === 3) lblDescNivelFiltroPopup.innerHTML = 'Nível 3: Títulos h1-h6, tabelas, código, bordas, padding e larguras.';
            else if (idx === 4) lblDescNivelFiltroPopup.innerHTML = 'Nível 4: Imagens, mesclagem colspan/rowspan, listas multinível e suites Office.';
            else lblDescNivelFiltroPopup.innerHTML = 'Estilos Básicos: Formatação de caracteres.';
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
            if (infoDominioAba) infoDominioAba.innerHTML = 'Site: <strong>Indisponível</strong>';
            if (btnAlternarDominioAba) btnAlternarDominioAba.disabled = true;
            if (containerAmpuletas) containerAmpuletas.style.display = 'none';
            return;
        }

        if (btnAlternarDominioAba) btnAlternarDominioAba.disabled = false;
        if (infoDominioAba) infoDominioAba.innerHTML = `Site: <strong>${hostnameAbaAtual}</strong>`;
        if (barraDominioAtual) {
            barraDominioAtual.style.display = (modoOperacionalAtual === 'url') ? 'flex' : 'none';
        }

        /* Passo 2.5: Logica de Ocultacao do PJe Turbo (Aparece apenas em sites .jus.br ou com "pje") */
        if (containerAmpuletas) {
            const strHost = hostnameAbaAtual.toLowerCase();
            if (strHost.includes('pje') || strHost.includes('.jus.br')) {
                containerAmpuletas.style.display = 'flex';
            } else {
                containerAmpuletas.style.display = 'none';
            }
        }

        const jaEstaNaLista = cacheUrlsTurbo.some(u => {
            if (!u || u === '<all_urls>') return false;
            return u.toLowerCase().includes(hostnameAbaAtual.toLowerCase());
        });

        if (btnAlternarDominioAba) {
            if (jaEstaNaLista) {
                btnAlternarDominioAba.innerHTML = '- Remover da Lista';
            } else {
                btnAlternarDominioAba.innerHTML = '+ Incluir na Lista';
            }
        }
    }

    /*
     * FUNCAO: atualizarInterfaceComportamentoIcone
     * OBJETIVO DE RECONSTRUCAO: Sincronizar o seletor de comportamento do icone
     * e o texto explicativo sobre o clique simples vs duplo clique.
     */
    function atualizarInterfaceComportamentoIcone(comp) {
        const valor = (comp === 'acoes_rapidas') ? 'acoes_rapidas' : 'popup';
        if (selectComportamentoIconePopup) {
            selectComportamentoIconePopup.value = valor;
        }
        if (descComportamentoIcone) {
            if (valor === 'acoes_rapidas') {
                descComportamentoIcone.innerHTML = 'Ações Rápidas: 1 clique altera o modo na barra e 2 cliques abrem as Opções.';
            } else {
                descComportamentoIcone.innerHTML = 'Padrão: 1 clique abre este painel popup.';
            }
        }
    }

    /*
     * FUNCAO: carregarEstadoInicial
     * OBJETIVO DE RECONSTRUCAO: Ler configuracoes do chrome.storage.sync e
     * identificar a URL da aba ativa na janela atual.
     */
    function carregarEstadoInicial() {
        /* Passo 3.1: Ler chaves salvas na nuvem */
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get([
                'modoTurbo',
                'urlsTurbo',
                'ativoAmpuletas',
                'manterFormatacaoBasica',
                'nivelFiltroFormatacao',
                'comportamentoCliqueIcone'
            ], (config) => {
                const cfg = config || {};
                const modo = cfg.modoTurbo || 'global';
                cacheUrlsTurbo = Array.isArray(cfg.urlsTurbo) ? cfg.urlsTurbo : [];

                atualizarInterfaceModo(modo);
                atualizarInterfaceFormatacao(Boolean(cfg.manterFormatacaoBasica));
                atualizarInterfaceNivelFiltro(cfg.nivelFiltroFormatacao || 'basico');
                atualizarInterfaceComportamentoIcone(cfg.comportamentoCliqueIcone);
                if (checkAmpuletas) checkAmpuletas.checked = (cfg.ativoAmpuletas !== false);
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

    /* Passo 4.1: Eventos dos botoes de Modo de Execucao com blindagem defensiva */
    adicionarOuvinteSeguro(btnModoGlobal, 'click', () => {
        atualizarInterfaceModo('global');
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ modoTurbo: 'global' });
        }
    });

    adicionarOuvinteSeguro(btnModoUrl, 'click', () => {
        atualizarInterfaceModo('url');
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ modoTurbo: 'url' });
        }
    });

    adicionarOuvinteSeguro(btnModoDesligado, 'click', () => {
        atualizarInterfaceModo('desligado');
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ modoTurbo: 'desligado' });
        }
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

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ urlsTurbo: cacheUrlsTurbo }, () => {
                atualizarBotaoDominioAba();
            });
        }
    });

    /* Passo 4.3: Evento do switch "Remover Formatacoes (Texto Puro)" */
    adicionarOuvinteSeguro(checkRemoverFormatacoes, 'change', (e) => {
        const manterBasica = !e.target.checked;
        atualizarInterfaceFormatacao(manterBasica);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ manterFormatacaoBasica: manterBasica });
        }
    });

    /* Passo 4.3.1: Evento do slider de Nivel de Filtro de Estilos */
    adicionarOuvinteSeguro(optNivelFiltroPopup, 'input', (e) => {
        const nivel = converterIndiceParaNivelFiltro(e.target.value);
        atualizarInterfaceNivelFiltro(nivel);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ nivelFiltroFormatacao: nivel });
        }
    });

    /* Passo 4.4: Evento do switch "PJe Turbo (Anti-Ampulhetas)" */
    adicionarOuvinteSeguro(checkAmpuletas, 'change', (e) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ ativoAmpuletas: e.target.checked });
        }
    });

    /* Passo 4.4.1: Evento de selecao do comportamento de clique do icone na barra do Chrome */
    adicionarOuvinteSeguro(selectComportamentoIconePopup, 'change', (e) => {
        const novoComp = (e.target && e.target.value === 'acoes_rapidas') ? 'acoes_rapidas' : 'popup';
        atualizarInterfaceComportamentoIcone(novoComp);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set({ comportamentoCliqueIcone: novoComp });
        }
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

    /* Passo 4.6: Escutar alteracoes externas no storage (ex: Duplo Esc na pagina) */
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                if (changes.modoTurbo) atualizarInterfaceModo(changes.modoTurbo.newValue);
                if (changes.manterFormatacaoBasica !== undefined) {
                    atualizarInterfaceFormatacao(Boolean(changes.manterFormatacaoBasica.newValue));
                }
                if (changes.nivelFiltroFormatacao !== undefined) {
                    atualizarInterfaceNivelFiltro(changes.nivelFiltroFormatacao.newValue);
                }
                if (changes.ativoAmpuletas !== undefined && checkAmpuletas) {
                    checkAmpuletas.checked = (changes.ativoAmpuletas.newValue !== false);
                }
                if (changes.urlsTurbo) {
                    cacheUrlsTurbo = Array.isArray(changes.urlsTurbo.newValue) ? changes.urlsTurbo.newValue : [];
                    atualizarBotaoDominioAba();
                }
                if (changes.comportamentoCliqueIcone !== undefined) {
                    atualizarInterfaceComportamentoIcone(changes.comportamentoCliqueIcone.newValue);
                }
            }
        });
    }

    carregarEstadoInicial();
});
