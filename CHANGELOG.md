# Registro de Atualizações — Painel de Monitoramento Territorial

> **Titularidade & Propriedade:** Agência Ícone Digital by Vinicius Cirne  
> **Licença Registrada:** `AID-VC-GIS-2026-BR-RJ` • Todos os direitos reservados.  
> **Instrução contínua:** A cada nova atualização aplicada ao sistema, acrescentar uma nova seção cronológica no topo deste arquivo preservando o histórico anterior.

---

## [17/11/2026] — Correção Crítica de Ocorrências: Sincronização de Domínio, Renderização em Tempo Real e Ajustes Visuais

### 13. Correção de Cadastro e Exibição de Ocorrências Corporativas (Painel e Mapa de Calor)
- **Diagnóstico e Resolução do Problema ("cadastra, mas não aparece")**:
  - **Sincronização Dinâmica de Domínio Corporativo (`effectiveCompanyDomain`)**: Identificado que administradores logados com provedores públicos de e-mail (ex: `@gmail.com`) tinham seu `domain` resolvido como `gmail.com`. Como as ocorrências corporativas pertencem à empresa cadastrada (ex: `@mercadolivre.com`), as consultas no mapa e no painel procuravam em subcoleções divergentes. Implementado seletor e sincronização automática entre o domínio ativo da empresa e o ouvinte do mapa e do modal.
  - **Eliminação de Dependência de Composite Index (`orderBy`)**: As consultas em `App.tsx` e `CompanyAdminView.tsx` utilizavam `orderBy('createdAt', 'desc')`. No Cloud Firestore, se a consulta for executada antes da indexação completa ou durante compensação de latência de `serverTimestamp()`, a subscrição falhava silenciosamente e limpava a lista (`setCompanyIncidents([])`). A ordenação decrescente foi migrada para processamento seguro em memória (`toMillis()`).
  - **Garantia de Coordenadas Geográficas e Fallback**: No formulário de cadastro do painel da empresa, caso o centróide da CISP ou delegacia não estivesse carregado no momento do salvamento, `lat` e `lng` eram omitidos do documento. Adicionado fallback geográfico automático baseado na UF (RJ, MG, ES) para que nenhuma ocorrência seja salva sem coordenadas válidas.
  - **Leitura Defensiva de Coordenadas no OpenLayers (`MapContainer.tsx`)**: O loop de sincronização do OpenLayers checava estritamente `typeof inc.lat === 'number'`. Foi implementado parsing com `parseFloat(String(inc.lat).replace(',', '.'))` para aceitar coordenadas numéricas ou textuais, assegurando que os pinos e o mapa de calor renderizem imediatamente todas as ocorrências.
  - **Prevenção de `TypeError` na Busca do Painel Corporativo**: Adicionada proteção com coalescência nula `(inc.notes || '').toLowerCase()` nos campos de busca e filtros, evitando que registros com observações ou B.O. em branco quebrem a lista.

### 14. Refinamentos de Layout e Navegação Solicitados
- **Menus Fechados por Padrão**: As quatro categorias do `NavigationDrawer.tsx` iniciam recolhidas por padrão, expandindo apenas mediante clique voluntário do operador.
- **Cabeçalho Otimizado**: Removido o botão horizontal "Menu & Módulos", removido o badge "RJ · MG · ES" do lado da logo, e organizada a logo com "MONITORAMENTO" na linha superior e "Territorial" na linha inferior para máxima economia de espaço vertical.
- **Assinatura da Agência no Rodapé**: Removida a referência da agência abaixo da logo no topo, centralizando a autoria legal ("Agência Ícone Digital by Vinicius Cirne") de forma limpa e institucional exclusivamente no rodapé.

---

## [17/11/2026] — Reorganização da Navegação: Menu Lateral Estruturado em Menus e Submenus por Assuntos Relacionados

