/* ==========================================================================
 * Nome do arquivo: mod-produt.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Produtividade: Tempo de Trabalho & Pomodoro
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/mod-produt.js
 * - Classe Exportada: ModuloProdutividade (self.JusGovModuloProdutividade)
 * - Métodos Públicos: definirProvedorConfig(fn), obterDataLocalChaveHoje(),
 *   obterOuIniciarEstadoTrabalhoHoje(), resetarEstadoTrabalhoHoje(),
 *   registrarAtividadeTrabalho(), projetarModalProdutividadeEmTodasJanelas(titulo, mensagem, subtitulo),
 *   processarTickTrabalho(obterConfigFn)
 * - Regras / Seções: Diretriz 14, Diretriz 16, Seção 6.142 (Tempo de Trabalho e Pomodoro)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Gerencia os contadores diários de tempo de trabalho corrido e tempo de
 *    trabalho ativo (estilo Workrave), além da máquina de estados do Pomodoro
 *    (foco, alívio e pausa maior), projetando modais em todas as janelas ativas.
 * 2) ISOLAMENTO:
 *    Executa no Service Worker (Manifest V3) via importScripts e persiste o
 *    estado diário na chave 'jusgovTrabalhoEstado' do chrome.storage.local.
 *
 * DOCUMENTAÇÃO COMPLEMENTAR:
 * - docs/01_DIRETRIZES_E_REGRAS_ROOT.md
 * - docs/02_ARQUITETURA_E_AS_BUILT.md
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovModuloProdutividade = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ModuloProdutividade {
        constructor(opcoes = {}) {
            this._obterConfig = (opcoes && typeof opcoes.obterConfiguracoes === 'function')
                ? opcoes.obterConfiguracoes
                : null;
        }

        /**
         * Define dinamicamente a função assíncrona responsável por ler as configurações atuais.
         * @param {Function} fn
         */
        definirProvedorConfig(fn) {
            if (typeof fn === 'function') {
                this._obterConfig = fn;
            }
        }

        /**
         * Retorna a chave textual da data local atual no formato YYYY-MM-DD.
         * @returns {string}
         */
        obterDataLocalChaveHoje() {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        /**
         * Recupera o estado diário atual do storage ou cria um novo registro zerado para hoje.
         * @returns {Promise<Object>}
         */
        async obterOuIniciarEstadoTrabalhoHoje() {
            const hoje = this.obterDataLocalChaveHoje();
            const agora = Date.now();
            const dados = await chrome.storage.local.get(['jusgovTrabalhoEstado']);
            const atual = dados.jusgovTrabalhoEstado;
            if (atual && atual.data === hoje) {
                return atual;
            }
            const novo = {
                data: hoje,
                inicioTs: agora,
                ultimaAtividadeTs: agora,
                corridoMinutos: 0,
                ativoMinutos: 0,
                alertaCorridoDisparado: false,
                alertaAtivoDisparado: false,
                pomodoroFase: 'foco',
                pomodoroMinutosNaFase: 0,
                pomodoroCicloAtual: 0
            };
            await chrome.storage.local.set({ jusgovTrabalhoEstado: novo });
            return novo;
        }

        /**
         * Reinicia os contadores diários e o estado do Pomodoro para o momento atual.
         * @returns {Promise<Object>}
         */
        async resetarEstadoTrabalhoHoje() {
            const agora = Date.now();
            const novo = {
                data: this.obterDataLocalChaveHoje(),
                inicioTs: agora,
                ultimaAtividadeTs: agora,
                corridoMinutos: 0,
                ativoMinutos: 0,
                alertaCorridoDisparado: false,
                alertaAtivoDisparado: false,
                pomodoroFase: 'foco',
                pomodoroMinutosNaFase: 0,
                pomodoroCicloAtual: 0
            };
            await chrome.storage.local.set({ jusgovTrabalhoEstado: novo });
            return novo;
        }

        /**
         * Registra o carimbo de tempo da última atividade detectada do usuário.
         * @returns {Promise<void>}
         */
        async registrarAtividadeTrabalho() {
            try {
                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                estado.ultimaAtividadeTs = Date.now();
                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
            } catch (_) { }
        }

        /**
         * Injeta um modal informativo nas abas ativas HTTP/HTTPS de todas as janelas abertas.
         * @param {string} titulo
         * @param {string} mensagem
         * @param {string} [subtitulo]
         * @returns {Promise<void>}
         */
        async projetarModalProdutividadeEmTodasJanelas(titulo, mensagem, subtitulo) {
            try {
                if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) return;
                const abasAtivas = await chrome.tabs.query({ active: true });
                for (const aba of abasAtivas) {
                    if (!aba || !aba.id || !aba.url || !/^https?:\/\//i.test(aba.url)) continue;
                    chrome.scripting.executeScript({
                        target: { tabId: aba.id },
                        func: (t, m, s) => {
                            const idModal = 'jusgov-modal-produtividade-trabalho';
                            const antigo = document.getElementById(idModal);
                            if (antigo) antigo.remove();
                            const overlay = document.createElement('div');
                            overlay.id = idModal;
                            overlay.setAttribute('role', 'dialog');
                            overlay.setAttribute('aria-modal', 'true');
                            overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(15,23,42,0.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;';
                            const card = document.createElement('div');
                            card.style.cssText = 'background:#ffffff;color:#0f172a;border-radius:14px;padding:24px 28px;max-width:440px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,0.35);border:2px solid #0d9488;text-align:center;';
                            const h2 = document.createElement('h2');
                            h2.textContent = t;
                            h2.style.cssText = 'margin:0 0 10px 0;font-size:20px;font-weight:700;color:#0d9488;';
                            const p = document.createElement('p');
                            p.textContent = m;
                            p.style.cssText = 'margin:0 0 10px 0;font-size:15px;line-height:1.5;color:#1e293b;';
                            const sub = document.createElement('p');
                            sub.textContent = s || '';
                            sub.style.cssText = 'margin:0 0 18px 0;font-size:12px;color:#64748b;';
                            const btn = document.createElement('button');
                            btn.type = 'button';
                            btn.textContent = 'Entendi / Fechar';
                            btn.style.cssText = 'background:#0d9488;color:#ffffff;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:600;cursor:pointer;';
                            const fechar = () => {
                                overlay.remove();
                                document.removeEventListener('keydown', onEsc, true);
                            };
                            const onEsc = (e) => {
                                if (e.key === 'Escape') fechar();
                            };
                            btn.addEventListener('click', fechar);
                            overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
                            document.addEventListener('keydown', onEsc, true);
                            card.appendChild(h2);
                            card.appendChild(p);
                            if (s) card.appendChild(sub);
                            card.appendChild(btn);
                            overlay.appendChild(card);
                            (document.body || document.documentElement).appendChild(overlay);
                            btn.focus();
                        },
                        args: [titulo, mensagem, subtitulo]
                    }).catch(() => { });
                }
            } catch (_) { }
        }

        /**
         * Processa o tick de 1 minuto para tempo corrido, tempo ativo e ciclo Pomodoro.
         * @param {Function} [obterConfigFn]
         * @returns {Promise<void>}
         */
        async processarTickTrabalho(obterConfigFn) {
            try {
                const provedor = typeof obterConfigFn === 'function'
                    ? obterConfigFn
                    : (this._obterConfig || (typeof obterConfiguracoesGerais === 'function' ? obterConfiguracoesGerais : null));
                const config = provedor ? await provedor() : {};

                const corridoAtivo = Boolean(config.tempoTrabalhoCorridoAtivo);
                const ativoAtivo = Boolean(config.tempoTrabalhoAtivoAtivo);
                const pomodoroAtivo = Boolean(config.pomodoroAtivo);
                if (!corridoAtivo && !ativoAtivo && !pomodoroAtivo) return;

                const estado = await this.obterOuIniciarEstadoTrabalhoHoje();
                const agora = Date.now();
                const usuarioAtivo = (agora - Number(estado.ultimaAtividadeTs || 0)) <= (5 * 60 * 1000);

                if (corridoAtivo) {
                    estado.corridoMinutos = Number(estado.corridoMinutos || 0) + 1;
                    const metaCorridoMin = Math.max(1, Number(config.tempoTrabalhoCorridoHoras || 7)) * 60;
                    if (!estado.alertaCorridoDisparado && estado.corridoMinutos >= metaCorridoMin) {
                        estado.alertaCorridoDisparado = true;
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Tempo de Trabalho Corrido Atingido',
                            `Você completou ${config.tempoTrabalhoCorridoHoras || 7}h de jornada corrida hoje.`,
                            `Tempo corrido: ${estado.corridoMinutos} min | Tempo ativo: ${estado.ativoMinutos} min`
                        );
                    }
                }

                if (ativoAtivo && usuarioAtivo) {
                    estado.ativoMinutos = Number(estado.ativoMinutos || 0) + 1;
                    const metaAtivoMin = Math.max(1, Number(config.tempoTrabalhoAtivoHoras || 6)) * 60;
                    if (!estado.alertaAtivoDisparado && estado.ativoMinutos >= metaAtivoMin) {
                        estado.alertaAtivoDisparado = true;
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Tempo Ativo de Trabalho Atingido',
                            `Você completou ${config.tempoTrabalhoAtivoHoras || 6}h de atividade efetiva hoje (estilo Workrave).`,
                            `Tempo ativo: ${estado.ativoMinutos} min | Tempo corrido: ${estado.corridoMinutos} min`
                        );
                    }
                }

                if (pomodoroAtivo) {
                    const focoMin = Math.max(25, Number(config.pomodoroFocoMinutos || 25));
                    const proporcao = Number(config.pomodoroProporcao || 4.5);
                    const alivioMin = Math.max(1, Math.round(focoMin / proporcao));
                    const ciclosMax = Math.max(2, Number(config.pomodoroCiclos || 4));
                    const pausaMaiorMin = Math.max(1, Math.round(alivioMin * ciclosMax));

                    estado.pomodoroMinutosNaFase = Number(estado.pomodoroMinutosNaFase || 0) + 1;
                    if (estado.pomodoroFase === 'foco' && estado.pomodoroMinutosNaFase >= focoMin) {
                        estado.pomodoroCicloAtual = Number(estado.pomodoroCicloAtual || 0) + 1;
                        estado.pomodoroMinutosNaFase = 0;
                        if (estado.pomodoroCicloAtual >= ciclosMax) {
                            estado.pomodoroFase = 'pausa_maior';
                            await this.projetarModalProdutividadeEmTodasJanelas(
                                'Pomodoro: Hora da Pausa Maior!',
                                `Você concluiu ${ciclosMax} ciclos de foco (${focoMin} min cada). Descanse por ${pausaMaiorMin} minutos.`,
                                `Proporção ${proporcao}:1 • Pausa Maior de ${pausaMaiorMin} min`
                            );
                        } else {
                            estado.pomodoroFase = 'alivio';
                            await this.projetarModalProdutividadeEmTodasJanelas(
                                'Pomodoro: Hora do Alívio!',
                                `Ciclo ${estado.pomodoroCicloAtual}/${ciclosMax} concluído (${focoMin} min). Faça uma pausa de ${alivioMin} minutos.`,
                                `Proporção ${proporcao}:1 • Alívio de ${alivioMin} min`
                            );
                        }
                    } else if (estado.pomodoroFase === 'alivio' && estado.pomodoroMinutosNaFase >= alivioMin) {
                        estado.pomodoroFase = 'foco';
                        estado.pomodoroMinutosNaFase = 0;
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Fim do Alívio',
                            `Retome o foco para o ciclo ${estado.pomodoroCicloAtual + 1}/${ciclosMax} (${focoMin} min).`,
                            'Bom trabalho!'
                        );
                    } else if (estado.pomodoroFase === 'pausa_maior' && estado.pomodoroMinutosNaFase >= pausaMaiorMin) {
                        estado.pomodoroFase = 'foco';
                        estado.pomodoroMinutosNaFase = 0;
                        estado.pomodoroCicloAtual = 0;
                        await this.projetarModalProdutividadeEmTodasJanelas(
                            'Pomodoro: Fim da Pausa Maior',
                            `Novo bloco de ${ciclosMax} ciclos iniciado (${focoMin} min de foco).`,
                            'Bom retorno!'
                        );
                    }
                }

                await chrome.storage.local.set({ jusgovTrabalhoEstado: estado });
            } catch (_) { }
        }
    }

    Object.freeze(ModuloProdutividade.prototype);
    Object.freeze(ModuloProdutividade);

    return ModuloProdutividade;
}));
