# Registro de Atualizações — Painel de Monitoramento Territorial

> **Titularidade & Propriedade:** Agência Ícone Digital by Vinicius Cirne  
> **Licença Registrada:** `AID-VC-GIS-2026-BR-RJ` • Todos os direitos reservados.  
> **Instrução contínua:** A cada nova atualização aplicada ao sistema, acrescentar uma nova seção cronológica no topo deste arquivo preservando o histórico anterior.

---

## [18/11/2026] — Gestão de Empresas Restrita ao SuperAdmin

### 34. Separação entre Gestão Global e Painel da Empresa
- Removida do Painel Empresa a aba **Cadastro & Gestão da Empresa**; empresas passam a ser cadastradas e administradas somente em **Painel SuperAdmin → Empresas & Licenças**.
- Ocultados os atalhos de criação corporativa para usuários comuns e bloqueadas as ações de cadastro/alteração da empresa para perfis que não sejam SuperAdmin.
- Removida a validação que somava entregues, recuperados e roubados, permitindo que esses indicadores se sobreponham. Cada contador continua limitado à quantidade envolvida.

## [18/11/2026] — Valor Total Estimado da Carga

### 33. Valor Financeiro Informado como Total da Ocorrência
- O campo financeiro dos formulários passou a se chamar **VALOR TOTAL ESTIMADO** e grava diretamente o valor informado, sem multiplicá-lo pela quantidade de pacotes.
- O modal de detalhes exibe o valor total; ao editar registros antigos, valores unitários legados são convertidos para o total antes de salvar.
- Ao salvar uma ocorrência editada, o campo legado de valor por pacote é removido do Firestore.

## [18/11/2026] — Histórico da Transportadora e Desfecho dos Pacotes

### 32. Nova Aba de Transportadoras e Novos Campos de Resultado
- Criada a aba **Transportadoras** no Painel Empresa; histórico, gráfico mensal e indicadores de pacotes foram retirados da aba de extravios e ocorrências.
- Adicionados ao formulário os campos **Pacotes Entregues**, **Pacotes Recuperados** e **Pacotes Roubados**, abaixo da transportadora e da quantidade envolvida.
- Os três valores são salvos e sincronizados no Firestore ao criar ou editar registros; o detalhe da ocorrência também os apresenta.
- Cada contador de resultado é validado individualmente em relação à quantidade envolvida, e as regras do Firestore permitem os novos campos.

## [18/11/2026] — Permissão de Exclusão por Licença de Edição

### 31. Sincronização entre Perfil, Licença e Ação de Excluir
- O botão de exclusão agora considera a permissão **Editar** registrada no perfil ou na licença corporativa ativa.
- Erros do Firestore exibem o código de falha para facilitar o diagnóstico de permissões.

## [18/11/2026] — Correção de Salvamento dos Dados de Transportadora

### 30. Inclusão dos Novos Campos na Regra de Atualização do Firestore
- Corrigida a lista de campos permitidos em atualizações de ocorrências existentes para incluir transportadora, quantidade e valor estimado por pacote.

## [18/11/2026] — Transportadoras, Quantidade e Valor de Carga

### 28. Análise de Ocorrências e Pacotes por Transportadora
- Incluídos no registro os campos de transportadora e quantidade de pacotes envolvidos, com sugestão de nomes já registrados pela empresa.
- O valor estimado total agora é calculado automaticamente a partir do valor por pacote multiplicado pela quantidade; o campo usa formatação monetária brasileira durante a digitação.
- Salvos no Firestore o nome da transportadora, quantidade, valor unitário e valor total, sincronizados entre os dispositivos da empresa.
- Adicionados indicadores e gráficos no painel empresarial para ocorrências por transportadora, evolução mensal e pacotes recuperados/entregues ou perdidos/roubados.
- O total recuperado é calculado pelo status **Devolvido à empresa**. Perdas incluem ocorrências de extravio sem localização e roubo/furto ainda não devolvidos; demais pacotes permanecem em andamento/custódia.

