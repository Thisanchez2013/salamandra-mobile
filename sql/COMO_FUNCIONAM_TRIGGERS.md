# Como funcionam os triggers de auditoria

Este guia explica, passo a passo, o que está no arquivo `03_auditoria_triggers.sql`. Ele também cobre as travas de segurança da função de venda (`01_venda_fifo_ajuste.sql`).

## 1. O problema

Antes, quem gravava a auditoria era o app. Depois de salvar um cliente, por exemplo, o `clienteService.ts` chamava `registrarAuditoria('CRIAR', ...)`. Isso tinha três falhas:

- Se alguém alterasse um dado **direto pelo painel do Supabase**, nada era registrado.
- Se a chamada de auditoria falhasse (internet caiu, por exemplo), o dado era salvo e a auditoria não.
- Qualquer usuário logado podia gravar um registro de auditoria falso, porque a tabela aceitava INSERT vindo do app.

## 2. O que é um trigger

Um **trigger** ("gatilho") é uma regra do banco que diz: *"sempre que acontecer X nesta tabela, rode esta função"*.

```sql
CREATE TRIGGER trg_auditoria_clientes
AFTER INSERT OR UPDATE OR DELETE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_auditoria();
```

Lendo em português:

| Parte | Significado |
|---|---|
| `AFTER` | Roda **depois** que a alteração deu certo. Se o INSERT falhar (CPF repetido, por exemplo), o trigger nem roda. |
| `INSERT OR UPDATE OR DELETE` | Dispara ao criar, editar ou excluir. |
| `ON public.clientes` | Vale só para essa tabela. |
| `FOR EACH ROW` | Roda uma vez **para cada linha** alterada. Um `DELETE` que apaga 3 clientes gera 3 registros. |
| `EXECUTE FUNCTION ...` | A função que será chamada. |

O ponto principal: o trigger roda **dentro da mesma transação** da alteração. Se a gravação da auditoria der erro, a alteração também é desfeita. Ou as duas coisas ficam gravadas, ou nenhuma fica. E não importa de onde veio o comando: app, painel do Supabase ou SQL Editor.

## 3. A função do trigger

Uma função de trigger é uma função comum com `RETURNS trigger`. O banco entrega a ela algumas variáveis prontas:

| Variável | O que contém |
|---|---|
| `TG_OP` | A operação: `'INSERT'`, `'UPDATE'` ou `'DELETE'`. |
| `TG_TABLE_NAME` | O nome da tabela que disparou, por exemplo `'clientes'`. |
| `NEW` | A linha **nova** (em INSERT e UPDATE). Em DELETE é `NULL`. |
| `OLD` | A linha **antiga** (em UPDATE e DELETE). Em INSERT é `NULL`. |

Por isso uma função só atende as 5 tabelas. Ela olha `TG_TABLE_NAME` e `TG_OP` e monta o texto certo:

```sql
v_acao := CASE TG_OP
  WHEN 'INSERT' THEN 'CRIAR'
  WHEN 'UPDATE' THEN 'EDITAR'
  ELSE 'EXCLUIR'
END;

IF TG_TABLE_NAME = 'clientes' THEN
  v_descricao := 'Cliente: ' || COALESCE(NEW.nome, OLD.nome);
```

`COALESCE(NEW.nome, OLD.nome)` pega o nome novo e, se ele for `NULL` (caso do DELETE), usa o antigo.

Mais alguns detalhes da função:

- **Edição que não muda nada** (`NEW IS NOT DISTINCT FROM OLD`): sai sem registrar.
- **Produtos:** se o preço mudou, o texto mostra `preço 5 → 6`. Aqui usamos `OLD` e `NEW` juntos.
- **Lotes:** um INSERT vira `ENTRADA_ESTOQUE` (a mesma ação que o app já usava).
- **Vendas:** um INSERT vira `VENDA`, com valor e cliente. Mudar o status (para Cancelada, por exemplo) também é registrado.
- No fim, `RETURN NULL`: em trigger `AFTER`, o retorno é ignorado.

### Quem fez a alteração

```sql
SELECT id INTO v_usuario FROM public.perfis WHERE id = auth.uid();
```

`auth.uid()` é uma função do Supabase que devolve o id do usuário logado no app, que vem no token de login.

- **Pelo app:** devolve o usuário, e o registro mostra o nome dele.
- **Pelo painel ou SQL Editor:** não há usuário logado, então fica `NULL`. A tela de Auditoria mostra *"Alteração direta no banco"*.

Por que o `SELECT` em `perfis` em vez de usar `auth.uid()` direto? A coluna `auditoria.id_usuario` tem chave estrangeira para `perfis`. Se existisse um usuário sem perfil, o INSERT na auditoria falharia, e isso desfaria a operação inteira. Fazendo assim, o pior caso é gravar `NULL`.

## 4. O detalhe da venda: não poluir a auditoria

Uma venda de 3 produtos pode baixar 5 lotes diferentes. Sem cuidado, o trigger de `lotes_produto` gravaria 5 registros "EDITAR lote" para uma venda só, que já tem o seu próprio registro `VENDA`.

A solução é a função de venda "avisar" o trigger:

```sql
-- dentro de registrar_venda_fifo
PERFORM set_config('salamandra.origem', 'venda', true);
```

```sql
-- dentro do trigger, para lotes
IF TG_OP = 'UPDATE' AND current_setting('salamandra.origem', true) = 'venda' THEN
  RETURN NULL;  -- é baixa de venda, já registrada como VENDA
END IF;
```

