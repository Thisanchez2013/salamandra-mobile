import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

import { COLORS } from '../../constants/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
}: SearchInputProps) {
  return (
    <View className="mt-5 h-[52px] flex-row items-center rounded-[14px] border border-salamandra-border bg-salamandra-card px-4">
      <Ionicons
        name="search-outline"
        size={20}
        color={COLORS.subtle}
      />

      <TextInput
        className="ml-3 h-full flex-1 text-sm text-salamandra-text"
        placeholder={placeholder}
        placeholderTextColor={COLORS.subtle}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
      />

      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Limpar pesquisa"
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={COLORS.subtle}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
