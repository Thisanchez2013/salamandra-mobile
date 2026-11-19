-- Venda com baixa FIFO (registrar_venda_fifo)

CREATE OR REPLACE FUNCTION public.registrar_venda_fifo(
  p_id_cliente uuid,
  p_observacao text,
  p_itens jsonb
)
RETURNS TABLE(id_venda uuid, valor_total numeric, custo_total numeric, resultado numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_venda_id uuid;
  v_item record;
  v_produto public.produtos%ROWTYPE;
  v_precos jsonb := '{}'::jsonb;
  v_preco numeric;
  v_item_venda_id uuid;
  v_lote record;
  v_restante integer;
  v_consumo integer;
  v_valor_total numeric := 0;
  v_custo_total numeric := 0;
  v_linhas_atualizadas integer;
BEGIN
  -- TRAVAS DE SEGURANÇA

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SESSAO_INVALIDA';
  END IF;

  IF NOT public.usuario_tem_perfil(ARRAY['ADMIN', 'GERENTE', 'FUNCIONARIO']) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SEM_PERMISSAO';
  END IF;

  -- VALIDAÇÕES

  IF p_id_cliente IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CLIENTE_OBRIGATORIO';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.clientes WHERE id = p_id_cliente) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CLIENTE_NAO_ENCONTRADO';
  END IF;

  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITENS_INVALIDOS';
  END IF;

  IF jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITENS_INVALIDOS';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_itens) AS entrada(item)
    WHERE jsonb_typeof(entrada.item) <> 'object'
      OR COALESCE(entrada.item ->> 'id_produto', '') = ''
      OR COALESCE(entrada.item ->> 'quantidade', '') !~ '^[0-9]+$'
      OR CASE
           WHEN COALESCE(entrada.item ->> 'quantidade', '') ~ '^[0-9]+$'
             THEN (entrada.item ->> 'quantidade')::numeric <= 0
           ELSE TRUE
         END
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ITENS_INVALIDOS';
  END IF;

  PERFORM set_config('salamandra.origem', 'venda', true);

  -- PREÇOS

  FOR v_item IN
    SELECT
      (entrada.item ->> 'id_produto')::uuid AS id_produto,
      SUM((entrada.item ->> 'quantidade')::bigint) AS quantidade
    FROM jsonb_array_elements(p_itens) AS entrada(item)
    GROUP BY (entrada.item ->> 'id_produto')::uuid
    ORDER BY (entrada.item ->> 'id_produto')::uuid
  LOOP
    IF v_item.quantidade > 2147483647 THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'QUANTIDADE_INVALIDA';
    END IF;

    SELECT produto.*
      INTO v_produto
    FROM public.produtos AS produto
    WHERE produto.id = v_item.id_produto;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PRODUTO_NAO_ENCONTRADO';
    END IF;

    v_precos := v_precos || jsonb_build_object(v_item.id_produto::text, v_produto.preco_venda);
    v_valor_total := v_valor_total + v_item.quantidade * v_produto.preco_venda;
  END LOOP;

  -- VENDA

  INSERT INTO public.vendas (id_cliente, id_usuario, valor_total, observacao)
  VALUES (p_id_cliente, v_usuario_id, v_valor_total, NULLIF(btrim(p_observacao), ''))
  RETURNING id INTO v_venda_id;

  -- ITENS + BAIXA FIFO

  FOR v_item IN
    SELECT
      (entrada.item ->> 'id_produto')::uuid AS id_produto,
      SUM((entrada.item ->> 'quantidade')::bigint)::integer AS quantidade
    FROM jsonb_array_elements(p_itens) AS entrada(item)
    GROUP BY (entrada.item ->> 'id_produto')::uuid
    ORDER BY (entrada.item ->> 'id_produto')::uuid
  LOOP
    v_preco := (v_precos ->> v_item.id_produto::text)::numeric;

    INSERT INTO public.itens_venda (id_venda, id_produto, quantidade, preco_unitario, subtotal)
    VALUES (v_venda_id, v_item.id_produto, v_item.quantidade, v_preco, v_item.quantidade * v_preco)
    RETURNING id INTO v_item_venda_id;

    v_restante := v_item.quantidade;

    FOR v_lote IN
      SELECT lote.id, lote.quantidade, lote.custo_unitario
      FROM public.lotes_produto AS lote
      WHERE lote.id_produto = v_item.id_produto
        AND lote.quantidade > 0
      ORDER BY lote.data_entrada ASC, lote.id ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_restante = 0;

      v_consumo := LEAST(v_restante, v_lote.quantidade);

      UPDATE public.lotes_produto
      SET quantidade = quantidade - v_consumo
      WHERE id = v_lote.id;

      GET DIAGNOSTICS v_linhas_atualizadas = ROW_COUNT;
      IF v_linhas_atualizadas <> 1 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'FALHA_AO_BAIXAR_LOTE';
      END IF;

      INSERT INTO public.itens_venda_lote (id_item, id_lote_produto, quantidade, custo_unitario)
      VALUES (v_item_venda_id, v_lote.id, v_consumo, v_lote.custo_unitario);

      v_restante := v_restante - v_consumo;
      v_custo_total := v_custo_total + v_consumo * v_lote.custo_unitario;
    END LOOP;

    IF v_restante > 0 THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'ESTOQUE_INSUFICIENTE:' || v_item.id_produto::text;
    END IF;
  END LOOP;

  RETURN QUERY
  SELECT v_venda_id, v_valor_total, v_custo_total, v_valor_total - v_custo_total;
END;
$function$;

REVOKE ALL ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) TO authenticated;