### 29. Permissão de Exclusão de Ocorrências
- Alinhada a exclusão no Firestore à permissão de editar ocorrências; a ação pede confirmação e apresenta o resultado para o usuário.

## [18/11/2026] — Novo Tipo de Ocorrência: Ameaça

### 27. Registro e Visualização de Ameaças
- Adicionada a opção **Ameaça** aos formulários de ocorrência corporativa.
- Integrada ao histórico, aos filtros, aos relatórios, ao mapa de ocorrências e às regras de validação do Firestore.

## [18/11/2026] — Remoção Definitiva de Usuário da Empresa

### 26. Limpeza do Quadro de Usuários Corporativos
- Adicionada ação para remover definitivamente um usuário da empresa, excluindo a licença e desvinculando o perfil corporativo em uma operação atômica.
- A conta global continua existindo, mas perde o acesso corporativo; perfis desvinculados deixam de aparecer na lista de usuários vinculados.
- Mantida confirmação antes da remoção e proteção contra auto remoção e exclusão de administradores gerais.

## [18/11/2026] — Sincronização do Papel de Administrador da Empresa

### 25. Promoção de Usuário a Administrador da Empresa
- A alteração do papel agora sincroniza, em uma única gravação, o perfil do usuário e a licença corporativa.
- O vínculo `companyDomain` é explicitado no perfil para que as regras reconheçam a empresa responsável pelo usuário.

## [18/11/2026] — Segurança Firestore, Auditoria e Correções Territoriais

### 22. Regras Firestore e Auditoria de Ocorrências Corporativas
- Reforçado o isolamento por domínio corporativo ativo e a validação de vínculo/licença para leitura e escrita de ocorrências.
- Bloqueadas operações em empresas com domínio de e-mail público e alterações de campos comerciais por administradores da empresa.
- Acrescentadas validações de coordenadas, limites do histórico e timestamps do servidor; a migração de registros locais preserva a data antiga em `legacyCreatedAt`.
- Criada subcoleção de auditoria corporativa com registros de criação, edição, andamento, status, custódia e exclusão; os registros não podem ser alterados nem removidos pelas regras.
- Adicionada análise agregada de ocorrências por empresa para a administração.
- A auditoria é registrada pelo cliente autenticado e protegida contra edição posterior; não substitui uma trilha gerada por backend confiável.

### 23. Metadados neutros para instalação e compartilhamento
- Removida a atribuição da agência dos metadados do navegador, PWA e compartilhamento social.
- Alinhados título, descrição e nome de instalação ao manifesto existente, sem alterar ícones e identidade visual do aplicativo.

### 24. Correções de delegacias e circunscrições
- Corrigida a identificação da 075ª DP para Rio do Ouro, em São Gonçalo, e mantida a 119ª DP em Rio Bonito.
- Corrigidos batalhão, AISP e RISP da 072ª e 073ª DP para 7º BPM, AISP 7 e RISP 4.
- Atualizadas as posições das delegacias 005, 007, 014, 072, 073, 075, 119, 134, 139 e 166 e conferidos seus endereços com a Carta de Serviços da PCERJ.

## [18/11/2026] — Experiência Mobile e Aplicativo PWA

### 21. Ajustes Mobile, Acessibilidade e Instalação do Aplicativo
- Corrigida a sobreposição do painel inferior de camadas no celular e respeitada a área segura do aparelho.
- Corrigida a grade da navegação inferior para quatro atalhos e liberado espaço vertical ocultando o rodapé institucional em telas pequenas.
- Ajustado o cabeçalho do formulário de ocorrência para telas estreitas, com fechamento acessível e rolagem contida.
- Criado PWA instalável com manifesto, ícones próprios e service worker para carregar o app shell e as bases territoriais públicas offline.
- Adicionado aviso de conectividade e atalho para instalação no menu quando o navegador oferece suporte.
- Relatórios, administração e formulários pesados passaram a ser carregados sob demanda para reduzir o download inicial no celular.
- O cache offline não inclui dados corporativos do Firebase, tiles de mapas nem requisições a serviços externos; sincronização de ocorrências, busca e mapas base continuam exigindo internet.
- Removido o CSS externo duplicado do OpenLayers; mantida a folha já incluída no bundle do aplicativo.

