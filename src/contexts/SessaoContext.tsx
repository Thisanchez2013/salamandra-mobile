import { Session } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { Cargo } from '../constants/permissoes';
import { supabase } from '../lib/supabase';

export interface PerfilUsuario {
  id: string;
  nome: string;
  usuario: string;
  perfil: Cargo;
}

interface SessaoContextValue {
  sessao: Session | null;
  perfil: PerfilUsuario | null;
  // true enquanto o app ainda não sabe se há alguém logado.
  carregando: boolean;
  recarregarPerfil: () => Promise<void>;
}

const SessaoContext = createContext<SessaoContextValue | null>(null);

async function buscarPerfil(idUsuario: string): Promise<PerfilUsuario | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('id, nome, usuario, perfil')
    .eq('id', idUsuario)
    .maybeSingle();

  if (error) {
    console.log('Erro ao carregar perfil:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    perfil: String(data.perfil ?? '').toUpperCase() as Cargo,
  };
}

// ==================================================
// PROVEDOR
// Guarda a sessão do Supabase e o perfil do usuário logado
// para todas as telas, e acompanha login/logout em tempo real.
// ==================================================

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, novaSessao) => {
        setSessao(novaSessao);
      }
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const idUsuario = sessao?.user.id ?? null;

  const recarregarPerfil = useCallback(async () => {
    setPerfil(idUsuario ? await buscarPerfil(idUsuario) : null);
  }, [idUsuario]);

  // Recarrega o perfil sempre que outro usuário entra ou sai.
  useEffect(() => {
    recarregarPerfil();
  }, [recarregarPerfil]);

  return (
    <SessaoContext.Provider
      value={{ sessao, perfil, carregando, recarregarPerfil }}
    >
      {children}
    </SessaoContext.Provider>
  );
}

export function useSessao(): SessaoContextValue {
  const contexto = useContext(SessaoContext);

  if (!contexto) {
    throw new Error('useSessao deve ser usado dentro de <SessaoProvider>.');
  }

  return contexto;
}
