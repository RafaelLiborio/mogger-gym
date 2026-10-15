# Mogger Gym

Aplicativo web responsivo para montar treinos personalizados, consultar uma biblioteca de exercícios com demonstrações animadas em GIF, registrar sessões e gerenciar sua evolução com design moderno no padrão **shadcn/ui**.

## O que foi implementado e aprimorado

- **Design de Ícones dos Módulos**: Substituição de símbolos unicode crus por ícones vetoriais modernos do ecossistema **Lucide** dentro de badges estilizados com gradientes sutis, bordas elegantes e elevações suaves (`icon-badge`).
- **Autenticação com Google & Banco de Dados Supabase**:
  - Suporte completo ao **Supabase JS v2** e login com Google OAuth ("Continuar com o Google").
  - Banco de dados em nuvem com persistência em PostgreSQL (tabelas `workouts` e `workout_logs`).
  - Script SQL pronto em [`supabase-schema.sql`](file:///d:/GerenteMax11/Desktop/Gym%20Workout/mogger-gym/supabase-schema.sql) com **Row Level Security (RLS)** ativado para garantir privacidade total dos dados de cada atleta.
  - Modal integrado na interface e suporte a variáveis de ambiente (`.env`) para configurar as chaves do Supabase com facilidade.
  - Modo híbrido com fallback transparente para o banco local caso deseje usar o login tradicional.
- **Componentes de Layout no padrão shadcn/ui**:
  - Cards com design limpo, bordas sutis (`hsl(var(--border))`), sombras de elevação e desfoque suave de fundo.
  - Botões com variantes oficiais (`default/primary`, `secondary`, `outline`, `destructive`, `small`).
  - Inputs com anel de foco refinado (`ring-2 ring-ring`).
  - Modais com efeito `backdrop-blur-md` e animação de escala.
  - Sistema de alertas e toasts sonner/shadcn com feedback imediato.
- **Resolução de Tela Ampliada (125% Padrão)**:
  - Escala base calibrada em **125%** (`scale-125`) para leitura super confortável, botões com áreas de toque generosas e presença visual imponente em monitores de alta densidade.
  - Seletor de escala na barra superior (100%, 125%, 150%) com persistência automática no navegador.
- **Proteção Total aos GIFs de Exercícios**:
  - As demonstrações animadas em GIF foram 100% preservadas e protegidas contra quebras de layout (`object-fit: contain` em containers com proporção estável e fundo escuro).
  - Fallbacks elegantes caso a conexão oscile.
- **Interface 100% Responsiva**:
  - Desktop: grid espaçoso com sidebar lateral completa.
  - Tablet: layout fluido de 2 colunas.
  - Mobile: navegação ergonômica estilo app nativo na base da tela (Bottom Navigation Bar), botões táteis e modais responsivos.

---

## Como Configurar o Supabase com Google Auth

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. No painel do seu projeto Supabase, acesse **SQL Editor** e execute o conteúdo do arquivo [`supabase-schema.sql`](file:///d:/GerenteMax11/Desktop/Gym%20Workout/mogger-gym/supabase-schema.sql).
3. Habilite o login do Google em **Authentication → Providers → Google**:
   - Insira o Client ID e Client Secret obtidos no [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Adicione a Callback URL informada pelo Supabase no seu projeto do Google Cloud.
4. Para conectar o Mogger Gym ao seu Supabase, você pode:
   - **Opção A (Pelo App)**: Na tela de login ou na barra superior, clique no ícone de engrenagem / "Configurar Supabase" e informe a URL do projeto e a Chave Anon.
   - **Opção B (Via `.env`)**: Copie o arquivo `.env.example` para `.env` e preencha:
     ```env
     SUPABASE_URL=https://seu-projeto.supabase.co
     SUPABASE_ANON_KEY=eyJhbGciOi...
     ```

---

## Executar o Projeto

1. Inicie o servidor:
   ```powershell
   npm start
   ```
2. Abra `http://localhost:3000` no navegador.
3. Se desejar criar também um administrador local offline:
   ```powershell
   npm run setup-admin
   ```

---

## Estrutura do Projeto

- `server.js` — Servidor HTTP nativo com API REST e rota pública de configuração do Supabase.
- `supabase-schema.sql` — Schema DDL e políticas de segurança RLS para o banco Supabase.
- `.env.example` — Modelo de variáveis de ambiente.
- `public/index.html` — HTML semântico com carregamento do Supabase JS e Lucide Icons.
- `public/styles.css` — Sistema de design shadcn/ui, tokens de cores HSL, escala 125% e regras responsivas.
- `public/app.js` — Lógica do aplicativo, integração Google Auth / Supabase e gerenciamento de estado.
- `data/store.json` — Armazenamento local de contingência.
