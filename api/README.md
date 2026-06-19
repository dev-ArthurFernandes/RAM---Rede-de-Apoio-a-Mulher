# API - RAM (Rede de Apoio à Mulher)

## Estratégia (custo x funcionalidade)

Arquitetura **híbrida**:

- **Supabase (free tier)** cobre Auth, banco de dados (Postgres), Realtime e Storage.
  Custo zero para começar, sem servidor para manter, RLS (Row Level Security) garante
  que cada perfil (usuária, advogado/estudante de direito, estudante de psicologia)
  só acesse os dados que pode ver.
- **Edge Functions (Deno/TypeScript)**, hospedadas no próprio projeto Supabase, cuidam
  das regras de negócio que não fazem sentido no cliente (ex: classificar a triagem e
  gerar automaticamente a Ficha NPJ + entrada na Fila de Psicologia). Não precisa de
  hospedagem separada (Render/Railway), evitando cold starts e custo extra.

Tudo relacionado ao backend vive nesta pasta `api/`.

## Estrutura

```
api/
  supabase/
    config.toml              # config do projeto Supabase (CLI)
    migrations/
      0001_init.sql           # schema completo + RLS
    functions/
      _shared/cors.ts
      triagem-submit/index.ts # classifica a triagem e cria Ficha NPJ + Fila Psicologia
  .env.example
```

## Modelo de dados (resumo)

- `profiles` — estende `auth.users`. Guarda `tipo` (usuaria | advogado | estudante_direito | estudante_psicologia),
  nome, telefone e campos específicos (OAB/UF, instituição, semestre). Criado automaticamente
  via trigger no signup (lendo `raw_user_meta_data`).
- `casos_npj` — fichas do Portal NPJ (código `NPJ-xxx`, status, prioridade, tipos de violência, relato).
- `fila_psicologia` — fila de acolhimento do Portal Psicologia (código `PSI-xxx`).
- `mensagens_chat` — chat entre profissional de psicologia e usuária, com Realtime habilitado.

A Triagem **não armazena as respostas brutas** (mantendo a promessa de privacidade
mostrada na tela). A Edge Function `triagem-submit` recebe as respostas, calcula
`tipos_violencia` + `prioridade`, descarta as respostas e grava apenas o resultado
classificado.

## Setup: criar e vincular o projeto Supabase

### 1. Criar o projeto
1. Acesse https://supabase.com e crie uma conta (pode usar login com GitHub).
2. Clique em **New project**.
3. Escolha a organização, dê um nome (ex: `ram-app`), defina uma **senha do banco de
   dados** (guarde-a — será pedida no passo 6) e escolha a região mais próxima
   (ex: South America - São Paulo, se disponível).
4. Aguarde ~2 minutos até o projeto ficar pronto (status "Project is ready").

### 2. Obter as credenciais
Em **Project Settings → API**, copie:
- **Project URL** → vai em `EXPO_PUBLIC_SUPABASE_URL`
- **anon public key** → vai em `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Reference ID** (também está na URL do projeto, ex: `https://abcdefghijklmnop.supabase.co` → ref = `abcdefghijklmnop`) — usado no passo 6.

### 3. Configurar o `.env` do app
Na raiz do projeto:
```bash
cp .env.example .env
```
E preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` com os valores do passo 2.

### 4. Instalar/usar a Supabase CLI
Não precisa instalar globalmente — use via `npx`:
```bash
npx supabase --version
```
(Windows com Scoop, opcional, fica mais rápido em chamadas seguintes):
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 5. Login na CLI
```bash
npx supabase login
```
Abre o navegador para autenticar com sua conta Supabase.

### 6. Vincular o projeto local à pasta `api/`
```bash
cd api
npx supabase link --project-ref <PROJECT_REF>
```
Será pedida a senha do banco definida no passo 1.

### 7. Aplicar o schema (migrations)
```bash
npx supabase db push
```
Cria as tabelas `profiles`, `casos_npj`, `fila_psicologia`, `mensagens_chat`, os enums,
o trigger de criação de perfil e as policies de RLS definidas em
`supabase/migrations/0001_init.sql`.

### 8. Deploy da Edge Function
```bash
npx supabase functions deploy triagem-submit
```
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente pelo Supabase
nas Edge Functions — não precisa configurar secrets manualmente.

### 9. Testar
- No painel do Supabase → **Table Editor**: confirme que as 4 tabelas foram criadas.
- No painel → **Edge Functions → triagem-submit → Invoke**, teste com:
  ```json
  { "respostas": ["Sim, frequentemente", "Não", "Não", "Não", "Não"] }
  ```
  A resposta deve trazer `prioridade: "alta"` e ter criado registros em `casos_npj`
  e `fila_psicologia` (visíveis no Table Editor).

### 10. Rodar o app
```bash
npm run web
```
O Expo carrega o `.env` automaticamente (variáveis com prefixo `EXPO_PUBLIC_`).
O cliente Supabase usado pelo app está em `lib/supabase.ts`.
