-- ============================================================
-- Fix: "infinite recursion detected in policy for relation profiles" (42P17)
--
-- A policia "Profissionais veem perfis de profissionais" consultava
-- public.profiles de dentro de uma policy da própria public.profiles,
-- forçando o Postgres a reaplicar a mesma policy indefinidamente.
--
-- Solução: função SECURITY DEFINER que lê o tipo do usuário atual
-- ignorando RLS, usada no lugar do subselect recursivo.
-- ============================================================

create function public.current_user_tipo()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select tipo from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_user_tipo() to authenticated, anon;

drop policy "Profissionais veem perfis de profissionais" on public.profiles;

create policy "Profissionais veem perfis de profissionais"
  on public.profiles for select
  using (public.current_user_tipo() in ('advogado', 'estudante_direito', 'estudante_psicologia'));
