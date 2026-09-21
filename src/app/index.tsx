import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [erroUsuario, setErroUsuario] = useState('');
  const [erroSenha, setErroSenha] = useState('');

  const router = useRouter();

  useEffect(() => {
    verificarSessao();
  }, []);

  // ==================================================
  // SESSÃO
  // ==================================================

  async function verificarSessao() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.log(
          'Erro ao verificar sessão:',
          error
        );

        return;
      }

      if (session) {
        console.log(
          'Sessão encontrada. Redirecionando para Home.'
        );

        router.replace('/home');
      }
    } catch (error) {
      console.log(
        'Erro inesperado ao verificar sessão:',
        error
      );
    }
  }

  // ==================================================
  // LOGIN
  // ==================================================

  async function handleLogin() {
    let formularioValido = true;

    setErroUsuario('');
    setErroSenha('');

    if (carregando) {
      return;
    }

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

    setCarregando(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          'login-usuario',
          {
            body: {
              usuario: usuario
                .trim()
                .toLowerCase(),
              senha,
            },
          }
        );

      if (error) {
        console.log(
          'Erro ao chamar login:',
          error
        );

        setErroSenha(
          'Usuário ou senha inválidos.'
        );

        return;
      }

      if (
        !data?.access_token ||
        !data?.refresh_token
      ) {
        setErroSenha(
          data?.error ||
            'Usuário ou senha inválidos.'
        );

        return;
      }

      const { error: sessionError } =
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

      if (sessionError) {
        console.log(
          'Erro ao criar sessão:',
          sessionError
        );

        setErroSenha(
          'Não foi possível iniciar a sessão.'
        );

        return;
      }

      console.log(
        'Login realizado com sucesso!'
      );
      console.log(
        'Usuário:',
        data.perfil?.usuario
      );
      console.log(
        'Nome:',
        data.perfil?.nome
      );
      console.log(
        'Perfil:',
        data.perfil?.perfil
      );

      router.replace('/home');
    } catch (error) {
      console.log(
        'Erro inesperado no login:',
        error
      );

      setErroSenha(
        'Não foi possível realizar o login.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==================================================
  // CAMPOS
  // ==================================================

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
    <SafeAreaView className="flex-1 bg-salamandra-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="min-h-full flex-1 justify-between px-7 py-10">

            {/* ==================================================
                                MARCA
               ================================================== */}

            <View className="mt-[30px] items-center">
              <Text className="text-[32px] font-bold tracking-[3px] text-salamandra-gold">
                SALAMANDRA
              </Text>

              <Text className="mt-1.5 text-[15px] text-salamandra-brandSubtitle">
                Sistema de Gestão
              </Text>
            </View>

            {/* ==================================================
                                LOGIN
               ================================================== */}

            <View className="w-full">
              <Text className="text-[27px] font-bold text-salamandra-text">
                Bem-vindo de volta
              </Text>

              <Text className="mb-[30px] mt-2 text-[15px] leading-[22px] text-salamandra-muted">
                Entre com suas credenciais para
                acessar o sistema.
              </Text>

              {/* ==================================================
                                  USUÁRIO
                 ================================================== */}

              <View className="mb-5">
                <Text className="mb-2 text-sm font-semibold text-salamandra-textSoft">
                  Usuário
                </Text>

                <TextInput
                  className={`h-[54px] rounded-xl border bg-salamandra-card px-4 text-base text-salamandra-text ${
                    erroUsuario
                      ? 'border-salamandra-errorBorder'
                      : 'border-salamandra-border'
                  }`}
                  placeholder="Digite seu usuário"
                  placeholderTextColor={
                    COLORS.subtle
                  }
                  value={usuario}
                  onChangeText={
                    handleUsuarioChange
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />

                {erroUsuario ? (
                  <Text className="mt-[7px] text-xs text-salamandra-error">
                    {erroUsuario}
                  </Text>
                ) : null}
              </View>

              {/* ==================================================
                                  SENHA
                 ================================================== */}

              <View className="mb-5">
                <Text className="mb-2 text-sm font-semibold text-salamandra-textSoft">
                  Senha
                </Text>

                <View
                  className={`h-[54px] flex-row items-center rounded-xl border bg-salamandra-card ${
                    erroSenha
                      ? 'border-salamandra-errorBorder'
                      : 'border-salamandra-border'
                  }`}
                >
                  <TextInput
                    className="h-full flex-1 px-4 text-base text-salamandra-text"
                    placeholder="Digite sua senha"
                    placeholderTextColor={
                      COLORS.subtle
                    }
                    value={senha}
                    onChangeText={
                      handleSenhaChange
                    }
                    secureTextEntry={
                      !mostrarSenha
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={
                      handleLogin
                    }
                  />

                  <Pressable
                    className="h-full justify-center px-4 active:opacity-70"
                    onPress={() =>
                      setMostrarSenha(
                        !mostrarSenha
                      )
                    }
                    hitSlop={10}
                  >
                    <Ionicons
                      name={
                        mostrarSenha
                          ? 'eye-off-outline'
                          : 'eye-outline'
                      }
                      size={22}
                      color={COLORS.gold}
                    />
                  </Pressable>
                </View>

                {erroSenha ? (
                  <Text className="mt-[7px] text-xs text-salamandra-error">
                    {erroSenha}
                  </Text>
                ) : null}
              </View>

              {/* ==================================================
                                BOTÃO ENTRAR
                 ================================================== */}

              <Pressable
                className={`mt-2.5 h-14 items-center justify-center rounded-xl bg-salamandra-gold ${
                  carregando
                    ? 'opacity-60'
                    : 'active:opacity-80'
                }`}
                onPress={handleLogin}
                disabled={carregando}
              >
                <Text className="text-[15px] font-extrabold tracking-[1px] text-salamandra-background">
                  {carregando
                    ? 'ENTRANDO...'
                    : 'ENTRAR'}
                </Text>
              </Pressable>
            </View>

            {/* ==================================================
                                RODAPÉ
               ================================================== */}

            <Text className="mt-10 text-center text-xs text-salamandra-footer">
              Salamandra Mobile
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}