import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  actionIcon,
  onActionPress,
}: AppHeaderProps) {
  return (
    <View className="flex-row items-center border-b border-salamandra-border px-[22px] py-4">
      {/* BOTÃO VOLTAR */}

      {onBack ? (
        <Pressable
          className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-salamandra-card active:opacity-70"
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={COLORS.gold}
          />
        </Pressable>
      ) : null}

      {/* TÍTULO */}

      <View className="flex-1">
        <Text
          className="text-xl font-bold text-salamandra-text"
          numberOfLines={1}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            className="mt-0.5 text-xs text-salamandra-muted"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* AÇÃO */}

      {actionIcon && onActionPress ? (
        <Pressable
          className="ml-4 h-10 w-10 items-center justify-center rounded-xl bg-salamandra-gold active:opacity-80"
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Ação"
        >
          <Ionicons
            name={actionIcon}
            size={25}
            color={COLORS.background}
          />
        </Pressable>
      ) : null}
    </View>
  );
}