### 12. Menu Lateral Temático com Categorização Estrita (Sem Misturar Assuntos)
- **Estruturação Temática de Menus e Submenus**:
  - Atendimento à solicitação de isolamento e agrupamento por afinidade das opções **SIG Mg e Es**, **Estatística**, **Auditoria**, **Importar** e **Metodologia**, eliminando a poluição visual do cabeçalho superior e organizando a navegação em quatro núcleos temáticos distintos:
    1. **Cartografia & Território**:
       - *Submenu: Mapa Geral Interativo* — OpenLayers, 1.695 áreas de risco, manchas criminais e CISPs/DPs.
       - *Submenu: Base SIG MG e ES* — Divisão territorial integrada e catálogo de 209 unidades policiais de Minas Gerais e Espírito Santo.
    2. **Inteligência & Análise Criminal**:
       - *Submenu: Estatísticas & Rankings ISP-RJ* — Séries temporais (2020–2025), letalidade violenta, roubos de carga e rankings oficiais.
       - *Submenu: Auditoria Territorial* — Diagnóstico de inconsistências cadastrais, sobreposições de limites de DPs e validação territorial.
    3. **Governança & Gestão de Dados**:
       - *Submenu: Importar Planilhas & GeoJSON* — Upload de planilhas CSV/XLSX, tabelas SIG e geometrias georreferenciadas.
       - *Submenu: Metodologia Científica & Fontes* — Normas técnicas, fontes oficiais (ISP, PMERJ, PCERJ, IBGE) e critérios de cálculo.
    4. **Segurança Corporativa & Gestão**:
       - *Submenu: Criar Conta Corporativa* — Acesso institucional para transportadoras, logística e segurança patrimonial.
       - *Submenu: Painel da Empresa* — Histórico confidencial de ocorrências, mapa de calor dinâmico exclusivo e gestão de licenças.
       - *Submenu: Painel Administrativo Geral (ADM)* — Controle de licenças globais, aprovação de contas e auditoria de acessos.
- **Novo Componente `NavigationDrawer.tsx`**:
  - Drawer lateral deslizante e retrátil com backdrop blur, atalho de teclado `Esc`, seletor rápido de foco territorial (Todos / RJ / MG / ES / MG+ES), grupos colapsáveis e indicadores visuais de módulo ativo.
  - Bloco de rodapé integrado exibindo credenciais da sessão ativa (status de aprovação e botão de saída) e certificação de Titularidade e Licença (`AID-VC-GIS-2026-BR-RJ`).
- **Limpeza do Cabeçalho Superior (`Header.tsx`)**:
  - Removida a barra horizontal de botões dispersos.
  - Implementado o botão principal de abertura do menu lateral **"☰ Menu & Módulos"** com badge da aba ativa e atalho contextual de 1 clique para **"Voltar ao Mapa"** quando em outras visualizações.
- **Acesso Integrado no Trilho do Mapa e Mobile**:
  - Adicionado botão de atalho direto no topo da barra lateral esquerda do mapa (`LeftSidebar.tsx`).
  - Integrado o botão "Menu" da barra inferior mobile diretamente ao novo Drawer unificado.

---

## [17/11/2026] — Correção de Reconciliação DOM (insertBefore) & Suporte a Domínios Autorizados no Firebase

### 11. Correção de Erro de Execução no DOM & Tratamento de Domínio no Firebase Auth
- **Eliminação Definitiva do Erro `Failed to execute 'insertBefore' on 'node'`**:
  - Identificada a causa raiz: a camada de Overlay do OpenLayers retirava fisicamente o elemento DOM do popup da árvore do React, fazendo o reconciliador virtual do React falhar ao atualizar estados e re-renderizar nós filhos.
  - Implementado desacoplamento completo através de **React Portal (`createPortal`)** em `MapContainer.tsx` e `TerritorialMap.tsx`, garantindo renderização isolada que impede descompassos na árvore DOM.
  - Adicionadas diretivas `notranslate` em `index.html` para impedir que o tradutor automático do navegador corrompa nós de texto do React.
