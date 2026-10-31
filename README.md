# âš–ï¸ JusGovBR â€” SeleÃ§Ã£o/CÃ³pia Inteligente & PJe Turbo

**JusGovBR (SeleÃ§Ã£o, ValidaÃ§Ã£o e CÃ³pia de Textos Aprimorada)** Ã© uma extensÃ£o de alta performance para navegadores baseados em Chromium (Google Chrome, Microsoft Edge, Brave â€” versÃ£o 116+ / Manifest V3), projetada especificamente para acelerar a rotina de **magistrados, assessores, servidores pÃºblicos, advogados e operadores do Direito** que atuam diariamente em sistemas judiciais e governamentais brasileiros (como **PJe**, **SEI!**, **e-Proc**, **Projudi** e portais `.jus.br` / `.gov.br`), alÃ©m de funcionar em qualquer pÃ¡gina web ou visualizador de PDF.

---

## ðŸŽ¯ Por que este aplicativo existe?

Na rotina forense e administrativa, milhares de cliques e atalhos repetitivos (`Ctrl+C`, `Ctrl+V`, limpeza de formataÃ§Ã£o, conferÃªncia de dÃ­gitos verificadores e espera por telas de bloqueio) consomem horas preciosas de trabalho:

1. **SeleÃ§Ã£o Manual Imprecisa e Lenta:** Selecionar nÃºmeros de processos CNJ, CPFs, CNPJs, datas, valores monetÃ¡rios ou dispositivos legais exige arrastar o mouse com precisÃ£o milimÃ©trica ou dar mÃºltiplos cliques que frequentemente capturam pontuaÃ§Ãµes indesejadas (como vÃ­rgulas e pontos finais) ou quebram em barras e hifens.
2. **Erros Silenciosos de DigitaÃ§Ã£o nos Autos:** PetiÃ§Ãµes e documentos frequentemente contÃªm CPFs, CNPJs, nÃºmeros de processos CNJ ou datas com erros de digitaÃ§Ã£o que passam despercebidos na leitura visual.
3. **PoluiÃ§Ã£o de FormataÃ§Ã£o HTML:** Copiar trechos de acÃ³rdÃ£os, pÃ¡ginas web ou PDFs e colar no editor de minutas traz fontes quebradas, tamanhos despadronizados, espaÃ§amentos duplicados e lixo invisÃ­vel de cÃ³digo.
4. **LentidÃ£o Artificial em Sistemas Judiciais (PJe):** Cortinas modais de bloqueio (*"Aguarde..."*) e cursores travados interrompem o fluxo de trabalho a cada clique na Ã¡rvore de documentos do processo.
5. **Coleta Fragmentada de Dados:** Extrair mÃºltiplos itens de uma pÃ¡gina (vÃ¡rios IDs de documentos, nomes de partes, chaves de notas fiscais ou linhas de tabelas) exige alternar dezenas de vezes entre a janela de leitura e o editor de texto.

O **JusGovBR** resolve todos esses gargalos de forma **silenciosa, instantÃ¢nea e nÃ£o intrusiva**, preservando 100% da navegaÃ§Ã£o nativa em botÃµes, menus e links das aplicaÃ§Ãµes web.

---

## âœ¨ Funcionalidades BÃ¡sicas e Principais Recursos

### 1. ðŸ–±ï¸ SeleÃ§Ã£o e CÃ³pia Inteligente em 1 Clique (Motor Contextual)
Basta clicar sobre a informaÃ§Ã£o em textos de leitura ou PDFs para que ela seja **automaticamente selecionada, higienizada e copiada** para a Ãrea de TransferÃªncia:
* **Reconhecimento AutomÃ¡tico de Entidades Forenses e Fiscais:**
  * **Processos e Protocolos:** NumeraÃ§Ã£o Ãšnica CNJ (`0991234-65.2024.4.01.4002`), processos SEI!, protocolos e referÃªncias de peÃ§as do PJe (`id 2297820154`, `fls. 123/130`).
  * **Documentos e Cadastros:** CPF, CNPJ ClÃ¡ssico, **Novo CNPJ AlfanumÃ©rico**, PIS/PASEP, RG, OAB, CEP, Placas Veiculares (Mercosul e antigas) e Passaportes.
  * **Financeiro e Fiscais:** Valores em Reais (`R$ 1.500,00`, inclusive valores negativos ou com extenso), percentuais, linhas digitÃ¡veis de boletos FEBRABAN, chaves NF-e (44 dÃ­gitos) e chaves PIX / UUID.
  * **Datas, HorÃ¡rios e LegislaÃ§Ã£o:** Datas numÃ©ricas (`28/10/2026`), datas com horÃ¡rio acoplado (`28/10/2026 14:30:00`), datas por extenso, citaÃ§Ãµes de leis, artigos (`art. 5Âº, LXXVIII`) e sÃºmulas.
