/* ==========================================================================
 * Nome do arquivo: editor_demo.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * FINALIDADE:
 * Controlador modular para o Editor HTML Online Demo (contenteditable)
 * presente no Bloco 3 da Central de Testes (options.html).
 *
 * RECURSOS E ESPECIFICACOES:
 * 1) Barra de ferramentas expansivel/recolhivel por botao alinhado a direita.
 * 2) Layout estreito/compacto em linha unica com os botoes essenciais:
 *    Desfazer, Refazer, Sep, Negrito, Italico, Sublinhado, Riscado, Sep,
 *    Marca-Texto, Sep, Subscrito, Sobrescrito, Sep, Alinhamentos (Esq, Centro,
 *    Dir, Justificado) e Limpar Formatacao alinhado a direita.
 * 3) Execucao de comandos de formatacao 100% nativa do Chrome com preservacao de foco.
 * 4) Conversores bidirecionais HTML <-> Markdown expostos para testes e integracao.
 * 5) Codificacao padrao UTF-8 nativa e direta (acentos e cedilhas reais). Proibido uso de entidades HTML em templates.
 * ========================================================================== */

'use strict';

(function () {
    /* Passo 1: Variaveis monomorficas de estado do editor */
    let modoAtual = 'rtf';
    let toolbarVisivel = false; // Normalmente subido (sem barra de ferramentas visivel)

    /* Texto padrao extenso com todos os placeholders judiciais requeridos */
    const TEXTO_PADRAO_EDITOR_HTML = '<p>Nome #Autor da ação#, telefone <i>(##)####-####</i>, manifesta-se nos autos conforme <b>id #######</b> e <b>id ###### fl. ##</b>.</p><p>Em síntese, na data <b>##/##/20##</b> insurge-se contra <b>[@@ato impugnado@@]</b>, postulando o valor de <u>R$ ##.###,##</u>.</p><p>Para a regular instrução processual, enumera-se <b>#####</b> e <b>#####</b> como elementos indispensáveis à tutela requerida.</p><p><b>[##TEXTO DA DECISÃO##]</b></p>';

    /* Icones SVG puros US-ASCII para o botao compacto sobe e desce */
    const SVG_SETA_BAIXO = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    const SVG_SETA_CIMA = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>';

    /* Icone SVG puro US-ASCII para clipboard cortado (acesso negado - identico a barra de enderecos) */
    const SVG_CLIPBOARD_CORTADO = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:-2px;margin-right:5px;color:#f87171;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="2" y1="22" x2="22" y2="2"></line></svg>';

    function formatarTamanhoBytes(bytes) {
        if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '';
        if (bytes < 1024) return `; ${bytes} B`;
        if (bytes < 1024 * 1024) return `; ${(bytes / 1024).toFixed(1)} KB`;
        return `; ${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /* Passo 4.8: Formatador Inteligente de Itens da Area de Transferencia (Multi-MIME & Incompatibilidade) */
    function formatarConteudoClipboard(origem) {
        if (origem === null || origem === undefined) {
            return {
                texto: '<vazio>',
                html: '<span class="clip-status-vazio">&lt;vazio&gt;</span>',
                status: 'vazio',
                totalLinhas: 0
            };
        }

        function formatarLinhaClipboardInterno(clip) {
            const fonte = clip || (typeof window !== 'undefined' ? window.__JUSGOV_ULTIMO_CLIPBOARD__ : null);
            const txt = (fonte && (fonte.texto || fonte.html)) ? String(fonte.texto || fonte.html).trim() : '';
            if (txt.length > 0) {
                return `<div class="clip-linha" style="margin-top: 6px; color: #d97706;"><span class="clip-linha-rotulo" style="color: #d97706; font-weight: bold;">INT:</span> <span class="clip-linha-colchete" style="color: #d97706;">[</span><span class="clip-linha-dados" style="color: #38bdf8; font-weight: 500;">${escapeHtml(txt)}</span><span class="clip-linha-colchete" style="color: #d97706;">]</span> <span style="font-size: 11px; opacity: 0.85;">(clipboard interno)</span></div>`;
            }
            return `<div class="clip-linha" style="margin-top: 6px; color: #d97706;"><span class="clip-linha-rotulo" style="color: #d97706; font-weight: bold;">INT:</span> <span class="clip-linha-dados" style="color: #d97706;">&lt;vazio&gt;</span> <span style="font-size: 11px; opacity: 0.85;">(clipboard interno)</span></div>`;
        }

        /* Caso de permissao negada (icone cortado + mensagem de acesso negado) */
        if (typeof origem === 'object' && !Array.isArray(origem) && origem.negado === true) {
            const linhaInterno = formatarLinhaClipboardInterno(origem.interno);
            return {
                texto: '<acesso a area de transferencia negado>',
                html: `<span class="clip-status-negado">${SVG_CLIPBOARD_CORTADO}&lt;acesso a área de transferência negado&gt;</span>${linhaInterno}`,
                status: 'denied',
                totalLinhas: 2
            };
        }

        /* Caso de erro operacional ao ler area de transferencia */
        if (typeof origem === 'object' && !Array.isArray(origem) && origem.erro) {
            const msgErro = String(origem.erro);
            const linhaInterno = formatarLinhaClipboardInterno(origem.interno);
            return {
                texto: `<${msgErro}>`,
                html: `<span class="clip-status-negado">${SVG_CLIPBOARD_CORTADO}&lt;${escapeHtml(msgErro)}&gt;</span>${linhaInterno}`,
                status: 'erro',
                totalLinhas: 2
            };
        }

        /* Caso de texto puro passado diretamente como string */
        if (typeof origem === 'string') {
            if (origem.length === 0) {
                return {
                    texto: '<vazio>',
                    html: '<span class="clip-status-vazio">&lt;vazio&gt;</span>',
                    status: 'vazio',
                    totalLinhas: 0
                };
            }
            return {
                texto: `TXT: [${origem}]`,
                html: `<div class="clip-linha"><span class="clip-linha-rotulo">TXT:</span> <span class="clip-linha-colchete">[</span><span class="clip-linha-dados">${escapeHtml(origem)}</span><span class="clip-linha-colchete">]</span></div>`,
                status: 'ok',
                totalLinhas: 1
            };
        }

        /* Normaliza lista de entradas vindas do Acumulador ou navigator.clipboard.read() */
        let listaEntradas = [];
        if (typeof origem === 'object' && !Array.isArray(origem) && (origem.texto !== undefined || origem.html !== undefined)) {
            const temHtml = Boolean(origem.html && String(origem.html).trim().length > 0);
            if (temHtml) {
                const txt = origem.texto || (function () {
                    try {
                        const tempEl = document.createElement('div');
                        tempEl.innerHTML = origem.html;
                        return tempEl.textContent || tempEl.innerText || '';
                    } catch (_) { return ''; }
                })();
                if (txt) {
                    listaEntradas.push({ type: 'text/plain', data: txt, isTextual: true });
                }
                listaEntradas.push({ type: 'text/html', data: origem.html, isTextual: true });
                if (origem.rtf) {
                    listaEntradas.push({ type: 'text/rtf', data: origem.rtf, isTextual: true });
                }
            } else if (origem.texto) {
                listaEntradas.push({ type: 'text/plain', data: origem.texto, isTextual: true });
            }
        } else if (Array.isArray(origem)) {
            listaEntradas = origem.slice();
        }

        listaEntradas = listaEntradas.filter(item => item && (item.type || item.data !== undefined));

        if (listaEntradas.length === 0) {
            return {
                texto: '<vazio>',
                html: '<span class="clip-status-vazio">&lt;vazio&gt;</span>',
                status: 'vazio',
                totalLinhas: 0
            };
        }

        /* Se houver somente 1 entrada textual sem conteudo textual valido */
        if (listaEntradas.length === 1 && listaEntradas[0].isTextual !== false && !listaEntradas[0].data && !String(listaEntradas[0].type || '').startsWith('image/')) {
            return {
                texto: '<vazio>',
                html: '<span class="clip-status-vazio">&lt;vazio&gt;</span>',
                status: 'vazio',
                totalLinhas: 0
            };
        }

        /* Ordenacao prioritaria dos tipos MIME: TXT -> HTML -> RTF -> Outros Textos -> Imagens -> Binarios */
        function obterPesoPrioridade(tipo) {
            if (!tipo) return 99;
            const t = String(tipo).toLowerCase();
            if (t === 'text/plain') return 1;
            if (t === 'text/html') return 2;
            if (t === 'text/rtf' || t === 'application/rtf') return 3;
            if (t === 'text/uri-list') return 4;
            if (t.startsWith('text/')) return 5;
            if (t.startsWith('image/')) return 6;
            if (t.startsWith('audio/')) return 7;
            if (t.startsWith('video/')) return 8;
            return 9;
        }

        listaEntradas.sort((a, b) => obterPesoPrioridade(a.type) - obterPesoPrioridade(b.type));

        const linhasTexto = [];
        const linhasHtml = [];

        for (const item of listaEntradas) {
            const tipo = String(item.type || 'text/plain');
            const ehImagem = tipo.startsWith('image/');
            const ehAudio = tipo.startsWith('audio/');
            const ehVideo = tipo.startsWith('video/');
            const ehNaoTextual = item.isTextual === false || ehImagem || ehAudio || ehVideo;

            let rotulo = 'TXT';
            if (tipo === 'text/html') rotulo = 'HTML';
            else if (tipo === 'text/rtf' || tipo === 'application/rtf') rotulo = 'RTF';
            else if (tipo === 'text/uri-list') rotulo = 'URI';
            else if (ehImagem) rotulo = `IMG (${tipo})`;
            else if (ehAudio) rotulo = `AUDIO (${tipo})`;
            else if (ehVideo) rotulo = `VIDEO (${tipo})`;
            else if (ehNaoTextual) rotulo = `BIN (${tipo})`;
            else if (tipo !== 'text/plain') rotulo = item.rotulo || tipo.toUpperCase();

            if (ehNaoTextual) {
                const infoTam = formatarTamanhoBytes(item.size);
                const descTexto = item.detalhe || `formato nao textual - incompativel com campos de texto${infoTam}`;
                const descHtml = item.detalhe ? escapeHtml(item.detalhe) : `formato não textual - incompatível com campos de texto${escapeHtml(infoTam)}`;

                linhasTexto.push(`${rotulo}: <visualizacao nao disponivel> (${descTexto})`);
                linhasHtml.push(`<div class="clip-linha"><span class="clip-linha-rotulo">${escapeHtml(rotulo)}:</span> <span class="clip-incompativel">&lt;visualização não disponível&gt; (${descHtml})</span></div>`);
            } else {
                const valorDado = item.data !== undefined && item.data !== null ? String(item.data) : '';
                linhasTexto.push(`${rotulo}: [${valorDado}]`);
                linhasHtml.push(`<div class="clip-linha"><span class="clip-linha-rotulo">${escapeHtml(rotulo)}:</span> <span class="clip-linha-colchete">[</span><span class="clip-linha-dados">${escapeHtml(valorDado)}</span><span class="clip-linha-colchete">]</span></div>`);
            }
        }

        return {
            texto: linhasTexto.join('\n'),
            html: linhasHtml.join('\n'),
            status: 'ok',
            totalLinhas: listaEntradas.length
        };
    }

    function formatarDataHoraAtual() {
        const agora = new Date();
        const dia = String(agora.getDate()).padStart(2, '0');
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const ano = agora.getFullYear();
        const hor = String(agora.getHours()).padStart(2, '0');
        const min = String(agora.getMinutes()).padStart(2, '0');
        const seg = String(agora.getSeconds()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hor}:${min}:${seg}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /* Passo 2: Conversores bidirecionais HTML <-> Markdown nativos */
    function converterHtmlParaMarkdown(html) {
        if (!html) return '';
        let md = html;

        /* Conversao de quebras e paragrafos */
        md = md.replace(/<br\s*\/?>/gi, '\n');
        md = md.replace(/<\/p>\s*<p>/gi, '\n\n');
        md = md.replace(/<\/?p>/gi, '');

        /* Estilos inline */
        md = md.replace(/<(?:b|strong)>(.*?)<\/(?:b|strong)>/gi, '**$1**');
        md = md.replace(/<(?:i|em)>(.*?)<\/(?:i|em)>/gi, '*$1*');
        md = md.replace(/<(?:s|strike|del)>(.*?)<\/(?:s|strike|del)>/gi, '~~$1~~');
        md = md.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>');
        md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
        md = md.replace(/<pre>(?:<code>)?([\s\S]*?)(?:<\/code>)?<\/pre>/gi, '```\n$1\n```');

        /* Cabecalhos e blocos */
        md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
        md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
        md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
        md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n');
        md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
        md = md.replace(/<\/?(?:ul|ol)>/gi, '\n');
        md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

        /* Limpeza de tags residuais via DOM */
        const tmp = document.createElement('div');
        tmp.innerHTML = md;
        return (tmp.textContent || tmp.innerText || '').trim();
    }

    function converterMarkdownParaHtml(md) {
        if (!md) return '<p><br></p>';
        const linhas = md.split(/\r?\n/);
        const partesHtml = [];

        for (let i = 0; i < linhas.length; i++) {
            let l = linhas[i];
            if (l.startsWith('# ')) {
                partesHtml.push('<h1>' + escapeHtml(l.substring(2)) + '</h1>');
            } else if (l.startsWith('## ')) {
                partesHtml.push('<h2>' + escapeHtml(l.substring(3)) + '</h2>');
            } else if (l.startsWith('### ')) {
                partesHtml.push('<h3>' + escapeHtml(l.substring(4)) + '</h3>');
            } else if (l.startsWith('> ')) {
                partesHtml.push('<blockquote>' + escapeHtml(l.substring(2)) + '</blockquote>');
            } else if (l.startsWith('- ') || l.startsWith('* ')) {
                partesHtml.push('<ul><li>' + escapeHtml(l.substring(2)) + '</li></ul>');
            } else if (/^\d+\.\s/.test(l)) {
                partesHtml.push('<ol><li>' + escapeHtml(l.replace(/^\d+\.\s/, '')) + '</li></ol>');
            } else if (l.trim() === '---') {
                partesHtml.push('<hr>');
            } else if (l.trim() === '') {
                partesHtml.push('<p><br></p>');
            } else {
                let fmt = escapeHtml(l);
                fmt = fmt.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
                fmt = fmt.replace(/\*(.*?)\*/g, '<i>$1</i>');
                fmt = fmt.replace(/~~(.*?)~~/g, '<s>$1</s>');
                fmt = fmt.replace(/`(.*?)`/g, '<code>$1</code>');
                partesHtml.push('<p>' + fmt + '</p>');
            }
        }

        return partesHtml.join('');
    }

    /* Passo 3: Inicializacao apos carregamento do DOM */
    function inicializarEditorDemo() {
        const editor = document.getElementById('editorHtmlOnlineDemo');
        if (!editor) return;

        const btnToggleToolbar = document.getElementById('btnToggleToolbarDemo');
        const toolbarPrincipal = document.getElementById('toolbarPrincipalDemo');
        const btnRestaurarTextarea = document.getElementById('btnRestaurarTextareaDemo');
        const textareaMinutas = document.getElementById('textareaMinutasDemo');
        const TEXTO_PADRAO_TEXTAREA = 'texto #tag/campo# texto #[tag/campo]# texto ##tag/campo## texto @@ tag/campo @@ texto ### tag/campo ## texto id ########## texto R$ $$$$$$$$ texto @@@@@@@@ texto.';

        const btnRestaurarEditorHtml = document.getElementById('btnRestaurarEditorHtmlDemo');
        const containerEditor = document.getElementById('containerEditorDemo');

        /* 3.0: Sanitizacao de espacos vazios nos limites do contenteditable para evitar quebras de linha orfas ao centralizar */
        function sanitizarEspacosLimitesEditor() {
            if (!editor) return;
            while (editor.firstChild && editor.firstChild.nodeType === Node.TEXT_NODE && !editor.firstChild.textContent.trim()) {
                editor.removeChild(editor.firstChild);
            }
            while (editor.lastChild && editor.lastChild.nodeType === Node.TEXT_NODE && !editor.lastChild.textContent.trim()) {
                editor.removeChild(editor.lastChild);
            }
        }
        sanitizarEspacosLimitesEditor();

        /* 3.1: Botao Restaurar Padrao para a Caixa de Texto (<textarea>) */
        if (btnRestaurarTextarea && textareaMinutas) {
            btnRestaurarTextarea.addEventListener('click', () => {
                textareaMinutas.value = TEXTO_PADRAO_TEXTAREA;
                textareaMinutas.focus();
                textareaMinutas.style.borderColor = '#10b981';
                setTimeout(() => {
                    textareaMinutas.style.borderColor = '';
                }, 600);
            });
        }

        /* 3.1.1: Botao Restaurar Padrao para o Editor HTML Online (contenteditable) */
        if (btnRestaurarEditorHtml && editor) {
            btnRestaurarEditorHtml.addEventListener('click', () => {
                editor.innerHTML = TEXTO_PADRAO_EDITOR_HTML;
                sanitizarEspacosLimitesEditor();
                editor.focus();
                if (containerEditor) containerEditor.style.borderColor = '#10b981';
                setTimeout(() => {
                    if (containerEditor) containerEditor.style.borderColor = '';
                }, 600);
            });
        }

        /* 3.2: Expansao / Recolhimento da Barra de Ferramentas (Sobe e Desce compacto) */
        if (btnToggleToolbar && toolbarPrincipal) {
            btnToggleToolbar.addEventListener('click', () => {
                toolbarVisivel = !toolbarVisivel;
                toolbarPrincipal.style.display = toolbarVisivel ? 'flex' : 'none';
                btnToggleToolbar.setAttribute(
                    'title',
                    toolbarVisivel ? 'Recolher barra de ferramentas de edicao' : 'Expandir barra de ferramentas de edicao'
                );
                btnToggleToolbar.innerHTML = toolbarVisivel ? SVG_SETA_CIMA : SVG_SETA_BAIXO;
            });
        }

        /* 3.3: Execucao de comandos nativos de formatacao com preservacao do foco */
        document.querySelectorAll('#containerEditorDemo .btn-tb').forEach((btn) => {
            const cmd = btn.getAttribute('data-cmd');
            if (!cmd) return;

            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Impede perda do foco da selecao no editor
            });

            btn.addEventListener('click', () => {
                editor.focus();

                if (cmd === 'hiliteColor') {
                    try {
                        const valCor = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor');
                        if (valCor && (valCor.includes('254, 240, 138') || valCor.includes('255, 255, 0') || valCor.includes('yellow'))) {
                            document.execCommand('hiliteColor', false, 'inherit');
                        } else {
                            document.execCommand('hiliteColor', false, '#fef08a');
                        }
                    } catch (err) {
                        try {
                            document.execCommand('backColor', false, '#fef08a');
                        } catch (e2) {
                            // Ignora erro eventual em sandboxes estritas
                        }
                    }
                } else if (cmd === 'justifyCenter' || cmd === 'justifyLeft' || cmd === 'justifyRight' || cmd === 'justifyFull') {
                    sanitizarEspacosLimitesEditor();
                    try {
                        document.execCommand(cmd, false, null);
                    } catch (_) {}
                } else {
                    try {
                        document.execCommand(cmd, false, null);
                    } catch (err) {
                        // Ignora erro eventual
                    }
                }
            });
        });
    }

    /* Passo 4: Modulo TECLADO/MOUSE - Demonstracao de Campos de Linha Unica em Grade */
    function obterDataAtualPorExtenso() {
        const meses = [
            'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        const agora = new Date();
        const dia = agora.getDate();
        const mes = meses[agora.getMonth()];
        const ano = agora.getFullYear();
        return `${dia} de ${mes} de ${ano}`;
    }

    function obterDataAtualFormatada() {
        const agora = new Date();
        const dia = String(agora.getDate()).padStart(2, '0');
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const ano = agora.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    function formatarMascaraData(valor) {
        const digitos = (valor || '').replace(/\D/g, '').slice(0, 8);
        if (digitos.length <= 2) return digitos;
        if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
        return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
    }

    function formatarMascaraCpfCnpj(valor) {
        const digitos = (valor || '').replace(/\D/g, '').slice(0, 14);
        if (digitos.length <= 11) {
            if (digitos.length <= 3) return digitos;
            if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
            if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
            return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
        } else {
            if (digitos.length <= 2) return digitos;
            if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
            if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
            if (digitos.length <= 12) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
            return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
        }
    }

    function aplicarMascarasLinha(linha) {
        if (!linha) return;
        const inputData = linha.querySelector('.input-data-mascara');
        const inputCpfCnpj = linha.querySelector('.input-cpf-cnpj');
        const inputTexto3 = linha.querySelector('.input-texto-tamanho3');

        if (inputData) {
            inputData.addEventListener('input', () => {
                inputData.value = formatarMascaraData(inputData.value);
            });
        }
        if (inputCpfCnpj) {
            inputCpfCnpj.addEventListener('input', () => {
                inputCpfCnpj.value = formatarMascaraCpfCnpj(inputCpfCnpj.value);
            });
        }
        if (inputTexto3) {
            inputTexto3.addEventListener('input', () => {
                if (inputTexto3.value.length > 3) {
                    inputTexto3.value = inputTexto3.value.slice(0, 3);
                }
            });
        }
    }

    function adicionarLinhaEntradaDemo() {
        const containerLinhas = document.getElementById('containerLinhasEntradaDemo');
        if (!containerLinhas) return;

        const todasLinhas = containerLinhas.querySelectorAll('.linha-campos-entrada');
        if (todasLinhas.length === 0) return;
        const ultimaLinha = todasLinhas[todasLinhas.length - 1];

        const inputExtenso = ultimaLinha.querySelector('.input-data-extenso');
        const inputData = ultimaLinha.querySelector('.input-data-mascara');
        const inputCpfCnpj = ultimaLinha.querySelector('.input-cpf-cnpj');
        const inputTexto3 = ultimaLinha.querySelector('.input-texto-tamanho3');

        const vExtenso = inputExtenso ? inputExtenso.value.trim() : '';
        const vData = inputData ? inputData.value.trim() : '';
        const vCpfCnpj = inputCpfCnpj ? inputCpfCnpj.value.trim() : '';
        const vTexto3 = inputTexto3 ? inputTexto3.value.trim() : '';

        /* So duplica a linha se todos os campos tiverem dados preenchidos */
        if (!vExtenso || !vData || !vCpfCnpj || !vTexto3) {
            [inputExtenso, inputData, inputCpfCnpj, inputTexto3].forEach(inp => {
                if (inp && !inp.value.trim()) {
                    inp.style.borderColor = '#ef4444';
                    setTimeout(() => { inp.style.borderColor = ''; }, 700);
                }
            });
            return;
        }

        /* Cria a nova linha duplicada com todos os campos em vazio e tip vazio */
        const novaLinha = document.createElement('div');
        novaLinha.className = 'linha-campos-entrada';
        novaLinha.style.cssText = 'display: flex; align-items: center; gap: 6px; flex-wrap: wrap;';
        novaLinha.innerHTML = [
            '<input type="text" class="editable-demo input-data-extenso" style="flex: 2; min-width: 170px; padding: 6px 10px; font-family: inherit; font-size: 13px;" placeholder="" title="">',
            '<input type="text" class="editable-demo input-data-mascara" style="flex: 1; min-width: 105px; max-width: 115px; padding: 6px 8px; font-family: inherit; font-size: 13px; text-align: center;" placeholder="DD/MM/AAAA" maxlength="10" title="Data no formato DD/MM/AAAA">',
            '<input type="text" class="editable-demo input-cpf-cnpj" style="flex: 1.5; min-width: 155px; max-width: 175px; padding: 6px 10px; font-family: inherit; font-size: 13px;" placeholder="CPF ou CNPJ" maxlength="18" title="CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) automatico">',
            '<input type="text" class="editable-demo input-texto-tamanho3" style="width: 55px; padding: 6px 8px; font-family: inherit; font-size: 13px; text-align: center;" placeholder="UF" maxlength="3" title="Campo de texto de tamanho 3">'
        ].join('');

        containerLinhas.appendChild(novaLinha);
        aplicarMascarasLinha(novaLinha);

        const novoExtenso = novaLinha.querySelector('.input-data-extenso');
        if (novoExtenso) {
            novoExtenso.focus();
        }
    }

    function limparTodasLinhasDemo() {
        const containerLinhas = document.getElementById('containerLinhasEntradaDemo');
        if (!containerLinhas) return;
        const todasLinhas = Array.from(containerLinhas.querySelectorAll('.linha-campos-entrada'));
        for (let i = 1; i < todasLinhas.length; i++) {
            todasLinhas[i].remove();
        }
        const primeiraLinha = containerLinhas.querySelector('.linha-campos-entrada');
        if (primeiraLinha) {
            const inputExtenso = primeiraLinha.querySelector('.input-data-extenso');
            const inputData = primeiraLinha.querySelector('.input-data-mascara');
            const inputCpfCnpj = primeiraLinha.querySelector('.input-cpf-cnpj');
            const inputTexto3 = primeiraLinha.querySelector('.input-texto-tamanho3');

            if (inputExtenso) inputExtenso.value = obterDataAtualPorExtenso();
            if (inputData) inputData.value = obterDataAtualFormatada();
            if (inputCpfCnpj) inputCpfCnpj.value = '';
            if (inputTexto3) inputTexto3.value = '';

            const slot = primeiraLinha.querySelector('.slot-btn-adicionar');
            if (slot) slot.remove();

            if (inputExtenso) inputExtenso.focus();
        }
    }

    function inicializarCamposEntradaDemo() {
        const containerLinhas = document.getElementById('containerLinhasEntradaDemo');
        if (!containerLinhas) return;

        const primeiraLinha = containerLinhas.querySelector('.linha-campos-entrada');
        if (primeiraLinha) {
            const inputExtenso = primeiraLinha.querySelector('.input-data-extenso');
            const inputData = primeiraLinha.querySelector('.input-data-mascara');
            const inputCpfCnpj = primeiraLinha.querySelector('.input-cpf-cnpj');
            const inputTexto3 = primeiraLinha.querySelector('.input-texto-tamanho3');

            if (inputExtenso) inputExtenso.value = obterDataAtualPorExtenso();
            if (inputData) inputData.value = obterDataAtualFormatada();
            if (inputCpfCnpj) inputCpfCnpj.value = '';
            if (inputTexto3) inputTexto3.value = '';

            aplicarMascarasLinha(primeiraLinha);
        }

        const btnAdicionar = document.getElementById('btnAdicionarLinhaEntradaDemo');
        if (btnAdicionar) {
            btnAdicionar.addEventListener('click', adicionarLinhaEntradaDemo);
        }

        const btnLimpar = document.getElementById('btnLimparCamposEntradaDemo');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', limparTodasLinhasDemo);
        }
    }

    function inicializarTudo() {
        inicializarEditorDemo();
        inicializarCamposEntradaDemo();
    }

    /* Expor interface de teste para validacao formal e automatizada */
    window.JusGovFormatarConteudoClipboard = formatarConteudoClipboard;
    window.JusGovEditorDemo = Object.freeze({
        formatarConteudoClipboard,
        SVG_CLIPBOARD_CORTADO,
        converterHtmlParaMarkdown,
        converterMarkdownParaHtml,
        formatarDataHoraAtual,
        obterDataAtualPorExtenso,
        obterDataAtualFormatada,
        formatarMascaraData,
        formatarMascaraCpfCnpj,
        adicionarLinhaEntradaDemo,
        limparTodasLinhasDemo,
        restaurarEditorHtmlPadrao() {
            const ed = document.getElementById('editorHtmlOnlineDemo');
            const cont = document.getElementById('containerEditorDemo');
            if (ed) {
                ed.innerHTML = TEXTO_PADRAO_EDITOR_HTML;
            }
            if (cont) {
                cont.style.borderColor = '#10b981';
                setTimeout(() => { if (cont) cont.style.borderColor = ''; }, 600);
            }
        },
        obterTextoPadraoEditorHtml() { return TEXTO_PADRAO_EDITOR_HTML; },
        obterModoAtual() { return modoAtual; },
        obterToolbarVisivel() { return toolbarVisivel; }
    });

    /* Registrar inicializacao no carregamento da janela */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarTudo);
    } else {
        inicializarTudo();
    }
})();
