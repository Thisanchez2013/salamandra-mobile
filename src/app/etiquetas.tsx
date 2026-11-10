import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';

import { AppHeader } from '../components/ui/AppHeader';
import { SearchInput } from '../components/ui/SearchInput';
import { LoadingState, EmptyState } from '../components/ui/EstadosTela';
import { COLORS } from '../constants/theme';
import { useProdutos } from '../hooks/useProdutos';


type LayoutGrade = '10' | '20' | '30';
type TipoCodigo = 'qrcode' | 'barcode';

interface ItemEtiqueta {
  id: string;
  nome: string;
  codigo: string;
  qtd: number;
}

export default function EtiquetasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { produtos, carregando } = useProdutos();

  // Estados
  const [pesquisa, setPesquisa] = useState('');
  const [quantidades, setQuantidades] = useState<{ [id: string]: number }>({});
  const [layoutGrade, setLayoutGrade] = useState<LayoutGrade>('20');
  const [tipoCodigo, setTipoCodigo] = useState<TipoCodigo>('barcode');
  const [gerando, setGerando] = useState(false);

 // Filtra produtos na busca
  const produtosFiltrados = produtos.filter((prod) => {
    const termo = pesquisa.toLowerCase();
    const nomeMatche = prod.nome?.toLowerCase().includes(termo);
    const codigoMatche = String(prod.codigo || '').toLowerCase().includes(termo);
    return nomeMatche || codigoMatche;
  });

  // Altera a quantidade de etiquetas de um produto
  const alterarQtd = (id: string, delta: number) => {
    setQuantidades((prev) => {
      const atual = prev[id] || 0;
      const nova = Math.max(0, atual + delta);
      return { ...prev, [id]: nova };
    });
  };

  // Total de etiquetas selecionadas
  const totalEtiquetas = Object.values(quantidades).reduce((a, b) => a + b, 0);

  /* ==================================================
      GERADOR DE HTML E IMPRESSÃO
     ================================================== */
  const handleGerarImpressao = async () => {
    if (totalEtiquetas === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos 1 etiqueta para gerar a folha.');
      return;
    }

    setGerando(true);

    try {
      // 1. Monta a lista de itens
      const listaEtiquetas: ItemEtiqueta[] = [];
      produtos.forEach((prod: any) => {
        const qtd = quantidades[prod.id] || 0;
        const codigoLimpo = String(prod.codigo || prod.bar_code || prod.id || '').trim();

        for (let i = 0; i < qtd; i++) {
          listaEtiquetas.push({
            id: String(prod.id),
            nome: prod.nome || 'Produto',
            codigo: codigoLimpo || '0000',
            qtd: 1,
          });
        }
      });

      // Configuração de dimensões conforme a grade escolhida (10, 20 ou 30)
      const configGrade: Record<LayoutGrade, { colunas: number; alturaEtiqueta: string; alturaImg: string; fontSize: string }> = {
        '10': { colunas: 2, alturaEtiqueta: '52mm', alturaImg: '26mm', fontSize: '12px' },
        '20': { colunas: 2, alturaEtiqueta: '26mm', alturaImg: '15mm', fontSize: '10px' },
        '30': { colunas: 3, alturaEtiqueta: '24mm', alturaImg: '13mm', fontSize: '9px' },
      };

      const { colunas, alturaEtiqueta, alturaImg, fontSize } = configGrade[layoutGrade];

      // 2. Monta o HTML das etiquetas
      const htmlEtiquetas = listaEtiquetas
        .map((item) => {
          const codEncoded = encodeURIComponent(item.codigo);
          const imgUrl =
            tipoCodigo === 'qrcode'
              ? `https://quickchart.io/qr?text=${codEncoded}&size=200&margin=1`
              : `https://quickchart.io/barcode?type=code128&text=${codEncoded}&width=300&height=90&quietZone=20&includeText=false`;

          return `
            <div class="etiqueta">
              <div class="nome">${item.nome}</div>
              <img class="codigo-img" src="${imgUrl}" alt="${item.codigo}" />
              <div class="codigo-txt">${item.codigo}</div>
            </div>
          `;
        })
        .join('');

      // 3. Documento HTML final formatado para A4
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { size: A4 portrait; margin: 6mm; }
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #ffffff;
              }
              .grid-a4 {
                display: grid;
                grid-template-columns: repeat(${colunas}, 1fr);
                gap: 3mm;
              }
              .etiqueta {
                border: 1px dashed #ccc;
                border-radius: 4px;
                padding: 2mm 3mm;
                text-align: center;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                height: ${alturaEtiqueta};
                page-break-inside: avoid;
                overflow: hidden;
              }
              .nome {
                font-size: ${fontSize};
                font-weight: bold;
                color: #111;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
              }
              .codigo-img {
                max-width: 90%;
                height: ${alturaImg};
                object-fit: contain;
                margin: 1mm auto;
              }
              .codigo-txt {
                font-size: 8px;
                color: #444;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="grid-a4">
              ${htmlEtiquetas}
            </div>
          </body>
        </html>
      `;

      // 4. Dispara a janela de impressão nativa
      await Print.printAsync({ html: htmlContent });
    } catch (err) {
      console.error('Erro na impressão:', err);
      Alert.alert('Erro na Impressão', 'Não foi possível gerar a folha de etiquetas.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <AppHeader
        title="Gerador de Etiquetas"
        subtitle="Folha A4 para impressão"
        onBack={() => router.back()}
      />

      <ScrollView className="flex-1 px-[22px]" showsVerticalScrollIndicator={false}>
        {/* CONFIGURAÇÃO DO TIPO DE CÓDIGO */}
        <Text className="mt-4 text-xs font-bold uppercase tracking-wider text-salamandra-muted">
        Formato do Código
        </Text>
        <View className="mt-2 flex-row gap-3">
          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border p-3 ${
              tipoCodigo === 'barcode'
                ? 'border-salamandra-gold bg-salamandra-gold/10'
                : 'border-salamandra-border bg-salamandra-card'
            }`}
            onPress={() => setTipoCodigo('barcode')}
          >
            <Ionicons
              name="barcode-outline"
              size={20}
              color={tipoCodigo === 'barcode' ? COLORS.gold : '#9ca3af'}
            />
            <Text
              className={`text-sm font-semibold ${
                tipoCodigo === 'barcode' ? 'text-salamandra-gold' : 'text-salamandra-muted'
              }`}
            >
              Código de Barras
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border p-3 ${
              tipoCodigo === 'qrcode'
                ? 'border-salamandra-gold bg-salamandra-gold/10'
                : 'border-salamandra-border bg-salamandra-card'
            }`}
            onPress={() => setTipoCodigo('qrcode')}
          >
            <Ionicons
              name="qr-code-outline"
              size={20}
              color={tipoCodigo === 'qrcode' ? COLORS.gold : '#9ca3af'}
            />
            <Text
              className={`text-sm font-semibold ${
                tipoCodigo === 'qrcode' ? 'text-salamandra-gold' : 'text-salamandra-muted'
              }`}
            >
              QR Code
            </Text>
          </Pressable>
        </View>

        {/* CONFIGURAÇÃO DA GRELHA A4 */}
        <Text className="mt-5 text-xs font-bold uppercase tracking-wider text-salamandra-muted">
          Grelha Folha A4 (Por Página)
        </Text>
        <View className="mt-2 flex-row gap-2">
          {(['10', '20', '30'] as LayoutGrade[]).map((grade) => (
            <Pressable
              key={grade}
              className={`flex-1 items-center justify-center rounded-xl border py-2.5 ${
                layoutGrade === grade
                  ? 'border-salamandra-gold bg-salamandra-gold/10'
                  : 'border-salamandra-border bg-salamandra-card'
              }`}
              onPress={() => setLayoutGrade(grade)}
            >
              <Text
                className={`text-sm font-bold ${
                  layoutGrade === grade ? 'text-salamandra-gold' : 'text-salamandra-text'
                }`}
              >
                {grade} por página
              </Text>
            </Pressable>
          ))}
        </View>

        {/* BUSCA E SELEÇÃO DE PRODUTOS */}
        <Text className="mt-6 text-xs font-bold uppercase tracking-wider text-salamandra-muted">
        Selecione os Produtos e Quantidades
        </Text>

        <View className="mt-2">
          <SearchInput
            value={pesquisa}
            onChangeText={setPesquisa}
            placeholder="Buscar produto por nome ou código..."
          />
        </View>

        {carregando ? (
          <LoadingState mensagem="A carregar produtos..." />
        ) : produtosFiltrados.length === 0 ? (
          <EmptyState
            icon="search-outline"
            titulo="Nenhum produto encontrado"
            descricao="Tente buscar por outro nome ou código."
          />
        ) : (
          <View className="mt-3 gap-3 pb-32">
            {produtosFiltrados.map((produto) => {
              const qtd = quantidades[produto.id] || 0;
              return (
                <View
                  key={produto.id}
                  className="flex-row items-center justify-between rounded-xl border border-salamandra-border bg-salamandra-card p-3.5"
                >
                  <View className="flex-1 pr-2">
                    <Text className="font-semibold text-salamandra-text" numberOfLines={1}>
                      {produto.nome}
                    </Text>
                    <Text className="text-xs text-salamandra-muted">
                      Cód: {produto.codigo || 'S/C'}
                    </Text>
                  </View>

                  {/* CONTADOR DE QUANTIDADE */}
                  <View className="flex-row items-center gap-3 rounded-lg bg-salamandra-background border border-salamandra-border p-1">
                    <Pressable
                      className="h-8 w-8 items-center justify-center rounded-md bg-salamandra-card"
                      onPress={() => alterarQtd(produto.id, -1)}
                    >
                      <Ionicons name="remove" size={16} color={COLORS.gold} />
                    </Pressable>

                    <Text className="w-5 text-center font-bold text-salamandra-text">
                      {qtd}
                    </Text>

                    <Pressable
                      className="h-8 w-8 items-center justify-center rounded-md bg-salamandra-card"
                      onPress={() => alterarQtd(produto.id, 1)}
                    >
                      <Ionicons name="add" size={16} color={COLORS.gold} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* RODAPÉ COM SAFE AREA */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-salamandra-border bg-salamandra-background p-4 px-[22px]"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          className={`flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${
            totalEtiquetas > 0 ? 'bg-salamandra-gold active:opacity-80' : 'bg-salamandra-card opacity-50'
          }`}
          disabled={totalEtiquetas === 0 || gerando}
          onPress={handleGerarImpressao}
        >
          <Ionicons name="print-outline" size={20} color="#000" />
          <Text className="font-bold text-black">
            {gerando ? 'Gerando documento...' : `Imprimir ${totalEtiquetas} etiqueta(s)`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}