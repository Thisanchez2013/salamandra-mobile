-- View saldo_produtos

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