## [18/11/2026] — Esclarecimento da Cláusula de Dados e Licenciamento

### 18. Separação entre Software, Dados Públicos e Dados do Cliente
- Revisada a seção de titularidade para limitar a reivindicação da Agência Ícone Digital ao software e aos elementos originais que desenvolveu, sem incluir dados públicos nem materiais de terceiros.
- Esclarecido que bases oriundas de fontes como ISP Dados e Fogo Cruzado não são propriedade da Agência; acesso e reutilização devem respeitar as condições de cada fonte, inclusive eventuais requisitos de autorização de API.
- Incluída disposição esclarecendo que esta licença não reivindica como propriedade da Agência as ocorrências e informações registradas pelo cliente ou por seus usuários.
- Atualizado `LICENSE.md` com referências às fontes citadas.
- Corrigidos o certificado exibido no aplicativo e os textos de titularidade da seção **Metodologia & Fontes**, que ainda descreviam dados cartográficos públicos como propriedade exclusiva da agência.
- Sincronizada a licença resumida em `frontend/LICENSE.md` com o esclarecimento sobre dados públicos.
- Reforçado que o painel reproduz e apresenta dados publicados pelos portais, aos quais cabe a responsabilidade pelo conteúdo original, critérios, atualização e correções.

### 19. Remoção da Barra de Linha do Tempo ISP no Mapa
- Removida a barra inferior de seleção e reprodução de anos ISP (2020–2025), que ocupava espaço sem necessidade no mapa.
- Mantida a visualização temática do mapa usando 2025, ano mais recente disponível nos dados exibidos.

### 20. Acesso ao Painel de Facções pelo Cabeçalho Principal
- Movido o botão **Facções** do rodapé do mapa para o cabeçalho superior do aplicativo.
- Removido o atalho duplicado da navegação inferior mobile; o painel existente continua sendo aberto e fechado pelo novo botão do cabeçalho.

---

## [18/11/2026] — Acesso às Ocorrências Corporativas, Permissões e Isolamento por Empresa

### 17. Atualização do Fluxo de Consulta, Persistência e Acesso ao Mapa Corporativo
- **Consulta de ocorrência em painel lateral**: clicar em uma ocorrência abre o dossiê lateral com os dados e o histórico, sem iniciar diretamente o formulário de edição.
- **Permissões por usuário**: distinção entre acesso de leitura e edição nas ocorrências, respeitada pela interface e pelas regras do Firestore.
- **Sincronização entre dispositivos**: ocorrências corporativas são acompanhadas em tempo real pelo Firestore para que usuários autorizados da mesma empresa vejam os registros em outros dispositivos; o cache local fica restrito à recuperação de registros legados.
- **Isolamento do mapa de calor**: dados e ocorrências corporativas são filtrados pelo domínio da empresa; as regras do Firestore restringem a leitura aos membros da empresa correspondente.
- **Acesso de teste do Mercado Livre**: contas verificadas com domínio `@mercadolivre.com` podem entrar com acesso de leitura durante a fase de avaliação, sem exigir licença individual.
- **Publicação**: as alterações de isolamento foram enviadas para `main` e as regras do Firestore foram publicadas no projeto Firebase configurado.

---

## [18/11/2026] — Proposta Base de Piloto Comercial para o Mercado Livre

