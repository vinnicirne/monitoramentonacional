# Painel de Monitoramento Territorial - Rio de Janeiro (GIS & Governança Policial)

Sistema de Inteligência Geográfica (GIS) e Governança Policial para monitoramento, análise de circunscrições e dinâmicas de segurança pública no Estado do Rio de Janeiro.

## 🗺️ Funcionalidades

- **Mapeamento Territorial Completo**:
  - **137 CISPs** (Circunscrições Integradas de Segurança Pública / Delegacias da PCERJ) com polígonos oficiais homologados.
  - **41 AISPs** (Áreas Integradas de Segurança Pública / Batalhões da PMERJ).
  - **7 RISPs** (Regiões Integradas de Segurança Pública / Comandos Regionais de Policiamento de Área).
  - Sedes de Delegacias com numeração oficial destacada nos marcadores (ex: `14ª DP`, `52ª DP`, `58ª DP`).
  - Sedes de Batalhões de Polícia Militar.

- **Mapa das Facções & Dinâmicas Bélicas**:
  - 🔴 **Comando Vermelho (CV)**: Vermelho vibrante.
  - 🔵 **Terceiro Comando Puro (TCP)**: Azul royal vibrante.
  - 🟣 **Milícia Paramilitar**: Violeta/Roxo vibrante.
  - 🟠 **Áreas em Disputa Bélica**: Laranja intenso (*ex: Praça Seca, Gardênia Azul, CV x TCP*).
  - 🟢 **Controle Institucional**: Verde esmeralda.
  - Barra de seleção rápida com filtro instantâneo por facção.
  - Mapeamento de focos especiais (*Complexo da Maré, Alemão/Penha, Complexo de Israel, Muzema, Praça Seca, Salgueiro*).

- **Dossiê Territorial Interativo**:
  - Estrutura de subordinação (PCERJ, PMERJ, RISP, CPA).
  - Lista completa de **Bairros e Localidades Atendidos** por cada circunscrição.
  - Séries históricas oficiais do **ISP-RJ (2020 a 2025)**: Letalidade Violenta, Roubos de Rua, Roubos de Veículo, Apreensão de Fuzis e Armas.
  - Comparativo com benchmarks regionais e estaduais.
  - Emissão de Dossiê Técnico Oficial em PDF / Impressão.

- **Módulos Adicionais**:
  - **Auditoria de Inconsistências**: Mapeamento de municípios compartilhados por múltiplas delegacias e divergências de marcos legais (*SESP 310/2000 vs SESEG 151/2008*).
  - **Rankings Estatísticos**: Classificação de criminalidade e apreensões por CISP/AISP.
  - **Importador de Dados**: Cruzamento de planilhas CSV/Excel externas com o registro territorial.

## 🛠️ Tecnologias

- **React 19 & TypeScript**
- **Vite**
- **OpenLayers v9.2.4**
- **Tailwind CSS v4**
- **Recharts**
- **Lucide Icons**
- **SheetJS (XLSX) & PapaParse**

## 🚀 Como Executar

```bash
# Entrar no diretório frontend
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build
```

Acesse em `http://localhost:5173/`.
