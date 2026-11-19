-- ==================================================
-- 00_ler_estrutura.sql
-- SOMENTE LEITURA: não altera nada no banco.
-- Mostra as tabelas, colunas, views, funções e triggers do schema public,
-- para o Claude escrever as funções, views e triggers com os nomes certos.
--
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
-- Clique no resultado (uma célula só), copie o texto e mande no chat.
-- ==================================================

select json_build_object(
  'colunas', (
    select json_agg(json_build_object(
      'tabela', c.table_name,
      'coluna', c.column_name,
      'tipo', c.data_type,
      'nulo', c.is_nullable,
      'padrao', c.column_default
    ) order by c.table_name, c.ordinal_position)
    from information_schema.columns c
    where c.table_schema = 'public'
  ),
  'chaves', (
    select json_agg(json_build_object(
      'tabela', conrelid::regclass::text,
      'nome', conname,
      'definicao', pg_get_constraintdef(oid)
    ))
    from pg_constraint
    where connamespace = 'public'::regnamespace
  ),
  'views', (
    select json_agg(json_build_object(
      'nome', viewname,
      'sql', definition
    ))
    from pg_views
    where schemaname = 'public'
  ),
  'funcoes', (
    select json_agg(json_build_object(
      'nome', p.proname,
      'sql', pg_get_functiondef(p.oid)
    ))
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prokind = 'f'
  ),
  'triggers', (
    select json_agg(json_build_object(
      'tabela', event_object_table,
      'nome', trigger_name,
      'quando', action_timing || ' ' || event_manipulation,
      'acao', action_statement
    ))
    from information_schema.triggers
    where trigger_schema = 'public'
  ),
  'politicas_rls', (
    select json_agg(json_build_object(
      'tabela', tablename,
      'nome', policyname,
      'comando', cmd,
      'using', qual,
      'check', with_check
    ))
    from pg_policies
    where schemaname = 'public'
  )
) as estrutura;
