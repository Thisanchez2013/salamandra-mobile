import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import type { TipoRelatorio } from '../hooks/useRelatorios';
import { buscarEntradas, buscarSaidas, FiltroPeriodo } from './relatorioService';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function dataBR(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export async function exportarRelatorioExcel(filtro: FiltroPeriodo, tipo: TipoRelatorio) {
  const [saidas, entradas] = await Promise.all([
    tipo !== 'entrada' ? buscarSaidas(filtro) : Promise.resolve([]),
    tipo !== 'saida' ? buscarEntradas(filtro) : Promise.resolve([]),
  ]);

  const planilha = XLSX.utils.book_new();

  if (tipo !== 'entrada') {
    XLSX.utils.book_append_sheet(
      planilha,
      XLSX.utils.json_to_sheet(
        saidas.map((linha) => ({
          Data: dataBR(linha.data),
          Cliente: linha.cliente,
          Status: linha.status,
          Código: linha.codigo,
          Produto: linha.produto,
          Quantidade: linha.quantidade,
          'Preço unitário': linha.precoUnitario,
          Subtotal: linha.subtotal,
        }))
      ),
      'Saídas (vendas)'
    );
  }

  if (tipo !== 'saida') {
    XLSX.utils.book_append_sheet(
      planilha,
      XLSX.utils.json_to_sheet(
        entradas.map((linha) => ({
          Data: dataBR(linha.data),
          Código: linha.codigo,
          Produto: linha.produto,
          Lote: linha.lote,
          Quantidade: linha.quantidade,
          'Custo unitário': linha.custoUnitario,
          'Custo total': linha.quantidade * linha.custoUnitario,
        }))
      ),
      'Entradas (estoque)'
    );
  }

  const bytes = XLSX.write(planilha, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  const arquivo = new File(Paths.cache, `relatorio-salamandra-${Date.now()}.xlsx`);
  arquivo.create({ overwrite: true });
  arquivo.write(new Uint8Array(bytes));

  await Sharing.shareAsync(arquivo.uri, {
    mimeType: MIME_XLSX,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
    dialogTitle: 'Exportar relatório',
  });
}
