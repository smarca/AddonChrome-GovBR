/* ==========================================================================
 * ARQUIVO: src/cfg/onboarding.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/onboarding.js
 *
 * FINALIDADE: Tela dedicada de seleção inicial de perfil na 1ª instalação (FEAT-80)
 * ========================================================================== */
(function () {
    'use strict';

    const DESCRICOES_PERFIS = {
        trabalho: {
            cor: '#10b981',
            bg: 'rgba(16, 185, 129, 0.16)',
            path: 'M3 5.2h10v7.6H3zM5.8 3.2h4.4v2H5.8z',
            desc: 'Ativa PJe Turbo, cabeçalhos id/pg, validação matemática, marcadores de cópia e todo o pacote Produtividade & Pomodoro.'
        },
        casa: {
            cor: '#38bdf8',
            bg: 'rgba(56, 189, 248, 0.16)',
            path: 'M2.5 8 8 3l5.5 5v5.2H9.6V9.6H6.4v3.6H2.5z',
            desc: 'Modo focado na lista de sites jurídicos para não interferir no uso pessoal, com Pomodoro discreto e lembretes de pausa/água.'
        },
        estudo: {
            cor: '#a78bfa',
            bg: 'rgba(167, 139, 250, 0.16)',
            path: 'M2.5 4.2 8 2l5.5 2.2L8 6.4zM4 7v4.2c0 1.4 1.8 2.4 4 2.4s4-1 4-2.4V7l-4 1.6z',
            desc: 'Cópia limpa em texto puro para resumos/fichamentos, atalho F1 com IA Gemini e ciclos Pomodoro de 50 min.'
        },
        leitura: {
            cor: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.16)',
            path: 'M2.5 3.5h4.8c.5 0 .7.3.7.8v8.4c-.6-.4-1.3-.6-2-.6H2.5zM13.5 3.5H8.7c-.5 0-.7.3-.7.8v8.4c.6-.4 1.3-.6 2-.6h3.5z',
            desc: 'Leitura fluida sem distrações visuais na página, selo discreto apenas no ícone e auxílio F1 sob demanda.'
        },
        reuniao: {
            cor: '#f43f5e',
            bg: 'rgba(244, 63, 94, 0.16)',
            path: 'M2.5 3.5h11v7.2h-11zM6 12.8h4M8 10.7v2.1',
            desc: 'Modo silencioso para compartilhamento de tela, audiências e reuniões: zero popups, sem sons e sem interferência em abas.'
        }
    };

    const criarIconePerfilSvg = (meta) => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 16 16');
        svg.setAttribute('fill', 'none');
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', meta.path);
        p.setAttribute('stroke', meta.cor);
        p.setAttribute('stroke-width', '1.4');
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(p);
        return svg;
    };

    const concluirOnboarding = async (perfil, cardEl, gradeEl, statusEl) => {
        const cards = gradeEl.querySelectorAll('.card-perfil');
        cards.forEach((c) => { c.disabled = true; });
        cardEl.classList.add('selecionado');
        statusEl.textContent = `Aplicando perfil "${perfil.nome}"...`;

        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chrome.storage.local.set({ jusgovOnboardingConcluido: true });
            }
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ acao: 'ALTERNAR_PERFIL', perfilId: perfil.id, exibirMiniTip: false }, () => resolve());
                });
            }
        } catch (_) { }

        statusEl.textContent = `Perfil "${perfil.nome}" configurado! Abrindo seu navegador...`;
        setTimeout(() => {
            try {
                if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.getCurrent === 'function') {
                    chrome.tabs.getCurrent((tab) => {
                        if (tab && tab.id) {
                            chrome.tabs.remove(tab.id).catch(() => { window.close(); });
                        } else {
                            window.close();
                        }
                    });
                    return;
                }
            } catch (_) { }
            window.close();
        }, 550);
    };

    const inicializar = async () => {
        const gradeEl = document.getElementById('gradePerfisOnboarding');
        const statusEl = document.getElementById('statusOnboarding');
        if (!gradeEl || !statusEl) return;

        let perfis = [
            { id: 'trabalho', nome: 'Trabalho', predefinido: true },
            { id: 'casa', nome: 'Casa', predefinido: true },
            { id: 'estudo', nome: 'Estudo', predefinido: true },
            { id: 'leitura', nome: 'Leitura / Pesquisa', predefinido: true },
            { id: 'reuniao', nome: 'Apresentação / Reunião', predefinido: true }
        ];

        try {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
                const resp = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({ acao: 'OBTER_PERFIS' }, (r) => resolve(r || null));
                });
                if (resp && resp.ok && Array.isArray(resp.listaPerfis)) {
                    const filtrados = resp.listaPerfis.filter(p => p && p.predefinido === true && p.id !== 'padrao');
                    if (filtrados.length > 0) {
                        perfis = filtrados;
                    }
                }
            }
        } catch (_) { }

        gradeEl.replaceChildren();
        perfis.forEach((perfil) => {
            const meta = DESCRICOES_PERFIS[perfil.id] || DESCRICOES_PERFIS.trabalho;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'card-perfil';
            btn.setAttribute('data-perfil-id', perfil.id);

            const topo = document.createElement('div');
            topo.className = 'card-topo';

            const iconeBox = document.createElement('span');
            iconeBox.className = 'card-icone';
            iconeBox.style.background = meta.bg;
            iconeBox.appendChild(criarIconePerfilSvg(meta));

            const titulo = document.createElement('span');
            titulo.textContent = perfil.nome;

            topo.appendChild(iconeBox);
            topo.appendChild(titulo);

            const desc = document.createElement('p');
            desc.className = 'card-desc';
            desc.textContent = meta.desc;

            btn.appendChild(topo);
            btn.appendChild(desc);
            btn.addEventListener('click', () => concluirOnboarding(perfil, btn, gradeEl, statusEl));
            gradeEl.appendChild(btn);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }
})();
