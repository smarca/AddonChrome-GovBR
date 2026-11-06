# ÍNDICE GERAL, ROTEADOR SEMÂNTICO E SITEMAP DETALHADO - JUSGOVBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo (Manifest V3 - Chromium 116+)
Autor / Contato: smarca@gmail.com
Finalidade: Mapa central de navegação rápida, roteador semântico de contexto e sumário executivo detalhado para desenvolvedores e agentes de IA (Otimização Máxima de Tokens e Zero Perda de Eficiência).

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/00_INDICE_GERAL.md`
> - **Finalidade Primária:** Roteador semântico mestre, mapa de navegação rápida e sitemap central de todo o acervo documental técnico.
> - **Papel na Governança e Inteligência da IA:** Ponto de entrada obrigatório da IA ao iniciar qualquer turno. Elimina buscas cegas e economiza tokens direcionando diretamente para o arquivo e seção necessária.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar um novo projeto, copie a pasta `docs/` e declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Estrutura da tabela de roteamento direto, protocolos rápidos do desenvolvedor/IA, links relativos e salvaguarda de eficiência de tokens.
>   - *Seções Específicas de Domínio (A Adaptar):* Mapeamento de pastas em `src/` e descrição das regras de negócio do produto.


> [!IMPORTANT]
> **DIRETRIZ DE OURO DE EFICIÊNCIA DE TOKENS E ESTABILIDADE DO ÍNDICE MESTRE:**
> 1. Este índice mapeia a estrutura de arquivos e responsabilidades gerais do acervo documental.
> 2. **Ele só deve ser alterado quando arquivos forem criados, excluídos ou renomeados no projeto.**
> 3. Anotações rotineiras de tarefas, bugs ou regras internas dentro dos arquivos `.md` existentes (ex: `03_BACKLOG...` ou `04_RADAR...`) **NÃO alteram este índice**, evitando edições repetitivas e economizando tokens de IA.
> 4. Antes de abrir ou ler qualquer arquivo extenso, a IA consulta este índice para carregar **estritamente o arquivo necessário**, evitando consumo cego de contexto.

---

## 🧭 TABELA DE ROTEAMENTO DIRETO POR TIPO DE CONSULTA

| Objetivo / Tipo de Informação | Arquivo Alvo em `docs/` | Seção / Tópico Específico | Resumo do Conteúdo Disponível |
| :--- | :--- | :--- | :--- |
| **Regras Root Imutáveis e Governança** | [`01_DIRETRIZES_E_REGRAS_ROOT.md`](01_DIRETRIZES_E_REGRAS_ROOT.md) | **Diretrizes e Regras Root** | Princípios de engenharia, governança de backlog e comando expresso, comentários exaustivos, UTF-8 nativo, regras de cópia/gestos e padrões de UI. |
| **Arquitetura "Como Construído" (As-Built)** | [`02_ARQUITETURA_E_AS_BUILT.md`](02_ARQUITETURA_E_AS_BUILT.md) | **Visão Geral e POO** | Blueprint dos módulos, hot-paths DOM, contratos de classes POO em diretório plano e injeção em iframes. |
| **Tarefas Pendentes & Backlog** | [`03_BACKLOG_TAREFAS_E_FEATURES.md`](03_BACKLOG_TAREFAS_E_FEATURES.md) | **Planejamento e Entregas** | Livro mestre de planejamento, fila de tarefas futuras, governança de prioridades, histórico de entregas e especificações de features. |
| **Radar de Bugs e Qualidade** | [`04_RADAR_BUGS_E_QUALIDADE.md`](04_RADAR_BUGS_E_QUALIDADE.md) | **Radar de Qualidade** | Rastreamento contínuo de bugs em aberto, histórico de correções e oportunidades de refatoração arquitetural (Boas Práticas). |
| **Decisões Técnicas Críticas (ADRs)** | [`05_DECISOES_ARQUITETURAIS_ADR.md`](05_DECISOES_ARQUITETURAIS_ADR.md) | **ADRs** | Registros formais de decisões arquiteturais, motivações técnicas e trade-offs do projeto. |
| **Auditoria Automatizada e Fuzzing** | [`06_PLANO_DE_TESTES_E_AUDITORIA.md`](06_PLANO_DE_TESTES_E_AUDITORIA.md) | **Plano de Testes** | Metodologia de testes determinísticos no Chrome Headless V8, suíte de regressão e diretrizes de mutação/fuzzing. |
| **Laboratório Interativo e Exemplos** | [`07_MANUAL_HOMOLOGACAO_SANDBOX.md`](07_MANUAL_HOMOLOGACAO_SANDBOX.md) | **Guia do Sandbox** | Roteiro de homologação visual, amostras forenses e testes de acumulador e edição HTML. |
| **Changelog e Versões** | [`CHANGELOG.md`](CHANGELOG.md) | **Histórico de Lançamentos** | Histórico cronológico de versões (Keep a Changelog) e rastreabilidade por tags de backup. |
| **Guia Ultraleve para IAs e Scripts** | [`AGENTS.md`](AGENTS.md) e [`util/AGENTS.md`](../util/AGENTS.md) | **Protocolos e Ferramentas** | Padrão oficial do Google Antigravity para descoberta contextual e catálogo executivo da caixa de ferramentas em `util/`. |
| **Apresentação do Produto / GitHub** | [`README.md`](README.md) | **Visão Geral** | Manual de instalação, atalhos do usuário final, compatibilidade e licença pública. |

---

## 🗂️ MAPEAMENTO DA ÁRVORE DO CÓDIGO-FONTE (`src/`)

Para rápida localização de código sem varreduras cegas:

```
src/
├── cfg/                                        # Configurações, Background e Auditoria
│   ├── background.js                           # Service Worker MV3: guias, janelas e injeção com debounce
│   ├── debug.js                                # Motor determinístico das 11 baterias de teste (300 testes)
│   ├── options.html                            # Central de Ajuda, 4 grupos de opções e Laboratório Sandbox
│   ├── options.js                              # Lógica da interface de opções e persistência chrome.storage
│   ├── exemplos.json                           # Catálogo centralizado append-only de máscaras e exemplos forenses
│   └── exemplos.js                             # Interface JS imutável (Object.freeze) para o catálogo
│
├── mod-copia/                                  # Grupo 1: Cópia Inteligente e Seleção Forense (12 classes + Fachada)
│   ├── ConstantesPadroes.js                    # Tabela ASCII 128-bit, Regex pré-compiladas e Wiki Forense
│   ├── AvisoFlutuante.js                       # Validação matemática (Mod 11/97) e MiniTips de auditoria
│   ├── AcumuladorCopia.js                      # Estrutura do modo acumulador (Ctrl+Alt) com separador ';'
│   ├── copia-geometria.js                      # Resolução de coordenadas e nós de texto DOM
│   ├── copia-filtros.js                        # 5 Níveis progressivos de sanitização HTML
│   ├── copia-validadores.js                    # Auditoria matemática de documentos e calendários
│   ├── copia-minutas.js                        # 4 Modos de placeholders em editores de minutas
│   ├── copia-visual.js                         # Feedback visual Flash Border em SVG contíguo
│   ├── copia-estagio1.js a copia-estagio6.js   # 6 Estágios progressivos de expansão contextual
│   ├── mod-copia.js                            # Fachada orquestradora selada com Padrão Null Object
│   └── SelecionarCopiar.js                     # Fachada retrocompatível
│
├── mod-pje/                                    # Grupo 2: Acelerador PJe Turbo
│   └── PJE-anti_ampuletas.css                  # Desbloqueio precoce de modais e neutralização de ampulhetas
│
├── mod-input/                                  # Grupo 3: Teclado/Mouse: Navegação e Botões Laterais (5 classes)
│   ├── input-botoes-laterais.js                # Botões laterais 4 e 5 do mouse (troca circular de guias)
│   ├── input-botao-meio.js                     # Scroll click para colagem e Win+V com Ctrl+Botão do Meio
│   ├── input-teclado-campos.js                 # Navegação por setas verticais (↑ e ↓) entre campos <input>
│   ├── input-atalho-f1.js                      # Atalho F1 Gemini sem poluir a área de transferência
│   └── mod-input.js                            # Fachada orquestradora selada com Padrão Null Object
│
├── mod-navegador/                              # Grupo 4: Navegador: Gerenciamento de Guias e Janelas (5 classes)
│   ├── navegador-janela-unica.js               # Single Window com preservação de certificados Gov.br/ICP/PJe
│   ├── navegador-anti-duplicacao.js            # Anti-duplicação de URLs e reuso de abas abertas
│   ├── navegador-ordenacao.js                  # Ordenação hierárquica e agrupamento via Tab Groups API
│   ├── navegador-descarte.js                   # Tab Discarding automático para economia de memória RAM
│   └── mod-navegador.js                        # Fachada orquestradora selada com Padrão Null Object
│
└── icones/                                     # Ícones de interface do addon (16, 32, 48, 128px)
```

---

## ⚡ PROTOCOLO RÁPIDO PARA DESENVOLVEDORES E AGENTES DE IA

1. **Antes de codificar:** Verifique as regras em [`01_DIRETRIZES_E_REGRAS_ROOT.md`](01_DIRETRIZES_E_REGRAS_ROOT.md). Jamais use entidades HTML; use UTF-8 nativo direto.
2. **Ao criar ou alterar funcionalidades:** Verifique e atualize o backlog em [`03_BACKLOG_TAREFAS_E_FEATURES.md`](03_BACKLOG_TAREFAS_E_FEATURES.md).
3. **Ao corrigir bugs:** Registre a causa-raiz e a solução em [`04_RADAR_BUGS_E_QUALIDADE.md`](04_RADAR_BUGS_E_QUALIDADE.md).
4. **Ao tomar decisões estruturais:** Registre o ADR correspondente em [`05_DECISOES_ARQUITETURAIS_ADR.md`](05_DECISOES_ARQUITETURAIS_ADR.md).
5. **Após qualquer alteração:**
   - Execute: `powershell -ExecutionPolicy Bypass -File util/verificar_codificacao.ps1` (Valida UTF-8, entidades e links MD).
   - Execute: `powershell -ExecutionPolicy Bypass -File util/executar_auditoria.ps1` (Exige 100% de aprovação nos 290 testes).
   - Execute: `powershell -ExecutionPolicy Bypass -File util/fazer_backup.ps1` (Gera backup versionado e sincroniza o README.md).
