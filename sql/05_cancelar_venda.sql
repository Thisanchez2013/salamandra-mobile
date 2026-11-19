-- Cancelamento de venda (cancelar_venda)

CREATE OR REPLACE FUNCTION public.cancelar_venda(p_id_venda uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SESSAO_INVALIDA';
  END IF;

  IF NOT public.usuario_tem_perfil(ARRAY['ADMIN', 'GERENTE']) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SEM_PERMISSAO';
  END IF;

  SELECT status INTO v_status
  FROM public.vendas
  WHERE id = p_id_venda
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VENDA_NAO_ENCONTRADA';
  END IF;

  IF v_status <> 'Concluída' THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'VENDA_JA_CANCELADA';
  END IF;

  -- Mesma origem da venda: a auditoria registra só a mudança de status, não cada lote.
  PERFORM set_config('salamandra.origem', 'venda', true);

  UPDATE public.lotes_produto AS lote
  SET quantidade = lote.quantidade + devolucao.quantidade
  FROM (
    SELECT ivl.id_lote_produto, SUM(ivl.quantidade)::integer AS quantidade
    FROM public.itens_venda_lote AS ivl
    JOIN public.itens_venda AS iv ON iv.id = ivl.id_item
    WHERE iv.id_venda = p_id_venda
    GROUP BY ivl.id_lote_produto
  ) AS devolucao
  WHERE lote.id = devolucao.id_lote_produto;

  UPDATE public.vendas
  SET status = 'Cancelada'
  WHERE id = p_id_venda;
END;
$function$;

REVOKE ALL ON FUNCTION public.cancelar_venda(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancelar_venda(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancelar_venda(uuid) TO authenticated;
