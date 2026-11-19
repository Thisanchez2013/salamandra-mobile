import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text } from 'react-native';

import { COLORS } from '../../constants/theme';

interface BotaoExcluirProps {
  // Ex.: "cliente", "produto" — usado nos textos.
  entidade: string;
  nome: string;
  // Faz a exclusão e devolve uma mensagem de erro, ou null se deu certo.
  onExcluir: () => Promise<string | null>;
  onExcluido: () => void;
}

// Botão vermelho com confirmação antes de excluir.
export function BotaoExcluir({
  entidade,
  nome,
  onExcluir,
  onExcluido,
}: BotaoExcluirProps) {
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    setExcluindo(true);
    const erro = await onExcluir();
    setExcluindo(false);

    if (erro) {
      Alert.alert('Não foi possível excluir', erro);
      return;
    }

    onExcluido();
  }

  function confirmar() {
    Alert.alert(
      `Excluir ${entidade}`,
      `Deseja realmente excluir "${nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: excluir },
      ]
    );
  }

  return (
    <Pressable
      className={`mt-3 h-[54px] flex-row items-center justify-center rounded-[14px] border border-salamandra-errorBorder ${
        excluindo ? 'opacity-60' : 'active:opacity-70'
      }`}
      onPress={confirmar}
      disabled={excluindo}
      accessibilityRole="button"
      accessibilityLabel={`Excluir ${entidade}`}
    >
      {excluindo ? (
        <ActivityIndicator
          size="small"
          color={COLORS.error}
        />
      ) : (
        <Ionicons
          name="trash-outline"
          size={20}
          color={COLORS.error}
        />
      )}

      <Text className="ml-2 text-sm font-extrabold text-salamandra-error">
        {excluindo ? 'EXCLUINDO...' : `EXCLUIR ${entidade.toUpperCase()}`}
      </Text>
    </Pressable>
  );
}
