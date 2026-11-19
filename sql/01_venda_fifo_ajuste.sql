-- ==================================================
-- 01_venda_fifo_ajuste.sql
-- Ajusta a função registrar_venda_fifo, que já existia no banco.
--
-- O que muda em relação à versão anterior:
--   1. Roda como dona da função (SECURITY DEFINER). Antes ela rodava com
--      as permissões de quem chamava e, pelas regras RLS, só ADMIN e
--      GERENTE podem alterar lotes_produto. Resultado: um FUNCIONARIO
--      não conseguia vender (o banco escondia os lotes e a função
--      respondia ESTOQUE_INSUFICIENTE).
--   2. Como agora ela passa por cima das regras RLS, ela mesma confere,
--      logo no início, se o usuário está logado, ativo e tem um dos
--      três cargos. Sem isso, qualquer conta logada poderia vender.
--   3. search_path vazio: todo nome de tabela/função é escrito com o
--      schema (public.vendas, auth.uid()...). Assim ninguém consegue
--      criar um objeto com o mesmo nome em outro schema para enganar
--      a função.
--   4. Só usuários logados (role authenticated) podem executar.
--      PUBLIC e anon perdem a permissão.
--   5. A venda precisa ter cliente, e o cliente precisa existir.
--   6. Marca a transação com salamandra.origem = 'venda', para o trigger
--      de auditoria de lotes (arquivo 03) não registrar cada baixa de
--      lote como uma edição.
--
-- A lógica FIFO é a mesma de antes.
-- Pode rodar de novo sem problema (CREATE OR REPLACE).
-- ==================================================

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
  -- --------------------------------------------------
  -- TRAVAS DE SEGURANÇA (necessárias por causa do SECURITY DEFINER)
  -- --------------------------------------------------

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SESSAO_INVALIDA';
  END IF;

  -- Mesma regra das políticas RLS de vendas: perfil ativo e com cargo.
  IF NOT public.usuario_tem_perfil(ARRAY['ADMIN', 'GERENTE', 'FUNCIONARIO']) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SEM_PERMISSAO';
  END IF;

  -- --------------------------------------------------
  -- VALIDAÇÕES
  -- --------------------------------------------------

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

  -- Avisa o trigger de auditoria de lotes que as baixas a seguir fazem
  -- parte de uma venda. O "true" faz a marca valer só nesta transação.
  PERFORM set_config('salamandra.origem', 'venda', true);

  -- --------------------------------------------------
  -- PREÇOS (lidos do banco, nunca do app)
  -- Junta linhas repetidas do mesmo produto e processa em ordem fixa.
  -- --------------------------------------------------

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

  -- --------------------------------------------------
  -- VENDA
  -- --------------------------------------------------

  INSERT INTO public.vendas (id_cliente, id_usuario, valor_total, observacao)
  VALUES (p_id_cliente, v_usuario_id, v_valor_total, NULLIF(btrim(p_observacao), ''))
  RETURNING id INTO v_venda_id;

  -- --------------------------------------------------
  -- ITENS + BAIXA FIFO
  -- --------------------------------------------------

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

    -- FIFO: lote mais antigo primeiro; o id desempata.
    -- FOR UPDATE trava os lotes até o fim da transação, então duas vendas
    -- simultâneas do mesmo produto esperam uma pela outra.
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

    -- Faltou estoque: o RAISE desfaz TUDO o que foi feito acima
    -- (venda, itens e baixas), porque a função é uma transação só.
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

-- Quem pode chamar a função: só usuários logados.
REVOKE ALL ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) TO authenticated;

-- ==================================================
-- CONFERÊNCIA (opcional): deve mostrar prosecdef = true
-- e a permissão só para authenticated (e postgres/service_role).
-- ==================================================
-- select proname, prosecdef, proconfig, proacl
-- from pg_proc where proname = 'registrar_venda_fifo';
