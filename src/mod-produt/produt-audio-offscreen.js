/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-audio-offscreen.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Sintetizador PC Speaker (Beeps 1000Hz + Estalos)
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-audio-offscreen.js
 * - Classe Exportada: ProdutAudioPcSpeaker (self.JusGovProdutAudioPcSpeaker)
 * - Métodos Públicos: tocarPadrao(intensidade, padraoAlarme), emitirBeepPcSpeaker(ctx, tInicio, freqHz, duracaoMs, ganho)
 * - Regras / Seções: ENG-00 (POO), ENG-05, Seção 6.285 (Offscreen AUDIO_PLAYBACK sem bloqueio de Autoplay)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO:
 * 1) FINALIDADE:
 *    Executa dentro do Offscreen Document (chrome.offscreen / AUDIO_PLAYBACK)
 *    para garantir reprodução audível 100% imune à política de Autoplay do Chrome,
 *    simulando o alto-falante interno clássico (PC Speaker / [console]::beep(1000, 300)
 *    com pausa de 200 ms e estalos secos de acionamento/desarme da bobina).
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovProdutAudioPcSpeaker = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ProdutAudioPcSpeaker {
        #ctx = null;
        #bufferEstalo = null;

        #garantirContexto() {
            const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
                || (typeof self !== 'undefined' && (self.AudioContext || self.webkitAudioContext));
            if (!AudioCtx) return null;
            if (!this.#ctx || this.#ctx.state === 'closed') {
                this.#ctx = new AudioCtx();
                this.#bufferEstalo = null;
            }
            if (this.#ctx.state === 'suspended' && typeof this.#ctx.resume === 'function') {
                this.#ctx.resume().catch(() => { });
            }
            return this.#ctx;
        }

        /**
         * Gera um micro-buffer de impulso seco (~4ms) simulando o estalo físico do
         * alto-falante interno (PC Speaker) ao ligar/desligar a bobina (PIT 8253/8254).
         * @param {AudioContext} ctx
         * @returns {AudioBuffer|null}
         */
        #obterBufferEstalo(ctx) {
            if (this.#bufferEstalo) return this.#bufferEstalo;
            try {
                const durAmostras = Math.max(32, Math.floor(ctx.sampleRate * 0.0045));
                const buf = ctx.createBuffer(1, durAmostras, ctx.sampleRate);
                const dados = buf.getChannelData(0);
                for (let i = 0; i < durAmostras; i++) {
                    const decaimento = Math.exp(-i / (durAmostras * 0.28));
                    const pulsoDc = (i < 6) ? 1.0 : ((Math.random() * 2 - 1) * 0.85);
                    dados[i] = pulsoDc * decaimento;
                }
                this.#bufferEstalo = buf;
                return buf;
            } catch (_) {
                return null;
            }
        }

        /**
         * Emite um estalo seco no instante exato tAt.
         * @param {AudioContext} ctx
         * @param {number} tAt
         * @param {number} ganhoEstalo
         */
        #emitirEstalo(ctx, tAt, ganhoEstalo) {
            const buf = this.#obterBufferEstalo(ctx);
            if (!buf) return;
            try {
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const filtro = ctx.createBiquadFilter();
                filtro.type = 'bandpass';
                filtro.frequency.setValueAtTime(2800, tAt);
                filtro.Q.setValueAtTime(1.1, tAt);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(ganhoEstalo, tAt);
                src.connect(filtro);
                filtro.connect(gain);
                gain.connect(ctx.destination);
                src.start(tAt);
            } catch (_) { }
        }

        /**
         * Emite um pulso individual estilo [console]::beep(1000, 300) com onda quadrada,
         * ressonância de alto-falante interno e estalos na entrada e na saída.
         * @param {AudioContext} ctx
         * @param {number} tInicio
         * @param {number} [freqHz=1000]
         * @param {number} [duracaoMs=300]
         * @param {number} [ganho=0.28]
         */
        emitirBeepPcSpeaker(ctx, tInicio, freqHz = 1000, duracaoMs = 300, ganho = 0.28) {
            const durSeg = Math.max(0.03, Number(duracaoMs || 300) / 1000);
            const osc = ctx.createOscillator();
            const filtroSpeaker = ctx.createBiquadFilter();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freqHz, tInicio);

            /* Ressonância seca de buzzer / alto-falante interno de gabinete */
            filtroSpeaker.type = 'bandpass';
            filtroSpeaker.frequency.setValueAtTime(1750, tInicio);
            filtroSpeaker.Q.setValueAtTime(0.65, tInicio);

            /* Envelope retangular seco (ataque 1.5ms, sustentação plena, corte 2ms) */
            gain.gain.setValueAtTime(0.0001, tInicio);
            gain.gain.linearRampToValueAtTime(ganho, tInicio + 0.0015);
            gain.gain.setValueAtTime(ganho, tInicio + Math.max(0.004, durSeg - 0.002));
            gain.gain.linearRampToValueAtTime(0.0001, tInicio + durSeg);

            osc.connect(filtroSpeaker);
            filtroSpeaker.connect(gain);
            gain.connect(ctx.destination);

            /* Estalo característico na entrada e no desarme do alto-falante */
            this.#emitirEstalo(ctx, tInicio, Math.min(0.55, ganho * 1.45));
            this.#emitirEstalo(ctx, tInicio + durSeg, Math.min(0.45, ganho * 1.15));

            osc.start(tInicio);
            osc.stop(tInicio + durSeg + 0.005);
        }

        /**
         * Executa o padrão sonoro do Pomodoro no estilo:
         * 1..5 | ForEach-Object { [console]::beep(1000, 300); Start-Sleep -Milliseconds 200 }
         * @param {string} [intensidade='suave']
         * @param {string} [padraoAlarme='BEEP_CURTO']
         * @returns {boolean}
         */
        tocarPadrao(intensidade = 'suave', padraoAlarme = 'BEEP_CURTO') {
            if (padraoAlarme === 'BLOQUEAR' || padraoAlarme === 'SILENCIO') return false;
            const ctx = this.#garantirContexto();
            if (!ctx) return false;

            const ganhoBase = intensidade === 'grave' ? 0.36 : (intensidade === 'moderado' ? 0.30 : 0.24);
            const freq = 1000;
            const t0 = ctx.currentTime + 0.015;

            if (padraoAlarme === 'BEEP_LONGO') {
                /* 5 beeps de 1000Hz x 300ms com 200ms de intervalo (passo = 500ms) */
                for (let i = 0; i < 5; i++) {
                    this.emitirBeepPcSpeaker(ctx, t0 + (i * 0.5), freq, 300, ganhoBase);
                }
                return true;
            }

            if (padraoAlarme === 'BEEP_CURTO_TRIPLO') {
                /* 3 beeps de 1000Hz x 220ms com 160ms de intervalo (passo = 380ms) */
                for (let i = 0; i < 3; i++) {
                    this.emitirBeepPcSpeaker(ctx, t0 + (i * 0.38), freq, 220, ganhoBase);
                }
                return true;
            }

            /* BEEP_CURTO: 1 beep de 1000Hz x 300ms (ou 2 se intensidade grave) */
            if (intensidade === 'grave') {
                this.emitirBeepPcSpeaker(ctx, t0, freq, 300, ganhoBase);
                this.emitirBeepPcSpeaker(ctx, t0 + 0.5, freq, 300, ganhoBase);
            } else {
                this.emitirBeepPcSpeaker(ctx, t0, freq, 300, ganhoBase);
            }
            return true;
        }
    }

    const instancia = new ProdutAudioPcSpeaker();

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
            if (msg && msg.acao === 'OFFSCREEN_TOCAR_BEEP_POMODORO') {
                const ok = instancia.tocarPadrao(msg.intensidade || 'suave', msg.padraoAlarme || 'BEEP_CURTO');
                try { sendResponse({ ok }); } catch (_) { }
                return true;
            }
            return false;
        });
    }

    return Object.freeze(ProdutAudioPcSpeaker);
}));