- **Tratamento Amigável e Solução para `auth/unauthorized-domain`**:
  - Mapeado o erro de domínio do Firebase no `AuthContext.tsx` com orientações exatas sobre como autorizar os domínios (`localhost` e URLs da Vercel) no Console do Firebase (**Authentication > Settings > Authorized domains**).
  - Adicionado botão de 1 clique no `AuthGateModal.tsx` para copiar o domínio atual (`window.location.hostname`) e colar diretamente no Firebase Console.
  - Destaque para o acesso imediato através de **E-mail e Senha**, que não depende de domínios autorizados e funciona em qualquer ambiente local ou de produção.
- **Suporte a Variáveis de Ambiente no Deploy da Vercel**:
  - `firebase.ts` atualizado para ler `VITE_FIREBASE_*` prioritariamente, permitindo alternar projetos Firebase na Vercel com fallback seguro para a configuração local.

---

## [17/11/2026] — Sistema de Ocorrências Corporativas, Histórico em Linha do Tempo e Mapa de Calor Confidencial

### 10. Registro de Ocorrências, Histórico Cronológico e Mapa de Calor Dinâmico Exclusivo por Empresa
- **Registro de Ocorrências com Georreferenciamento Preciso**:
  - Modal especializado (`CorporateIncidentModal.tsx`) para registro e edição de ocorrências da empresa (`Roubo de Carga`, `Roubo / Assalto`, `Furto`, `Extravio`, `Fraude`, `Apreensão Policial`, `Outros`).
  - Busca e geocodificação automática de endereços (`searchAddressesFree`), captura instantânea de coordenadas via GPS atual (`navigator.geolocation`), e coordenadas herdadas automaticamente da circunscrição da Delegacia policial vinculada (CISP RJ e Delegacias Territoriais MG/ES).
- **Linha do Tempo e Histórico Cronológico de Andamentos**:
  - Cada ocorrência gera automaticamente uma linha do tempo (`history`) com autor, data/hora, status de custódia e descrição.
  - Sub-aba dedicada **Histórico & Andamentos** no modal permite aos membros da equipe corporativa registrar novos andamentos operacionais (ex: registro de B.O., acionamento de seguradora, perícia concluída, mercadoria liberada na DP).
- **Mapa de Calor Dinâmico Confidencial (`ol/layer/Heatmap`)**:
  - Integração da camada nativa de mapa de calor do OpenLayers com recalculo dinâmico em tempo real a cada ocorrência criada ou editada.
  - Ponderação térmica diferenciada: ocorrências de `roubo_carga` e `roubo` recebem peso térmico ampliado (1.0) para gerar mancha de calor proeminente nas áreas com maior incidência criminosa.
  - Camada de pins e marcadores interativos com tooltips informativos exibindo código do rastreio, B.O., tipo de crime, delegacia e clique direto para abrir o histórico completo.
- **Privacidade e Isolamento Estrito Multi-Tenant**:
  - Ocorrências e mapas de calor pertencem estritamente à empresa ativa (`companyDomain`).
  - Usuários de outras empresas ou visitantes públicos **NÃO possuem acesso** aos dados ou à visualização das manchas de calor corporativas.
  - Regras de segurança no Firestore (`firestore.rules`) atualizadas com o helper `isCompanyMember(domain)` garantindo que apenas membros aprovados da mesma empresa ou administradores do sistema possam ler, listar, criar ou atualizar registros em `/corporate_companies/{domain}/incidents/{id}`.
- **Integração no Painel da Empresa & Barra Lateral**:
  - **CompanyAdminView.tsx**: Banner com aviso de privacidade corporativa, botão rápido "Registrar Nova Ocorrência", card KPI de "Roubos & Furtos (Mapa de Calor)", filtro rápido por roubos e botões de 1 clique "Ver no Mapa" e "Histórico" em cada item da listagem.
  - **LeftSidebar.tsx**: Switches dedicados na gaveta de camadas para "Mapa de Calor da Empresa" e "Pontos de Ocorrências", com contadores em tempo real.
  - **MapContainer.tsx**: Botão de ação flutuante sobre o mapa permitindo cadastrar ocorrências diretamente a partir da visualização geográfica.