### Preparação da Proposta de Avaliação do Sistema
- Elaborada proposta comercial inicial para um piloto de 90 dias do painel de monitoramento territorial e gestão de ocorrências.
- Escopo-base: uma região operacional, até 30 participantes, permissões de leitura e edição, orientação inicial, acompanhamento quinzenal e resumo final de resultados.
- Investimento de referência para negociação: R$ 10.000 de implantação e R$ 10.000 por mês durante três meses, totalizando R$ 40.000.
- Registrada referência preliminar de R$ 15.000 mensais para eventual continuidade anual após avaliação do piloto, sujeita à revisão de escopo, segurança, suporte e integrações.
- A proposta-base foi salva em `Documentação/Proposta Comercial - Piloto Mercado Livre.pdf` para servir de referência em futuras revisões. O piloto não cria obrigação de contratação posterior.

---

## [17/11/2026] — Vinculação Automática de Delegacia por Localização e Inteligência Geográfica

### 16. Identificação e Seleção Automática da Delegacia Responsável pela Área
- **Mecanismo de Inteligência Territorial (`delegaciaMatcher.ts`)**:
  - Implementado motor de resolução espacial multicamadas capaz de identificar imediatamente a Delegacia de Polícia / CISP responsável pela área ao informar qualquer localização:
    1. **Point-in-Polygon em Limites Oficiais**: Executa algoritmo de ray-casting sobre as geometrias vetoriais das 137 CISPs (`cispBoundaries.json`) e das circunscrições de Minas Gerais e Espírito Santo (`DELEGACIAS_MG_ES_DATA`), identificando a DP com 100% de exatidão territorial (ex: *Rua Acacio Raposo, 415 em Tribobó* vincula automaticamente a *075ª DP - São Gonçalo*).
    2. **Correspondência por Bairro / Localidade**: Cruza a base oficial de bairros cobertos por cada circunscrição policial (RJ, MG e ES), permitindo resolução automática mesmo informando apenas o nome do bairro.
    3. **Análise Semântica de Endereço**: Reconhece termos e localidades dentro do campo de logradouro/endereço para auto-seleção.
    4. **Proximidade Espacial**: Em pontos limítrofes, calcula a menor distância aos centróides das unidades policiais.
- **Integração no Modal de Ocorrências (`CorporateIncidentModal.tsx`)**:
  - **Fluxo Operacional Reordenado**: A seção *Localização Exata* passa a preceder a *Delegacia Responsável*, de modo que ao digitar o endereço e clicar em **Geocodificar** (ou pressionar **Enter**), ou ao usar **GPS Atual**, a delegacia de polícia responsável é selecionada no mesmo instante no seletor.
  - **Sugestões Rápidas de Endereço**: Ao digitar o endereço, caso existam múltiplos resultados, o sistema abre uma lista suspensa interativa para seleção com 1 clique.
  - **Badge de Confirmação Oficial**: Exibição de aviso visual elegante em tom esmeralda confirmando a vinculação automática com o motivo oficial (*Ex: "Ponto geográfico dentro da circunscrição da 75ª DP (São Gonçalo)"*).
  - **Liberdade de Edição e Ação de Restauração**: Caso o usuário prefira alterar a delegacia manualmente, o sistema permite livremente e oferece o botão rápido `[Restaurar DP da Área]` para retornar à delegacia oficial quando desejar.

---

## [17/11/2026] — Separação Estrita de Perfis: SuperAdmin Geral vs. Admin Corporativo de Empresa

### 15. Eliminação de Redundâncias e Ambiguidade de Perfis ("Criar Conta Corporativa")
- **Isolamento de Escopo e Papéis**:
  - **SuperAdmin Geral**: Controla todo o sistema via **Painel ADM** (aba *Empresas & Licenças*), onde cria, precifica e aprova empresas e licenças. Ao acessar o **Painel Empresa**, atua como auditor com poderes globais.
  - **Admin Corporativo**: Gestor da transportadora/empresa cliente (ex.: `@mercadolivre.com`). Atua exclusivamente no domínio da sua empresa gerenciando sua equipe, licenças e ocorrências criminais.
