import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SALAMANDRA</Text>
      <Text style={styles.subtitle}>Sistema de Gestão</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Mobile funcionando ✓</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 3,
  },

  subtitle: {
    fontSize: 17,
    color: '#E5E5E5',
    marginTop: 8,
  },

  badge: {
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#242424',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
});