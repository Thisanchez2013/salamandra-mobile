import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [erroUsuario, setErroUsuario] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  function handleLogin() {
    let formularioValido = true;

    setErroUsuario('');
    setErroSenha('');

    if (!usuario.trim()) {
      setErroUsuario('Informe seu usuário.');
      formularioValido = false;
    }

    if (!senha.trim()) {
      setErroSenha('Informe sua senha.');
      formularioValido = false;
    }

    if (!formularioValido) {
      return;
    }

    console.log('Login validado.');
  }

  function handleUsuarioChange(texto: string) {
    setUsuario(texto);

    if (erroUsuario) {
      setErroUsuario('');
    }
  }

  function handleSenhaChange(texto: string) {
    setSenha(texto);

    if (erroSenha) {
      setErroSenha('');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Marca */}
            <View style={styles.brandContainer}>
              <Text style={styles.brand}>SALAMANDRA</Text>
              <Text style={styles.brandSubtitle}>Sistema de Gestão</Text>
            </View>

            {/* Login */}
            <View style={styles.loginContainer}>
              <Text style={styles.title}>Bem-vindo de volta</Text>

              <Text style={styles.description}>
                Entre com suas credenciais para acessar o sistema.
              </Text>

              {/* Usuário */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Usuário</Text>

                <TextInput
                  style={[
                    styles.input,
                    erroUsuario ? styles.inputError : null,
                  ]}
                  placeholder="Digite seu usuário"
                  placeholderTextColor="#777777"
                  value={usuario}
                  onChangeText={handleUsuarioChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {erroUsuario ? (
                  <Text style={styles.errorText}>{erroUsuario}</Text>
                ) : null}
              </View>

              {/* Senha */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Senha</Text>

                <View
                  style={[
                    styles.passwordContainer,
                    erroSenha ? styles.inputError : null,
                  ]}
                >
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Digite sua senha"
                    placeholderTextColor="#777777"
                    value={senha}
                    onChangeText={handleSenhaChange}
                    secureTextEntry={!mostrarSenha}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                 <Pressable
  style={styles.showPasswordButton}
  onPress={() => setMostrarSenha(!mostrarSenha)}
  hitSlop={10}
>
  <Ionicons
    name={mostrarSenha ? 'eye-off-outline' : 'eye-outline'}
    size={22}
    color="#D4AF37"
  />
</Pressable>
                </View>

                {erroSenha ? (
                  <Text style={styles.errorText}>{erroSenha}</Text>
                ) : null}
              </View>

              {/* Botão entrar */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                ]}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>ENTRAR</Text>
              </Pressable>
            </View>

            <Text style={styles.footer}>Salamandra Mobile</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    minHeight: '100%',
    paddingHorizontal: 28,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },

  brandContainer: {
    alignItems: 'center',
    marginTop: 30,
  },

  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 3,
  },

  brandSubtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#AFAFAF',
  },

  loginContainer: {
    width: '100%',
  },

  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  description: {
    marginTop: 8,
    marginBottom: 30,
    fontSize: 15,
    lineHeight: 22,
    color: '#999999',
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#D6D6D6',
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  passwordContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },

  showPasswordButton: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  inputError: {
    borderColor: '#C94C4C',
  },

  errorText: {
    marginTop: 7,
    fontSize: 12,
    color: '#E57373',
  },

  loginButton: {
    height: 56,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#D4AF37',
  },

  loginButtonPressed: {
    opacity: 0.8,
  },

  loginButtonText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#121212',
  },

  footer: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
  },
});