---

## [17/11/2026] — Módulo Integrado de Cadastro e Gestão de Empresas no Painel ADM da Empresa

### 9. Opção Completa de Cadastro de Empresa Dentro do Painel ADM da Empresa (`CompanyAdminView.tsx`)
- **Nova Sub-Aba Nativa "Cadastro & Gestão da Empresa"**:
  - Implementada uma terceira sub-aba dedicada (`company_info`) dentro do **Painel Empresa**, acessível diretamente na barra de navegação superior do módulo ao lado de *Usuários & Licenças* e *Extravios, Fraudes & Ocorrências em DPs*.
- **Formulário de Cadastro de Nova Empresa**:
  - Permite criar uma nova empresa corporativa diretamente de dentro do painel ADM, preenchendo Razão Social, Domínio Corporativo (`@empresa.com.br`), Plano, Quantidade de Assentos e Preço Unitário por Licença.
  - Normalização automática de domínios e validação de formato rigorosa compatível com as regras de segurança do Firestore.
- **Visualização e Edição da Empresa Ativa**:
  - Painel de edição em tempo real dos parâmetros da empresa ativa (`@activeDomain`): Razão Social, plano contratado, quantidade de licenças contratadas, valor por licença, aprovação automática de colaboradores e toggle de status (Ativa/Inativa).
- **Multi-Empresas & Troca Rápida de Organização**:
  - Grid de empresas cadastradas no sistema com métricas de assentos, valor unitário, status de ativação e botão de 1 clique para selecionar e gerenciar qualquer empresa corporativa.
- **Acolhimento Automático no Primeiro Acesso**:
  - Quando nenhuma empresa estiver cadastrada ou selecionada, o painel exibe de imediato o formulário interativo de cadastro corporativo centralizado, eliminando telas vazias ou dependência de modais externos.
- **Governança & Regras de Segurança (`firestore.rules`)**:
  - Permissão de atualização de dados de empresas corporativas concedida tanto a Administradores Gerais quanto a Administradores da Empresa (`isCompanyAdmin(domainId)`).

---

## [17/11/2026] — Atualização de Titularidade, Licenciamento & Cadastro de Empresas

### 8. Opção de Cadastro de Empresa & Acesso Corporativo Unificado
- **Novo Modal de Cadastro de Empresa (`CompanyRegisterModal.tsx`)**:
  - Interface moderna para cadastrar empresas corporativas (`@empresa.com` / `@dominio.com.br`), vinculando Razão Social, domínio sem prefixos, plano corporativo, valor unitário da licença e total de assentos contratados.
  - Suporte à ativação da **Liberação Automática de Colaboradores**, permitindo que membros da equipe com e-mail do domínio corporativo recebam licença nominal instantaneamente no primeiro login.
  - Ação integrada: após o cadastro bem-sucedido, permite navegar diretamente para o **Painel Empresa** recém-criado.
- **Acesso Ubíquo no Sistema**:
  - **Cabeçalho Principal (`Header.tsx`)**: Botão **Cadastrar Empresa** em destaque com ícone institucional em telas desktop e mobile.
  - **Modal de Autenticação (`AuthGateModal.tsx`)**: Opção direta **Cadastrar Empresa (@empresa.com)** na tela de login/cadastro para equipes e gestores.
  - **Painel Empresa (`CompanyAdminView.tsx`)**: Botões **+ Cadastrar Empresa** no topo do painel e no estado de boas-vindas para empresas não cadastradas.
  - **Painel ADM (`AdminDashboardView.tsx`)**: Botão de ação rápida **+ Cadastrar Empresa** integrado à barra executiva.
  - **Menu Mobile**: Atalho dedicado no menu inferior expansível ("Mais").


