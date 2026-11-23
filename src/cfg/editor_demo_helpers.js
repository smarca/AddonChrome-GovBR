/* ==========================================================================
 * ARQUIVO: src/cfg/editor_demo_helpers.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Sandbox Demo — Conversores HTML <-> Markdown e Utilitários de Formatação
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/editor_demo_helpers.js
 * - Exportado: window.JusGovEditorDemoHelpers (formatarDataHoraAtual, escapeHtml, converterHtmlParaMarkdown, converterMarkdownParaHtml)
 * - Regras / Seções: ENG-00, ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz) {
    'use strict';

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


    raiz.JusGovEditorDemoHelpers = Object.freeze({
        formatarDataHoraAtual,
        escapeHtml,
        converterHtmlParaMarkdown,
        converterMarkdownParaHtml
    });
})(typeof self !== 'undefined' ? self : this);