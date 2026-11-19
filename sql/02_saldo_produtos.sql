-- ==================================================
-- 02_saldo_produtos.sql
-- View com o saldo de estoque de cada produto.
--
-- Antes, o app baixava TODOS os lotes e somava no celular.
-- Agora o banco faz a soma e devolve uma linha por produto.
--
-- O saldo vem só de lotes_produto. A coluna produtos.quantidade_estoque
-- não é atualizada por nada e por isso é ignorada aqui.
--
-- security_invoker = true: a view roda com as permissões de quem
-- consulta, então as regras RLS de produtos e lotes_produto continuam
-- valendo (sem isso, a view passaria por cima delas).
--
-- Pode rodar de novo sem problema (CREATE OR REPLACE).
-- ==================================================

CREATE OR REPLACE VIEW public.saldo_produtos
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.codigo,
  p.nome,
  p.descricao,
  p.preco_venda,
  p.created_at,
  COALESCE(SUM(l.quantidade), 0)::integer AS quantidade_disponivel,
  COUNT(l.id) FILTER (WHERE l.quantidade > 0)::integer AS lotes_com_saldo,
  -- Mesma regra do app (src/constants/estoque.ts): até 10 unidades é "baixo".
  CASE
    WHEN COALESCE(SUM(l.quantidade), 0) <= 0 THEN 'sem-estoque'
    WHEN COALESCE(SUM(l.quantidade), 0) <= 10 THEN 'baixo'
    ELSE 'normal'
  END AS situacao
FROM public.produtos AS p
LEFT JOIN public.lotes_produto AS l
  ON l.id_produto = p.id
GROUP BY p.id;

COMMENT ON VIEW public.saldo_produtos IS
  'Saldo de estoque por produto (soma dos lotes) e situação: sem-estoque, baixo ou normal.';

REVOKE ALL ON public.saldo_produtos FROM PUBLIC, anon;
GRANT SELECT ON public.saldo_produtos TO authenticated;

-- ==================================================
-- TESTE
-- ==================================================
-- select codigo, nome, quantidade_disponivel, situacao
-- from public.saldo_produtos
-- order by quantidade_disponivel;
