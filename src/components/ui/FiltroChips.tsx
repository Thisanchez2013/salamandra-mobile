import { Pressable, ScrollView, Text } from 'react-native';

export interface OpcaoChip<T extends string> {
  valor: T;
  rotulo: string;
}

interface FiltroChipsProps<T extends string> {
  opcoes: OpcaoChip<T>[];
  selecionado: T;
  onChange: (valor: T) => void;
}

// Linha de botões arredondados para escolher uma opção (ex.: período).
export function FiltroChips<T extends string>({
  opcoes,
  selecionado,
  onChange,
}: FiltroChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      className="mt-3 flex-grow-0"
      showsHorizontalScrollIndicator={false}
    >
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === selecionado;

        return (
          <Pressable
            key={opcao.valor}
            className={`mr-2 rounded-full border px-4 py-2 active:opacity-70 ${
              ativo
                ? 'border-salamandra-gold bg-salamandra-gold'
                : 'border-salamandra-border bg-salamandra-card'
            }`}
            onPress={() => onChange(opcao.valor)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={opcao.rotulo}
          >
            <Text
              className={`text-xs font-bold ${
                ativo
                  ? 'text-salamandra-background'
                  : 'text-salamandra-textSoft'
              }`}
            >
              {opcao.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
