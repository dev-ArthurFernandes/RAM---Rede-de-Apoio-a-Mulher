-- ============================================================
-- RAM - Rede de Apoio à Mulher
-- Schema inicial: perfis, casos NPJ, fila de psicologia, chat
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type public.user_role as enum ('usuaria', 'advogado', 'estudante_direito', 'estudante_psicologia');
create type public.caso_status as enum ('pendente', 'em_atendimento', 'encerrado');
create type public.prioridade_nivel as enum ('alta', 'media', 'baixa');
create type public.origem_registro as enum ('triagem_automatica', 'manual');

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tipo public.user_role not null default 'usuaria',
  nome text not null,
  telefone text,
  oab_numero text,
  oab_uf text,
  instituicao text,
  semestre text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Usuária vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuária atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profissionais veem perfis de profissionais"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo in ('advogado', 'estudante_direito', 'estudante_psicologia')
    )
  );

-- Cria o profile automaticamente ao registrar em auth.users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, tipo, nome, telefone, oab_numero, oab_uf, instituicao, semestre)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'tipo')::public.user_role, 'usuaria'),
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    new.raw_user_meta_data ->> 'telefone',
    new.raw_user_meta_data ->> 'oab_numero',
    new.raw_user_meta_data ->> 'oab_uf',
    new.raw_user_meta_data ->> 'instituicao',
    new.raw_user_meta_data ->> 'semestre'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- GERADORES DE CÓDIGO (NPJ-001, PSI-001, ...)
-- ============================================================
create sequence public.casos_npj_seq;
create sequence public.fila_psicologia_seq;

create function public.gen_codigo_npj()
returns text
language sql
as $$
  select 'NPJ-' || lpad(nextval('public.casos_npj_seq')::text, 3, '0');
$$;

create function public.gen_codigo_psi()
returns text
language sql
as $$
  select 'PSI-' || lpad(nextval('public.fila_psicologia_seq')::text, 3, '0');
$$;

-- ============================================================
-- CASOS NPJ (Portal NPJ)
-- ============================================================
create table public.casos_npj (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default public.gen_codigo_npj(),
  usuaria_id uuid references public.profiles (id) on delete set null,
  nome_completo text not null,
  cpf text,
  telefone text,
  email text,
  status public.caso_status not null default 'pendente',
  prioridade public.prioridade_nivel not null default 'media',
  tipos_violencia text[] not null default '{}',
  relato text,
  data_incidente date,
  aluno_responsavel_id uuid references public.profiles (id) on delete set null,
  origem public.origem_registro not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.casos_npj enable row level security;

create policy "Equipe NPJ vê todos os casos"
  on public.casos_npj for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo in ('advogado', 'estudante_direito')
    )
  );

create policy "Usuária vê o próprio caso"
  on public.casos_npj for select
  using (usuaria_id = auth.uid());

create policy "Equipe NPJ cria casos"
  on public.casos_npj for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo in ('advogado', 'estudante_direito')
    )
  );

create policy "Equipe NPJ atualiza casos"
  on public.casos_npj for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo in ('advogado', 'estudante_direito')
    )
  );

-- ============================================================
-- FILA DE PSICOLOGIA (Portal Psicologia)
-- ============================================================
create table public.fila_psicologia (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default public.gen_codigo_psi(),
  usuaria_id uuid references public.profiles (id) on delete set null,
  nome_completo text not null,
  tipo_violencia text,
  prioridade public.prioridade_nivel not null default 'media',
  status public.caso_status not null default 'pendente',
  profissional_id uuid references public.profiles (id) on delete set null,
  origem public.origem_registro not null default 'manual',
  created_at timestamptz not null default now()
);

alter table public.fila_psicologia enable row level security;

create policy "Equipe psicologia vê a fila"
  on public.fila_psicologia for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo = 'estudante_psicologia'
    )
  );

create policy "Usuária vê a própria solicitação"
  on public.fila_psicologia for select
  using (usuaria_id = auth.uid());

create policy "Equipe psicologia atualiza a fila"
  on public.fila_psicologia for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo = 'estudante_psicologia'
    )
  );

-- ============================================================
-- CHAT (Portal Psicologia)
-- ============================================================
create table public.mensagens_chat (
  id uuid primary key default gen_random_uuid(),
  fila_id uuid not null references public.fila_psicologia (id) on delete cascade,
  autor_id uuid references public.profiles (id) on delete set null,
  autor_tipo text not null check (autor_tipo in ('usuaria', 'profissional')),
  conteudo text not null,
  created_at timestamptz not null default now()
);

alter table public.mensagens_chat enable row level security;

create policy "Participantes veem as mensagens"
  on public.mensagens_chat for select
  using (
    exists (
      select 1 from public.fila_psicologia f
      where f.id = fila_id
        and (f.usuaria_id = auth.uid() or f.profissional_id = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo = 'estudante_psicologia'
    )
  );

create policy "Participantes enviam mensagens"
  on public.mensagens_chat for insert
  with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.fila_psicologia f
      where f.id = fila_id
        and (
          f.usuaria_id = auth.uid()
          or f.profissional_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.tipo = 'estudante_psicologia'
          )
        )
    )
  );

alter publication supabase_realtime add table public.mensagens_chat;
alter publication supabase_realtime add table public.fila_psicologia;
