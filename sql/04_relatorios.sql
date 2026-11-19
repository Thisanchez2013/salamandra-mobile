-- Views dos relatórios

-- BASE: vendas concluídas

CREATE OR REPLACE VIEW public.vendas_concluidas
WITH (security_invoker = true)
AS
SELECT
  v.id,
  v.data,
  (v.data AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
  v.valor_total,
  v.id_cliente,
  COALESCE(c.nome, 'Cliente não informado') AS cliente,
  v.id_usuario
FROM public.vendas AS v
LEFT JOIN public.clientes AS c
  ON c.id = v.id_cliente
WHERE v.status = 'Concluída';

-- FATURAMENTO POR DIA

CREATE OR REPLACE VIEW public.faturamento_diario
WITH (security_invoker = true)
AS
SELECT
  vc.dia,
  COUNT(*)::integer AS quantidade_vendas,
  SUM(vc.valor_total) AS faturamento,
  COALESCE(SUM(itens.quantidade), 0)::integer AS itens_vendidos,
  ROUND(SUM(vc.valor_total) / COUNT(*), 2) AS ticket_medio
FROM public.vendas_concluidas AS vc
LEFT JOIN (
  SELECT id_venda, SUM(quantidade) AS quantidade
  FROM public.itens_venda
  GROUP BY id_venda
) AS itens
  ON itens.id_venda = vc.id
GROUP BY vc.dia;

-- PRODUTOS VENDIDOS POR DIA

CREATE OR REPLACE VIEW public.produtos_vendidos_diario
WITH (security_invoker = true)
AS
SELECT
  vc.dia,
  iv.id_produto,
  COALESCE(p.nome, 'Produto removido') AS produto,
  SUM(iv.quantidade)::integer AS quantidade,
  SUM(iv.subtotal) AS valor,
  COALESCE(SUM(custos.custo), 0) AS custo,
  SUM(iv.subtotal) - COALESCE(SUM(custos.custo), 0) AS lucro
FROM public.vendas_concluidas AS vc
JOIN public.itens_venda AS iv
  ON iv.id_venda = vc.id
LEFT JOIN public.produtos AS p
  ON p.id = iv.id_produto
LEFT JOIN (
  SELECT id_item, SUM(quantidade * custo_unitario) AS custo
  FROM public.itens_venda_lote
  GROUP BY id_item
) AS custos
  ON custos.id_item = iv.id
GROUP BY vc.dia, iv.id_produto, p.nome;

-- COMPRAS POR CLIENTE E DIA

CREATE OR REPLACE VIEW public.clientes_compras_diario
WITH (security_invoker = true)
AS
SELECT
  vc.dia,
  vc.id_cliente,
  vc.cliente,
  COUNT(*)::integer AS compras,
  SUM(vc.valor_total) AS valor
FROM public.vendas_concluidas AS vc
GROUP BY vc.dia, vc.id_cliente, vc.cliente;

-- ESTOQUE BAIXO

CREATE OR REPLACE VIEW public.estoque_baixo
WITH (security_invoker = true)
AS
SELECT id, codigo, nome, quantidade_disponivel, situacao
FROM public.saldo_produtos
WHERE situacao <> 'normal';

-- PERMISSÕES: só usuários logados

REVOKE ALL ON public.vendas_concluidas, public.faturamento_diario,
  public.produtos_vendidos_diario, public.clientes_compras_diario,
  public.estoque_baixo
FROM PUBLIC, anon;

GRANT SELECT ON public.vendas_concluidas, public.faturamento_diario,
  public.produtos_vendidos_diario, public.clientes_compras_diario,
  public.estoque_baixo
TO authenticated;
