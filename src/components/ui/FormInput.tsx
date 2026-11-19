import { Text, TextInput, TextInputProps, View } from 'react-native';

import { COLORS } from '../../constants/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export function FormInput({
  label,
  error,
  required = false,
  ...textInputProps
}: FormInputProps) {
  return (
    <View className="mb-4">
      {/* LABEL */}

      <Text className="mb-2 text-xs font-semibold text-salamandra-textSoft">
        {label}

        {required ? (
          <Text className="text-salamandra-gold"> *</Text>
        ) : null}
      </Text>

      {/* INPUT */}

      <TextInput
        className={`h-[52px] rounded-[14px] border bg-salamandra-card px-4 text-sm text-salamandra-text ${error
          ? 'border-salamandra-errorBorder'
          : 'border-salamandra-border'
          }`}
        placeholderTextColor={COLORS.subtle}
        selectionColor={COLORS.gold}
        {...textInputProps}
      />

      {/* ERRO */}

      {error ? (
        <Text
          className="mt-1.5 text-[11px]"
          style={{ color: COLORS.error }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}