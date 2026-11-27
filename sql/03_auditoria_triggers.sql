-- Auditoria com triggers

-- 1. FUNÇÃO DE TRIGGER

CREATE OR REPLACE FUNCTION public.fn_registrar_auditoria()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_acao text;
  v_descricao text;
  v_usuario uuid;
  v_produto text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN
    RETURN NULL;
  END IF;

  v_acao := CASE TG_OP
    WHEN 'INSERT' THEN 'CRIAR'
    WHEN 'UPDATE' THEN 'EDITAR'
    ELSE 'EXCLUIR'
  END;

  -- Texto do registro, de acordo com a tabela.

  IF TG_TABLE_NAME = 'clientes' THEN
    v_descricao := 'Cliente: ' || COALESCE(NEW.nome, OLD.nome);

  ELSIF TG_TABLE_NAME = 'produtos' THEN
    v_descricao := 'Produto: ' || COALESCE(NEW.nome, OLD.nome);
    IF TG_OP = 'UPDATE' AND NEW.preco_venda IS DISTINCT FROM OLD.preco_venda THEN
      v_descricao := v_descricao || ' (preço ' || OLD.preco_venda || ' → ' || NEW.preco_venda || ')';
    END IF;

  ELSIF TG_TABLE_NAME = 'fornecedores' THEN
    v_descricao := 'Fornecedor: ' || COALESCE(NEW.nome, OLD.nome);

  ELSIF TG_TABLE_NAME = 'lotes_produto' THEN
    IF TG_OP = 'UPDATE' AND current_setting('salamandra.origem', true) = 'venda' THEN
      RETURN NULL;
    END IF;

    SELECT nome INTO v_produto
    FROM public.produtos
    WHERE id = COALESCE(NEW.id_produto, OLD.id_produto);

    IF TG_OP = 'INSERT' THEN
      v_acao := 'ENTRADA_ESTOQUE';
      v_descricao := 'Lote ' || NEW.codigo_lote || ': ' || NEW.quantidade || ' un.';
    ELSIF TG_OP = 'UPDATE' THEN
      v_descricao := 'Lote ' || NEW.codigo_lote || ': ' || OLD.quantidade || ' → ' || NEW.quantidade || ' un.';
    ELSE
      v_descricao := 'Lote ' || OLD.codigo_lote || ': ' || OLD.quantidade || ' un.';
    END IF;

    v_descricao := v_descricao || ' (' || COALESCE(v_produto, 'produto removido') || ')';

  ELSIF TG_TABLE_NAME = 'vendas' THEN
    IF TG_OP = 'INSERT' THEN
      v_acao := 'VENDA';
      v_descricao := 'Venda de R$ ' || replace(to_char(NEW.valor_total, 'FM999999990.00'), '.', ',')
        || COALESCE(' para ' || (SELECT nome FROM public.clientes WHERE id = NEW.id_cliente), '');
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      v_descricao := 'Venda: status ' || OLD.status || ' → ' || NEW.status;
    ELSE
      v_descricao := 'Venda de R$ ' || replace(to_char(COALESCE(NEW.valor_total, OLD.valor_total), 'FM999999990.00'), '.', ',')
        || ' de ' || to_char(COALESCE(NEW.data, OLD.data) AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI');
    END IF;

  ELSE
    v_descricao := TG_TABLE_NAME;
  END IF;

  -- Quem fez a alteração.

  SELECT id INTO v_usuario
  FROM public.perfis
  WHERE id = auth.uid();

  INSERT INTO public.auditoria (id_usuario, acao, descricao)
  VALUES (v_usuario, v_acao, v_descricao);

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_registrar_auditoria() FROM PUBLIC, anon, authenticated;

-- 2. TRIGGERS

DROP TRIGGER IF EXISTS trg_auditoria_clientes ON public.clientes;
CREATE TRIGGER trg_auditoria_clientes
AFTER INSERT OR UPDATE OR DELETE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_produtos ON public.produtos;
CREATE TRIGGER trg_auditoria_produtos
AFTER INSERT OR UPDATE OR DELETE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_fornecedores ON public.fornecedores;
CREATE TRIGGER trg_auditoria_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_lotes_produto ON public.lotes_produto;
CREATE TRIGGER trg_auditoria_lotes_produto
AFTER INSERT OR UPDATE OR DELETE ON public.lotes_produto
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();

DROP TRIGGER IF EXISTS trg_auditoria_vendas ON public.vendas;
CREATE TRIGGER trg_auditoria_vendas
AFTER INSERT OR UPDATE OR DELETE ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();
