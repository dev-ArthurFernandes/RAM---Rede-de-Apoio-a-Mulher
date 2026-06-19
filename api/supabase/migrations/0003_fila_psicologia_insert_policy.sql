-- ============================================================
-- A tabela fila_psicologia tinha policies de select/update mas
-- nenhuma de insert, então a equipe de psicologia não conseguia
-- criar solicitações manuais (RLS nega por padrão sem policy).
-- ============================================================

create policy "Equipe psicologia cria solicitações"
  on public.fila_psicologia for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.tipo = 'estudante_psicologia'
    )
  );
