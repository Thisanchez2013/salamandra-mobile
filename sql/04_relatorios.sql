-- ==================================================
-- 04_relatorios.sql
-- Views dos relatórios, montadas umas em cima das outras:
--
--   vendas_concluidas          (base: só vendas com status Concluída)
--     ├── faturamento_diario        faturamento, vendas, itens e ticket por dia
--     ├── produtos_vendidos_diario  quantidade, valor, custo e lucro por produto e dia
--     └── clientes_compras_diario   compras e valor por cliente e dia
--   saldo_produtos (arquivo 02)
--     └── estoque_baixo             produtos sem estoque ou com estoque baixo
--
-- Por que "por dia"? O app filtra por período (7 dias, 30 dias, este mês,
-- tudo). Com uma linha por dia, o app pede só os dias do período e soma
-- poucas linhas, em vez de baixar todas as vendas e itens.
--
-- O dia é calculado no fuso de São Paulo, para uma venda às 22h não
-- cair no dia seguinte (o banco guarda as datas em UTC).
--
-- Todas usam security_invoker = true: respeitam as regras RLS de quem consulta.
-- Rode depois do 02_saldo_produtos.sql. Pode rodar de novo sem problema.
-- ==================================================


-- ==================================================
-- BASE: vendas concluídas
-- ==================================================

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


-- ==================================================
-- FATURAMENTO POR DIA
-- ==================================================

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
  -- Soma os itens de cada venda antes do JOIN, para não repetir
  -- o valor_total da venda uma vez para cada item.
  SELECT id_venda, SUM(quantidade) AS quantidade
  FROM public.itens_venda
  GROUP BY id_venda
) AS itens
  ON itens.id_venda = vc.id
GROUP BY vc.dia;


-- ==================================================
-- PRODUTOS VENDIDOS POR DIA (base do ranking "mais vendidos")
-- O custo vem de itens_venda_lote: é o custo real dos lotes
-- que saíram em cada venda (FIFO).
-- ==================================================

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


-- ==================================================
-- COMPRAS POR CLIENTE E DIA (base do ranking "melhores clientes")
-- ==================================================

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


-- ==================================================
-- ESTOQUE BAIXO (em cima da saldo_produtos)
-- ==================================================

CREATE OR REPLACE VIEW public.estoque_baixo
WITH (security_invoker = true)
AS
SELECT id, codigo, nome, quantidade_disponivel, situacao
FROM public.saldo_produtos
WHERE situacao <> 'normal';


-- ==================================================
-- PERMISSÕES: só usuários logados
-- ==================================================

REVOKE ALL ON public.vendas_concluidas, public.faturamento_diario,
  public.produtos_vendidos_diario, public.clientes_compras_diario,
  public.estoque_baixo
FROM PUBLIC, anon;

GRANT SELECT ON public.vendas_concluidas, public.faturamento_diario,
  public.produtos_vendidos_diario, public.clientes_compras_diario,
  public.estoque_baixo
TO authenticated;


-- ==================================================
-- TESTES (rode um bloco de cada vez)
-- ==================================================

-- Faturamento dos últimos 30 dias:
-- select sum(faturamento) as faturamento, sum(quantidade_vendas) as vendas,
--        round(sum(faturamento) / nullif(sum(quantidade_vendas), 0), 2) as ticket_medio
-- from public.faturamento_diario
-- where dia >= current_date - 29;

-- 5 produtos mais vendidos (todo o período), com lucro:
-- select produto, sum(quantidade) as unidades, sum(valor) as valor, sum(lucro) as lucro
-- from public.produtos_vendidos_diario
-- group by id_produto, produto
-- order by valor desc
-- limit 5;

-- 5 melhores clientes:
-- select cliente, sum(compras) as compras, sum(valor) as valor
-- from public.clientes_compras_diario
-- group by id_cliente, cliente
-- order by valor desc
-- limit 5;

-- Estoque baixo:
-- select * from public.estoque_baixo order by quantidade_disponivel;
