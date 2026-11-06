# MANUAL DE HOMOLOGAÇÃO E CENTRAL DE AJUDA / SANDBOX - JUSGOVBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Guia de homologação manual, uso do laboratório de testes interativo e catálogo de dados em `src/cfg/options.html`.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/07_MANUAL_HOMOLOGACAO_SANDBOX.md`
> - **Finalidade Primária:** Manual interativo da Central de Ajuda, laboratório de testes visuais (Sandbox) e guia de homologação pelo usuário final.
> - **Papel na Governança e Inteligência da IA:** Assegura paridade absoluta entre a documentação de instrução, a interface visual e o motor do aplicativo.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Princípio de sincronização mútua de Sandbox/Blueprint (Diretriz Root 6) e separação de casos positivos vs negativos.
>   - *Seções Específicas de Domínio (A Adaptar):* Exemplos práticos de tela e dados de formulário do produto anterior.

Documento Relacionado: [01_DIRETRIZES_E_REGRAS_ROOT.md](01_DIRETRIZES_E_REGRAS_ROOT.md)

---

## 1. O LABORATÓRIO INTERATIVO (SANDBOX DE TESTES)

Localizado ao final da página de Opções (`src/cfg/options.html`), o Laboratório Interativo permite ao usuário e ao analista de testes homologar o comportamento exato de cada atalho e motor de seleção visual:

### 1.1 Bloco 1: Campo de Simulação Editável (Minutas e Placeholders)
* **Objetivo:** Homologar os 4 modos de *"Seleção Automática de Placeholders em Editores"*.
* **Casos Testados:**
  * Modo 1: Colchetes `[conteúdo do campo]`
  * Modo 2: Delimitadores angulares `<conteúdo do campo>`
  * Modo 3: Chaves `{conteúdo do campo}`
  * Modo 4: Símbolos repetidos `#####` e tokens longos `@@@@INSTITUTO...; @@@@`
* **Comportamento Esperado:** Ao clicar sobre o placeholder dentro de um campo editável, o texto do placeholder é selecionado instantaneamente sem copiar para o clipboard do sistema.

### 1.2 Bloco 2: Banco de Amostras de Texto e Entidades Forenses
* **Objetivo:** Homologar a seleção com 1 clique único em dados estruturados.
* **Padrões Disponíveis para Clique:**
  * Processos CNJ: `5001234-56.2026.4.04.7000`
  * CPF / CNPJ: `123.456.789-00` e `12.345.678/0001-90`
  * RG com dígito X: `12.345.678-X`
  * Passaporte Brasileiro: `PF099123`
  * Telefones e Contatos: `(41) 99123-4567`, `0800 725 0100`, `+55 (45) 99123-4567`, `@cnj_oficial`
  * Coordenadas GPS: `-25.592600, -54.593536`, `25°35'33.36"S 54°35'36.73"W`, `5867CC44+XH`
  * Chaves e Documentos Fiscais: Chave NF-e de 44 dígitos e Linha de Concessionária de 48 dígitos.

### 1.3 Bloco 3: Tabela Dinâmica e Modo Acumulador
* **Objetivo:** Homologar a seleção de linhas inteiras com 1 clique na borda esquerda do `<tr>` e o acúmulo de intervalos via `Ctrl + Alt` com separador ponto e vírgula (`;`).
* **Comportamento Esperado:**
  * 1 clique na borda esquerda copia a linha inteira formatada.
  * `Ctrl + Alt + Clique` ou `Ctrl + Alt + Arrasto` acumula fragmentos em memória e exibe o MiniTip temporizado com contadores de termos e caracteres.

---

## 2. CENTRAL DE AJUDA E DOCUMENTAÇÃO DA INTERFACE

A Central de Ajuda é estruturada em seções recolhíveis (`<details>`) para uso leigo e rápido:
1. **Atalhos Rápidos de Teclado e Mouse:** Resumo executivo dos gestos essenciais.
2. **Ciclo Circular de 5 Degraus:** Gráfico explicativo da expansão e minorização de seleções.
3. **Filtros HTML em 5 Níveis:** Demonstração dos modos de cópia com ou sem formatação.
4. **Wiki Forense e Alertas Ambar:** Explicação dos cartões contextuais do INSS e mensagens de erro de cálculo de dígitos verificadores.