### 7. Titularidade Oficial, Rodapé & Licença Vinculada (Agência Ícone Digital by Vinicius Cirne)
- **Atribuição Oficial do Sistema**: Sistema devidamente registrado e personalizado em nome de **Agência Ícone Digital by Vinicius Cirne**.
- **Rodapé Institucional Responsivo**: Incorporado rodapé de governança com identificação de direitos autorais, status de licença homologada, botão de verificação e canal oficial de WhatsApp (+55 21 97497-6130).
- **Licença de Uso Vinculada (AID-VC-GIS-2026-BR-RJ)**:
  - Criação do documento formal de licença de propriedade intelectual (`LICENSE.md`), fundamentado na Lei Federal nº 9.609/1998 (Software) e Lei Federal nº 9.610/1998 (Direitos Autorais).
  - Modal interativo (`LicenseModal.tsx`) para consulta e cópia instantânea da chave de homologação.
  - Cartão de governança tecnológica incorporado na aba **Metodologia & Fontes**.
  - Chancela oficial de licenciamento em todos os Dossiês Técnicos impressos e relatórios em PDF.

---

## [17/11/2026]

### 6. Cadastro de Pacotes Extraviados / Fraudes & Ocorrências Policiais em Delegacias
- **Sub-aba Exclusiva no Painel Corporativo**: Adicionada a aba **Extravios, Fraudes & Ocorrências em DPs** dentro do **Painel Empresa** para acompanhamento jurídico-operacional por empresa (`@empresa.com`).
- **Seleção Integrada de Delegacias (RJ · MG · ES)**: O formulário de cadastro carrega todas as DPs/CISPs do Rio de Janeiro e delegacias de Minas Gerais e Espírito Santo com filtro rápido por UF e busca por nome ou município.
- **Controle de Custódia & Ocorrência Policial**:
  - Campos para código do pacote/rastreio, tipo de ocorrência (`Extravio`, `Fraude`, `Roubo de Carga`, `Apreensão Policial`, `Outros`), número do B.O., valor estimado (R$) e observações.
  - Marcação explícita **"Pacote está na delegacia em ocorrência policial"** e atualização em 1 clique do status de custódia (`Em ocorrência na DP`, `Aguardando perícia`, `Liberado p/ retirada`, `Devolvido à empresa`, `Não localizado`).
- **Painel de Métricas e Filtros**: Totalizadores em tempo real de ocorrências, quantidade de pacotes retidos em delegacias, volumes liberados/devolvidos e valor total envolvido, com busca e filtros rápidos.
- **Persistência & Segurança**: Adicionada a subcoleção `/corporate_companies/{domainId}/incidents/{incidentId}` ao schema e às regras do Firestore com validação e acesso restrito ao **ADM da Empresa** e **ADM Geral**.

### 5. Painel de Controle de Usuários & Licenças para ADM da Empresa (`Painel Empresa`)
- **Painel Simples para ADM Corporativo**: Criado o módulo **Painel Empresa** (botão direto no cabeçalho, no menu mobile e na tela Minha Conta para administradores da empresa e administradores gerais).
- **Adicionar Usuário e Vincular Licença**:
  - Permite cadastrar colaboradores com e-mail `@empresa.com` (com sufixo fixo do domínio da empresa), atribuir o perfil (`Colaborador` ou `ADM da Empresa`) e gerar automaticamente uma licença individual vinculada mesmo antes do primeiro login.
  - Quando o colaborador acessa o sistema com o e-mail corporativo verificado, a licença pré-vinculada é ativada automaticamente, respeitando o limite de assentos contratados.
  - Ações simples de **Suspender / Reativar licença**, **Tornar / Remover ADM da Empresa**, cópia rápida do link de acesso da equipe e indicador de faturamento mensal.
- **Gestão Centralizada no Painel ADM**: A aba **Empresas & Licenças** ganhou o atalho **Abrir Painel Corporativo** por empresa e botão direto para promover ou remover colaboradores como **ADM da Empresa**.