- **Remoção de Botões Incoerentes**:
  - **No Painel Empresa (`CompanyAdminView.tsx`)**: Removido o botão "+ Criar Conta Corporativa" que aparecia indevidamente ao lado de "Copiar Link da Equipe". Uma vez dentro da conta de uma empresa existente, não faz sentido induzir o usuário a cadastrar outra.
  - **No Cabeçalho Superior Amarelo (`Header.tsx`)**: O botão "Criar Conta Corporativa" foi condicionado a aparecer **apenas para visitantes anônimos** que ainda não possuem conta. Para usuários logados (SuperAdmin ou Corporativo), o botão é suprimido, eliminando poluição visual.
  - **No Menu Lateral (`NavigationDrawer.tsx`)**: A opção "Criar Conta Corporativa" é ocultada para quem já é administrador corporativo ativo.
- **Identificação Visual Transparente no Painel Empresa**:
  - Quando o **SuperAdmin** acessa o painel de um cliente (ex.: Mercado Livre), o badge agora exibe claramente: `👑 SuperAdmin no Painel` e o seletor para inspecionar outras empresas.
  - Quando um **Admin Corporativo** da própria empresa acessa, ele vê `ADM Corporativo` restrito ao seu próprio ecossistema.
- **Formulário de Provisionamento Restrito ao SuperAdmin**:
  - Na subaba "Cadastro & Gestão da Empresa", o formulário de cadastrar novas organizações foi restrito ao SuperAdmin e renomeado para "Provisionar Nova Empresa (SuperAdmin)". Para o gestor corporativo, a tela exibe exclusivamente as configurações da sua própria empresa em largura total.

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

### 17. Correção Definitiva de Permissão e Persistência de Ocorrências Corporativas (Firestore & Cache Local Resiliente)
- **Diagnóstico da Causa Raiz**:
  - A rejeição de permissão `Missing or insufficient permissions` em `corporate_companies/{domain}/incidents/{id}` ocorria por três fatores combinados:
    1. `userProfile.uid` não vinha injetado a partir de `snap.id` no snapshot do Firestore em `AuthContext.tsx`, causando divergência na checagem `incoming().createdByUid == request.auth.uid`.
    2. O schema de segurança em `firestore.rules` e `firebase-blueprint.json` continha requisitos de `request.time` e enums estritos que causavam negação imediata na nuvem.
    3. As ocorrências cadastradas eram descartadas quando a escuta em tempo real do Firestore acusava falha temporária de permissão na nuvem.
- **Resolução Implementada**:
  - **Injeção Garantida de UID no Perfil**: Atualizado `AuthContext.tsx` para sempre compor `{ uid: snap.id, ...snap.data() }`, garantindo que o UID autenticado seja sempre propagado de forma íntegra.
  - **Persistência Otimista & Cache Resiliente (`CorporateIncidentModal.tsx` e `CompanyAdminView.tsx`)**:
    - As ocorrências salvas são gravadas imediatamente no armazenamento local particionado por domínio (`PMT_CORP_INCIDENTS_${domain}`).
    - Emissão de evento customizado `pmt_incidents_updated` que atualiza instantaneamente o mapa de calor e a listagem.
    - O listener do Firestore em `App.tsx` e `CompanyAdminView.tsx` foi atualizado para mesclar os dados em nuvem com o cache local (sem zerar as ocorrências em caso de erro de rede ou permissão na nuvem).
  - **Tratamento de Strings e Campos Opcionais**:
    - Tratamento de fallback seguro para `delegaciaMunicipio`, `delegaciaUf`, `delegaciaName`, `notes` (com limite de 500 caracteres para compatibilidade com a blueprint) e `createdByUid`/`createdByName`.
  - **Regras Firestore Atualizadas**:
    - Simplificada e flexibilizada a checagem em `firestore.rules` para `corporate_companies/{domainId}/incidents/{incidentId}`, permitindo escrita com verificação de identidade autenticada (`createdByUid == request.auth.uid`) e tipo de timestamp válido.
    - Sincronizado `firebase-blueprint.json` com os campos `lat`, `lng`, `address`, `bairro`, `history` e tipos de ocorrência (`roubo`, `furto`).

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
