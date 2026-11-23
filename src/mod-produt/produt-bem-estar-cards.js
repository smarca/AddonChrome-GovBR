/* ==========================================================================
 * ARQUIVO: src/mod-produt/produt-bem-estar-cards.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Produtividade — Catálogo Estático de Cards de Bem-Estar
 *
 * @MAPA-IA:
 * - Arquivo: src/mod-produt/produt-bem-estar-cards.js
 * - Exportado: self.JusGovProdutBemEstarCards (CARDS_FOCO, CARDS_AGUARDANDO, CARDS_DEBITO, CARDS_ALIVIO, CARDS_PROIBIDOS, CARDS_PAUSA_MAIOR)
 * - Regras / Seções: ENG-00, ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovProdutBemEstarCards = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const CARDS_FOCO = Object.freeze([
        Object.freeze({
            chave: 'foco_profundo',
            categoria: 'foco',
            prioridade: 'essencial',
            icone: 'alvo',
            titulo: 'Foco Profundo',
            texto: 'Concentre-se em uma tarefa por vez para render mais!',
            bg: '#0f766e',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'foco_ergonomia',
            categoria: 'foco',
            prioridade: 'essencial',
            icone: 'postura_cadeira',
            titulo: 'Postura Ativa',
            texto: 'Mantenha ombros relaxados, costas apoiadas e pés no chão.',
            bg: '#0369a1',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'foco_respiracao',
            categoria: 'foco',
            prioridade: 'normal',
            icone: 'mente_calma',
            titulo: 'Ritmo Constante',
            texto: 'Respire fundo e evite alternar entre muitas abas ao mesmo tempo.',
            bg: '#047857',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'foco_piscar',
            categoria: 'foco',
            prioridade: 'normal',
            icone: 'olhos',
            titulo: 'Cuide dos Olhos',
            texto: 'Pisque com frequência enquanto lê ou digita na tela.',
            bg: '#0f766e',
            fg: '#f8fafc',
            piscar: false
        })
    ]);

    const CARDS_AGUARDANDO = Object.freeze([
        Object.freeze({
            chave: 'aguardando_soltar',
            categoria: 'aguardando',
            prioridade: 'essencial',
            icone: 'relogio_alerta',
            titulo: 'Hora da Pausa!',
            texto: 'Solte o mouse e o teclado agora para iniciar seu alívio.',
            bg: '#b91c1c',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'aguardando_salvar',
            categoria: 'aguardando',
            prioridade: 'essencial',
            icone: 'energia',
            titulo: 'Recarregue Agora',
            texto: 'Finalize a frase atual, afaste-se da tela e descanse os olhos!',
            bg: '#dc2626',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'aguardando_espera',
            categoria: 'aguardando',
            prioridade: 'essencial',
            icone: 'sem_tela',
            titulo: 'Pausa Esperando',
            texto: 'Seu descanso começa automaticamente assim que você parar.',
            bg: '#b91c1c',
            fg: '#ffffff',
            piscar: false
        })
    ]);

    const CARDS_DEBITO = Object.freeze([
        Object.freeze({
            chave: 'debito_acumulado',
            categoria: 'debito',
            prioridade: 'essencial',
            icone: 'balanca',
            titulo: 'Descanso em Débito',
            texto: 'Você tem pausa pendente! Pare 1 min para começar a quitar.',
            bg: '#b91c1c',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'debito_rendimento',
            categoria: 'debito',
            prioridade: 'essencial',
            icone: 'energia',
            titulo: 'Fadiga Acumulada',
            texto: 'Estender demais o foco reduz a atenção — faça seu alívio!',
            bg: '#dc2626',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'debito_agua_tela',
            categoria: 'debito',
            prioridade: 'essencial',
            icone: 'agua',
            titulo: 'Quite sua Pausa',
            texto: 'Levante-se, beba água e afaste-se da tela para zerar o débito.',
            bg: '#991b1b',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'debito_mente',
            categoria: 'debito',
            prioridade: 'normal',
            icone: 'musica_calma',
            titulo: 'Desconecte um Pouco',
            texto: 'Uma pausa curta agora devolve o foco mais rápido do que insistir.',
            bg: '#b45309',
            fg: '#ffffff',
            piscar: false
        })
    ]);

    const CARDS_ALIVIO = Object.freeze([
        Object.freeze({
            chave: 'hidratar',
            categoria: 'alivio',
            prioridade: 'essencial',
            icone: 'agua',
            titulo: 'Hidrate-se',
            texto: 'Beba um copo de água agora ou vá ao banheiro!',
            bg: '#0369a1',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'levantar',
            categoria: 'alivio',
            prioridade: 'essencial',
            icone: 'caminhar',
            titulo: 'Levante-se!',
            texto: 'Levante-se da cadeira agora e dê alguns passos!',
            bg: '#0f766e',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'longe_tela',
            categoria: 'alivio',
            prioridade: 'essencial',
            icone: 'sem_tela',
            titulo: 'Afaste-se da Tela',
            texto: 'Tire a atenção do computador e relaxe o foco visual!',
            bg: '#0369a1',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'esticar',
            categoria: 'alivio',
            prioridade: 'essencial',
            icone: 'esticar',
            titulo: 'Alívio Físico',
            texto: 'Levante-se e estique ombros, pescoço, costas e punhos!',
            bg: '#0f766e',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'olhos_6m',
            categoria: 'alivio',
            prioridade: 'essencial',
            icone: 'olhos',
            titulo: 'Visão (+6m)',
            texto: 'Descanse os olhos: olhe para longe (+6m) fora da tela!',
            bg: '#0f766e',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'piscar_olhos',
            categoria: 'alivio',
            prioridade: 'normal',
            icone: 'olhos',
            titulo: 'Lubrifique a Visão',
            texto: 'Pisque devagar várias vezes ou feche os olhos por 20s.',
            bg: '#047857',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'postura',
            categoria: 'alivio',
            prioridade: 'normal',
            icone: 'esticar',
            titulo: 'Postura e Coluna',
            texto: 'Solte os braços, gire o pescoço devagar e alinhe as costas.',
            bg: '#047857',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'respirar',
            categoria: 'alivio',
            prioridade: 'normal',
            icone: 'respirar',
            titulo: 'Respiração',
            texto: 'Faça respirações lentas e fundas para baixar o estresse.',
            bg: '#047857',
            fg: '#f8fafc',
            piscar: false
        }),
        Object.freeze({
            chave: 'copo_agua',
            categoria: 'alivio',
            prioridade: 'essencial',
            icone: 'copo_agua',
            titulo: 'Copo de Água',
            texto: 'Beba um copo de água fresca para manter a hidratação!',
            bg: '#0284c7',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'cafe_quente',
            categoria: 'alivio',
            prioridade: 'extra',
            icone: 'cafe',
            titulo: 'Café Quente / Chá',
            texto: 'Aproveite a pausa para um café quente ou chá sem pressa.',
            bg: '#78350f',
            fg: '#fef3c7',
            piscar: false
        }),
        Object.freeze({
            chave: 'vitamina_frutas',
            categoria: 'alivio',
            prioridade: 'extra',
            icone: 'vitamina',
            titulo: 'Vitamina de Frutas',
            texto: 'Recarregue a energia com uma vitamina de frutas ou fruta fresca!',
            bg: '#0f766e',
            fg: '#ffffff',
            piscar: false
        })
    ]);

    const CARDS_PROIBIDOS = Object.freeze([
        Object.freeze({
            chave: 'sem_celular',
            categoria: 'proibido',
            prioridade: 'essencial',
            icone: 'sem_celular',
            titulo: 'Sem Celular',
            texto: 'Não abra o celular ou redes sociais: descanse a atenção!',
            bg: '#b91c1c',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'sem_pc',
            categoria: 'proibido',
            prioridade: 'essencial',
            icone: 'sem_tela',
            titulo: 'Sem Computador',
            texto: 'Evite ler e-mails, mensagens ou telas de trabalho no alívio!',
            bg: '#b91c1c',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'sem_tarefa',
            categoria: 'proibido',
            prioridade: 'normal',
            icone: 'sem_tarefa',
            titulo: 'Não Fazer',
            texto: 'Não comece tarefa nova ou complexa durante a pausa!',
            bg: '#b45309',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'sem_pressa',
            categoria: 'proibido',
            prioridade: 'extra',
            icone: 'sem_tarefa',
            titulo: 'Sem Olhar o Relógio',
            texto: 'Não fique vigiando o cronômetro esperar o descanso acabar.',
            bg: '#b45309',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'sem_redes',
            categoria: 'proibido',
            prioridade: 'normal',
            icone: 'sem_redes',
            titulo: 'Sem Redes Sociais',
            texto: 'Evite rolar feeds ou chats: deixe a mente descansar de verdade!',
            bg: '#b91c1c',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'sem_notificacoes',
            categoria: 'proibido',
            prioridade: 'normal',
            icone: 'sem_notificacoes',
            titulo: 'Sem Notificações',
            texto: 'Silencie alertas e notificações durante o seu descanso.',
            bg: '#b45309',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'sem_email',
            categoria: 'proibido',
            prioridade: 'extra',
            icone: 'sem_email',
            titulo: 'Sem E-mails',
            texto: 'Não abra a caixa de e-mails ou mensagens de trabalho no alívio.',
            bg: '#991b1b',
            fg: '#ffffff',
            piscar: false
        })
    ]);

    const CARDS_PAUSA_MAIOR = Object.freeze([
        Object.freeze({
            chave: 'hidratar_longa',
            categoria: 'pausa_maior',
            prioridade: 'essencial',
            icone: 'agua',
            titulo: 'Hidratação e Pausa',
            texto: 'Aproveite a pausa longa para beber água e renovar a mente!',
            bg: '#0284c7',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'caminhar',
            categoria: 'pausa_maior',
            prioridade: 'essencial',
            icone: 'caminhar',
            titulo: 'Mude de Ambiente',
            texto: 'Saia da cadeira agora, caminhe longe do PC e alongue-se!',
            bg: '#0369a1',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'desconectar',
            categoria: 'pausa_maior',
            prioridade: 'essencial',
            icone: 'desconectar',
            titulo: 'Desconecte-se',
            texto: 'Afaste-se do computador e do celular durante a pausa longa!',
            bg: '#9a3412',
            fg: '#ffffff',
            piscar: true
        }),
        Object.freeze({
            chave: 'banheiro',
            categoria: 'pausa_maior',
            prioridade: 'essencial',
            icone: 'agua',
            titulo: 'Pausa Completa',
            texto: 'Vá ao banheiro, lave o rosto com água fria e respire fora da sala!',
            bg: '#0f766e',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'sol_ar_fresco',
            categoria: 'pausa_maior',
            prioridade: 'normal',
            icone: 'sol',
            titulo: 'Luz Natural e Ar',
            texto: 'Vá até uma janela ou área externa para tomar ar fresco.',
            bg: '#0369a1',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'lanche',
            categoria: 'pausa_maior',
            prioridade: 'extra',
            icone: 'lanche',
            titulo: 'Lanche Leve',
            texto: 'Coma uma fruta, castanhas ou tome um café/chá longe das telas.',
            bg: '#0f766e',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'musica',
            categoria: 'pausa_maior',
            prioridade: 'extra',
            icone: 'musica',
            titulo: 'Música Calma',
            texto: 'Ouça 1 ou 2 músicas calmas longe do teclado.',
            bg: '#4338ca',
            fg: '#ffffff',
            piscar: false
        }),
        Object.freeze({
            chave: 'organizar',
            categoria: 'pausa_maior',
            prioridade: 'extra',
            icone: 'organizar',
            titulo: 'Organize o Espaço',
            texto: 'Guarde papéis ou organize brevemente a mesa ao finalizar.',
            bg: '#0f766e',
            fg: '#ffffff',
            piscar: false
        })
    ]);

    const CARD_RETORNO_TRABALHO = Object.freeze({
        chave: 'foco_retorno',
        categoria: 'retorno_trabalho',
        icone: 'foco_retorno',
        titulo: 'Retomar Foco',
        texto: 'Saldo de pausas elevado hoje: hora de retomar o trabalho!',
        bg: '#0f766e',
        fg: '#ffffff',
        piscar: true
    });

    const CARD_INCENTIVO_DESCANSO = Object.freeze({
        chave: 'adiantar_descanso',
        categoria: 'alivio',
        icone: 'adiantar_descanso',
        titulo: 'Pausa Merecida',
        texto: 'Foco intenso acumulado! Que tal iniciar ou retomar um Alívio?',
        bg: '#0284c7',
        fg: '#ffffff',
        piscar: true
    });


    return Object.freeze({
        CARDS_FOCO,
        CARDS_AGUARDANDO,
        CARDS_DEBITO,
        CARDS_ALIVIO,
        CARDS_PROIBIDOS,
        CARDS_PAUSA_MAIOR,
        CARD_RETORNO_TRABALHO,
        CARD_INCENTIVO_DESCANSO
    });
}));