* **Captura Inteligente por RÃ³tulo:** Clicar diretamente sobre palavras designadoras como `id`, `fls.`, `art.`, `Lei`, `CPF`, `CNPJ` ou `processo` captura automaticamente o rÃ³tulo junto com o nÃºmero subsequente (ex.: clicar em *"id"* copia `id 2297820154`).
* **Regra do "EspaÃ§o = 2 Cliques":** Clicar no espaÃ§o em branco entre palavras de uma expressÃ£o composta (ex.: entre `R$` e `65,00`, entre uma data e um horÃ¡rio, ou dentro de um trecho em **NEGRITO** / **CAIXA ALTA**) seleciona e copia o bloco composto inteiro instantaneamente.
* **Fronteira Limpa de PontuaÃ§Ã£o:** VÃ­rgulas (`,`) e pontos-e-vÃ­rgulas (`;`) nunca colam acidentalmente na palavra clicada.
* **Ciclo de Zoom Contextual (ExpansÃ£o e ReduÃ§Ã£o):** Cliques sucessivos expandem ou reduzem a seleÃ§Ã£o de forma inteligente: *Palavra / Entidade â†’ ExpressÃ£o Composta â†’ Frase â†’ ParÃ¡grafo â†’ Bloco Completo*.

---

### 2. ðŸ›¡ï¸ ValidaÃ§Ã£o MatemÃ¡tica e CalendÃ¡rio em Tempo Real (NÃ£o Bloqueante)
Sempre que um documento ou data Ã© selecionado, o aplicativo audita sua validade instantaneamente nos bastidores:
* **CPF e CNPJ (ClÃ¡ssico e AlfanumÃ©rico):** CÃ¡lculo oficial dos dÃ­gitos verificadores (**MÃ³dulo 11**).
* **Processo Judicial CNJ:** ValidaÃ§Ã£o oficial da numeraÃ§Ã£o Ãºnica do Poder JudiciÃ¡rio (**MÃ³dulo 97 / ISO 7064**).
* **CalendÃ¡rio Gregoriano e HorÃ¡rios:** Verifica anos bissextos (ex.: `29/02/2025` Ã© invÃ¡lido), meses de 30/31 dias e limites de horas/minutos/segundos.
* **CÃ³pia Silenciosa:** Se o dado for vÃ¡lido, **nenhum balÃ£o incÃ´modo de "Copiado!" polui sua tela** (apenas um discreto contorno verde rÃ¡pido confirma a aÃ§Ã£o). Um **alerta visual Ã¢mbar** sÃ³ aparece quando uma inconsistÃªncia matemÃ¡tica ou de data Ã© detectada, avisando do erro sem impedir a cÃ³pia.

---

### 3. âŒ¨ï¸ Atalhos de Alta Produtividade e Modificadores
* **`Shift + Clique` (ExtraÃ§Ã£o Limpa & Zero-Padding CNJ):** Copia nÃºmeros de CPF, CNPJ, CEP, telefones e processos **sem nenhuma pontuaÃ§Ã£o** (apenas dÃ­gitos/letras), preenchendo automaticamente zeros Ã  esquerda no nÃºmero CNJ quando necessÃ¡rio â€” ideal para colar em campos de busca de sistemas que sÃ³ aceitam nÃºmeros.
* **`Ctrl + Alt + Clique` (Modo Acumulador Multi-SeleÃ§Ã£o):** Permite clicar em vÃ¡rios itens espalhados pelo documento para acumulÃ¡-los em uma Ãºnica lista separada por `;` (ex.: `item1;item2;item3;`), com destaque visual na tela, ordenaÃ§Ã£o automÃ¡tica, remoÃ§Ã£o ao clicar novamente e `Ctrl + Alt + Clique Direito` para desfazer o Ãºltimo item.
* **`Alt + Clique` (CÃ³pia de BotÃµes e Links):** Como cliques normais em botÃµes, abas e links preservam 100% a navegaÃ§Ã£o normal do site, basta segurar `Alt` e clicar sobre qualquer botÃ£o, menu ou hiperlink para copiar seu texto sem acionar o clique da pÃ¡gina.
* **`Esc` e `Duplo Esc`:**
  * **`1x Esc`:** Limpa qualquer seleÃ§Ã£o ativa na pÃ¡gina (inclusive dentro de quadros/iframes), esvazia o acumulador e fecha alertas visuais.
  * **`2x Esc` (RÃ¡pido):** Alterna instantaneamente entre o modo **Somente Texto Puro** e o modo **Manter FormataÃ§Ã£o BÃ¡sica/Rica**.
* **`F1` (Envio RÃ¡pido para Assistente de IA):** Ao selecionar um trecho do processo e pressionar `F1`, o texto Ã© inserido no seu modelo personalizado de prompt jurÃ­dico, copiado para a Ã¡rea de transferÃªncia e enviado para anÃ¡lise em assistente de InteligÃªncia Artificial (Painel Lateral ou aba dedicada).
* **Colagem RÃ¡pida via BotÃ£o Direito e NavegaÃ§Ã£o no Mouse:** Suporte opcional para colar textos com o botÃ£o direito do mouse em editores e alternar rapidamente entre abas abertas usando os **BotÃµes Laterais 4 e 5 do mouse**.