- `set_config(nome, valor, true)` cria uma configuração temporária. O `true` faz ela valer **só até o fim da transação atual**. Quando a venda termina, a marca some sozinha.
- `current_setting(nome, true)` lê essa configuração. O `true` faz devolver `NULL` em vez de erro quando ela não existe.

Resultado: se alguém mudar a quantidade de um lote pelo painel, isso é registrado (`Lote A1: 2 → 3 un.`). As baixas feitas pela venda não são.

O app não consegue usar `set_config` para esconder uma alteração. Pela API do Supabase só dá para chamar funções do schema `public`, e `set_config` não está lá.

## 5. SECURITY DEFINER: o que é e por que não quebra a segurança

Toda função no Postgres roda de um destes dois jeitos:

| Modo | Roda com as permissões de... |
|---|---|
| `SECURITY INVOKER` (padrão) | quem **chamou** a função |
| `SECURITY DEFINER` | quem **criou** a função (o dono, `postgres`) |

### Por que a função de venda precisava disso

Pelas regras RLS, só ADMIN e GERENTE podem alterar `lotes_produto`. A venda precisa baixar lotes. Com `SECURITY INVOKER`, um FUNCIONARIO chamando a função não enxergava os lotes, porque o `SELECT ... FOR UPDATE` exige permissão de UPDATE. A função então respondia `ESTOQUE_INSUFICIENTE`. Testamos isso num banco de teste com as mesmas regras: o erro acontece mesmo.

Não queremos liberar UPDATE em lotes para FUNCIONARIO, senão ele poderia mudar o estoque à vontade pelo app. Queremos que ele só consiga baixar o estoque **através de uma venda**. É exatamente isso que `SECURITY DEFINER` faz: a função tem a permissão, e o funcionário só tem permissão de chamar a função.

### As travas que impedem abuso

Uma função `SECURITY DEFINER` passa por cima das regras RLS, então ela mesma precisa conferir tudo. Foram colocadas 4 travas:

1. **Confere o usuário logo no início.**
   ```sql
   IF v_usuario_id IS NULL THEN ... 'SESSAO_INVALIDA'
   IF NOT public.usuario_tem_perfil(ARRAY['ADMIN','GERENTE','FUNCIONARIO']) THEN ... 'SEM_PERMISSAO'
   ```
   É a mesma regra da política RLS de vendas: perfil **ativo** com um dos três cargos. Um usuário desativado não vende.

2. **O vendedor é sempre quem está logado.** A função usa `auth.uid()` e não aceita o id do vendedor como parâmetro. Ninguém registra venda em nome de outra pessoa.

3. **search_path vazio** (`SET search_path TO ''`). O `search_path` é a lista de schemas onde o banco procura um nome sem schema. Se ele não estivesse fixo, alguém poderia criar uma tabela `vendas` falsa em outro schema e fazer a função gravar nela. Com o caminho vazio, todo nome é escrito por completo (`public.vendas`, `auth.uid()`), e não há o que enganar.

4. **Só usuários logados podem executar.**
   ```sql
   REVOKE ALL ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) FROM PUBLIC;
   REVOKE ALL ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) FROM anon;
   GRANT EXECUTE ON FUNCTION public.registrar_venda_fifo(uuid, text, jsonb) TO authenticated;
   ```
   No Supabase, `anon` é quem acessa sem login e `authenticated` é quem fez login. Por padrão, toda função nova pode ser chamada por todos. Aqui isso foi fechado.

Além disso, a função continua lendo o **preço do banco**, nunca do app. Um app adulterado não consegue vender por R$ 0,01.

A função de trigger `fn_registrar_auditoria` também é `SECURITY DEFINER`, para conseguir gravar em `auditoria` mesmo quando quem alterou não teria permissão. Ela não pode ser chamada diretamente: o `REVOKE ... FROM PUBLIC, anon, authenticated` tira essa permissão, e o banco só a executa como trigger.

### Opcional: fechar o INSERT manual na auditoria

Agora que o banco grava a auditoria sozinho, a política `auditoria_insert` (que deixava o app inserir) não é mais necessária. Removendo-a, ninguém consegue gravar um registro falso pelo app. Os triggers continuam funcionando, porque rodam como donos. O comando está comentado no fim do `03_auditoria_triggers.sql`:

```sql
DROP POLICY IF EXISTS auditoria_insert ON public.auditoria;
```

## 6. Como testar (bom para os prints)

Rode no SQL Editor, um bloco de cada vez.

**a) Ver os triggers criados.** Devem aparecer 5 tabelas, cada uma com INSERT, UPDATE e DELETE.
```sql
select event_object_table as tabela, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by 1, 2;
```

**b) Alteração direta é registrada.**
```sql
insert into public.fornecedores (nome) values ('Fornecedor Teste Trigger');
delete from public.fornecedores where nome = 'Fornecedor Teste Trigger';

select acao, descricao, id_usuario, data_hora
from public.auditoria
order by data_hora desc
limit 5;
```
Esperado: `CRIAR` e `EXCLUIR` com a descrição `Fornecedor: Fornecedor Teste Trigger`, e `id_usuario` vazio.

**c) Pelo app.** Cadastre um cliente, registre uma entrada de estoque e faça uma venda. Na tela **Auditoria** devem aparecer `Cadastro`, `Entrada de estoque` e `Venda`, com o seu nome. Na venda deve haver **um** registro só, sem um "EDITAR lote" para cada lote baixado.

## 7. Resumo em uma frase

O trigger é o banco dizendo *"toda vez que alguém mexer nesta tabela, eu anoto"*. Como quem anota é o banco, a anotação acontece venha a alteração de onde vier, e ela é desfeita junto se a alteração for desfeita.
