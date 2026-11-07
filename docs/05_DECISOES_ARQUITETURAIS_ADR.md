# REGISTRO DE DECISÕES ARQUITETURAIS (ADR) - JUSGOVBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Histórico perene das decisões técnicas críticas tomadas ao longo da evolução do ecossistema, seus contextos, motivações, alternativas descartadas e consequências operacionais.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/05_DECISOES_ARQUITETURAIS_ADR.md`
> - **Finalidade Primária:** Registro perene de Decisões Arquiteturais Críticas (ADRs) tomadas ao longo da evolução do software.
> - **Papel na Governança e Inteligência da IA:** Preserva o histórico do *porquê* de cada decisão de engenharia, impedindo que a IA reverta escolhas intencionais no futuro.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Padrão canônico de ADR (Status, Contexto, Decisão e Consequências), ADR-001 (sem Node/NPM), ADR-006 (Null Object Pattern) e ADR-007 (Workflow Deliberativo no Backlog).
>   - *Seções Específicas de Domínio (A Adaptar):* Decisões restritas ao domínio do produto anterior.

Documento Relacionado: [01_DIRETRIZES_E_REGRAS_ROOT.md](01_DIRETRIZES_E_REGRAS_ROOT.md)

---

## ÍNDICE DE REGISTROS DE DECISÃO

- **ADR-001:** Execução e Auditoria via PowerShell V8 e Chromium Headless sem Dependência de Node.js / NPM
- **ADR-002:** Simulação de Clipboard em Memória para Histórico e Botão do Meio sem Solicitação de Permissões
- **ADR-003:** Classificação de Caracteres em Tabela Tipada ASCII de 128 Bits em Tempo O(1)
- **ADR-004:** Arquitetura Plana de Classes Especializadas em Diretório Único (copia-*.js e mod-copia.js)
- **ADR-005:** Centralização Append-Only de Exemplos Forenses e Máscaras em exemplos.json
- **ADR-006:** Resiliência em POO JavaScript via Injeção Opcional e Padrão Null Object
- **ADR-007:** Governança do Fluxo de Trabalho — Fila de Tarefas Obrigatória, Anotar Primeiro no Backlog, Sugestões Proativas (`+`) e Implementar sob Comando Expresso
- **ADR-008:** Paridade Estrutural dos 4 Grupos de Opções em Subdiretórios Físicos Exclusivos com SRP e DIP

---

### ADR-001: Execução e Auditoria via PowerShell V8 e Chromium Headless sem Node.js / NPM

- **Status:** Aprovado e Vigente.
- **Contexto:** Ambientes corporativos do Poder Judiciário e computadores de servidores públicos frequentemente possuem restrições severas de instalação de runtimes como Node.js, Python ou ferramentas baseadas em NPM.
- **Decisão:** A compilação, análise de sintaxe e suítes de testes automatizados são executadas via scripts nativos PowerShell (`util/executar_auditoria.ps1`), lançando instâncias headless do próprio Google Chrome para verificação estrita em runtime V8 genuíno.
- **Consequências:**
  * Zero dependências externas ou `node_modules` no repositório.
  * Ambiente 100% portável e reproduzível em qualquer máquina Windows padrão.
  * Validação no mesmo motor JavaScript V8 utilizado pelo usuário final em produção.

---

### ADR-002: Simulação de Clipboard em Memória sem Permissões Nativas de Leitura

- **Status:** Aprovado e Vigente.
- **Contexto:** A invocação da API `navigator.clipboard.readText()` pelo navegador aciona alertas invasivos de segurança ("O site deseja ler a área de transferência"), quebrando a experiência de cópia silenciosa e gerando desconfiança no usuário.
- **Decisão:** Implementação de um buffer simulado em memória de 2 níveis (`window.__JUSGOV_ULTIMO_CLIPBOARD__` e `window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__`, sincronizado via `chrome.storage.local` na Seção 6.63) mantido no momento da cópia (`salvarClipboardInternoComBackup`), com trava de segurança de 512KB.
- **Consequências:**
  * O clique com o Botão do Meio (último item) e `Ctrl + Botão do Meio` (penúltimo item, sem rotacionar o último) colam dados instantaneamente sem solicitar nenhuma permissão de leitura ao Chrome e sem depender do `Win+V` do SO.
  * Privacidade forense garantida e compatibilidade com iframes restritos.

---

### ADR-003: Classificação de Caracteres em Tabela Tipada ASCII em Tempo O(1)

- **Status:** Aprovado e Vigente.
- **Contexto:** Disparar expressões regulares complexas a cada micro-movimento ou clique de mouse causa engasgos (*jank*) e consumo excessivo de CPU no renderer do Chromium.
- **Decisão:** Criação de uma tabela `Uint8Array(128)` pré-computada em `ConstantesPadroes.js` para classificação bitmask imediata de delimitadores, letras, dígitos e pontuações em ~2 nanossegundos por caractere.
- **Consequências:**
  * Tempo de processamento $O(1)$ na identificação de unidades atômicas.
  * Expressões regulares são invocadas apenas após o isolamento inicial das fronteiras do token.

---

### ADR-004: Arquitetura de Classes Especializadas em Diretório Plano Único

- **Status:** Aprovado e Implementado.
- **Contexto:** O arquivo `SelecionarCopiar.js` concentrava ~8.600 linhas. A criação de subpastas profundas aumentava a complexidade de paths e o consumo de tokens de IA em prompts de leitura de arquivos.
- **Decisão:** Desacoplar o motor em arquivos concisos (`copia-estagio1.js` até `copia-visual.js`) orquestrados por uma fachada `mod-copia.js`, mantendo todos dentro do mesmo diretório `src/mod-copia/`.
- **Consequências:**
  * Classes coesas com responsabilidade única e campos privados (`#`).
  * Máxima economia de tokens de IA e facilidade de localização em buscas no repositório.

