import { supabase } from './supabase';

export type UserTipo = 'usuaria' | 'advogado' | 'estudante_direito' | 'estudante_psicologia';

export interface Profile {
  tipo: UserTipo;
  nome: string;
  oab_numero: string | null;
  oab_uf: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('tipo, nome, oab_numero, oab_uf')
    .eq('id', userId)
    .single();

  return (data as Profile | null) ?? null;
}

export function routeForTipo(tipo: UserTipo | null | undefined) {
  if (tipo === 'advogado' || tipo === 'estudante_direito') return '/portal-npj' as const;
  if (tipo === 'estudante_psicologia') return '/portal-psicologia' as const;
  if (tipo === 'usuaria') return '/calendario-menstrual' as const;
  return '/home' as const;
}

export function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
  }
  return message;
}
