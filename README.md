LogiTrack — Dashboard de Monitoramento Logístico

**Status do Projeto:** Concluído · Desenvolvido para o Desafio dos Dados (Etapa 1 — Fase 3: Armazenamento, Manipulação e Transformação de Dados)

O **LogiTrack** é uma solução inteligente de *Business Intelligence* (BI) e monitoramento operacional em formato de aplicação web. Ele foi projetado especificamente para transformar dados brutos de entregas em insights visuais acionáveis, auxiliando a diretoria e os gestores logísticos a identificarem gargalos de distribuição e tomarem decisões rápidas e assertivas.

Principais Qualidades e Diferenciais do Projeto

**Inteligência de Negócio Automatizada (Insights Proativos):** O sistema não se limita a mostrar tabelas; ele analisa o universo de dados e gera diagnósticos automáticos em texto, apontando a pior transportadora, a região mais crítica e o nível de severidade geral da operação.
**Mapeamento Inteligente de Cabeçalhos (Foco em UX):** Graças ao motor flexível do `importer.js`, o usuário pode subir arquivos CSV ou Excel com colunas em qualquer ordem ou com nomes variados (ex: "ID", "Código", "Pedido", "Prazo", "Dias"). O sistema reconhece os sinônimos e normaliza os dados de forma totalmente invisível.
**Performance Pura e Leveza (Vanilla Tech Stack):** Construído sem a necessidade de frameworks pesados ou servidores complexos — utiliza apenas HTML5, CSS3 e JavaScript nativo (ES6). O carregamento é instantâneo e o consumo de hardware é mínimo.
**Resiliência com Persistência de Dados:** Integração nativa com o `localStorage` do navegador. Os dados importados pelo usuário ficam salvos no dispositivo de forma segura, mantendo o dashboard preenchido mesmo se a página for fechada ou atualizada.
**Análise Visual Fluida e Elegante:** Gráficos interativos criados com *Chart.js* adaptados com uma paleta de cores corporativa sofisticada (focada em tons suaves de verde, âmbar e vermelho para riscos) e tooltips customizados para auditoria rápida.

Funcionalidades Implementadas

**Tratamento e Classificação Automática:** Separação imediata das entregas entre *"No prazo"*, *"Atrasada"* (até 3 dias) e *"Crítica"* (atrasos superiores a 3 dias).
**Filtros Combinados Dinâmicos:** Filtragem em tempo real por Região, Transportadora e Status sem necessidade de recarregar a tela.
**Ordenação Multicritério:** Clique nos cabeçalhos da tabela para ordenar os registros por qualquer critério (ID, transportadora, prazo, atraso, etc.).
**Paginação Inteligente:** Divisão automática de **10 em 10 itens por página**, garantindo que o layout permaneça limpo, legível e organizado mesmo se uma planilha com milhares de linhas for importada.
**Tratamento de Estado Vazio (Zero Data State):** Caso o sistema inicie sem nenhuma informação salva, uma interface amigável e centralizada é exibida, orientando o usuário passo a passo sobre como alimentar o sistema.

Estrutura de Arquivos

`index.html`: Estrutura semântica da aplicação e marcações de layout.
`style.css`: Identidade visual moderna, variáveis CSS, tipografia refinada (*Inter* e *Space Grotesk*) e total responsividade para dispositivos móveis.
`data.js`: Banco de dados inicial embutido para que o painel funcione de imediato ao ser aberto.
`script.js`: O "cérebro" do projeto (Cálculos de KPIs, lógica de paginação, ordenação, renderização de gráficos e persistência local).
`importer.js`: Motor de importação que faz a leitura e a tradução de arquivos externos (CSV, XLS, XLSX).

Lógica e Regras de Negócio (Resolução da Questão AMT01)

I. Identificação de Atrasos
Os atrasos são identificados de forma automática mapeando e comparando o tempo real de trânsito de cada pacote contra a meta de dias acordada com o cliente. Sempre que a diferença é positiva, o sistema isola o registro para compor os indicadores de risco.

II. Lógica dos Cálculos Operacionais
Os cálculos seguem regras matemáticas padronizadas aplicadas programmaticamente sobre cada entrega:
**Atraso Individual (em dias):** Calculado de maneira direta pela fórmula:
  $$\text{Atraso} = \text{Dias Reais} - \text{Prazo Dias}$$
**Classificação de Status por Severidade:** * Se $\text{Atraso} \le 0 \rightarrow$ **"No prazo"** (Sinalização Verde)
  * Se $0 < \text{Atraso} \le 3 \rightarrow$ **"Atrasada"** (Sinalização Âmbar)
  * Se $\text{Atraso} > 3 \rightarrow$ **"Crítica"** (Sinalização Vermelha)
**Indicadores Consolidados (KPIs):** O JavaScript realiza funções de agregação (*reduce* e *filter*) no vetor de dados para computar em tempo real o *Total de Entregas*, *Percentual de Atraso (%)* e a severidade das *Entregas Críticas*.

III. Critérios de Organização e Priorização das Informações
O grupo aplicou os **Princípios de Design de Dados e Usabilidade** com foco em tomada de decisão rápida (*"bater o olho e agir"*):
1. **Hierarquia Macro para o Micro:** Os KPIs globais ficam posicionados logo no topo da página.
2. **Priorização Crítica no Ranking:** O ranking de transportadoras é propositalmente ordenado do **pior desempenho para o melhor**, garantindo que os gargalos mais graves fiquem expostos no topo para atuação imediata dos gestores.
3. **Sinalização Visual Condicional:** Uso de badges coloridas e alertas textuais na tabela detalhada para guiar os olhos do operador até os problemas que necessitam de auditoria urgente.

Como Executar o Projeto

Como o projeto preza pela simplicidade de infraestrutura, você não precisa instalar nenhuma dependência ou rodar comandos no terminal:

1. Faça o download ou clone este repositório.
2. Abra o arquivo `index.html` diretamente em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
3. *(Opcional)* Utilize o botão **"Importar CSV / XLS"** no canto superior direito e selecione o arquivo `exemplo_entregas.csv` incluso para testar o motor de importação em tempo real.