---

### 4. ðŸ§¹ Filtro Inteligente de FormataÃ§Ã£o (5 NÃ­veis + Regra de Ouro)
* **HigienizaÃ§Ã£o AutomÃ¡tica de Texto:** Remove espaÃ§os duplicados, linhas em branco excessivas, caracteres invisÃ­veis de PDFs e estilos sujos do Microsoft Word.
* **5 NÃ­veis ConfigurÃ¡veis:** Escolha desde **NÃ­vel 0 (Texto Puro)** atÃ© **NÃ­veis 1 a 4** (preservando apenas negrito/itÃ¡lico/sublinhado, parÃ¡grafos alinhados, tabelas estruturadas ou formataÃ§Ã£o completa para editores de minutas).
* **Regra de Ouro:** Mesmo com a formataÃ§Ã£o ativada para textos longos, clicar em uma **palavra isolada** ou em um **nÃºmero de documento/processo/data** copia sempre em **Texto Puro**, evitando quebrar a fonte da sua minuta ao inserir um CPF ou nÃºmero de processo no meio da frase.

---

### 5. âš¡ MÃ³dulo PJe Turbo & Gerenciamento de Navegador
* **PJe Anti-Ampulhetas:** Neutraliza as cortinas cinzas de bloqueio visual (*"Aguarde..."*) e destrava o cursor do mouse nas pÃ¡ginas do Processo Judicial EletrÃ´nico (`*pje*.jus.br`), permitindo continuar lendo e selecionando textos imediatamente.
* **ConversÃ£o AutomÃ¡tica de CabeÃ§alhos PJe:** Transforma automaticamente referÃªncias brutas copiadas do PJe (como `Num. 2297820154 - PÃ¡g. 1`) no formato forense limpo (`id 2297820154, pg. 1`).
* **Gerenciamento Inteligente de Janelas e Guias:** OpÃ§Ãµes para impedir que sistemas judiciais abram dezenas de janelas pop-up soltas (**Modo Janela Ãšnica / Single Window**), evitar abas duplicadas com a mesma URL e ordenar guias abertas automaticamente.

---

## ðŸš€ Como Instalar no Navegador (Modo Desenvolvedor)

1. Baixe ou clone este repositÃ³rio em uma pasta no seu computador:
   ```bash
   git clone https://github.com/smarca/AddonChrome-GovBR.git
   ```
2. Abra o navegador (Google Chrome, Edge ou Brave) e acesse a pÃ¡gina de extensÃµes:
   * Digite `chrome://extensions/` (ou `edge://extensions/`) na barra de endereÃ§os e pressione **Enter**.
3. No canto superior direito, ative a chave **Modo do desenvolvedor** (*Developer mode*).
4. Clique no botÃ£o **Carregar sem compactaÃ§Ã£o** (*Load unpacked*) no canto superior esquerdo.
5. Selecione a pasta raiz do projeto (`AddonChrome-GovBR`, onde estÃ¡ localizado o arquivo `manifest.json`).
6. Pronto! O Ã­cone da extensÃ£o aparecerÃ¡ na barra do navegador. Clique nele para controle rÃ¡pido ou acesse as **OpÃ§Ãµes** para personalizar os recursos, consultar a **Central de Ajuda** detalhada e testar todas as funcionalidades no **LaboratÃ³rio Interativo**.

---

## ðŸ“ Estrutura BÃ¡sica do Projeto

```text
AddonChrome-GovBR/
â”œâ”€â”€ manifest.json                 # Manifesto Oficial Chrome Extension (Manifest V3 - Chromium 116+)
â”œâ”€â”€ README.md                     # DocumentaÃ§Ã£o de apresentaÃ§Ã£o para o GitHub
â”œâ”€â”€ docs/                         # DocumentaÃ§Ã£o tÃ©cnica, arquitetura e regras de negÃ³cio (Blueprints)
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ cfg/                      # NÃºcleo de configuraÃ§Ã£o, Service Worker (background.js), Popup, OpÃ§Ãµes e Suite de Testes (debug.js)
â”‚   â”œâ”€â”€ ico/                      # Ãcones oficiais da extensÃ£o
â”‚   â”œâ”€â”€ mod-copia/                # MÃ³dulo 1: Motor de SeleÃ§Ã£o/CÃ³pia Inteligente, PadrÃµes Forenses, Acumulador e Validador MatemÃ¡tico
â”‚   â””â”€â”€ mod-pje/                  # MÃ³dulo 2: Acelerador PJe Turbo (CSS Anti-Ampulhetas)
â””â”€â”€ util/                         # Scripts utilitÃ¡rios de manutenÃ§Ã£o e backup
```

---

## ðŸ“§ Autor e Contato

* **Projeto:** JusGovBR â€” SeleÃ§Ã£o/CÃ³pia Inteligente & PJe Turbo
* **Autor / Contato:** `smarca@gmail.com`

