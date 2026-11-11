# Salamandra Mobile

Aplicativo de **gestão comercial** desenvolvido como Projeto Integrador. Permite controlar clientes, produtos, estoque por lotes e acompanhar vendas e relatórios pelo celular.

## Funcionalidades

| Módulo | O que faz |
|---|---|
| **Login** | Acesso por usuário e senha, com sessão salva no aparelho |
| **Início (Dashboard)** | Faturamento, total de vendas, clientes, produtos, alerta de estoque baixo e últimas vendas |
| **Clientes** | Cadastro, edição e busca por nome ou CPF (com validação e máscara de CPF e CEP) |
| **Produtos e estoque** | Cadastro de produtos e entradas de estoque por **lote**, com custo de aquisição e saldo calculado (FIFO) |
| **Gerador de Etiquetas** | Emissão e impressão nativa de folhas A4 (padrão Pimaco) com Códigos de Barras e QR Codes dinâmicos |
| **Histórico de vendas** | Lista de vendas com busca por cliente, filtro por período, totais e detalhe de cada venda |
| **Relatórios** | Faturamento, ticket médio, itens vendidos, produtos mais vendidos, melhores clientes e estoque baixo |
| **Menu** | Dados do usuário logado, atalhos para os módulos e saída do sistema |

## Tecnologias

- **[Expo](https://expo.dev) SDK 57** + **React Native**, com **Expo Router** (navegação por arquivos)
- **TypeScript**
- **NativeWind** (Tailwind CSS no React Native) para o visual
- **[Supabase](https://supabase.com)**: banco PostgreSQL, autenticação e Edge Function de login
- **Expo Camera & Print**: Leitura óptica de códigos via hardware e conversão de templates HTML/CSS para impressão nativa de PDFs.
- **QuickChart API**: Renderização de imagens de códigos de barras (Code 128) e QR Codes em alta resolução.

## Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org) 20 ou superior
- App **Expo Go** no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Acesso ao projeto no Supabase (peça um convite ao responsável pelo banco)

### Passo a passo

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz do projeto com os dados do Supabase (em *Project Settings → API*):

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sua_chave_publica_anon
   ```

   > Use a chave **pública** (anon/publishable). Nunca coloque a chave `service_role` no app. O arquivo `.env.local` não vai para o GitHub.

3. Inicie o servidor:

   ```bash
   npx expo start -c
   ```

4. Com o celular **no mesmo Wi-Fi** do computador, leia o QR code com o Expo Go. Se a rede bloquear a conexão, use `npx expo start --tunnel`.

## Estrutura de pastas

```
src/
├── app/          # Telas (cada arquivo é uma rota do Expo Router)
├── components/   # Componentes visuais reutilizáveis
│   └── ui/       # Cabeçalho, campos, busca, filtros e estados (carregando, erro, vazio)
├── constants/    # Cores do tema e regras (ex.: limite de estoque baixo)
├── hooks/        # Lógica das telas (carregamento, filtros, formulários)
├── lib/          # Configuração do cliente Supabase
├── services/     # Acesso ao banco (consultas e gravações)
├── types/        # Tipos TypeScript das entidades
└── utils/        # Máscaras, validações e formatação de moeda
```

Cada tela segue o fluxo **tela → hook → service → Supabase**, separando visual, lógica e acesso a dados.

## Banco de dados

Principais tabelas (schema `public`):

| Tabela | Conteúdo |
|---|---|
| `perfis` | Usuários do app (nome, usuário, cargo, ativo) |
| `clientes` | Clientes cadastrados |
| `produtos` | Catálogo e preço de venda |
| `lotes_produto` | Entradas de estoque, cada uma com quantidade e custo |
| `vendas` | Vendas (cliente, vendedor, data, valor, status) |
| `itens_venda` | Produtos de cada venda |
| `itens_venda_lote` | De qual lote saiu cada item vendido (FIFO) |
| `fornecedores` | Fornecedores |
| `auditoria` | Registro de alterações |

O diagrama completo fica no Supabase em **Database → Schema Visualizer**.

## Equipe

Projeto Integrador. Desenvolvido por Thiago Sanchez, Leonardo Lacerda e Thiago Marcelo.