### 4. Plano Corporativo com Licença por Usuário (`@empresa.com`)
- **Modelo de Plano por Licença (`per_user`)**: Adicionado suporte a planos cobrados por licença individual de usuário/mês, além dos planos mensais fixos, com criação e edição direta na aba **Planos** do Painel ADM (incluindo o plano padrão `Corporativo Por Licença`).
- **Gestão de Empresas & Licenças (`@empresa.com`)**: Criada a aba **Empresas & Licenças** no Painel ADM para cadastrar e editar empresas por domínio (`@empresa.com`), definir o valor por licença, controlar assentos contratados e acompanhar o faturamento mensal automático (`usuários com licença ativa × valor unitário`).
- **Emissão e Controle Individual de Licenças**:
  - Usuários com e-mail verificado de empresa corporativa ativa recebem automaticamente uma licença nominal (`LIC-EMPRESA-XXXXXX`) vinculada ao domínio da empresa e acesso liberado no plano corporativo.
  - Ações rápidas de **Atribuir Licença** e **Suspender Licença** disponíveis tanto por empresa quanto na tabela geral de **Usuários**.
  - Exibição do cartão de **Licença Corporativa Ativa** (empresa + código da licença) na tela **Minha Conta**.
- **Regras de Segurança e Validação**: Atualizadas e publicadas as regras de segurança do Firestore para a coleção `corporate_companies` e campos de licença nos perfis de usuários e planos.

### 3. Correções de Autenticação, Estabilidade e Acesso ADM
- **Prevenção de Tela Travada**: Adicionados limites de tempo (`withTimeout`) nas chamadas de login, cadastro, redefinição de senha e sincronização de perfil, além de fallback no transporte do Firestore (`experimentalAutoDetectLongPolling`) e tela de recuperação caso o perfil demore a sincronizar.
- **Tratamento Claro de Credenciais**: Melhoradas as mensagens em português para erros de credencial (`auth/invalid-credential`) e conta existente (`auth/email-already-in-use`), com botões rápidos no modal para alternar para **Acessar** ou **Definir / Esqueci a senha** (útil quando o e-mail foi usado anteriormente com Google).
- **Layout Responsivo do Modal e Botão ADM**: Ajustado o modal de autenticação com rolagem interna (`max-h-[92dvh]`) para não cortar o cabeçalho nem os botões em telas menores, mantido o botão **ADM** visível no cabeçalho em qualquer largura de tela e adicionado o atalho **Abrir Painel ADM** na conta do administrador.

### 2. Tela de Login Convencional e Controle de Acessos
- **Autenticação Completa**: Implementada tela convencional com abas **Acessar** e **Criar Conta**, suporte a **E-mail e Senha**, **Esqueci a senha**, botão **visualizar/ocultar senha**, campo opcional de **Código de Indicação** (`?ref=`) e botão **Entrar / Criar Conta com Google**.
- **Fluxo de Verificação e Liberação**:
  - Contas `@mercadolivre.com` verificadas e usuários indicados por elas recebem liberação imediata.
  - Contas externas (`@gmail.com`, `@outlook.com`, etc.) sem indicação direta ficam pendentes para aprovação rápida no Painel ADM.
  - Fluxo de confirmação de e-mail integrado com botões **Já confirmei** e **Reenviar e-mail**.

### 1. Banco de Dados Isolado & Acesso Administrativo
- **Banco de Dados Dedicado**: Configurado e provisionado o Cloud Firestore dedicado (`ai-studio-paineldemonitora-274ba797-8ae9-4b0a-a13c-fe819cbfd018`), totalmente isolado de outras aplicações.
- **Administradores Principais**: Liberado acesso administrativo total ao sistema (após verificação do e-mail no login) para:
  - `adm.desbloqueio@gmail.com`
  - `viniciuscirne@gmail.com`
  - `agenciaiconedigital@gmail.com`
  - `vinnicirne@gmail.com`
- **Painel ADM Completo**: Implementado painel executivo com cartões de métricas e sub-abas de **Resumo & Acessos**, **Usuários**, **Planos**, **Domínios Free** e **Indicações**.