---

### ADR-005: Centralização Append-Only de Exemplos e Máscaras em exemplos.json

- **Status:** Aprovado e Vigente.
- **Contexto:** Anteriormente existia duplicidade entre `exemplos.txt`, `exemplos.js` e a Central de Ajuda.
- **Decisão:** Centralizar 100% dos exemplos positivos e negativos no arquivo `src/cfg/exemplos.json` (compilado para `src/cfg/exemplos.js`), com política estrita append-only (nunca remover dados válidos, apenas incrementar casos).
- **Consequências:**
  * Fonte única de verdade compartilhada entre a página de opções, os testes em `debug.js` e a auditoria automatizada.

---

### ADR-006: Resiliência em POO JavaScript via Injeção Opcional e Padrão Null Object

- **Status:** Aprovado e Vigente.
- **Contexto:** No ecossistema JavaScript do Chromium, a exclusão física de um arquivo de módulo, sua desativação por configuração ou eventual falha de carregamento normalmente provocaria quebra catastrófica da extensão em tempo de execução (`TypeError: Cannot read properties of undefined` ou `is not a function`), paralisando o navegador do usuário.
- **Decisão:** Combinar Injeção de Dependência Opcional com o Padrão Null Object. A classe orquestradora (`ModuloCopia`) aceita dependências opcionais via construtor e, caso qualquer classe filha ou serviço externo não esteja presente no escopo global ou nas opções, instancia automaticamente um Null Object com métodos no-op e retornos neutros (`null`, `false`, `""`, `{ ok: false }`), ex.: `this.#geometria = opcoes.geometria || (window.JusGovGeometriaDOM ? new window.JusGovGeometriaDOM() : NULL_GEOMETRIA)`.
- **Consequências:**
  * Imunidade absoluta contra quebras por arquivos ausentes ou módulos desabilitados.
  * Chamadas do teclado ou gestos de mouse jamais sofrem interrupção por exceções não tratadas.
  * Módulos podem ser ativados/desativados modularmente em tempo de execução com degradação graciosa.

---

### ADR-007: Governança do Fluxo de Trabalho — Fila de Tarefas Obrigatória, Anotar Primeiro e Implementar sob Comando

- **Status:** Aprovado e Vigente.
- **Contexto:** Em projetos de alta complexidade com interações contínuas entre desenvolvedor humano e IA, comandos imediatos de codificação podem gerar refatorações precipitadas, desalinhamento conceitual ou efeitos colaterais indesejados caso uma solicitação seja implementada antes de sua análise técnica e estruturação documental.
- **Decisão:** Formalizar na Diretriz Root 1 a regra estrita: toda solicitação cai obrigatoriamente na fila do Backlog (`docs/03_BACKLOG_TAREFAS_E_FEATURES.md`), acompanhada de sugestões automatizadas proativas da IA sinalizadas com `+`. O agente NUNCA implementa de imediato; ele primeiro expõe com clareza seu entendimento técnico e salva o plano na documentação. A codificação em `src/` e `manifest.json` só é iniciada mediante comando expresso `"implementar"`.
- **Consequências:**
  * Zero risco de refatorações ou modificações não deliberadas em código de produção.
  * Registro documental completo e histórico de decisões antes de qualquer linha de código ser alterada.
  * Máxima transparência e alinhamento ergonômico entre usuário e IA.

---

### ADR-008: Paridade Estrutural dos 4 Grupos de Opções em Subdiretórios Físicos Exclusivos com SRP e DIP

- **Status:** Aprovado e Vigente (Versão 261106.6.18).
- **Contexto:** A interface de opções (`options.html`) divide as configurações do usuário em 4 grandes grupos: (1) Cópia Inteligente & Forense, (2) Acelerador PJe Turbo, (3) Teclado/Mouse: Navegação por Teclado e Botões Laterais, e (4) Navegador: Gerenciamento de Guias e Janelas. Anteriormente, as rotinas de teclado/mouse e guias estavam parcialmente concentradas em `background.js` e em trechos utilitários, sem isolamento de classes especializadas em pastas dedicadas.
- **Decisão:** Estabelecer paridade 1:1 rigorosa entre os 4 grupos visíveis de opções e a estrutura física de subdiretórios em `src/`:
  1. `src/mod-copia/` (15 classes/módulos POO especializados + fachada `mod-copia.js`);
  2. `src/mod-pje/` (`PJE-anti_ampuletas.css`);
  3. `src/mod-input/` (4 classes especializadas + fachada `mod-input.js`);
  4. `src/mod-navegador/` (4 classes especializadas + fachada `mod-navegador.js`).
  Cada módulo adota SRP (Responsabilidade Única), DIP (Inversão de Dependência via injeção opcional), fachadas seladas com `Object.freeze` e Null Object Pattern com fallbacks imutáveis seguros contra exclusão física de arquivos.
- **Consequências:**
  * Coesão física e lógica perfeita entre o modelo mental da UI (`options.html`) e o código-fonte em `src/`.
  * Modularidade plug-and-play: cada módulo pode ser testado, mantido, reconfigurado ou excluído de forma totalmente independente.
  * Suíte de testes V8 Chromium Headless com 460 asserções determinísticas (100% de cobertura em 32 arquivos JS).
