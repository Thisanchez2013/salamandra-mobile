import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

import { COLORS } from '../../constants/theme';

interface SeletorDataProps {
  rotulo: string;
  valor: Date;
  onChange: (data: Date) => void;
  minimo?: Date;
  maximo?: Date;
}

export function SeletorData({ rotulo, valor, onChange, minimo, maximo }: SeletorDataProps) {
  const [aberto, setAberto] = useState(false);

  function abrir() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: valor,
        mode: 'date',
        minimumDate: minimo,
        maximumDate: maximo,
        onValueChange: (_evento, data) => onChange(data),
      });
      return;
    }
    setAberto(true);
  }

  return (
    <>
      <Pressable
        className="flex-1 flex-row items-center rounded-[14px] border border-salamandra-border bg-salamandra-card px-3 py-3 active:opacity-70"
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}: ${valor.toLocaleDateString('pt-BR')}`}
      >
        <Ionicons name="calendar-outline" size={18} color={COLORS.gold} />
        <View className="ml-2">
          <Text className="text-[10px] font-bold text-salamandra-muted">{rotulo}</Text>
          <Text className="text-sm font-bold text-salamandra-text">
            {valor.toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </Pressable>

      {Platform.OS !== 'android' ? (
        <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
          <Pressable className="flex-1 justify-center bg-black/70 px-6" onPress={() => setAberto(false)}>
            <View className="rounded-2xl bg-salamandra-card p-4">
              <DateTimePicker
                value={valor}
                mode="date"
                display="inline"
                themeVariant="dark"
                accentColor={COLORS.gold}
                minimumDate={minimo}
                maximumDate={maximo}
                onValueChange={(_evento, data) => {
                  onChange(data);
                  setAberto(false);
                }}
              />
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
