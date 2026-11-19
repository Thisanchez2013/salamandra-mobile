-- ==================================================
-- 03_auditoria_triggers.sql
-- Auditoria automática com triggers.
--
-- Antes, o app gravava a auditoria depois de cada operação. Se alguém
-- alterasse um dado direto pelo painel do Supabase, nada era registrado.
-- Agora o próprio banco grava, não importa de onde veio a alteração.
--
-- O passo a passo de como isso funciona está em COMO_FUNCIONAM_TRIGGERS.md.
-- Pode rodar de novo sem problema (CREATE OR REPLACE + DROP TRIGGER IF EXISTS).
-- ==================================================


-- ==================================================
-- 1. FUNÇÃO DE TRIGGER
-- Uma função só, usada por todas as tabelas.
-- Ela descobre qual tabela e qual operação dispararam o trigger
-- (TG_TABLE_NAME e TG_OP) e monta o texto do registro.
-- ==================================================

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
  -- Uma edição que não mudou nada não precisa ser registrada.
  IF TG_OP = 'UPDATE' AND NEW IS NOT DISTINCT FROM OLD THEN
    RETURN NULL;
  END IF;

  -- Ação padrão a partir da operação.
  v_acao := CASE TG_OP
    WHEN 'INSERT' THEN 'CRIAR'
    WHEN 'UPDATE' THEN 'EDITAR'
    ELSE 'EXCLUIR'
  END;

  -- --------------------------------------------------
  -- Texto do registro, de acordo com a tabela.
  -- NEW = linha nova (INSERT/UPDATE); OLD = linha antiga (UPDATE/DELETE).
  -- --------------------------------------------------

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
    -- As baixas de estoque feitas pela venda (função registrar_venda_fifo)
    -- já ficam registradas como VENDA. A função marca a transação com
    -- salamandra.origem = 'venda', e aqui essas baixas são ignoradas.
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

  -- --------------------------------------------------
  -- Quem fez a alteração.
  -- Pelo app: o usuário logado (auth.uid()).
  -- Direto pelo painel/SQL Editor: não há usuário, fica NULL e o app
  -- mostra "Alteração direta no banco".
  -- Só usa o id se ele existir em perfis (a coluna tem chave estrangeira
  -- para perfis; um id sem perfil faria a operação inteira falhar).
  -- --------------------------------------------------

  SELECT id INTO v_usuario
  FROM public.perfis
  WHERE id = auth.uid();

  INSERT INTO public.auditoria (id_usuario, acao, descricao)
  VALUES (v_usuario, v_acao, v_descricao);

  -- Em trigger AFTER, o valor de retorno é ignorado.
  RETURN NULL;
END;
$function$;

-- Função de trigger não deve ser chamada diretamente por ninguém.
REVOKE ALL ON FUNCTION public.fn_registrar_auditoria() FROM PUBLIC, anon, authenticated;


-- ==================================================
-- 2. TRIGGERS
-- AFTER: roda depois que a alteração deu certo.
-- FOR EACH ROW: uma vez para cada linha alterada.
-- ==================================================

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


-- ==================================================
-- 3. OPCIONAL (recomendado): só o banco grava a auditoria
-- Com os triggers, o app não precisa mais inserir em auditoria.
-- Removendo a política de INSERT, ninguém consegue gravar um registro
-- falso pelo app; os triggers continuam gravando (rodam como donos).
-- Para desfazer, basta recriar a política.
-- ==================================================

-- DROP POLICY IF EXISTS auditoria_insert ON public.auditoria;


-- ==================================================
-- 4. TESTES (rode um bloco de cada vez no SQL Editor)
-- ==================================================

-- Teste 1: confira os triggers criados (devem aparecer 5 tabelas).
-- select event_object_table as tabela, trigger_name, action_timing, event_manipulation
-- from information_schema.triggers
-- where trigger_schema = 'public'
-- order by 1, 2;

-- Teste 2: uma alteração direta pelo SQL Editor fica registrada, sem usuário.
-- (troque o nome do fornecedor de teste se quiser)
-- insert into public.fornecedores (nome) values ('Fornecedor Teste Trigger');
-- delete from public.fornecedores where nome = 'Fornecedor Teste Trigger';
-- select acao, descricao, id_usuario, data_hora
-- from public.auditoria
-- order by data_hora desc
-- limit 5;
--   Resultado esperado: CRIAR e EXCLUIR "Fornecedor: Fornecedor Teste Trigger",
--   com id_usuario vazio (NULL), porque não há usuário logado no SQL Editor.
